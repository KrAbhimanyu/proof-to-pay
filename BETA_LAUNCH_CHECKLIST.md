# PROOF-TO-PAY: BETA LAUNCH & ₹0 BUDGET OPERATIONAL CHECKLIST

## 1. Beta Testing Checklist by Role

### A. Creator (Student 18+) Journey
- [ ] **Registration & 18+ Gate**: Register with birthdate/age. Confirm students under 18 receive an explicit validation block.
- [ ] **Onboarding & Profile**: Enter college, skills, and optional UPI ID. Confirm no admin capabilities can be self-assigned.
- [ ] **Discover Projects**: Search and filter active projects by category (UI/UX, Web Dev, Python Automation) and budget range.
- [ ] **Apply to Project**: Submit pitch message and past portfolio links. Confirm that attempting to apply a second time is strictly blocked with "Already applied" error.
- [ ] **Review Binding Offer**: Receive notification of a formal offer from a verified business with frozen deliverables, deadline, and INR budget. Accept or decline the offer.
- [ ] **Active Assignment & Deadlines**: Verify project appears in Active Assignments with delivery countdown.
- [ ] **Submit Deliverables**: Provide version notes, live link (e.g. Figma / GitHub PR), and deliverable summary. Confirm submission changes status to `SUBMITTED`.
- [ ] **Revision Handling**: If the business requests revisions, review specific feedback and confirm revision cycle counter increments without exceeding the project's max permitted revisions (1–5).
- [ ] **Payment Status Verification**: Confirm that project payment displays as `Pending Payment` until the business inputs an audited bank UTR transaction number.
- [ ] **Public Verified Portfolio**: After approval and payment confirmation, check the public portfolio URL (e.g., `/portfolio/aarav-sharma`) to ensure the verified proof badge, client review, and deliverable summary are publicly rendered.
- [ ] **Privacy & Account Deletion**: Test self-service GDPR/DPDP account deletion in Settings.

---

### B. Business Journey
- [ ] **Registration**: Sign up with company name, industry, and city.
- [ ] **Business Verification**: Submit GSTIN / CIN / MSME legal details. Verify status moves to `PENDING` and displays badge upon admin approval.
- [ ] **Post Project**: Create project with clear scope, acceptance criteria, deliverables, INR budget (minimum ₹1,000), deadline (minimum 2 days), and revision cap (1–5). Submit for moderation (`PENDING_REVIEW`).
- [ ] **Review Applicants**: Once approved by admin, review applicant pitches and portfolios. Shortlist candidates.
- [ ] **Send Binding Offer**: Issue a formal offer with locked scope terms to the selected creator.
- [ ] **Track Execution**: Monitor assignment deadlines.
- [ ] **Review Deliverables**: Inspect creator submission files and links.
- [ ] **Request Revision vs. Approve**:
  - Request revision with constructive feedback (enforces max revision limit).
  - Or click "Approve Work".
- [ ] **Settle Payment with Real UTR**: Enter genuine Bank Transfer / UPI UTR reference number (e.g., `UTR-HDFC-991283819201`). Confirm that blank or invalid UTR entries are rejected.
- [ ] **Leave Verified Review**: Rate the creator 1–5 stars and submit honest feedback.

---

### C. Admin Journey
- [ ] **Super Admin Access**: Log in with authorized credentials (`admin-1@prooftopay.in`). Confirm non-admin accounts cannot access `/admin` or invoke admin methods.
- [ ] **Review Pending Projects**: Inspect project scopes in moderation queue. Approve legitimate listings or reject with specific guidance.
- [ ] **Verify Business Tax Documents**: Inspect submitted GSTIN/CIN records and approve verified badges.
- [ ] **Dispute Resolution**: Review open disputes, inspect agreed terms and delivered files, and issue binding resolutions.
- [ ] **Safety & Abuse Reports Queue**: Inspect reports of off-platform payment attempts or spam, issue warnings, or suspend offending accounts in one click.
- [ ] **Audit Trail**: Review immutable log of every status change, payment record, and account action.

---

## 2. Safety & Payment Accuracy Protocols

1. **Real-Money Gateway Disabled**:
   - Automated payment gateways (Razorpay, Cashfree, Decentro) remain disabled during Phase 1 Beta until formal corporate entity bank accounts and merchant KYC are verified.
   - All settlements are performed directly between business and student accounts via NEFT/IMPS or UPI.
2. **No Fake Balances or Simulated Escrow**:
   - The platform never fabricates digital wallet balances or simulates escrow holding.
   - A payment is ONLY marked as `PAID` when a legitimate business user explicitly records a valid, unique bank transaction UTR number.
3. **Accurate Status Labels**:
   - `NOT_INITIATED`: Work is in progress; payment is not yet due.
   - `PENDING`: Deliverables approved; waiting for business to initiate direct bank settlement.
   - `PAID`: Business has transferred funds and logged the official bank UTR reference.
   - `DISPUTED`: A dispute has been opened by creator or business regarding scope or payment.

---

## 3. ₹0 Budget Deployment Guide

### A. Free Website Hosting (Vercel / Netlify / Cloudflare Pages)

#### Option 1: Vercel (Recommended)
1. Push repository to a free GitHub account.
2. Sign in to [Vercel](https://vercel.com) using GitHub (Hobby tier is 100% free forever).
3. Click **Add New Project** and import the repository.
4. Set Build Settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Configure Environment Variables in Vercel Dashboard:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
6. Click **Deploy**. Your app is live with SSL at `https://your-app.vercel.app` at ₹0 cost.

#### Option 2: Netlify
1. Sign in to [Netlify](https://netlify.com) (Free Starter tier).
2. Click **Import from Git**.
3. Build command: `npm run build`, Publish directory: `dist`.
4. Add environment variables in Site Configuration.
5. Deploy.

---

### B. Free Backend Database & Auth (Supabase Free Tier)

1. Sign up at [Supabase](https://supabase.com) (Free tier includes 500 MB database, 50,000 monthly active users, 1 GB storage).
2. Create a new organization and project (select `AWS - Mumbai (ap-south-1)` for lowest latency in India).
3. Open the **SQL Editor** in the Supabase dashboard.
4. Copy and paste the contents of `/supabase/schema.sql` and click **Run**.
5. Copy your **Project URL** and **anon / public key** from `Settings > API`.
6. Add them to your web app's `.env` and Android app's `SupabaseClientProvider.kt`.

---

### C. Free Android Build & APK Generation (GitHub Actions CI)

Because the development environment container does not bundle the heavy Android SDK (~4 GB), you can build the native debug APK for free using GitHub Actions free minutes (2,000 minutes/month):

1. Create `.github/workflows/android-build.yml` in your repo:
```yaml
name: Build Android Debug APK

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@v3

      - name: Run Unit Tests
        run: |
          cd android
          ./gradlew test

      - name: Build Debug APK
        run: |
          cd android
          ./gradlew assembleDebug

      - name: Upload APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: proof-to-pay-debug-apk
          path: android/app/build/outputs/apk/debug/app-debug.apk
```
2. When pushed, GitHub builds the native APK and provides the downloadable `app-debug.apk` under the Actions tab.

---

## 4. Expected Costs & Free-Tier Limitations

| Service | Free Tier Limits | Future Cost When Scaling |
|---|---|---|
| **Web Hosting (Vercel/Netlify)** | 100 GB bandwidth / mo, unlimited personal builds | ₹0 until ~100k monthly pageviews |
| **Database & Auth (Supabase)** | 500 MB storage, 50k MAU, 2 projects, 1 GB files | $25/mo (~₹2,100) on Pro Tier |
| **Android CI (GitHub Actions)** | 2,000 build minutes / month | ₹0 for public or small private repos |
| **Custom Domain** | N/A (use `prooftopay.vercel.app`) | ~₹499 – ₹899 / year for `.in` or `.com` |
| **Google Play Store Publishing** | N/A (distribute direct debug APK during beta) | $25 one-time developer registration fee |
| **Payment Gateway (Future)** | N/A (direct bank UTR during beta) | 1.8% – 2.0% + GST per processed transaction |
