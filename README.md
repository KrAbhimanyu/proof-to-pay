# Proof-to-Pay 🇮🇳
> **Your skills. Your proof. Your first pay.**
> **Do real work. Get paid. Build proof.**
> The verified work-experience and paid project platform connecting students and emerging creators in India with legitimate businesses.

---

## 📱 Native Android App (Kotlin & Jetpack Compose)

The repository includes the complete native Android companion application in `/android`, built with modern Android standards:

### 1. Architecture & Stack
* **Language**: Kotlin 1.9+ with Coroutines & StateFlow.
* **UI Framework**: Jetpack Compose with Material 3 design system.
* **Navigation**: Navigation Compose with type-safe route modeling.
* **Architecture**: Clean MVVM (Model-View-ViewModel) with decoupled repository layer.
* **Backend Integration**: Supabase Kotlin SDK v2.5 (`gotrue-kt`, `postgrest-kt`, `storage-kt`, `realtime-kt`) over Ktor HTTP client.
* **Package**: `in.prooftopay.app`

### 2. Opening & Running in Android Studio
1. Open Android Studio (Hedgehog / Iguana / Ladybug or newer).
2. Select **Open** and choose the `/android` directory of this repository.
3. Gradle will sync dependencies (`androidx.compose`, `io.github.jan-tennert.supabase`, etc.).
4. Run on an Android emulator (API 26+) or physical device.
5. Execute unit tests:
   ```bash
   cd android
   ./gradlew test
   ```

### 3. Native Screens Implemented

#### A. App Identity & Onboarding
* **Splash Screen**: Polished splash screen with brand logo and tagline *"Do real work. Get paid. Build proof."*.
* **Onboarding**: 3-step animated pager explaining verified projects, locked scopes, zero spec work, and UTR payouts.
* **Authentication**: Sign Up (with 18+ adult age validation & role selection), Sign In, Password Reset, and persistent session state.

#### B. Creator Screens
* **Home Dashboard**: Cleared earnings in INR, active project assignments count, verified 5.0 rating, and approved listings feed.
* **Browse & Search**: Live keyword search and category chip filters (UI/UX, Brand Identity, Web Dev, Python Automation).
* **Project Details**: Full scope, deliverables breakdown, business verification badge, payment terms, and apply CTA.
* **Apply to Project**: Pitch submission (minimum character validation), portfolio links, turnaround estimate, and duplicate application prevention.
* **Applications & Offers**: Status tracking (Pending, Shortlisted, Offer Extended) and formal binding offer response (Accept / Decline).
* **Active Assignments**: Deadlines countdown, fees, deliverable submission status.
* **Submit Deliverables**: Version tracking, notes, live demo / Figma / GitHub links.
* **Earnings & Payouts**: Cleared balance, payment history with traceable bank UTR references and UPI details.
* **Verified Portfolio**: Minted proof with client testimonials, star ratings, and verified deliverable summary.
* **Account & Settings**: College details, 18+ age verification, UPI ID configuration, and GDPR/DPDP account deletion.

#### C. Business Screens
* **Business Dashboard**: Spend overview, active project count, applicants telemetry, and project listings status.
* **Create Project**: Structured wizard with deliverables breakdown, budget validation (>= ₹1,000 INR), timeline (>= 2 days), permitted revisions (1–5), and payment terms.
* **Manage Applicants**: Review applicants, inspect portfolios, shortlist, and extend formal binding offers.
* **Deliverable Review**: Version history, preview live links, approve work and release payment, or request targeted revisions respecting agreed caps.
* **Payment Recording**: Record bank transfer / UPI UTR reference number with auditable timestamp.
* **Business Verification**: Submit Indian legal entity details (GSTIN, CIN, PAN, or MSME Udyam) for admin verification.

#### D. Admin Screens
* **Platform Operations**: Telemetry on registered creators, businesses, active listings, disputes, and total INR volume.
* **Project Moderation**: Approve or reject pending project drafts with structured reason notes.
* **Dispute Resolution**: Review scope disputes between creators and businesses with binding administrative resolutions.
* **Audit History**: Tamper-evident immutable audit log of every system transaction, login, and payment.

---

## 🗄️ Shared Supabase Backend & Database Schema

The database schema in `/supabase/schema.sql` is shared seamlessly across both the web application and the native Android app:

* **`profiles`**: Linked to `auth.users(id)` with roles (`STUDENT`, `BUSINESS`, `ADMIN`).
* **`student_profiles`**: 18+ age check (`check (age >= 18)`), skills, college, UPI ID, ratings, earnings in INR.
* **`business_profiles`**: Legal entity verification details (`GSTIN`, `CIN`, `PAN`, `MSME`), industry, city.
* **`projects`**: Listing scopes, budget in INR (`check (budget_inr >= 1000)`), deadline days (`check (deadline_days >= 2)`), permitted revisions (`check (permitted_revisions between 1 and 5)`).
* **`applications`**: Unique composite constraint preventing duplicate student applications to the same project.
* **`project_offers`**: Binding offers with frozen deliverables and locked budgets.
* **`project_submissions`**: Versioned deliverables with revision tracking.
* **`payment_records`**: Audited transaction reference with bank UTR number and payment method (`UPI`, `NEFT_IMPS`).
* **`verified_reviews`**: Verified client testimonials tied to completed project deliverables.
* **`disputes` & `audit_logs`**: Administrative audit trail and resolution history.

---

## 🔒 Security & Integrity Enforcements

1. **Adult 18+ Participation**: Indian legal contract law requires adulthood; enforced across client validation, Zod schemas, and database check constraints.
2. **Zero Unpaid Spec Work**: Businesses cannot request free sample work; applications are evaluated on existing portfolios.
3. **Scope Lockdown**: Unilateral budget or deliverable modifications after student acceptance are prohibited.
4. **Permitted Revision Limits**: Prevents scope creep by capping revisions to the agreed count (1–5).
5. **Audited UTR Payments**: All payouts require a traceable bank UTR or UPI transaction reference for proof of payment.

---

## 🧪 Automated Unit Tests

* **Android Companion App**:
  Run `./gradlew test` inside `/android` or run `ProjectLifecycleTest.kt`:
  - `testUnder18StudentRegistrationRejected`
  - `testAdultStudentRegistrationAccepted`
  - `testPreventDuplicateProjectApplications`
  - `testProjectStatusTransitionLifecycle`
  - `testPermittedRevisionLimitEnforcement`
  - `testPaymentRecordingRequiresValidUtr`
* **Web Companion App**:
  - `npm run lint` - TypeScript strict type checking.
  - In-browser interactive test suite under Platform Admin Console.
