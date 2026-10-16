# Proof-to-Pay — Web vs Native Android Comparison

This document provides a feature-by-feature comparison between the **Web Application** (React 19 + TypeScript + Vite) and the **Native Android Companion Application** (Kotlin + Jetpack Compose) in the repository.

---

## 1. Feature-by-Feature Matrix

| Feature / Domain | Web App Status | Android App Status | Shared Backend / Services | Platform Differences & Details |
|---|---|---|---|---|
| **App Architecture** | React 19 SPA with Vite 8, Tailwind CSS v4, Lucide icons. | Native Kotlin 1.9+, Jetpack Compose, Material 3, Navigation Compose, Clean MVVM. | Shared Supabase schema (`supabase/schema.sql`) and data models. | Web renders responsive desktop/tablet layouts + embedded mobile frame. Android is 100% native Kotlin with Compose StateFlow. |
| **Splash & Onboarding** | Landing page with hero CTA and feature sections. | Dedicated `SplashScreen` (animated logo/tagline) + 3-step `OnboardingScreen` pager. | Shared branding copy and trust guarantees. | Android includes a native animated onboarding pager explaining Zero Spec Work and Audited UTR payouts before login. |
| **Authentication: Email/Password** | Implemented via `AuthModal.tsx`. | Implemented via `LoginScreen.kt` & `RegisterScreen.kt`. | Target: Supabase Auth (`auth.signInWithPassword()`). | Both enforce 18+ adult age validation during student registration. Web also includes 1-Click quick sandbox demo accounts. |
| **Authentication: Google Sign-In** | Implemented via Firebase Auth popup (`signInWithPopup`). | Structured for Supabase Auth Google provider or Webview OAuth. | Firebase Auth (Web) / Supabase Auth (Android). | Web uses direct Firebase Google popup. Android companion handles email/pass and auth state flows via `AuthRepository`. |
| **Browse & Filter Projects** | Implemented in `BrowseProjects.tsx` with live search and category chips. | Implemented in `BrowseProjectsScreen.kt` with live query and category chips. | `projects` table / repository. | Web includes quick budget sort dropdown; Android provides native Material 3 search field and horizontal scrollable filter chips. |
| **Project Details & Scope Breakdown** | Implemented in `ProjectDetail.tsx` with deliverables checklist. | Implemented in `ProjectDetailScreen.kt` with scope breakdown and terms. | `projects` and `deliverables` tables. | Both show verified business badges, net creator compensation, permitted revisions, and deadline days. |
| **Pitch & Application Submission** | Implemented in `ProjectDetail.tsx` (modal). Validates min 20 chars. | Implemented in `ApplyProjectScreen.kt`. Validates pitch length and portfolio links. | `applications` table. Composite `unique(project_id, student_id)`. | Both prevent duplicate applications to the same project. |
| **Binding Formal Offer Issuance** | Implemented in `BusinessDashboard.tsx` (`activeTab === 'applications'`). | Implemented in `ManageApplicantsScreen.kt` (issue offer dialog). | `project_offers` table. | Both allow businesses to lock agreed budget, deadline, and permitted revision count. |
| **Formal Offer Review & Scope Lock** | Implemented in `StudentDashboard.tsx` with explicit modal. | Implemented in `CreatorApplicationsScreen.kt` with Accept/Decline actions. | `project_offers` and `projects` tables. | Web triggers canvas confetti on acceptance. Both freeze the deliverable snapshot. |
| **Deliverables Submission** | Implemented in `StudentDashboard.tsx` with live demo / Figma / GitHub inputs. | Implemented in `SubmitDeliverableScreen.kt` with URL fields and notes. | `submissions` table. | Both validate URL inputs and transition project status to `SUBMITTED`. |
| **Client Review & Revision Capping** | Implemented in `BusinessDashboard.tsx` (`activeTab === 'active_work'`). | Implemented in `BusinessDeliverableReviewScreen.kt`. | `projects` and `submissions` tables. | Both enforce agreed revision cap (1–5) and prevent revision requests once the cap is exhausted. |
| **Payment Recording (Bank UTR / UPI)** | Implemented in `BusinessDashboard.tsx` with 12-digit UTR validation. | Handled via payment recording flow in `BusinessScreens.kt`. | `project_payments` table. | Both enforce 12-digit transaction UTR number entry; zero automated gateway fees deducted from student. |
| **Payment Confirmation by Creator** | Implemented in `PaymentHistory.tsx` (`handleConfirmReceipt`). | Ledger view in `EarningsScreen.kt`. | `project_payments` table. | Creator inspects UTR and marks receipt confirmed. |
| **Proof Passport Public Portfolio** | Implemented in `PublicPortfolio.tsx` (2,649 lines). Rich social share cards, QR code, skill meters. | Implemented in `CreatorPortfolioScreen.kt` (clean native list view). | `student_profiles` and `proof_passport_items`. | Web offers an extensive desktop recruiter view with social meta tags, filter tabs, and copyable slug. Android provides a sleek mobile view. |
| **Platform Commission (5%) Management** | Implemented in `BusinessDashboard.tsx` (report fee modal) and `AdminDashboard.tsx` (verify fee). | Schema supported; core admin telemetry in `AdminHomeScreen.kt`. | `platform_commissions` table. | Web has full commission modal dialog, fee status filter, and UTR collection verification for Admins. |
| **Admin Operations & Test Suite** | Implemented in `AdminDashboard.tsx` (9 tabs + in-browser live automated assertion suite). | Implemented in `AdminHomeScreen.kt` (metrics telemetry and moderation list). | `audit_logs`, `disputes`, `abuse_reports`. | Web includes an interactive in-browser automated test runner verifying 6 live security and math invariants. |
| **Offline Sandbox Mode** | Implemented via `MarketplaceStore` (`src/lib/storage.ts`) with `localStorage`. | Implemented via in-memory `StateFlow` mock fallback in `Repositories.kt`. | Local memory stores. | Both platforms can run 100% offline without live database credentials, making them instantly demoable. |
| **Mobile Simulation on Web** | Implemented via `AndroidShell.tsx` (toggled in top RoleSwitcher bar). | N/A (runs directly on native device/emulator). | N/A | Web includes an embedded Android frame simulator with punch hole camera, 5G status bar, and thumb-friendly navigation. |

---

## 2. Platform Build, Test & Execution Commands

### Web Application

| Task | Command | Verified Result in Repository |
|---|---|---|
| **Install Dependencies** | `npm install` | Uses dependencies declared in `package.json`. |
| **Start Development Server** | `npm run dev` | Runs Vite on port 3000 (`vite --port=3000 --host=0.0.0.0`). |
| **Compile & TypeScript Lint** | `npm run lint` | Runs `tsc --noEmit`. Passes with **0 errors**. |
| **Production Build** | `npm run build` | Compiles client assets and PWA service worker into `/dist` in **1.58s**. |
| **Run Automated Test Suite** | `npm test` | Executes Vitest. **All 175 tests in 8 test files pass** in ~4.9s. |

### Android Companion Application

| Task | Command | Execution Requirements & Notes |
|---|---|---|
| **Open in Android Studio** | Open folder `/android` | Requires Android Studio (Hedgehog, Iguana, Ladybug or newer) with JDK 17+. |
| **Sync Gradle Dependencies** | Handled by Android Studio | Downloads Compose BOM, Supabase Kotlin SDK v2.5, Ktor client, and AndroidX dependencies. |
| **Run Android Unit Tests** | `cd android && ./gradlew test` | Runs Kotlin JUnit tests in `ProjectLifecycleTest.kt` (age validation, duplicate prevention, status transitions). *Note: Requires local Java/JDK; cannot be run inside standard web containers.* |
| **Assemble Debug APK** | `cd android && ./gradlew assembleDebug` | Builds installable debug APK output at `android/app/build/outputs/apk/debug/app-debug.apk`. |
| **Run on Emulator / Device** | Android Studio "Run" (Shift + F10) | Compatible with Android API level 26 (Android 8.0 Oreo) and above. |
