# Proof-to-Pay Native Android App (Kotlin & Jetpack Compose)

**Tagline:** "Do real work. Get paid. Build proof."

This is the native Android companion to the Proof-to-Pay web platform. It connects directly to the same Supabase backend, database schema, and authentication system, sharing accounts, projects, applications, deliverables, and payment proof.

---

## Architecture & Tech Stack

- **Language:** Kotlin 1.9.22 (100% Native)
- **UI Toolkit:** Jetpack Compose + Material 3
- **Design System:** Deep Navy & Emerald Proof-to-Pay Brand Palette with dark/light theme support
- **Architecture:** MVVM (Model-View-ViewModel) with unidirectional data flow
- **Concurrency & Reactivity:** Kotlin Coroutines & `StateFlow`
- **Navigation:** Navigation Compose (`AppNavGraph.kt`, `Screen.kt`)
- **Backend & Auth:** Supabase Kotlin SDK (`gotrue-kt`, `postgrest-kt`, `storage-kt`, `realtime-kt`)
- **HTTP Client:** Ktor Android Engine
- **JSON Serialization:** `kotlinx.serialization`
- **Unit Testing:** JUnit 4 test suite (`ProjectLifecycleTest.kt`)

---

## Project Structure

```
android/
├── app/
│   ├── build.gradle.kts
│   ├── src/
│   │   ├── main/
│   │   │   ├── AndroidManifest.xml
│   │   │   ├── java/in/prooftopay/app/
│   │   │   │   ├── ProofToPayApp.kt              # Application subclass
│   │   │   │   ├── MainActivity.kt               # Single Activity entry point
│   │   │   │   ├── theme/
│   │   │   │   │   └── Color.kt & Theme.kt       # Material 3 Design tokens
│   │   │   │   ├── data/
│   │   │   │   │   ├── model/Models.kt           # Shared Supabase schemas & enums
│   │   │   │   │   ├── supabase/
│   │   │   │   │   │   └── SupabaseClientProvider.kt # Live Supabase client + offline fallback
│   │   │   │   │   └── repository/
│   │   │   │   │       └── Repositories.kt       # Auth, Project, Application, Submission, Payment, Review, Admin
│   │   │   │   ├── viewmodel/
│   │   │   │   │   └── ViewModels.kt             # AuthViewModel, CreatorViewModel, BusinessViewModel, AdminViewModel
│   │   │   │   └── ui/
│   │   │   │       ├── navigation/
│   │   │   │       │   ├── Screen.kt             # Type-safe screen routes
│   │   │   │       │   └── AppNavGraph.kt        # Jetpack Compose navigation graph
│   │   │   │       ├── components/
│   │   │   │       │   └── Components.kt         # ProjectCard, TopBar, BottomBars, Badges
│   │   │   │       └── screens/
│   │   │   │           ├── splash/SplashScreen.kt
│   │   │   │           ├── onboarding/OnboardingScreen.kt
│   │   │   │           ├── auth/AuthScreens.kt   # Login, Register (18+ gate), ForgotPassword
│   │   │   │           ├── creator/CreatorScreens.kt # Browse, Details, Apply, Active, Submit, Earnings, Portfolio, Settings
│   │   │   │           ├── business/BusinessScreens.kt # Drafts, Review, Shortlist, Offers, Revisions, UTR Payment
│   │   │   │           └── admin/AdminScreens.kt # Moderation, Reject with reasons, Disputes, Audit logs
│   │   │   └── res/
│   │   └── test/java/in/prooftopay/app/
│   │       └── ProjectLifecycleTest.kt           # End-to-end lifecycle and security tests
├── build.gradle.kts
├── settings.gradle.kts
└── gradle.properties
```

---

## Getting Started in Android Studio

### Prerequisites
- **Android Studio:** Hedgehog (2023.1.1), Iguana (2023.2.1), or Koala (2024.1.1+)
- **JDK:** Java 17 or higher (configured in `Settings > Build, Execution, Deployment > Build Tools > Gradle > Gradle JDK`)
- **Android SDK:** Compile SDK 34, Min SDK 26 (Android 8.0 Oreo or higher)

### 1. Open the Project
1. Open Android Studio.
2. Select **Open** and select the `/android` directory.
3. Allow Gradle to sync dependencies.

### 2. Configure Supabase Credentials
By default, `SupabaseClientProvider.kt` connects to your Supabase instance using the environment variables or configuration constants:
- `SUPABASE_URL`: `https://your-project.supabase.co`
- `SUPABASE_ANON_KEY`: `your-public-anon-key`

To set your live project credentials, configure them in `SupabaseClientProvider.kt` or pass them via `gradle.properties`:
```properties
SUPABASE_URL=https://xyzcompany.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
```
*Note: Never include the `service_role` secret in the Android app. Authorization is enforced via Supabase Row-Level Security (RLS) rules in `supabase/schema.sql`.*

### 3. Running Unit Tests
To run the automated tests validating user registration, 18+ age checks, duplicate application prevention, and payment status updates:
```bash
./gradlew test
```

### 4. Build Debug APK
To assemble the debug APK:
```bash
./gradlew assembleDebug
```
The output APK is located at:
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## User Journey & Workflow Validation

### 1. Registration & Login
- **18+ Enforcement:** Creator registration verifies birth date and blocks users under 18 years old.
- **Role Isolation:** Users select either `STUDENT` (Creator) or `BUSINESS`. Admins are verified server-side only.

### 2. Complete Project Lifecycle (Tested)
1. **Business Creation:** Business posts project with INR budget, deliverables, revision limits, and deadline.
2. **Admin Moderation:** Project enters `PENDING_REVIEW`. Admin inspects scope and either approves or provides rejection feedback.
3. **Marketplace Discovery:** Approved project immediately appears in Creator Browse and Search with category/skill filters.
4. **Creator Application:** Creator submits pitch message and portfolio links. Duplicate applications are blocked.
5. **Business Review & Offer:** Business shortlists creator and sends formal offer terms.
6. **Active Assignment:** Creator accepts offer; project status moves to `IN_PROGRESS`.
7. **Deliverable Submission:** Creator uploads files or links with version notes.
8. **Revisions / Approval:** Business reviews deliverable, requests revisions with feedback (enforcing maximum revision limits), or approves.
9. **Proof-to-Pay Payment:** Business records Bank Transfer / UPI payment with unique UTR number.
10. **Completed Proof & Review:** Deliverable is minted into the creator's verified public portfolio with rating and review.
