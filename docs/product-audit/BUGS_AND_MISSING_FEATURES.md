# Proof-to-Pay — Bugs, Missing Features & Prioritized Roadmap

This document outlines confirmed bugs, architectural risks, and missing features discovered during the repository audit, prioritized into **P0 (Critical)**, **P1 (Important)**, and **P2 (Improvements)**.

---

## 1. Priority P0 — Critical Issues

*Issues that prevent secure, production-grade usage or cause runtime failures in production.*

### P0-1: Live Supabase Environment Credentials are Unconfigured Placeholders
- **Problem**: The repository is currently operating in `OFFLINE_DEMO_SANDBOX` mode because `.env` contains the placeholder URL `'https://your-project-id.supabase.co'`. No data is currently persisting to a live PostgreSQL database across different browser clients or machines.
- **Evidence / File Path**: `src/lib/supabaseClient.ts` (lines 20–34, 133–142), `.env.example` (lines 11–13).
- **Why It Matters**: Data created by one user (e.g. a business posting a project) is stored only in that user's local browser `localStorage`. A creator on another computer cannot see the project until live Supabase is configured.
- **Recommended Fix**:
  1. Provision a live Supabase project.
  2. Execute `/supabase/schema.sql` in the Supabase SQL Editor.
  3. Set real `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in production environment variables.
- **Dependencies**: Supabase project creation.
- **Suggested Test**: Run `src/tests/supabaseConnection.test.ts` with valid credentials.

### P0-2: Use of `window.confirm` in Iframe Sandbox Environments
- **Problem**: Account deletion in `StudentDashboard.tsx` uses native `window.confirm()`.
- **Evidence / File Path**: `src/components/pages/StudentDashboard.tsx` (line 327: `if (window.confirm('Are you certain you want to request complete account deletion?...'))`).
- **Why It Matters**: In modern sandboxed iframes (e.g. preview environments or embedded webviews), `window.confirm`, `window.alert`, and `window.prompt` are frequently blocked by browser security policies (`allow-modals`), causing the action to fail silently or throw an unhandled security exception.
- **Recommended Fix**: Replace native `window.confirm` with a custom Tailwind modal component (similar to `ReportAbuseModal` or `ScopeLockModal`).
- **Dependencies**: React component state.
- **Suggested Test**: Click "Delete My Account" in an iframe with modals disabled.

---

## 2. Priority P1 — Important Issues

*Issues that block or impair primary creator and business workflows.*

### P1-1: Absence of In-App Notification Bell & Alert Center
- **Problem**: Although `public.notifications` table is defined in `supabase/schema.sql` and the schema models notification events, the Web navigation bar does not render an interactive Notification Center icon/dropdown.
- **Evidence / File Path**: `src/components/layout/Navbar.tsx` (has no notification popover), `src/types/index.ts` (notification types exist).
- **Why It Matters**: Creators only discover newly extended project offers if they happen to visit their Student Dashboard Overview tab. A persistent top-bar bell with unread badge is standard for freelance marketplaces.
- **Recommended Fix**: Add a `NotificationBell` component to `Navbar.tsx` and `AndroidShell.tsx` querying active unread notifications.
- **Dependencies**: `ptp_notifications` store / Supabase Realtime channel.
- **Suggested Test**: Extend an offer from Business account and verify badge increments in creator's navbar.

### P1-2: Explicit Dispute Initiation Button Missing from Creator Active Workflow
- **Problem**: While `AdminDashboard` has a comprehensive dispute arbitration portal and `BusinessDashboard` can flag issues, `StudentDashboard` lacks a direct "Raise Formal Dispute" button inside the active assignment card.
- **Evidence / File Path**: `src/components/pages/StudentDashboard.tsx` (lines 650–750).
- **Why It Matters**: If a business client refuses to approve completed deliverables or stops communicating, the student must rely on the general "Report Abuse" modal rather than a structured milestone dispute flow.
- **Recommended Fix**: Add a "Raise Scope Dispute" button inside `StudentDashboard` active workflow cards that invokes `marketplaceStore.createDispute()`.
- **Dependencies**: `marketplaceStore.createDispute()` (already implemented).
- **Suggested Test**: Submit deliverable, trigger dispute as student, verify it appears in Admin dispute queue.

### P1-3: Monolithic Web Client Bundle Size (1.65 MB single chunk)
- **Problem**: Vite production build outputs a single JavaScript bundle `dist/assets/index-DFq5CGod.js` of **1,647.66 kB** (387 kB gzip).
- **Evidence / File Path**: `npm run build` output log: `(!) Some chunks are larger than 500 kB after minification.`
- **Why It Matters**: Slower initial page load on 3G/4G mobile connections in Tier-2/Tier-3 Indian cities.
- **Recommended Fix**: Implement route-based lazy loading with React `lazy()` and `Suspense` in `src/App.tsx` for heavy views (`AdminDashboard`, `PublicPortfolio`, `AndroidAppGuideModal`).
- **Dependencies**: React `lazy` & `Suspense`.
- **Suggested Test**: Run `npm run build` and ensure vendor chunk sizes drop below 400 kB each.

---

## 3. Priority P2 — Improvements & Polish

*Usability enhancements, analytics, and operational conveniences.*

### P2-1: Out-of-Band UPI QR Code Generation for Business Payouts
- **Problem**: When a business approves deliverables and prepares to pay the student, they must manually copy the student's UPI ID (`aarav.sharma@okhdfcbank`) and open their banking app.
- **Evidence / File Path**: `src/components/pages/BusinessDashboard.tsx` (`handleRecordPayment`).
- **Why It Matters**: Generating a dynamic Indian standard UPI Intent QR Code (`upi://pay?pa=...&am=...&pn=...&tn=ProjectDeliverables`) would allow businesses to simply scan from Google Pay, PhonePe, or Paytm on mobile, cutting payment errors.
- **Recommended Fix**: Add a lightweight SVG QR code generator in the payment recording modal rendering the standard UPI intent URI.
- **Dependencies**: QR code rendering utility.
- **Suggested Test**: Scan generated QR code with mobile UPI app and verify payee and amount pre-fill.

### P2-2: Email & Push Notifications via Webhooks
- **Problem**: Notifications are currently in-app only; no external email (Resend/SendGrid) or mobile push notifications (FCM) are triggered.
- **Evidence / File Path**: `src/lib/storage.ts`.
- **Why It Matters**: External notifications bring creators back to the platform when offers or payments are posted.
- **Recommended Fix**: Configure Supabase Database Webhooks or Edge Functions on `project_offers` and `project_payments` table inserts.
- **Dependencies**: External transactional email provider.

### P2-3: Automated Bank Reconciliation Webhook (Future Gateway Integration)
- **Problem**: UTR numbers are verified by human inspection by creators and admins.
- **Evidence / File Path**: `src/components/common/PaymentHistory.tsx`.
- **Why It Matters**: High-volume scale will benefit from automated verification via Indian banking APIs or payout gateways (e.g. RazorpayX / Cashfree Payouts).
- **Recommended Fix**: Add a webhook receiver endpoint for automated UTR settlement verification when payment gateway credentials are provided.
- **Dependencies**: Payment gateway merchant account.
