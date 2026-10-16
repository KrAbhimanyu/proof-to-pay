# Proof-to-Pay — Product Overview & Architecture

## 1. What Proof-to-Pay Does

**Proof-to-Pay** is a specialized freelance project and verifiable work-experience marketplace tailored for university students, emerging digital creators, and legitimate businesses in India.

The platform's core motto is:
> **"Your skills. Your proof. Your first pay."**  
> **"Do real work. Get paid. Build proof."**

Unlike traditional gig marketplaces (like Upwork or Fiverr) that suffer from fierce global price competition, unpaid sample test demands ("spec work"), endless revision scope creep, and unverifiable self-reported resumes, Proof-to-Pay creates a legally anchored, structured sandbox for young talent in India to complete discrete paid projects, receive verified payment references via bank UTR or UPI, and automatically generate an immutable **Proof Passport** (cryptographically and client-endorsed public portfolio).

---

## 2. Problems It Solves

| Problem in Existing Market | How Proof-to-Pay Solves It | Code Implementation |
|---|---|---|
| **Unpaid Spec Work** | Businesses often ask students to do "free design tests" or "sample tasks" that get used without compensation. | "Zero Spec Work" policy. Businesses can only review existing portfolios, and cannot request custom work before issuing a paid formal offer. |
| **Scope Creep & Infinite Revisions** | Clients demand endless rounds of edits beyond the initial agreement. | **Scope Lockdown**: The project budget, deliverables list, and permitted revision count (1 to 5) are frozen upon student acceptance. Additional changes require an explicit bilateral **Scope Change Request**. |
| **Payment Insecurity & Ghosting** | Students complete work and never get paid. | **Audited UTR / UPI Tracking**: Payments are recorded with mandatory 12-digit Indian banking UTR (Unique Transaction Reference) or UPI reference numbers, verified and confirmed by the creator. |
| **"No Experience, No Job" Paradox** | Fresh graduates cannot land entry-level jobs without proof of real-world delivery. | **Minted Proof Passport**: Every completed, paid deliverable mints an immutable public credential with client ratings, deliverable live links, and verified skills. |
| **Underage Contract Enforceability** | Under Section 11 of the Indian Contract Act (1872), minors cannot enter into legally enforceable commercial contracts. | **18+ Adult Participation Policy**: Age validation is enforced on client forms (HTML5/Zod), database check constraints (`check (age >= 18)`), and Supabase RLS. |

---

## 3. Target Users

1. **Student Creators (Ages 18+)**:
   - University and college students in India looking for their first paid client projects in UI/UX Design, Web Development, Brand Identity, Content, and Automation.
   - Default persona in code: **Aarav Sharma** (3rd-year CS student at Delhi Technological University).
2. **Business Clients**:
   - Indian startups, D2C brands, SMEs, agencies, and founders who need high-quality digital work delivered at predictable fixed pricing.
   - Default persona in code: **HyperFlow Labs** (Siddharth Menon, Bengaluru).
3. **Platform Administrators**:
   - Operations and compliance team managing project listing moderation, business entity verification (GSTIN/CIN/PAN), dispute arbitration, beta feedback, and platform fee collection.
   - Default persona in code: **Vikramaditya Roy** (Super Admin).
4. **Public Visitors & Recruiters**:
   - Unauthenticated visitors browsing the project directory, reading the "How It Works" guide, or verifying a creator's public Proof Passport (`/portfolio/aarav-sharma`).

---

## 4. Main User Journey

```
[Student Creator]                  [Business Client]                  [Platform Admin]
       │                                  │                                  │
       ├─► 1. Sign Up (18+ check)         ├─► 1. Sign Up & Profile Setup     │
       │                                  ├─► 2. Post Project (Budget >=₹1k) │
       │                                  │        │                         ├─► 3. Moderates & Approves Project
       │                                  ◄────────┴─────────────────────────┤
       ├─► 4. Browse Projects & Apply     │                                  │
       │   (Pitch + Portfolio links)      │                                  │
       │                                  ├─► 5. Review Applicants           │
       │   6. Receive Formal Offer ◄──────┤      & Issue Formal Offer        │
       ├─► 7. Review & Lock Scope         │                                  │
       │      (Agreed deadline/revisions) │                                  │
       │                                  │                                  │
       ├─► 8. Submit Deliverables ───────►│                                  │
       │   (Figma/GitHub/Drive links)     ├─► 9. Review Deliverables         │
       │                                  │      (Approve OR Request Rev)    │
       │                                  │                                  │
       │   10. Direct UPI/NEFT Payout ◄───┼─► 10. Pay Creator directly via   │
       │       & Receipt Confirmation     │       UPI/NEFT & Enter Bank UTR  │
       │                                  │                                  │
       │                                  ├─► 11. Leave 5-Star Review        │
       ├─► 12. Proof Passport Minted      │                                  │
       │       (Skills, Badges, Rating)   │                                  │
       │                                  ├─► 13. Pay 5% Platform Fee ──────►├─► 14. Admin Verifies Platform Fee
```

---

## 5. Technology Stack (Fact-Checked Against Actual Code)

| Layer / Technology | Status | Implementation Details in Repository |
|---|---|---|
| **Web Frontend Framework** | **CONFIRMED BY CODE** | React 19 (`react: ^19.0.1`, `react-dom: ^19.0.1`), Vite 8 (`vite: ^8.3.0`), TypeScript 7 (`typescript: ^7.0.2`). Uses a Single-Page Application (SPA) architecture with view routing managed in `src/App.tsx`. |
| **Web Styling & Icons** | **CONFIRMED BY CODE** | Tailwind CSS v4 (`@tailwindcss/vite: ^4.3.3`, `tailwindcss: ^4.3.3`), Lucide React icons (`lucide-react: ^0.546.0`), and Canvas Confetti (`canvas-confetti: ^1.9.4`). Dark mode supported via Tailwind CSS dark classes. |
| **PWA (Progressive Web App)** | **CONFIRMED BY CODE** | `vite-plugin-pwa: ^2.0.0`, Web App Manifest at `public/manifest.json`, custom install prompt hook `src/hooks/usePWAInstall.ts`, and `PWAInstallButton.tsx`. |
| **Client Storage & State Engine** | **CONFIRMED BY CODE** | `MarketplaceStore` in `src/lib/storage.ts` (1,829 lines). Handles all CRUD operations, state persistence, RBAC checks, and mock seeding using browser `localStorage` and in-memory fallback. |
| **Backend: Supabase Client SDK** | **CONFIRMED BY CODE** | `@supabase/supabase-js: ^2.117.3`. Client setup in `src/lib/supabaseClient.ts`, service methods in `src/lib/supabaseService.ts`, and full SQL schema in `supabase/schema.sql`. |
| **Backend: Live Supabase Connection** | **NOT CONNECTED / UNVERIFIED** | The live connection is inactive because `.env` contains placeholder credentials (`https://your-project-id.supabase.co`). The app detects this placeholder and intentionally falls back to `OFFLINE_DEMO_SANDBOX` mode. |
| **Authentication: Firebase Auth** | **CONFIRMED BY CODE** | Firebase 13 (`firebase: ^13.0.0`). Configured via `firebase-applet-config.json` with project ID `double-sky-gds98`. Provides Google OAuth via `signInWithPopup` in `src/components/pages/AuthModal.tsx`. |
| **Database: PostgreSQL & Drizzle ORM** | **DOCUMENTED ONLY / UNUSED** | Dependencies `drizzle-orm: ^0.45.4`, `pg: ^8.23.1`, and files in `src/db/` exist, but are never imported or invoked by the application code or Vite dev server. |
| **Backend: Express / Server** | **DOCUMENTED ONLY / UNUSED** | `express: ^4.21.2` is in `package.json`, but no `server.ts` or Express entry point exists. The app runs entirely client-side via `vite`. |
| **Native Android Companion App** | **CONFIRMED BY CODE** | Full native companion project in `/android` (4,308 lines of Kotlin). Built with Jetpack Compose, Material 3, Navigation Compose, Kotlin Coroutines/StateFlow, and Supabase Kotlin SDK v2.5 (`io.github.jan-tennert.supabase`). |
| **Validation Library** | **CONFIRMED BY CODE** | Zod (`zod: ^4.6.5`) in `src/lib/schemas.ts`. Validates student age (>=18), project budgets (>=₹1,000), timelines (>=2 days), revision caps (1-5), and formal offers. |
| **AI Capabilities** | **DOCUMENTED ONLY** | `@google/genai: ^2.4.0` is present in `package.json`, and metadata lists `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`. However, no active Gemini API endpoints or AI features are invoked in the application code. |
| **Automated Testing** | **CONFIRMED BY CODE** | Vitest (`vitest: ^5.0.3`). 8 test suites with 175 unit/integration tests in `src/tests/` verifying financial math, schema constraints, security RBAC guards, and UI rendering. |
| **Payment Gateway** | **NOT FOUND** | No automated payment gateway (Razorpay, Stripe, Cashfree) exists. Payments are handled via out-of-band UPI/NEFT transfers with audited UTR reference recording. |

---

## 6. Directory Structure & Key Files

```
├── .env.example                          # Environment variables template
├── android/                              # Complete Native Android Companion Application
│   ├── app/
│   │   ├── build.gradle.kts              # Android app build configuration & dependencies
│   │   └── src/main/java/in/prooftopay/app/
│   │       ├── MainActivity.kt           # Android single-activity entry point
│   │       ├── data/                     # Data models, repositories & Supabase client
│   │       ├── ui/                       # Jetpack Compose UI screens & navigation
│   │       └── viewmodel/                # Architecture ViewModels
│   └── build.gradle.kts                  # Root Gradle build script
├── docs/product-audit/                   # Complete Product Architecture & Audit Documentation
├── firebase-applet-config.json           # Firebase project configuration for Google Sign-In
├── index.html                            # HTML entry point with meta tags & PWA links
├── metadata.json                         # Project metadata and system capabilities
├── package.json                          # Node.js dependencies, scripts and tooling
├── public/                               # PWA assets (manifest.json, icon.svg)
├── src/
│   ├── App.tsx                           # Master routing, modal coordinator & shell switcher
│   ├── main.tsx                          # React 19 root DOM mount
│   ├── index.css                         # Tailwind CSS v4 entry point
│   ├── types/index.ts                    # Canonical TypeScript interfaces & enums
│   ├── components/
│   │   ├── common/                       # Reusable UI components (Badges, PaymentHistory, etc.)
│   │   ├── layout/                       # Navbar, Footer, and AndroidShell frame simulator
│   │   └── pages/                        # Screen views (Dashboard, Browse, Detail, Admin, etc.)
│   ├── lib/
│   │   ├── firebase.ts                   # Firebase client initialization
│   │   ├── mockData.ts                   # Initial seed data for offline sandbox mode
│   │   ├── schemas.ts                    # Zod validation schemas
│   │   ├── storage.ts                    # MarketplaceStore client-side data layer
│   │   ├── supabaseClient.ts             # Supabase client singleton & credential validator
│   │   └── supabaseService.ts            # Supabase database query methods
│   └── tests/                            # Vitest automated test suite (175 tests)
└── supabase/
    ├── schema.sql                        # Authoritative PostgreSQL schema & RLS policies
    └── migrations/20240101000000_init_schema.sql # Initial migration script
```

---

## 7. How System Components Connect

```
               ┌────────────────────────────────────────────────────────┐
               │                     USER ACCESS                        │
               └──────────────────────────┬─────────────────────────────┘
                                          │
                   ┌──────────────────────┴──────────────────────┐
                   ▼                                             ▼
       ┌──────────────────────┐                      ┌──────────────────────┐
       │   Desktop Web SPA    │                      │  Android Native App  │
       │   (React 19 + Vite)  │                      │  (Jetpack Compose)   │
       └──────────┬───────────┘                      └──────────┬───────────┘
                  │                                             │
      ┌───────────┴───────────┐                     ┌───────────┴───────────┐
      ▼                       ▼                     ▼                       ▼
┌──────────────┐      ┌───────────────┐     ┌───────────────┐       ┌──────────────┐
│ Firebase Auth│      │Marketplace    │     │Supabase Kotlin│       │  In-Memory   │
│ (Google pop) │      │Store (Local)  │     │SDK (Ktor)     │       │Mock StateFlow│
└──────────────┘      └───────┬───────┘     └───────┬───────┘       └──────────────┘
                              │                     │
                  ┌───────────┴───────────────┐     │
                  │   Supabase JS Service     │◄────┘
                  │   (When configured)       │
                  └───────────┬───────────────┘
                              ▼
                  ┌───────────────────────┐
                  │   Supabase Postgres   │
                  │  (17 Tables + RLS)    │
                  └───────────────────────┘
```

1. **Web Frontend Mode**:
   - The user opens the web app. `App.tsx` initializes `MarketplaceStore` which reads data from `localStorage` (seeded by `mockData.ts`).
   - If `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are configured with valid non-placeholder credentials, `supabaseService.ts` can connect to PostgreSQL.
   - Currently, because placeholder credentials exist, the top banner accurately displays: **"Demo Mode" / "OFFLINE_DEMO_SANDBOX"**, ensuring transparent behavior without crashing.
2. **Android Native Companion App**:
   - The Kotlin companion app uses `SupabaseClientProvider`.
   - If Gradle properties contain valid Supabase keys, it queries Supabase tables via PostgREST.
   - If unconfigured, its repositories (`AuthRepository`, `ProjectRepository`, etc.) fall back to predefined Kotlin data models matching the mock dataset.
3. **Android Shell Simulator on Web**:
   - In `App.tsx`, users can toggle the **"📱 Android App Mode"** button. This mounts `AndroidShell.tsx`, rendering an interactive Android mobile frame with status bar, punch hole camera, and thumb-zone bottom navigation bar.
