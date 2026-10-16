# Proof-to-Pay — Database & API Architecture Mapping

## 1. Executive Summary: Dual-Mode Architecture

The Proof-to-Pay repository features an explicit **Dual-Mode Data Architecture**:

```
                       ┌──────────────────────────────────────────────┐
                       │           Runtime Environment Check          │
                       │           (getSupabaseConfig())              │
                       └──────────────────────┬───────────────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
         [Live Supabase Credentials]                    [Placeholder / Unconfigured]
         VITE_SUPABASE_URL (Valid HTTPS)                URL has 'your-project' or missing
         VITE_SUPABASE_PUBLISHABLE_KEY                  Status: 'placeholder_detected'
                      │                                               │
                      ▼                                               ▼
     ┌──────────────────────────────────┐            ┌──────────────────────────────────┐
     │      PRODUCTION_SUPABASE         │            │     OFFLINE_DEMO_SANDBOX         │
     │  Queries PostgreSQL via PostgREST│            │  Reads/Writes browser localStorage│
     │  Strict Row-Level Security (RLS) │            │  Seeded with realistic mock data  │
     │  Supabase Auth Sessions          │            │  Immediate in-browser demo state  │
     └──────────────────────────────────┘            └──────────────────────────────────┘
```

1. **Production Mode (`PRODUCTION_SUPABASE`)**:
   - Intended for deployment with live Supabase credentials.
   - Code-defined schema with 17 PostgreSQL tables, custom ENUM types, relational foreign keys, CHECK constraints, and fine-grained Row Level Security (RLS) policies defined in `/supabase/schema.sql`.
   - Client access layer implemented in `src/lib/supabaseClient.ts` and `src/lib/supabaseService.ts`.
2. **Offline Demo Sandbox Mode (`OFFLINE_DEMO_SANDBOX`)**:
   - Active default in the current development environment.
   - The application checks `.env` variables. Because `VITE_SUPABASE_URL` is set to placeholder `https://your-project-id.supabase.co`, `supabaseClient.ts` detects the placeholder, flags `isConfigured: false`, and falls back to `MarketplaceStore` (`src/lib/storage.ts`).
   - All CRUD actions, Zod validations, audit logs, and status transitions execute cleanly in browser memory and `localStorage`.

---

## 2. Authentication Flow & Session Handling

| Feature | Production Supabase Target | Current Sandbox Implementation |
|---|---|---|
| **Email / Password Sign-In** | `supabaseService.signInWithEmail()` calls `supabase.auth.signInWithPassword()` returning JWT and session. | Evaluated against `ptp_users` in `localStorage`. Verifies account suspension state. |
| **Email / Password Registration** | `supabaseService.signUpWithEmail()` creates auth user in `auth.users` and profile trigger runs. | Validated via Zod (`StudentRegistrationSchema` / `BusinessRegistrationSchema`). Enforces age >= 18. Adds user to `ptp_users`. |
| **Google Sign-In** | Can be routed via Supabase Auth Google Provider. | Uses Firebase Auth (`signInWithPopup` via `src/lib/firebase.ts`) configured with project ID `double-sky-gds98`. |
| **Session Persistence** | `localStorage` auth token managed by `@supabase/supabase-js`. | `ptp_current_user_id` stored in browser `localStorage`. Survives browser refreshes. |
| **Sign Out** | `supabase.auth.signOut()` clears session tokens. | Clears `ptp_current_user_id`, sets `currentUser` state to `null`, redirects to `'landing'`. |

---

## 3. Database Tables Inventory (Defined in `supabase/schema.sql`)

The schema defines **17 relational tables** with Indian legal and financial compliance rules:

### Table 1: `public.profiles`
- **Purpose**: Core user identity table extending Supabase `auth.users`.
- **Primary Key**: `id` (`uuid references auth.users(id) on delete cascade`).
- **Key Columns**: `email` (text), `name` (text), `role` (`user_role`: 'STUDENT' | 'BUSINESS' | 'ADMIN'), `avatar_url` (text), `city` (text), `state` (text), `phone` (text), `is_suspended` (boolean default false), `suspension_reason` (text), `created_at` (timestamptz).
- **Related Tables**: Parent of `student_profiles`, `business_profiles`, `audit_logs`.
- **Pages Used**: All pages (`Navbar`, `AuthModal`, `AdminDashboard`).
- **RLS Policy**:
  - `SELECT`: Public can read active unsuspended profile names/roles; users can read their own profile.
  - `UPDATE`: Users can update their own non-role profile fields. Admins can update suspension and all fields.
  - `INSERT`: Trigger or self during signup.
- **Verification Status**: Code-defined schema present in repository; **live database unverified** (placeholder env).

### Table 2: `public.student_profiles`
- **Purpose**: Creator-specific portfolio and accreditation record.
- **Primary Key**: `user_id` (`uuid references public.profiles(id) on delete cascade`).
- **Key Columns**: `headline` (text), `bio` (text), `age` (int not null default 18 **`check (age >= 18)`**), `college` (text), `skills` (text[]), `portfolio_links` (jsonb), `social_links` (jsonb), `upi_id` (text), `total_earned_paise` (bigint check >= 0), `completed_projects_count` (int check >= 0), `average_rating` (numeric(3,2)), `verified_portfolio_slug` (text unique).
- **Pages Used**: `StudentDashboard`, `PublicPortfolio`, `BrowseProjects`, `ProjectDetail`.
- **RLS Policy**:
  - `SELECT`: Public can read public portfolio profiles.
  - `UPDATE`: Owner can update bio, headline, skills, college, UPI ID. Only system/admin RPC can modify `total_earned_paise` or `completed_projects_count`.
- **Verification Status**: Code-defined schema present; live database unverified.

### Table 3: `public.business_profiles`
- **Purpose**: Hiring company record and Indian legal entity verification.
- **Primary Key**: `user_id` (`uuid references public.profiles(id) on delete cascade`).
- **Key Columns**: `company_name` (text), `tagline` (text), `website` (text), `industry` (text), `city` (text), `verification_status` (`verification_status`: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED'), `verification_legal_entity` (text), `verification_doc_type` (text: 'GSTIN' | 'CIN' | 'PAN' | 'MSME'), `verification_doc_number` (text - restricted access), `total_spent_paise` (bigint check >= 0), `projects_posted_count` (int).
- **Pages Used**: `BusinessDashboard`, `ProjectDetail`, `AdminDashboard`.
- **RLS Policy**:
  - `SELECT`: Public can view verified business company names and industries. Sensitive doc numbers visible only to business owner and Admin.
  - `UPDATE`: Owner can update company details and submit verification; only Admin can set `verification_status = 'VERIFIED'`.
- **Verification Status**: Code-defined schema present; live database unverified.

### Table 4: `public.projects`
- **Purpose**: Paid project listings posted by businesses.
- **Primary Key**: `id` (`uuid default uuid_generate_v4()`).
- **Key Constraints**:
  - `budget_inr >= 1000` (`check (budget_inr >= 1000)`)
  - `deadline_days >= 2` (`check (deadline_days >= 2)`)
  - `permitted_revisions between 1 and 5` (`check (permitted_revisions between 1 and 5)`)
- **Key Columns**: `business_id` (uuid references profiles), `title` (text), `summary` (text), `description` (text), `category` (text), `budget_inr` (int), `budget_paise` (bigint), `deadline_days` (int), `permitted_revisions` (int default 2), `status` (`project_status`), `payment_terms` (text), `assigned_student_id` (uuid references profiles).
- **Pages Used**: `BrowseProjects`, `ProjectDetail`, `BusinessDashboard`, `StudentDashboard`, `AdminDashboard`.
- **RLS Policy**:
  - `SELECT`: Anyone can view `APPROVED` or active projects. Businesses view their own drafts.
  - `INSERT`: Authenticated businesses only.
  - `UPDATE`: Business owner before student acceptance; Admin for moderation; System on lifecycle transitions.
- **Verification Status**: Code-defined schema present; live database unverified.

### Table 5: `public.deliverables`
- **Purpose**: Discrete, locked deliverable checklist items for a project.
- **Key Columns**: `id` (uuid), `project_id` (uuid references projects on delete cascade), `title` (text), `description` (text), `is_completed` (boolean default false), `deliverable_order` (int).
- **Pages Used**: `ProjectDetail`, `BusinessDashboard`, `StudentDashboard`.
- **RLS Policy**: Viewable by all who can view the parent project. Modifiable by business owner before scope lock.

### Table 6: `public.applications`
- **Purpose**: Student project applications and pitches.
- **Key Constraint**: **`unique(project_id, student_id)`** — Prevents duplicate applications at the database level.
- **Key Columns**: `id` (uuid), `project_id` (uuid references projects), `student_id` (uuid references profiles), `pitch` (text check length >= 20), `portfolio_links` (jsonb), `estimated_days` (int), `status` (`application_status`).
- **Pages Used**: `ProjectDetail`, `StudentDashboard`, `BusinessDashboard`.
- **RLS Policy**: Student can read their own applications; business client can read applications for their posted projects.

### Table 7: `public.project_offers`
- **Purpose**: Legally binding formal offer issued by business to selected student.
- **Key Columns**: `id` (uuid), `project_id` (uuid references projects), `business_id` (uuid), `student_id` (uuid), `agreed_budget_inr` (int), `agreed_budget_paise` (bigint), `agreed_deadline` (date), `agreed_revisions` (int check between 1 and 5), `scope_summary` (text), `status` (`offer_status`: 'PENDING' | 'ACCEPTED' | 'DECLINED'), `deliverables_snapshot` (jsonb).
- **Pages Used**: `StudentDashboard` (Scope Lock Modal), `BusinessDashboard`.
- **RLS Policy**: Accessible only to participating student, issuing business, and Admin.

### Table 8: `public.scope_change_requests`
- **Purpose**: Bilateral change mechanism preventing unilateral scope creep.
- **Key Columns**: `id` (uuid), `project_id` (uuid), `requester_id` (uuid), `change_type` ('BUDGET' | 'DEADLINE' | 'DELIVERABLES'), `proposed_adjustment` (text), `rationale` (text), `status` ('PENDING' | 'ACCEPTED' | 'REJECTED').
- **Pages Used**: `StudentDashboard`, `BusinessDashboard`.

### Table 9: `public.submissions`
- **Purpose**: Creator deliverable submissions with revision iteration tracking.
- **Key Columns**: `id` (uuid), `project_id` (uuid), `student_id` (uuid), `version_number` (int check >= 1), `deliverable_links` (jsonb), `live_url` (text), `github_url` (text), `notes` (text), `submitted_at` (timestamptz).
- **Pages Used**: `StudentDashboard`, `BusinessDashboard`.

### Table 10: `public.project_payments`
- **Purpose**: Payout records with traceable Indian bank UTR / UPI reference numbers.
- **Key Columns**: `id` (uuid), `project_id` (uuid), `student_id` (uuid), `business_id` (uuid), `amount_inr` (int), `amount_paise` (bigint), `payment_method` (`payment_method`: 'UPI' | 'NEFT_IMPS' | 'BANK_TRANSFER'), `transaction_reference_utr` (text not null), `status` (`payment_status`), `business_paid_at` (timestamptz), `creator_confirmed_at` (timestamptz).
- **Pages Used**: `PaymentHistory`, `StudentDashboard`, `BusinessDashboard`.

### Table 11: `public.platform_commissions`
- **Purpose**: Tracks Proof-to-Pay's 5% platform fee paid separately by business clients.
- **Key Columns**: `id` (uuid), `project_id` (uuid), `business_id` (uuid), `project_budget_inr` (int), `commission_rate_bps` (int default 500 = 5.0%), `fee_amount_inr` (numeric), `fee_amount_paise` (bigint), `status` (`commission_fee_status`), `utr_reference` (text), `verified_by_admin_id` (uuid), `verified_at` (timestamptz).
- **Pages Used**: `BusinessDashboard`, `AdminDashboard`.

### Table 12: `public.proof_passport_items`
- **Purpose**: Minted portfolio credentials published to public creator profiles.
- **Key Columns**: `id` (uuid), `student_id` (uuid), `project_id` (uuid), `project_title` (text), `business_name` (text), `category` (text), `skills_used` (text[]), `client_rating` (numeric), `review_quote` (text), `deliverable_urls` (jsonb), `minted_at` (timestamptz).
- **Pages Used**: `PublicPortfolio`, `StudentDashboard`.

### Table 13: `public.reviews`
- **Purpose**: Verified client testimonials and 1-5 star ratings.
- **Key Columns**: `id` (uuid), `project_id` (uuid), `student_id` (uuid), `business_id` (uuid), `rating` (int check between 1 and 5), `endorsement_text` (text), `skills_demonstrated` (text[]), `created_at` (timestamptz).
- **Pages Used**: `StudentDashboard`, `BusinessDashboard`, `PublicPortfolio`.

### Tables 14–17: `audit_logs`, `disputes`, `abuse_reports`, `notifications`
- **Purpose**: System security, dispute arbitration, user-safety flagging, and in-app alerts.
- **Pages Used**: `AdminDashboard`, `ReportAbuseModal`, `StudentDashboard`, `BusinessDashboard`.

---

## 4. Storage Buckets (File Uploads)

Configured in `supabase/schema.sql` (Section 6: Storage Buckets):
1. **`portfolio-assets`**: Public bucket for creator portfolio screenshots, Figma exports, and design mockups (max 10MB per file, image/pdf).
2. **`project-attachments`**: Authenticated bucket for project specification briefs and deliverable ZIPs (max 25MB per file).
3. **`verification-docs`**: **Private restricted bucket** for business legal registration certificates (GSTIN/CIN/PAN). Accessible ONLY to the business owner and Admins; blocked from public access.

---

## 5. Required Environment Variables

| Variable Name | Purpose | Required For | Exposure Rules |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project API gateway endpoint (e.g. `https://xyz.supabase.co`) | Web client connection | Client-safe (starts with `VITE_`). Never embed credentials with placeholder patterns. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public client API key with RLS enforcement | Web client queries | Client-safe. Strict RLS prevents unauthorized data access. |
| `VITE_SUPABASE_ANON_KEY` | Legacy alias for publishable key | Backward compatibility | Client-safe. |
| `DATABASE_URL` | Direct PostgreSQL connection string | Server-side / CLI migrations | **PRIVATE SECRET**. Never expose in client bundles. |
| `GEMINI_API_KEY` | Google AI Gemini API access key | Optional AI services | **PRIVATE SECRET**. Must be used server-side only. |
| `PAYMENT_GATEWAY_KEY_ID` | Future payment gateway client ID | Future automated payouts | Client-safe when gateway integrated. |
| `PAYMENT_GATEWAY_KEY_SECRET` | Future payment gateway secret | Future automated payouts | **PRIVATE SECRET**. |
