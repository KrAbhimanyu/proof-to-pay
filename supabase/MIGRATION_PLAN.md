# Proof-to-Pay — Supabase Database Migration Plan & Security Architecture

## 1. Executive Summary & Root Cause Diagnosis

### Why Initial Database Queries Returned "Success. No rows returned":
When a PostgreSQL database query like:
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```
or
```sql
SELECT proname FROM pg_proc WHERE proname IN ('is_admin', 'bootstrap_initial_admin');
```
returns **"Success. No rows returned"**, it indicates that:
1. **The migration script has not been executed yet in the selected Supabase project**: A new Supabase project starts with zero user-defined tables in the `public` schema. The `SELECT` query runs without error, but finds zero matching records.
2. **DDL Execution Output Distinction**: When DDL commands (`CREATE TABLE`, `CREATE FUNCTION`, `CREATE TRIGGER`) are run in the Supabase SQL Editor, Supabase also reports `"Success. No rows returned"` because DDL statements do not generate tabular rows.

---

## 2. Core Security & Architectural Guarantees

The database schema (`supabase/schema.sql`) represents the single authoritative source of truth for both the **Proof-to-Pay Web Application** and the **Native Jetpack Compose Android App**:

- **100% Idempotent Execution**: Uses `CREATE TABLE IF NOT EXISTS`, `CREATE TYPE IF NOT EXISTS`, `DROP TRIGGER IF EXISTS ... CREATE TRIGGER`, and `DROP POLICY IF EXISTS ... CREATE POLICY`. Safe to run on clean projects or re-run without duplicate policy errors.
- **Strict Row Level Security (RLS)**: Enforced across all **17 public tables**. Zero unauthenticated access to confidential data.
- **Zero-Trust Client Access**: No client application or mobile APK ever receives the Supabase `service_role` key. All operations execute via the public anon key with authenticated user JWTs (`auth.uid()`).
- **Cryptographic Financial Integrity**: Budgets, fees, and payments are stored strictly as 64-bit integer paise (`bigint`), eliminating floating-point rounding errors.
- **Authoritative Metrics & No Fake Data**: Ratings default to `NULL` until genuine reviews are posted. Anti-tampering triggers prevent creators or businesses from modifying their own ratings, project counts, earnings, or verification status.
- **Automated Profile Creation Hook**: The `handle_new_user()` trigger on `auth.users` automatically provisions the corresponding `profiles` and role records upon signup, while preventing direct `ADMIN` self-assignment.
- **Locked Down Administrative Bootstrap**: Execution of `public.bootstrap_initial_admin(text)` is revoked from `PUBLIC`, `anon`, and `authenticated`. It can only be invoked from the Supabase SQL Editor by the platform owner.

---

## 3. Table Catalog & Data Architecture

| # | Table Name | Purpose | Key Constraints |
|---|---|---|---|
| 1 | `public.profiles` | User identity & platform role | References `auth.users(id) ON DELETE CASCADE`. Role cannot be self-modified. |
| 2 | `public.student_profiles` | Creator professional details & earnings | `age >= 18`, `total_earned_paise >= 0`, `average_rating` is computed only from verified reviews. UPI ID is confidential. |
| 3 | `public.business_profiles` | Client/employer organization info | Verification document numbers and admin review notes are strictly private. |
| 4 | `public.projects` | Project listings & scope | `budget_paise >= 100000` (₹1,000 INR min), `deadline_days BETWEEN 2 AND 90`, revisions capped at 1-5. |
| 5 | `public.deliverables` | Milestone deliverable definitions | Linked to projects. Visible only when project is public or user is participant. |
| 6 | `public.applications` | Creator applications to projects | Confidential. Visible only to applicant creator, project owner, and platform admin. |
| 7 | `public.project_offers` | Scope-locked contract agreements | Authoritative platform commission snapshot (`commission_rate_bps`, `creator_receives_paise = agreed_budget_paise`). |
| 8 | `public.scope_change_requests` | Mutual contract amendment proposals | Requires approval from counterparty before modifying agreed terms. |
| 9 | `public.submissions` | Private work deliverables & files | Strictly private between assigned creator, client, and admin. |
| 10 | `public.project_payments` | Direct Business-to-Creator payments | UPI/NEFT transaction UTR and confirmation timestamps. Private financial record. |
| 11 | `public.platform_commissions` | Business-to-Platform 5% fee records | Business-paid platform fee. Only verified as collected by authorized admins. |
| 12 | `public.proof_passport_items` | Sanitized public completed deliverables | Created only upon verified completion. Public only if creator opted in (`is_public = true`). No private files or PII. |
| 13 | `public.reviews` | 1-5 star ratings & client feedback | Permitted only by project participants upon verified project completion. |
| 14 | `public.audit_logs` | Immutable administrative audit trail | Append-only. Readable only by active administrators. |
| 15 | `public.disputes` | Formal dispute resolution records | Raised only by project participants; resolved by platform admins. |
| 16 | `public.abuse_reports` | Safety & compliance reporting | Visible only to platform moderation admins. |
| 17 | `public.notifications` | In-app user notifications | Restricted to individual recipient user. |

---

## 4. Row Level Security (RLS) Authorization Matrix

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | Own profile OR non-suspended public directory info | Via auth trigger | Own profile (role/suspension protected by trigger) | Admin only |
| `student_profiles` | Public view (UPI ID restricted) | Own user (`auth.uid() = user_id`) | Own user (stats protected by trigger) | Admin only |
| `business_profiles` | Public view (doc # private) | Own user (`auth.uid() = user_id`) | Own user (verification protected by trigger) | Admin only |
| `projects` | Approved/Active projects OR owner OR admin | Business owner (`business_id = auth.uid()`) | Business owner or Admin | Owner/Admin |
| `deliverables` | Project participants or approved projects | Project owner | Project owner | Project owner |
| `applications` | Applicant creator OR project owner OR admin | Authenticated creator | Applicant (withdraw) OR owner | None |
| `project_offers` | Involved creator OR business OR admin | Business owner | Involved parties (accept/decline) | None |
| `scope_change_requests`| Project participants OR admin | Project participants | Counterparty (accept/reject) | None |
| `submissions` | Assigned creator OR business OR admin | Assigned creator (`selected_student_id`) | Assigned creator / Business (feedback) | None |
| `project_payments` | Payer business OR creator OR admin | Payer business | Parties (report/confirm) | None |
| `platform_commissions` | Payer business OR admin | System / Trigger | Payer (report UTR) OR Admin (verify/waive) | None |
| `proof_passport_items` | Public IF `is_public = true` OR creator OR admin | System upon project completion | Creator (toggle visibility) | Creator / Admin |
| `reviews` | Public read (genuine feedback) | Project participant upon completion | Creator/Admin dispute only | None |
| `audit_logs` | Admin only (`public.is_admin()`) | Authenticated users (system append) | **DENIED** (Append-only) | **DENIED** |
| `disputes` | Involved parties OR admin | Involved parties | Admin only | None |
| `abuse_reports` | Admin only | Authenticated users | Admin only | Admin only |
| `notifications` | Own notifications (`auth.uid() = user_id`) | System | Own notifications (`is_read`) | Own user |

---

## 5. Privilege Escalation Prevention & Security Triggers

Four PostgreSQL `BEFORE UPDATE` triggers prevent clients from circumventing business rules:

1. **`trg_prevent_profile_escalation` (`profiles`)**:
   Rejects any attempt by non-admins to alter their own `role`, `is_suspended`, or `suspension_reason`.
2. **`trg_prevent_student_tampering` (`student_profiles`)**:
   Rejects manual updates to `average_rating`, `completed_projects_count`, or `total_earned_paise`. Ratings are computed exclusively from verified `reviews` records.
3. **`trg_prevent_business_tampering` (`business_profiles`)**:
   Prevents businesses from self-granting `verification_status = 'VERIFIED'` or editing `verification_admin_notes`.
4. **`trg_prevent_commission_tampering` (`platform_commissions`)**:
   Rejects attempts by non-admins to set `status = 'VERIFIED_COLLECTED'` or `status = 'WAIVED'`.

### `SECURITY DEFINER` Search Path Hardening:
Functions defined with `SECURITY DEFINER` (such as `is_admin()`, `bootstrap_initial_admin()`, and `handle_new_user()`) explicitly set `SET search_path = public` to protect against search-path injection attacks.

---

## 6. Deployment & Execution Instructions

You can apply the database setup using either the **Supabase Dashboard SQL Editor** or the **Supabase CLI / Migration system**:

### Option A: Via Supabase CLI / Migrations
The initial migration file is located at:
`supabase/migrations/20240101000000_init_schema.sql`

To apply with the Supabase CLI:
```bash
supabase db push
# or
supabase migration up
```

### Option B: Via Supabase Web Dashboard SQL Editor
1. Log in to [https://supabase.com/dashboard](https://supabase.com/dashboard) and navigate to your project.
2. In the left navigation bar, click **SQL Editor**.
3. Click **New query** (or open an empty tab).
4. Copy the entire contents of either `supabase/migrations/20240101000000_init_schema.sql` or `supabase/schema.sql`.
5. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`).
6. Supabase will output: `"Success. No rows returned"` along with the notice:
   `"Verification Succeeded: Core tables (profiles, projects, reviews) created with RLS enabled and indexes verified."`

---

## 7. Post-Deployment Verification Queries

Run these queries in a new SQL Editor tab to confirm that the schema is active:

```sql
-- 1. Verify all 17 tables exist and have RLS active
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
-- Expected: Exactly 17 rows, rowsecurity = true for all

-- 2. Verify all security functions exist with safe search paths
SELECT proname, prosecdef, proconfig 
FROM pg_proc 
WHERE proname IN (
  'is_admin',
  'bootstrap_initial_admin',
  'prevent_profile_privilege_escalation',
  'prevent_student_stats_tampering',
  'prevent_business_verification_tampering',
  'prevent_commission_verification_tampering',
  'handle_new_user'
);
-- Expected: Exactly 7 rows, prosecdef = true, proconfig = {search_path=public}

-- 3. Confirm bootstrap_initial_admin is NOT callable by anon or authenticated
SELECT routine_name, grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public' AND routine_name = 'bootstrap_initial_admin';
-- Expected: Grants only to postgres and service_role
```

---

## 8. One-Time Secure Admin Bootstrapping Procedure

1. Sign up normally in the app or via the Supabase Auth Dashboard using your desired administrator email (e.g. `admin@prooftopay.in`).
2. In the Supabase **SQL Editor**, execute:
   ```sql
   SELECT public.bootstrap_initial_admin('admin@prooftopay.in');
   ```
3. The function checks whether any active administrator already exists:
   - If `0` administrators exist, it promotes `admin@prooftopay.in` to `ADMIN` and writes a permanent record in `public.audit_logs`.
   - If `1` or more administrators already exist, it raises a security exception. Subsequent administrators can only be appointed by existing administrators.
