# Proof-to-Pay — Authentication and Session Lifecycle Audit Report

**Date of Audit:** October 16, 2026  
**Auditor:** Senior Software Engineer (AI Studio)  
**Target Repository:** Proof-to-Pay (Web React SPA & Android Jetpack Compose)  
**Audit Scope:** Registration, Login, Role Routing, Google OAuth, Demo Accounts, RoleSwitcher, Logout & Session Lifecycle, Supabase Database & RLS Security, and Web vs. Android Parity.

---

## 1. Executive Summary

This audit evaluates the actual implemented authentication and session lifecycle mechanisms in the Proof-to-Pay codebase. Rather than relying on architectural plans or assumptions, every finding is grounded in concrete code traces across Web (`src/`) and Android (`android/`).

### Overall System Classification
* **Web Runtime Architecture:** Client-side React 19 Single Page Application (SPA) bundled with Vite 8. There is **no Node/Express backend process running in development or production**; all business logic runs in the browser.
* **Dual-Mode Persistence Strategy:**
  1. **Offline / Sandbox Demo Mode (Default):** Driven by `MarketplaceStore` (`src/lib/storage.ts`) using browser `localStorage` and initial fixtures (`src/lib/mockData.ts`).
  2. **Authoritative Supabase Mode (When Configured):** Uses `@supabase/supabase-js` (`src/lib/supabaseClient.ts` and `src/lib/supabaseService.ts`) with PostgreSQL Row Level Security (RLS) and security-definer database triggers (`supabase/schema.sql`).
* **Android Architecture:** Native Android Jetpack Compose application (`android/app/`) using `io.github.jan.supabase` with a dual live/offline fallback pattern mirroring the Web architecture.

---

## 2. Authentication Architecture

### 2.1 Web Authentication Stack
| Component | Implementation File | Actual Code Mechanism | Status |
|---|---|---|---|
| **Auth UI & Modals** | `src/components/pages/AuthModal.tsx` | Form submission, Zod schema validation, Firebase Google popup, Quick Demo triggers | **Functional** (Dual Mode) |
| **Client Storage & State** | `src/lib/storage.ts` (`MarketplaceStore`) | `localStorage` persistence under `ptp_users` and `ptp_current_user_id` | **Functional** (Client-side) |
| **Input Validation** | `src/lib/schemas.ts` | Zod schemas (`StudentRegistrationSchema`, `BusinessRegistrationSchema`) | **Functional** |
| **Supabase Client Layer** | `src/lib/supabaseClient.ts` | Factory with credential validation, placeholder detection, and session options (`persistSession: true`, `autoRefreshToken: true`) | **Functional** (Requires env vars) |
| **Supabase Service Layer** | `src/lib/supabaseService.ts` | `signInWithEmail`, `signUpWithEmail`, `signOut`, `getSession`, profile fetchers | **Implemented** (Not invoked by AuthModal) |
| **Google OAuth Provider** | `src/lib/firebase.ts` | Firebase Auth (`initializeApp`, `getAuth`, `GoogleAuthProvider`) | **Configured** via `firebase-applet-config.json` |
| **Role Sandbox** | `src/components/common/RoleSwitcher.tsx` | Dropdown selector modifying `ptp_current_user_id` and calling `onUserChange` | **Functional** (Demo sandbox tool) |
| **Access Gatekeeper** | `src/components/pages/AccessDenied.tsx` | Conditional gate in `App.tsx` routing unauthenticated or mismatched roles | **Functional** |

### 2.2 Android Authentication Stack
| Component | Implementation File | Actual Code Mechanism | Status |
|---|---|---|---|
| **Android Client Provider** | `android/.../SupabaseClientProvider.kt` | Singleton checking `BuildConfig.SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` | **Functional** |
| **Auth Repository** | `android/.../Repositories.kt` (`AuthRepository`) | Coroutine-based `login`, `register`, `logout`, `deleteAccount` with live Supabase or mock fallback | **Functional** |
| **Auth ViewModel** | `android/.../ViewModels.kt` (`AuthViewModel`) | Exposes `currentUser: StateFlow<UserProfile?>`, `isLoading`, `errorMessage` | **Functional** |
| **Compose Screens** | `android/.../ui/screens/auth/AuthScreens.kt` | `LoginScreen`, `RegisterScreen`, `ForgotPasswordScreen` | **Functional** |
| **Navigation Graph** | `android/.../ui/navigation/AppNavGraph.kt` | `NavHost` role-based destination dispatching | **Functional** |

---

## 3. Registration Flow

### 3.1 Student / Creator Sign-Up
* **UI Component:** `src/components/pages/AuthModal.tsx` (`mode === 'register_student'`).
* **Trigger:** Form submission executing `handleRegisterStudent(e)`.
* **Validation:** Validated synchronously against `StudentRegistrationSchema` (`src/lib/schemas.ts` lines 3–14):
  ```typescript
  export const StudentRegistrationSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Valid email is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    age: z.coerce.number().min(18, 'You must be at least 18 years old to join Proof-to-Pay'),
    city: z.string().min(2, 'City is required'),
    college: z.string().optional(),
    degree: z.string().optional(),
    headline: z.string().min(5, 'Headline must be at least 5 characters'),
    skills: z.array(z.string()).min(1, 'Select at least one skill'),
    experienceLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  });
  ```
* **Age 18+ Validation Analysis:**
  - **Client-Side:** Enforced strictly via Zod (`age: z.coerce.number().min(18)`). If age is less than 18, submission halts with `"You must be at least 18 years old to join Proof-to-Pay"`.
  - **Database Level:** In `supabase/schema.sql` (line 69), the `public.student_profiles` table contains an explicit SQL check constraint:
    ```sql
    age int not null default 18 check (age >= 18)
    ```
  - **Verdict:** Age 18+ is validated both in client validation schemas and by a PostgreSQL table constraint.

* **Profile Creation & Persistence:**
  - Generates a `User` entity with `id = 'student-' + Date.now()` and role `'STUDENT'`.
  - Appends user to `ptp_users` in `localStorage`.
  - Calls `marketplaceStore.updateStudentProfile(newUser.id, { ... })` saving headline, college, skills, 0 paise earnings, 5.0 rating, and verified portfolio slug.
  - Sets active session via `marketplaceStore.setCurrentUserId(newUser.id)` and invokes `onSuccess(newUser)`.

### 3.2 Business Client Sign-Up
* **UI Component:** `src/components/pages/AuthModal.tsx` (`mode === 'register_business'`).
* **Trigger:** Form submission executing `handleRegisterBusiness(e)`.
* **Validation:** Validated against `BusinessRegistrationSchema` (`src/lib/schemas.ts` lines 16–24) requiring representative name, valid work email, password (min 8 chars), company name, industry, and city.
* **Profile Creation & Persistence:**
  - Generates a `User` entity with `id = 'business-' + Date.now()` and role `'BUSINESS'`.
  - Appends user to `ptp_users`.
  - Calls `marketplaceStore.updateBusinessProfile(newUser.id, { ... })` initializing `verificationStatus = 'UNVERIFIED'`, 0 spent, and 0 projects posted.
  - Sets active session via `marketplaceStore.setCurrentUserId(newUser.id)` and invokes `onSuccess(newUser)`.

### 3.3 Registration Security & Edge Cases
1. **Duplicate Account Handling (Client Sandbox):**
   - **Vulnerability Found:** In `AuthModal.tsx`, neither `handleRegisterStudent` nor `handleRegisterBusiness` inspects `marketplaceStore.getUsers()` to check if the supplied email already exists. As a result, in local sandbox mode, multiple accounts can be created with the identical email address.
   - **Supabase Backend:** In `supabase/schema.sql`, `auth.users` inherently enforces email uniqueness; however, the client modal does not catch or surface Supabase duplicate key errors because it writes to `marketplaceStore` rather than calling `supabaseService.signUpWithEmail`.
2. **Partial Profile Creation Failure:**
   - If profile generation throws an exception after `ptp_users` is updated, the user record exists in `ptp_users` without a matching entry in `ptp_student_profiles`. In `App.tsx` (lines 178–187), a defensive fallback object is constructed to prevent application crashing.

---

## 4. Login and Role-Based Routing

### 4.1 Actual Login Provider
* **Component:** `src/components/pages/AuthModal.tsx` (`handleLogin`, lines 86–102).
* **Mechanism:**
  ```typescript
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const users = marketplaceStore.getUsers();
    const user = users.find((u) => u.email.toLowerCase() === loginEmail.toLowerCase());
    if (!user) {
      setErrorMsg('No user found with this email. Try quick test accounts below.');
      return;
    }
    if (user.isSuspended) {
      setErrorMsg(`Account is suspended: ${user.suspensionReason || 'Policy review'}`);
      return;
    }
    marketplaceStore.setCurrentUserId(user.id);
    onSuccess(user);
    onClose();
  };
  ```
* **Security Finding:** In the Web client's active login flow, authentication is performed solely by matching the entered email against `marketplaceStore.getUsers()`. **Password verification is skipped in the client demo mode.**
* **Supabase Service Contrast:** `SupabaseService` (`src/lib/supabaseService.ts`, lines 74–80) contains a complete `signInWithEmail(email, password)` method calling `supabase.auth.signInWithPassword`, but this method is bypassed by `AuthModal.tsx` in favor of local store matching.

### 4.2 Role Retrieval and Privilege Enforcement
* **Role Storage:** Stored in the `role` attribute of the `User` object (`'STUDENT' | 'BUSINESS' | 'ADMIN'`).
* **Database Level:** In `public.profiles`, the `role` column is of enum type `user_role`. The database trigger `prevent_profile_privilege_escalation()` (`supabase/schema.sql`, lines 440–466) blocks non-admin users from updating the `role`, `is_suspended`, or `suspension_reason` columns.
* **Trigger Check on User Creation:** The trigger `handle_new_user()` (`supabase/schema.sql`, lines 553–595) explicitly sanitizes raw metadata:
  ```sql
  raw_role := coalesce(new.raw_user_meta_data->>'role', 'STUDENT');
  if raw_role = 'ADMIN' then
    assigned_role := 'STUDENT'::public.user_role;
  ...
  ```
  This guarantees that even if an attacker modifies client signup payloads to request `'ADMIN'`, the database trigger forces the assigned role to `'STUDENT'`.

### 4.3 Redirection and Direct URL Navigation
* **Dispatch Handler:** `App.tsx` contains `handleUserChange` (lines 99–110) and `onSuccess` in `AuthModal` (lines 449–455):
  ```typescript
  onSuccess={(user) => {
    setCurrentUser(user);
    if (user.role === 'STUDENT') setActiveView('student_dashboard');
    else if (user.role === 'BUSINESS') setActiveView('business_dashboard');
    else setActiveView('admin_dashboard');
  }}
  ```
* **Protected Routes Enforcement:**
  `App.tsx` enforces server-independent role guarding inside `renderContent()`:
  - **Student Dashboard (`case 'student_dashboard'`):** Unauthenticated users receive `<AccessDenied targetRole="STUDENT" />`. Users with non-STUDENT roles (except ADMIN) receive `<AccessDenied targetRole="STUDENT" />`.
  - **Business Dashboard (`case 'business_dashboard'`):** Unauthenticated users or non-BUSINESS roles (except ADMIN) receive `<AccessDenied targetRole="BUSINESS" />`.
  - **Admin Dashboard (`case 'admin_dashboard'`):** Only users with `currentUser.role === 'ADMIN'` can access; all others receive `<AccessDenied targetRole="ADMIN" />`.

### 4.4 Session Loading, Refresh, and Expiry
* **Session Persistence:** Managed through `localStorage.getItem('ptp_current_user_id')`. On initial mount or browser reload, `marketplaceStore.getCurrentUser()` retrieves the stored ID and resolves the user.
* **Token Expiry:** In the default sandbox mode, there are no expiring JWT tokens. In live Supabase mode, the Supabase client handles auto-refresh (`autoRefreshToken: true`), but since `App.tsx` tracks state via `currentUser` in React state and `localStorage`, Supabase session timeouts do not automatically unseat `currentUser` in the React layer.

---

## 5. Google OAuth Integration

### 5.1 Configuration & Implementation Evidence
* **Provider:** Google Identity via **Firebase Authentication** SDK (`firebase/auth`).
* **Source Configuration:** `src/lib/firebase.ts`:
  ```typescript
  import { initializeApp } from 'firebase/app';
  import { getAuth, GoogleAuthProvider } from 'firebase/auth';
  import firebaseConfig from '../../firebase-applet-config.json';

  const app = initializeApp(firebaseConfig);
  export const auth = getAuth(app);
  export const googleAuthProvider = new GoogleAuthProvider();
  ```
* **Configuration File:** `firebase-applet-config.json` contains:
  - `projectId`: `"double-sky-gds98"`
  - `authDomain`: `"double-sky-gds98.firebaseapp.com"`
  - `appId`, `apiKey`, `messagingSenderId`, `oAuthClientId`
* **Flow Trigger:** `handleGoogleSignIn` in `src/components/pages/AuthModal.tsx` (lines 50–82):
  - Calls `signInWithPopup(auth, googleAuthProvider)`.
  - Retrieves `result.user.email` and `result.user.displayName`.
  - Checks if a user with that email already exists in `marketplaceStore.getUsers()`.
  - If existing, sets that user as current.
  - If new, creates a user record with role depending on the current active tab (`BUSINESS` if `register_business`, otherwise `STUDENT`).
* **Verification Status:**
  - **Configured & Implemented in Web:** Yes.
  - **Environment Variables:** No separate `.env` keys needed for Firebase Web SDK because configuration is loaded directly from `firebase-applet-config.json`.
  - **Supabase Google OAuth:** Not configured in the codebase. Supabase authentication is email/password only.
  - **Android Parity:** **Not configured on Android.** The Android app lacks Firebase or Google Play Services auth dependencies and only supports email/password via Supabase.

---

## 6. Demo Accounts and RoleSwitcher Security

### 6.1 Demo Accounts Implementation
* **Component:** `src/components/pages/AuthModal.tsx` (`handleQuickDemo`, lines 206–215).
* **Mock Users Available:**
  1. `student-1` — **Aarav Sharma** (Role: `STUDENT`, Level 4 Creator, ₹43,000 earned, verified badges).
  2. `business-1` — **NexTech Ventures / Siddharth Menon** (Role: `BUSINESS`, Verified GSTIN).
  3. `admin-1` — **Platform Administrator / Vikramaditya Roy** (Role: `ADMIN`, Full moderation).
* **Nature of Demo Login:** Entirely client-side state manipulation. It retrieves the user fixture from `marketplaceStore.getUsers()` and sets `ptp_current_user_id`. No network call to Supabase or Firebase is dispatched.

### 6.2 RoleSwitcher Component Audit
* **Component:** `src/components/common/RoleSwitcher.tsx` (lines 1–176).
* **Functionality:**
  - Displays current user name, role badge, and Supabase connection status.
  - Provides a dropdown allowing instant switching between any user in `marketplaceStore.getUsers()`, plus a "Public Visitor (Logged Out)" option.
  - Provides a "Reset Data" button that executes `marketplaceStore.resetToDefaults()`.
* **Security Findings:**
  - **Vulnerability:** `RoleSwitcher` is rendered unconditionally at the top of `App.tsx` (line 367) across all views.
  - **Impact in Production / Live Supabase Mode:**
    - On the **client layer**, any visitor can click `RoleSwitcher` and select the Admin account (`admin-1`), which flips `currentUser.role` to `ADMIN` and renders `AdminDashboard`.
    - On the **database layer (Supabase RLS)**, if live Supabase is active, the attacker's actual auth token would remain anonymous or unauthenticated (`auth.uid() is null`), so PostgREST queries to protected tables (`audit_logs`, `disputes`, `projects` updates) would fail with 401/403 errors.
    - However, client-side data inspection of `mockData` and UI actions that only touch `localStorage` remain fully accessible.
  - **Recommendation:** `RoleSwitcher` must be guarded by a development-only check (`if (!import.meta.env.DEV) return null;`) or removed prior to production deployment.

---

## 7. Logout and Session Security

### 7.1 Inventory of Logout Triggers
Every logout button across the codebase was traced:

| Location | Component | Trigger Element | Handler Action |
|---|---|---|---|
| **Top Navigation** | `src/components/layout/Navbar.tsx` (lines 78–89) | "Log Out" button with `LogOut` icon | Calls `onLogout()` |
| **Creator Workspace Sidebar** | `src/components/layout/CreatorWorkspace.tsx` (lines 325–334) | "Sign Out of Account" in sidebar footer | Calls `onLogout()` |
| **Creator Workspace Header** | `src/components/layout/CreatorWorkspace.tsx` (lines 198–206) | Header sign-out button | Calls `onLogout()` |
| **Business Workspace Sidebar** | `src/components/layout/BusinessWorkspace.tsx` (lines 290–298) | "Sign Out of Account" in sidebar footer | Calls `onLogout()` |
| **Business Workspace Header** | `src/components/layout/BusinessWorkspace.tsx` (lines 185–195) | Header sign-out button | Calls `onLogout()` |
| **Student Dashboard Header** | `src/components/pages/StudentDashboard.tsx` (lines 419–428) | Header "Sign Out" button | Calls `onLogout()` |
| **Student Dashboard Settings** | `src/components/pages/StudentDashboard.tsx` (lines 1575–1585) | "Sign Out of Session" button | Calls `onLogout()` |
| **Business Dashboard Header** | `src/components/pages/BusinessDashboard.tsx` (lines 425–435) | Header "Sign Out" button | Calls `onLogout()` |
| **Admin Dashboard Header** | `src/components/pages/AdminDashboard.tsx` (lines 380–390) | Header "Sign Out" button | Calls `onLogout()` |
| **Android Shell Header** | `src/components/layout/AndroidShell.tsx` (lines 102–111) | Top right `LogOut` icon button | Calls `onLogout()` |
| **Role Sandbox Dropdown** | `src/components/common/RoleSwitcher.tsx` (lines 114–122) | "Public Visitor (Logged Out)" option | Calls `onUserChange(null)` & `setCurrentUserId(null)` |
| **Android Native App** | `android/.../ui/navigation/AppNavGraph.kt` | `onLogout` callbacks in Creator, Business, Admin | Calls `authViewModel.logout()` |

### 7.2 Centralized Web Logout Handler
All Web logout actions funnel directly into `handleLogout` in `src/App.tsx` (lines 92–96):
```typescript
const handleLogout = () => {
  marketplaceStore.setCurrentUserId(null);
  setCurrentUser(null);
  setActiveView('landing');
};
```

### 7.3 What Logout Clears vs. What It Retains
* **Cleared:**
  - `localStorage.removeItem('ptp_current_user_id')`.
  - React state `currentUser` reset to `null`.
  - Active route reset to `'landing'`.
* **Retained (Potential Security Gaps):**
  - **No Provider Token Invalidation:** `supabaseService.signOut()` and Firebase `auth.signOut()` are **not invoked** in `handleLogout()`. If a user had an active Firebase or Supabase session, the underlying OAuth or JWT refresh tokens remain stored in IndexedDB/localStorage.
  - **Cached Data Retained:** `ptp_projects`, `ptp_applications`, `ptp_submissions` in `localStorage` remain untouched (intended for offline demo mode, but represents private data leakage on shared computers).
* **Behavior After Browser Refresh:**
  - Because `'ptp_current_user_id'` was removed from `localStorage`, reloading the browser initializes `currentUser` as `null` and presents the public landing page.
  - Direct attempts to open restricted views (e.g. reloading on a protected view state) trigger `AccessDenied`.

---

## 8. Supabase Database Schema and Row Level Security (RLS)

### 8.1 Schema Overview
* **Schema Files:** `supabase/schema.sql` (956 lines) and migration `supabase/migrations/20240101000000_init_schema.sql`.
* **Database Enums:** `user_role` (`'STUDENT'`, `'BUSINESS'`, `'ADMIN'`), `verification_status`, `project_status`, `application_status`, `offer_status`, `payment_status`, `commission_fee_status`, `payment_method`.

### 8.2 Security Functions and Triggers
The schema implements five critical PostgreSQL triggers to prevent tampering:

1. `prevent_profile_privilege_escalation()` on `public.profiles`:
   - Checks `public.is_admin()`. If false, raises exception on any attempt to alter `role`, `is_suspended`, or `suspension_reason`.
2. `prevent_student_stats_tampering()` on `public.student_profiles`:
   - Prevents non-admins from manually increasing `average_rating`, `completed_projects_count`, or `total_earned_paise`.
3. `prevent_business_verification_tampering()` on `public.business_profiles`:
   - Prevents businesses from setting `verification_status = 'VERIFIED'` or editing admin review notes.
4. `prevent_commission_verification_tampering()` on `public.platform_commissions`:
   - Enforces that only administrators can mark commission fees as `VERIFIED_COLLECTED` or `WAIVED`.
5. `handle_new_user()` on `auth.users`:
   - Auto-provisions profiles upon auth signup while preventing admin privilege injection.

### 8.3 RLS Policy Audit
Every table has RLS explicitly enabled (`alter table ... enable row level security;`).

| Table | Policy Name | Permitted Operations | Access Condition | Security Assessment |
|---|---|---|---|---|
| `profiles` | "Users can read own profile" | `SELECT` | `auth.uid() = id OR is_admin()` | **Secure** |
| `profiles` | "Public directory info viewable" | `SELECT` | `NOT is_suspended` | **Secure** (Hides suspended accounts) |
| `profiles` | "Users can update own basic profile" | `UPDATE` | `auth.uid() = id` | **Secure** (Trigger blocks role tampering) |
| `student_profiles`| "Students can update own profile" | `UPDATE` | `auth.uid() = user_id` | **Secure** (Stats trigger protected) |
| `business_profiles`| "Businesses can update own profile"| `UPDATE` | `auth.uid() = user_id` | **Secure** (Verification trigger protected) |
| `projects` | "Approved projects viewable by all" | `SELECT` | `status IN ('APPROVED','IN_PROGRESS','COMPLETED') OR business_id = auth.uid() OR is_admin()` | **Secure** (Drafts are strictly private) |
| `projects` | "Businesses can insert own projects"| `INSERT` | `business_id = auth.uid()` | **Secure** |
| `applications` | "Students view own applications" | `SELECT` | `student_id = auth.uid() OR is_admin()` | **Secure** |
| `applications` | "Businesses view project applications"| `SELECT` | Owning project `business_id = auth.uid()` | **Secure** (Competitors cannot view pitches) |
| `project_offers` | "Offer participants view offer" | `SELECT` | `business_id = auth.uid() OR student_id = auth.uid() OR is_admin()` | **Secure** (Binding scope is confidential) |
| `audit_logs` | "Only admins read audit logs" | `SELECT` | `is_admin()` | **Secure** |

### 8.4 Service-Role Key Audit
- An audit of all client source code (`src/` and `android/`) confirms that **no Supabase service-role secret key or master database password is embedded or exposed**.
- Only `VITE_SUPABASE_PUBLISHABLE_KEY` and `VITE_SUPABASE_ANON_KEY` are referenced.

---

## 9. Web versus Android Parity Comparison

| Dimension | Web Application (`src/`) | Android Native App (`android/`) | Parity Status |
|---|---|---|---|
| **Language / Framework** | TypeScript / React 19 / Vite | Kotlin / Jetpack Compose / Coroutines | Platform-specific |
| **Authentication Flow** | Email selection in sandbox or Firebase Google popup | Email + Password form via Supabase GoTrue or mock user | **Discrepancy** |
| **Google OAuth** | Present via Firebase (`signInWithPopup`) | **None** (Email/Password only) | **Web only** |
| **Password Validation** | Bypassed in client demo mode | Checked via Supabase or mock user branch | **Discrepancy** |
| **Age 18+ Check** | Zod schema + PostgreSQL check constraint | Kotlin validation (`ageInput < 18`) + DB constraint | **Consistent** |
| **Role Routing** | `App.tsx` switch with `AccessDenied` | `AppNavGraph.kt` with `NavHost` role dispatch | **Consistent** |
| **Role Switcher** | Visual top banner (`RoleSwitcher.tsx`) | None (Native Compose navigation) | **Web only** (Sandbox tool) |
| **Logout Execution** | Clears `ptp_current_user_id` & React state | Sets `_currentUser.value = null` & pops navigation | **Consistent** |
| **Supabase Client** | `@supabase/supabase-js` v2.117 | `io.github.jan.supabase` (Auth, Postgrest, Storage) | **Consistent** |
| **Dual Mode Support** | Offline sandbox mode fallback if no env vars | Mock user fallback if `!SupabaseClientProvider.isConfigured` | **Consistent** |

---

## 10. Automated Tests Executed & Results

Vitest was executed against the repository test suite (`npm run test`):

```text
 RUN  v5.0.4 /app/applet
 ✓ src/tests/studentDashboardRender.test.tsx (8 tests)
 ✓ src/tests/paymentHistory.test.ts (8 tests)
 ✓ src/tests/securityAndMonetization.test.ts (41 tests)
 ✓ src/tests/supabaseConnection.test.ts (15 tests)
 ✓ src/tests/supabaseSchemaMigration.test.ts (75 tests)
 ✓ src/tests/publicPortfolioSocialLinks.test.ts (10 tests)
 ✓ src/tests/supabaseRlsTestScript.test.ts (14 tests)
 ✓ src/tests/verifiedSkills.test.ts (4 tests)

 Test Files  8 passed (8)
      Tests  175 passed (175)
   Duration  4.31s
```

### Key Security Assertions Verified by Tests:
1. **RLS Policy Checks (`supabaseRlsTestScript.test.ts` & `supabaseSchemaMigration.test.ts`):** Verifies that all 17 tables enable RLS and that anonymous queries cannot access draft projects or alter profiles.
2. **Privilege Escalation Triggers (`securityAndMonetization.test.ts`):** Verifies that non-admin modifications to ratings, earnings, verification statuses, and platform fees throw exceptions.
3. **Environment Credential Validation (`supabaseConnection.test.ts`):** Verifies that placeholder strings (`your-project`, `dummy_anon_key`) are rejected.

---

## 11. Confirmed Vulnerabilities, Risks & Incomplete Implementations

### Confirmed Defect 1: Unconditional RoleSwitcher Visibility
* **Severity:** High (Production Risk)
* **File:** `src/components/common/RoleSwitcher.tsx` & `src/App.tsx` (line 367)
* **Finding:** The `RoleSwitcher` bar renders in all environments. Anyone can click the dropdown, select the Administrator account, and access administrative views (`AdminDashboard`).
* **Mitigation:** Wrap `RoleSwitcher` in `if (import.meta.env.PROD && isSupabaseConfigured()) return null;`.

### Confirmed Defect 2: Client-Side Login Does Not Verify Password
* **Severity:** Medium (Sandbox Limitation)
* **File:** `src/components/pages/AuthModal.tsx` (lines 86–102)
* **Finding:** `handleLogin` checks only whether the email matches a record in `marketplaceStore.getUsers()`. It does not compare passwords or call `supabaseService.signInWithEmail`.
* **Mitigation:** In live mode, delegate authentication directly to `supabaseService.signInWithEmail`.

### Confirmed Defect 3: No Duplicate Email Guard on Client Sign-Up
* **Severity:** Low (Data Integrity)
* **File:** `src/components/pages/AuthModal.tsx` (lines 104–204)
* **Finding:** `handleRegisterStudent` and `handleRegisterBusiness` prepend new users to `ptp_users` without verifying whether the email is already registered.
* **Mitigation:** Add an email collision check `if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) setErrorMsg('Email is already registered');`.

### Confirmed Defect 4: Logout Does Not Call Provider SignOut
* **Severity:** Medium (Session Hygiene)
* **File:** `src/App.tsx` (lines 92–96)
* **Finding:** `handleLogout` resets local state and removes `ptp_current_user_id`, but does not invoke `supabaseService.signOut()` or Firebase `signOut(auth)`.
* **Mitigation:** Invoke `supabaseService.signOut()` and `auth.signOut()` asynchronously inside `handleLogout`.

### Confirmed Defect 5: Google OAuth Lacks Android Parity
* **Severity:** Low (Feature Parity)
* **File:** `android/app/src/main/java/in/prooftopay/app/ui/screens/auth/AuthScreens.kt`
* **Finding:** Google Sign-In is only implemented on Web via Firebase. The native Android app does not include Google Identity or Credential Manager support.

---

## 12. Prioritized Actionable Recommendations

### Priority 1 (Immediate / Security Hardening)
1. **Restrict RoleSwitcher in Production:** Hide the sandbox switcher in production builds or when connected to a live Supabase project to prevent unauthorized client-side role emulation.
2. **Integrate Real Supabase Auth in Web AuthModal:** When `isSupabaseConfigured()` is true, connect `AuthModal.tsx` to `supabaseService.signInWithEmail` and `supabaseService.signUpWithEmail` so that authentication is handled by the Supabase backend.
3. **Invalidate Provider Sessions on Logout:** Update `handleLogout` in `src/App.tsx` to call `supabaseService.signOut()` and Firebase `auth.signOut()`.

### Priority 2 (Data Integrity & UX)
4. **Enforce Duplicate Email Check in AuthModal:** Reject duplicate email registrations before modifying the client store.
5. **Session Expiry Listener:** Hook `supabase.auth.onAuthStateChange` in `src/App.tsx` to automatically sync session state and handle token expiration.

### Priority 3 (Mobile Parity)
6. **Implement Google Sign-In on Android:** Add Android Credential Manager or Google Sign-In SDK support to `AuthScreens.kt` for feature parity with the Web experience.
