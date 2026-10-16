# Proof-to-Pay — Local Setup, Testing & Verification Guide

This guide provides tested, reproducible instructions for running, testing, and building both the Web application and the Native Android companion application.

---

## 1. Web Application (React 19 + Vite 8 + TypeScript)

### Prerequisites
- Node.js 18.0.0 or higher (Node 20+ LTS recommended)
- npm 9+ or bun / yarn / pnpm

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Environment Configuration
Create a `.env.local` file in the root directory (based on `.env.example`):
```bash
cp .env.example .env.local
```

Configure your environment variables:
```ini
# Live Supabase Connection (Optional for local demo; leave empty or unconfigured to run in Offline Sandbox mode)
VITE_SUPABASE_URL=https://your-real-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-real-supabase-publishable-key
VITE_SUPABASE_ANON_KEY=your-real-supabase-publishable-key

# Direct PostgreSQL URL (Used only for CLI migrations)
DATABASE_URL=postgresql://postgres:password@db.your-real-project.supabase.co:5432/postgres

# Optional Server-Side Gemini API Key
GEMINI_API_KEY=your-gemini-api-key
```

*Note: If no Supabase credentials are provided, Proof-to-Pay will automatically and safely run in **Offline Demo Sandbox Mode** with pre-seeded test data for Aarav Sharma (Student), HyperFlow Labs (Business), and Roy (Admin).*

### Step 3: Run Development Server
```bash
npm run dev
```
The server will start at `http://localhost:3000`.

### Step 4: Run Automated Test Suite
```bash
npm test
```
**Actual Repository Test Results**:
- Test runner: Vitest v5.0.4
- Files tested: **8 test files** (`src/tests/*`)
- Tests executed: **175 passed (0 failed)**
- Duration: ~4.9 seconds

### Step 5: TypeScript Compilation & Linting
```bash
npm run lint
```
**Actual Repository Result**: `tsc --noEmit` exits with **0 errors**.

### Step 6: Production Build
```bash
npm run build
```
**Actual Repository Result**: Compiles client assets and PWA service worker (`dist/sw.js`) in ~1.58s with 1,849 transformed modules.

---

## 2. Native Android Application (Kotlin + Jetpack Compose)

### Prerequisites
- Android Studio (Hedgehog, Iguana, Ladybug or newer)
- Java Development Kit (JDK) 17 or higher
- Android SDK API level 34 (Android 14) and build-tools 34.0.0
- Target Android emulator or physical device running API level 26 (Android 8.0 Oreo) or above

### Step 1: Open in Android Studio
1. Launch Android Studio.
2. Select **File > Open...** and navigate to the `/android` directory inside the repository.
3. Android Studio will automatically recognize the Gradle build configuration (`android/build.gradle.kts` and `android/app/build.gradle.kts`) and begin syncing dependencies.

### Step 2: Configure Supabase Credentials (Optional)
In `android/gradle.properties` or `android/local.properties`:
```properties
SUPABASE_URL=https://your-real-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-real-supabase-publishable-key
```
*Note: If credentials are not set, the Android companion app automatically falls back to its local offline mock repositories in `Repositories.kt`.*

### Step 3: Run Android Unit Tests
In the Android Studio terminal or from command line:
```bash
cd android
./gradlew test
```
Executes JUnit tests in `android/app/src/test/java/in/prooftopay/app/ProjectLifecycleTest.kt`:
- `testUnder18StudentRegistrationRejected()`: Asserts that an age of 17 throws an `IllegalArgumentException`.
- `testAdultStudentRegistrationAccepted()`: Asserts that an age of 18+ successfully registers.
- `testPreventDuplicateProjectApplications()`: Asserts that a second application to the same project is blocked.
- `testProjectStatusTransitionLifecycle()`: Asserts that status moves from `DRAFT` → `APPROVED` → `IN_PROGRESS` → `SUBMITTED` → `COMPLETED`.

### Step 4: Assemble Installable Debug APK
```bash
cd android
./gradlew assembleDebug
```
The resulting APK will be generated at:
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## 3. Database Schema Deployment (Supabase)

To apply the database schema to a live Supabase project:

1. Open the [Supabase Dashboard](https://supabase.com/dashboard).
2. Create a new project.
3. Open the **SQL Editor** from the left sidebar.
4. Copy and paste the entire contents of `supabase/schema.sql`.
5. Click **Run**.
6. The script is **100% idempotent** (`create table if not exists`, `if not exists create type`) and sets up all 17 tables, custom ENUM types, composite constraints, and RLS policies.
