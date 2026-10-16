# Proof-to-Pay — Executive Summary

## 1. Product Status at a Glance

| Dimension | Current State | Audit Verification |
|---|---|---|
| **Product Purpose** | Paid project & verified work-experience platform for emerging Indian student creators and businesses with 18+ legal validity, scope locking, and proof passports. | **Confirmed** by codebase copy, Zod validation schemas, and database constraints. |
| **Web Application** | Full-featured React 19 + TypeScript + Tailwind CSS v4 Single Page Application with PWA support. | **Confirmed**. Builds in 1.58s. Passes TypeScript check (`0 errors`). Passes all 175 tests in Vitest. |
| **Android Application** | Complete companion codebase in `/android` (4,308 lines of Kotlin + Jetpack Compose). | **Confirmed**. Follows Clean MVVM architecture with 19 native screens and Supabase Kotlin SDK v2.5. |
| **Core Workflow Execution** | End-to-end lifecycle (Registration → Apply → Offer → Scope Lock → Submission → Revisions → Payout & UTR confirmation → Minted Proof Passport). | **Confirmed**. Fully operational in the browser via `MarketplaceStore` local engine with reactive updates. |
| **Database & Supabase** | 17 relational tables, custom ENUMs, and RLS policies defined in `supabase/schema.sql`. Service client defined in `supabaseService.ts`. | **Schema confirmed in repository; live connection unverified** due to placeholder credentials (`your-project-id.supabase.co`) in environment. |
| **Automated Payment Gateway** | Out-of-band direct UPI / NEFT transfers with audited 12-digit bank UTR numbers and receipt confirmation. | **No automated gateway (Razorpay/Stripe)** is implemented; operates as an audited peer-to-peer settlement workflow. |
| **Automated Test Suite** | 8 test suites in `src/tests/` with 175 passing tests covering financial math, RLS policies, schemas, and UI rendering. | **Confirmed**. `npm test` runs and passes 175/175 tests in ~4.9s. |

---

## 2. What Works End-to-End Today

A user can open the application today and execute the entire marketplace lifecycle:

1. **Authentication & Role Switching**:
   - Register as an Adult Student (18+ validation enforced by Zod).
   - Register as a Business with company and entity details.
   - Switch instantly between roles (Student, Business, Admin, Public Visitor) via the persistent top Sandbox Bar.
   - Google Sign-In via Firebase Auth popup.
2. **Project Creation & Moderation**:
   - A business creates a project specifying deliverables, budget (>= ₹1,000 INR), deadline (>= 2 days), and permitted revisions (1–5).
   - An admin reviews the listing in the Admin Dashboard moderation queue and approves it.
3. **Application & Binding Offer**:
   - A student browses projects, filters by category chips, and submits a pitch with portfolio links.
   - Duplicate applications to the same project are blocked.
   - The business reviews the pitch and extends a formal offer.
4. **Scope Lock & Deliverables Delivery**:
   - The student reviews the financial breakdown (100% net creator payout, ₹0 fee deduction) and explicitly accepts the Scope Lock.
   - The student works on the project and submits live URLs (Figma, GitHub, Drive) and completion notes.
5. **Revisions & Capping**:
   - The business can request targeted revisions within the agreed cap (1 to 5).
   - Once the cap is exhausted, further revision requests are blocked to protect creators from scope creep.
6. **Payment Settlement & Proof Passport**:
   - The business approves work, transfers funds to the student's UPI ID, and records the 12-digit transaction bank UTR number.
   - The student confirms receipt in their Payment Tracking tab.
   - The business leaves a 5-star rating and testimonial.
   - The completed project is automatically minted to the student's public **Proof Passport** (`/portfolio/:slug`).
7. **Platform Commission (5%)**:
   - The business pays the 5% platform fee to Proof-to-Pay and records the fee UTR.
   - The admin audits the UTR and verifies collection in the Monetization tab.

---

## 3. What is Missing or Needs Attention

1. **Live Supabase Credentials**:
   - Currently, `.env` contains placeholder credentials, so all data persists to the browser's `localStorage` rather than a shared cloud database.
2. **Automated Payment Gateway Integration**:
   - Payments happen out-of-band via UPI/NEFT, and users manually record bank UTR numbers. Adding Razorpay/Cashfree webhook integration will allow instant automated payouts.
3. **In-App Notification Bell**:
   - There is currently no notification dropdown in the top navbar; users view notifications inside their respective dashboard tabs.
4. **External Email/SMS Delivery**:
   - Offer and submission alerts are in-app only; transactional email (Resend/SendGrid) is needed for external notifications.

---

## 4. Next Recommended Steps (Priority Order)

1. **Provision Live Supabase Project**:
   - Execute `supabase/schema.sql` in Supabase SQL editor.
   - Set real `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in environment variables.
2. **Replace Native `window.confirm`**:
   - Swap `window.confirm` in `StudentDashboard.tsx` account deletion with a custom React modal.
3. **Add Notification Bell to Top Navigation**:
   - Implement an unread notification popover in `Navbar.tsx` and `AndroidShell.tsx`.
4. **Code-Split Web Client Bundle**:
   - Use dynamic `import()` with React `lazy` to split the 1.65 MB bundle into optimized chunks.
5. **Add Indian Standard UPI Intent QR Code**:
   - Display a scannable dynamic UPI QR code on the business payout modal for instant mobile app scanning.
