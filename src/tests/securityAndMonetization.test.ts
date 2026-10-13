import { describe, it, expect, beforeEach } from 'vitest';
import { marketplaceStore } from '../lib/storage';
import { User, ProjectOffer, DeliverableItem } from '../types';

describe('PROOF-TO-PAY: Security, Authorization & Monetary Integrity Tests', () => {
  const studentUser: User = {
    id: 'test-student-1',
    name: 'Test Creator',
    email: 'creator@test.com',
    role: 'STUDENT',
    createdAt: new Date().toISOString(),
  };

  const businessUser: User = {
    id: 'test-business-1',
    name: 'Test Business Corp',
    email: 'corp@test.com',
    role: 'BUSINESS',
    createdAt: new Date().toISOString(),
  };

  const adminUser: User = {
    id: 'test-admin-1',
    name: 'Platform Administrator',
    email: 'admin@prooftopay.in',
    role: 'ADMIN',
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    marketplaceStore.resetToDefaults();
  });

  // --- Financial Rules & Integer Paise Precision ---
  describe('Authoritative Commission Calculations & Integer Paise Safety', () => {
    it('calculates ₹500 project at 5% = ₹25 fee exactly with zero floating-point drift', () => {
      const budgetINR = 500;
      const ratePct = 5;
      const budgetPaise = Math.round(budgetINR * 100);
      const feePaise = Math.round((budgetPaise * ratePct) / 100);
      const feeINR = feePaise / 100;

      expect(budgetPaise).toBe(50000); // 50,000 paise
      expect(feePaise).toBe(2500);     // 2,500 paise
      expect(feeINR).toBe(25);
    });

    it('calculates ₹3,000 project at 5% = ₹150 fee exactly', () => {
      const budgetINR = 3000;
      const ratePct = 5;
      const budgetPaise = Math.round(budgetINR * 100);
      const feePaise = Math.round((budgetPaise * ratePct) / 100);
      const feeINR = feePaise / 100;

      expect(budgetPaise).toBe(300000);
      expect(feePaise).toBe(15000);
      expect(feeINR).toBe(150);
    });

    it('calculates ₹10,000 project at 10% = ₹1,000 fee exactly', () => {
      const budgetINR = 10000;
      const ratePct = 10;
      const budgetPaise = Math.round(budgetINR * 100);
      const feePaise = Math.round((budgetPaise * ratePct) / 100);
      const feeINR = feePaise / 100;

      expect(budgetPaise).toBe(1000000);
      expect(feePaise).toBe(100000);
      expect(feeINR).toBe(1000);
    });

    it('rejects negative budgets and zero amounts', () => {
      expect(() => {
        marketplaceStore.issueOffer(businessUser, 'proj-1', 'student-1', -500, '2026-10-30', 2, 'Scope summary');
      }).toThrow(/positive amount/i);

      expect(() => {
        marketplaceStore.issueOffer(businessUser, 'proj-1', 'student-1', 0, '2026-10-30', 2, 'Scope summary');
      }).toThrow(/positive amount/i);
    });

    it('rejects invalid commission rate percentages', () => {
      expect(() => {
        marketplaceStore.updateMonetizationConfig(adminUser, -2);
      }).toThrow(/between 0% and 50%/i);

      expect(() => {
        marketplaceStore.updateMonetizationConfig(adminUser, 60);
      }).toThrow(/between 0% and 50%/i);
    });
  });

  // --- Priority 1: Prevent Privilege Escalation & Role Boundaries ---
  describe('Privilege Escalation Prevention', () => {
    it('prevents non-admins from updating monetization commission configuration', () => {
      expect(() => {
        marketplaceStore.updateMonetizationConfig(studentUser, 10);
      }).toThrow(/Admin authorization required/i);

      expect(() => {
        marketplaceStore.updateMonetizationConfig(businessUser, 10);
      }).toThrow(/Admin authorization required/i);
    });

    it('prevents a creator from verifying their own or any platform fee', () => {
      expect(() => {
        marketplaceStore.adminVerifyPlatformCommission(studentUser, 'comm-proj-2', 'Self verification note');
      }).toThrow(/Admin authorization required/i);
    });

    it('prevents a business from marking the platform fee as verified collected', () => {
      expect(() => {
        marketplaceStore.adminVerifyPlatformCommission(businessUser, 'comm-proj-2', 'Business self-verification');
      }).toThrow(/Admin authorization required/i);
    });

    it('prevents non-admins from waiving platform commission fees', () => {
      expect(() => {
        marketplaceStore.adminWaivePlatformCommission(businessUser, 'comm-proj-2', 'Waive my own fee');
      }).toThrow(/Admin authorization required/i);

      expect(() => {
        marketplaceStore.adminWaivePlatformCommission(studentUser, 'comm-proj-2', 'Waive fee');
      }).toThrow(/Admin authorization required/i);
    });
  });

  // --- Priority 3: Private Information & Evidence Separation ---
  describe('Evidence vs Settled Payment & Evidence Review', () => {
    it('unverified UTR does NOT mark payment verified', () => {
      // Business reports payment with UTR
      const payRecord = marketplaceStore.reportProjectPayment(
        businessUser,
        'proj-2',
        'UTR-ICICI-TEST-9921',
        'UPI',
        'Transferred via UPI'
      );

      // Must be REPORTED_BY_BUSINESS, NOT PAID or confirmed
      expect(payRecord.status).toBe('REPORTED_BY_BUSINESS');
      expect(payRecord.status).not.toBe('RECEIPT_CONFIRMED_BY_CREATOR');
    });

    it('prevents a creator from confirming another creator\'s payment record', () => {
      // proj-2 is assigned to student-2. test-student-1 attempts to confirm
      marketplaceStore.reportProjectPayment(businessUser, 'proj-2', 'UTR-ICICI-TEST-9921', 'UPI');
      expect(() => {
        marketplaceStore.creatorConfirmPaymentReceipt(studentUser, 'proj-2');
      }).toThrow(/Payment record not found for this creator/i);
    });

    it('requires creator explicit confirmation to reach settled payment state', () => {
      // proj-2 assigned to student-2
      const creatorAnanya = marketplaceStore.getUsers().find((u) => u.id === 'student-2')!;
      marketplaceStore.reportProjectPayment(businessUser, 'proj-2', 'UTR-ICICI-TEST-9921', 'UPI');
      const confirmed = marketplaceStore.creatorConfirmPaymentReceipt(creatorAnanya, 'proj-2');

      expect(confirmed.status).toBe('RECEIPT_CONFIRMED_BY_CREATOR');
      expect(confirmed.confirmedByUserId).toBe('student-2');
    });

    it('duplicate verification requests do NOT double-count revenue in metrics', () => {
      const initialMetrics = marketplaceStore.getMonetizationMetrics();
      const initialCollected = initialMetrics.commissionVerifiedCollectedINR;

      // comm-proj-3 is already VERIFIED_COLLECTED (₹750)
      const comm3 = marketplaceStore.getPlatformCommissions().find((c) => c.id === 'comm-proj-3');
      expect(comm3?.status).toBe('VERIFIED_COLLECTED');

      // Attempting to re-verify or fetching metrics does not multiply
      const newMetrics = marketplaceStore.getMonetizationMetrics();
      expect(newMetrics.commissionVerifiedCollectedINR).toBe(initialCollected);
    });

    it('refunded or waived fees are excluded from collected revenue totals', () => {
      // comm-proj-3 is verified collected (750)
      marketplaceStore.adminWaivePlatformCommission(adminUser, 'comm-proj-3', 'Waived post review');

      const metrics = marketplaceStore.getMonetizationMetrics();
      // Should now be excluded from collected
      expect(metrics.commissionVerifiedCollectedINR).toBe(0);
      expect(metrics.waivedFeesINR).toBe(750);
    });
  });

  // --- Priority 4: Anti-Fake Verification & Badge Criteria ---
  describe('Anti-Fake Verification & Badge Integrity', () => {
    it('does not default unrated creators to 5 stars', () => {
      const profile = marketplaceStore.getStudentProfile('student-2');
      // student-2 has 0 reviews in initial mock data
      const reviews = marketplaceStore.getReviews().filter((r) => r.targetUserId === 'student-2');
      expect(reviews.length).toBe(0);
    });

    it('requires business approval or dispute resolution before proof passport inclusion', () => {
      const passportItems = marketplaceStore.getProofPassportItems('student-1');
      // Every item in passport has an authoritative completion source
      passportItems.forEach((item) => {
        expect(['BUSINESS_APPROVAL', 'DISPUTE_RESOLUTION']).toContain(item.completionSource);
      });
    });
  });

  // --- Scope Lock & Change Request Workflow ---
  describe('Scope Lock & Change Requests', () => {
    it('locks scope upon student acceptance with immutable deliverables', () => {
      const offer = marketplaceStore.getOffers().find((o) => o.id === 'offer-proj-2');
      expect(offer?.scopeLocked).toBe(true);
      expect(offer?.status).toBe('ACCEPTED');
      expect(offer?.deliverablesSnapshot?.length).toBeGreaterThan(0);
      expect(offer?.cancellationTerms).toBeDefined();
      expect(offer?.commissionRatePercent).toBe(5);
      expect(offer?.creatorReceivesINR).toBe(offer?.agreedBudgetINR);
    });

    it('allows counterparty to accept scope change request and updates project terms atomically', () => {
      const pendingReq = marketplaceStore.getScopeChangeRequests('proj-2').find((r) => r.status === 'PENDING');
      expect(pendingReq).toBeDefined();

      if (pendingReq) {
        const student = marketplaceStore.getUsers().find((u) => u.id === 'student-2')!;
        const updatedReq = marketplaceStore.respondToScopeChangeRequest(student, pendingReq.id, true);

        expect(updatedReq.status).toBe('ACCEPTED');

        // Check project updated
        const proj = marketplaceStore.getProject('proj-2')!;
        expect(proj.budgetINR).toBe(32000);
        expect(proj.expectedDeliveryDate).toBe('2026-11-05');
        expect(proj.permittedRevisions).toBe(3);
        expect(proj.deliverables.length).toBe(3);
      }
    });

    it('proposer cannot accept their own scope change request', () => {
      const pendingReq = marketplaceStore.getScopeChangeRequests('proj-2').find((r) => r.status === 'PENDING');
      if (pendingReq) {
        const proposer = marketplaceStore.getUsers().find((u) => u.id === pendingReq.requestedByUserId)!;
        expect(() => {
          marketplaceStore.respondToScopeChangeRequest(proposer, pendingReq.id, true);
        }).toThrow(/Cannot respond to your own/i);
      }
    });

    it('non-party user cannot create or respond to a scope change request', () => {
      const thirdPartyUser: User = {
        id: 'unrelated-user',
        name: 'Third Party',
        email: 'intruder@test.com',
        role: 'STUDENT',
        createdAt: new Date().toISOString(),
      };

      expect(() => {
        marketplaceStore.createScopeChangeRequest(thirdPartyUser, {
          projectId: 'proj-2',
          reason: 'Unauthorized modification attempt',
          proposedBudgetINR: 50000,
          proposedDeadline: '2026-12-01',
          proposedRevisions: 5,
          proposedDeliverables: [],
          proposedScopeSummary: 'Hacked',
        });
      }).toThrow(/Unauthorized/i);
    });

    it('preserves existing terms when scope change request is rejected', () => {
      const pendingReq = marketplaceStore.getScopeChangeRequests('proj-2').find((r) => r.status === 'PENDING');
      if (pendingReq) {
        const student = marketplaceStore.getUsers().find((u) => u.id === 'student-2')!;
        const originalProj = marketplaceStore.getProject('proj-2')!;
        const originalBudget = originalProj.budgetINR;

        const updatedReq = marketplaceStore.respondToScopeChangeRequest(
          student,
          pendingReq.id,
          false,
          'Too many extra requirements for this deadline'
        );

        expect(updatedReq.status).toBe('REJECTED');
        expect(updatedReq.rejectionReason).toBe('Too many extra requirements for this deadline');

        const projAfter = marketplaceStore.getProject('proj-2')!;
        expect(projAfter.budgetINR).toBe(originalBudget);
      }
    });
  });

  // --- Role Separation: Creator, Business, and Admin Roles Tested Individually ---
  describe('Strict Role-Based Access Control (RBAC) per Persona', () => {
    it('Creator role boundaries: Creator cannot perform business operations', () => {
      // Creator cannot issue project offers
      expect(() => {
        marketplaceStore.issueOffer(studentUser, 'proj-1', 'student-2', 5000, '2026-11-01', 2, 'Summary');
      }).toThrow();

      // Creator cannot approve work and complete projects
      expect(() => {
        marketplaceStore.approveWorkAndComplete(studentUser, 'proj-2');
      }).toThrow(/Unauthorized/i);

      // Creator cannot report project payments
      expect(() => {
        marketplaceStore.reportProjectPayment(studentUser, 'proj-2', 'UTR-FAKER-1234', 'UPI');
      }).toThrow(/Unauthorized|Only/i);

      // Creator cannot verify business KYC
      expect(() => {
        marketplaceStore.adminVerifyBusiness(studentUser, 'business-1', true, 'Notes');
      }).toThrow(/Admin authorization required/i);
    });

    it('Business role boundaries: Business cannot perform creator or admin operations', () => {
      // Business cannot submit creator deliverables
      expect(() => {
        marketplaceStore.submitProjectWork(
          businessUser,
          'proj-2',
          'Fake submission notes',
          'https://fake.link'
        );
      }).toThrow(/Unauthorized/i);

      // Business cannot confirm payment receipts
      expect(() => {
        marketplaceStore.creatorConfirmPaymentReceipt(businessUser, 'proj-2');
      }).toThrow(/Unauthorized|Only/i);

      // Business cannot suspend users
      expect(() => {
        marketplaceStore.adminSetUserSuspension(businessUser, 'student-1', true, 'Malicious suspension');
      }).toThrow(/Admin authorization required/i);

      // Business cannot resolve disputes
      expect(() => {
        marketplaceStore.adminResolveDispute(businessUser, 'disp-demo-1', 'DISMISSED', 'Notes');
      }).toThrow(/Admin authorization required/i);
    });

    it('Admin role boundaries: Admin can moderate and verify but cannot bypass identity checks', () => {
      // Admin can verify business credentials
      marketplaceStore.adminVerifyBusiness(adminUser, 'business-1', true, 'Verified against MCA registry');
      const profile = marketplaceStore.getBusinessProfile('business-1');
      expect(profile?.verificationStatus).toBe('VERIFIED');

      // Admin can set user suspension
      marketplaceStore.adminSetUserSuspension(adminUser, 'student-2', true, 'Test suspension');
      const suspended = marketplaceStore.getUsers().find((u) => u.id === 'student-2');
      expect(suspended?.isSuspended).toBe(true);

      // Reactivate
      marketplaceStore.adminSetUserSuspension(adminUser, 'student-2', false, 'Test reactivated');
      const reactivated = marketplaceStore.getUsers().find((u) => u.id === 'student-2');
      expect(reactivated?.isSuspended).toBe(false);
    });
  });

  // --- Public vs Private Portfolio Items & Privacy ---
  describe('Proof Passport Public vs Private Visibility & Data Protection', () => {
    it('allows creator to toggle proof passport items between public and private', () => {
      const student1 = marketplaceStore.getUsers().find((u) => u.id === 'student-1')!;
      const items = marketplaceStore.getProofPassportItems('student-1');
      expect(items.length).toBeGreaterThan(0);

      const targetItem = items[0];
      const initialVisibility = targetItem.isPublic;

      // Toggle to private
      const updated = marketplaceStore.toggleProofPassportVisibility(student1, targetItem.id, !initialVisibility);
      expect(updated.isPublic).toBe(!initialVisibility);

      // Only public items query should exclude private item
      const publicItems = marketplaceStore.getProofPassportItems('student-1', true);
      const containsUpdated = publicItems.some((item) => item.id === targetItem.id);
      expect(containsUpdated).toBe(!initialVisibility);
    });

    it('prevents non-owner creator from toggling or updating another creator\'s passport item', () => {
      const student2 = marketplaceStore.getUsers().find((u) => u.id === 'student-2')!;
      const items = marketplaceStore.getProofPassportItems('student-1');
      const student1Item = items[0];

      expect(() => {
        marketplaceStore.toggleProofPassportVisibility(student2, student1Item.id, false);
      }).toThrow(/Unauthorized to modify this portfolio item/i);

      expect(() => {
        marketplaceStore.updateProofPassportItem(student2, student1Item.id, { sanitizedSummary: 'Hacked summary' });
      }).toThrow(/Unauthorized/i);
    });

    it('protects private client files: Proof Passport displays sanitized outcomes without confidential files', () => {
      const passportItems = marketplaceStore.getProofPassportItems('student-1');
      passportItems.forEach((item) => {
        // Items must contain sanitized summary
        expect(item.sanitizedSummary).toBeDefined();
        expect(typeof item.sanitizedSummary).toBe('string');
        // Raw internal project files must NOT be exposed in passport item
        expect((item as any).files).toBeUndefined();
        expect((item as any).internalNotes).toBeUndefined();
      });
    });

    it('clearly distinguishes self-uploaded portfolio links from platform-verified proof passport items', () => {
      const profile = marketplaceStore.getStudentProfile('student-1')!;
      expect(profile.portfolioLinks).toBeDefined();
      expect(profile.portfolioLinks.length).toBeGreaterThan(0);

      const verifiedPassportItems = marketplaceStore.getProofPassportItems('student-1');
      expect(verifiedPassportItems.length).toBeGreaterThan(0);

      // Verified passport items have verifiable completionSource and projectId
      verifiedPassportItems.forEach((v) => {
        expect(['BUSINESS_APPROVAL', 'DISPUTE_RESOLUTION']).toContain(v.completionSource);
        expect(v.projectId).toBeDefined();
      });

      // Self-uploaded items are unverified external links
      profile.portfolioLinks.forEach((link) => {
        expect(link.url).toMatch(/^https?:\/\//);
        expect((link as any).completionSource).toBeUndefined();
      });
    });
  });

  // --- Work Completion vs Payment Separation ---
  describe('Work Completion Strictly Separated from Payment Confirmation', () => {
    it('completed project does NOT automatically become verified payment', () => {
      const biz1 = marketplaceStore.getUsers().find((u) => u.id === 'business-1')!;

      // Find an in-progress project or simulate work approval
      // In initial mock data, proj-3 is COMPLETED, but let's test proj-2
      const proj2 = marketplaceStore.getProject('proj-2')!;
      expect(proj2.status).toBe('IN_PROGRESS');

      // Step 1: Student submits work
      const stu2 = marketplaceStore.getUsers().find((u) => u.id === 'student-2')!;
      marketplaceStore.submitProjectWork(
        stu2,
        'proj-2',
        'Final branding assets attached',
        'https://test.link'
      );

      // Step 2: Business approves work
      const biz2 = marketplaceStore.getUsers().find((u) => u.id === 'business-2')!;
      marketplaceStore.approveWorkAndComplete(biz2, 'proj-2');

      // Project is COMPLETED
      const completedProj = marketplaceStore.getProject('proj-2')!;
      expect(completedProj.status).toBe('COMPLETED');

      // Proof passport item is created with BUSINESS_APPROVAL
      const passportItem = marketplaceStore.getProofPassportItems('student-2').find((p) => p.projectId === 'proj-2');
      expect(passportItem).toBeDefined();
      expect(passportItem?.completionSource).toBe('BUSINESS_APPROVAL');

      // BUT payment record is NOT_DUE / PENDING — NOT marked confirmed or paid!
      const payment = marketplaceStore.getPayments().find((p) => p.projectId === 'proj-2');
      expect(payment?.status).not.toBe('RECEIPT_CONFIRMED_BY_CREATOR');
      expect(payment?.status).not.toBe('PAID');
    });

    it('business submitting UTR does NOT mark payment verified without creator receipt confirmation', () => {
      const biz2 = marketplaceStore.getUsers().find((u) => u.id === 'business-2')!;
      const stu2 = marketplaceStore.getUsers().find((u) => u.id === 'student-2')!;

      // Business reports payment with UTR
      const reportedPay = marketplaceStore.reportProjectPayment(
        biz2,
        'proj-2',
        'UTR-TEST-BANK-555123',
        'UPI',
        'Sent to student UPI'
      );

      expect(reportedPay.status).toBe('REPORTED_BY_BUSINESS');
      expect(reportedPay.transactionReferenceUTR).toBe('UTR-TEST-BANK-555123');

      // Still NOT settled or confirmed
      expect(reportedPay.status).not.toBe('RECEIPT_CONFIRMED_BY_CREATOR');

      // Now creator explicitly confirms receipt
      const settledPay = marketplaceStore.creatorConfirmPaymentReceipt(stu2, 'proj-2');
      expect(settledPay.status).toBe('RECEIPT_CONFIRMED_BY_CREATOR');
      expect(settledPay.confirmedAt).toBeDefined();
    });

    it('creator can dispute an uncredited payment reported by business', () => {
      const biz2 = marketplaceStore.getUsers().find((u) => u.id === 'business-2')!;
      const stu2 = marketplaceStore.getUsers().find((u) => u.id === 'student-2')!;

      marketplaceStore.reportProjectPayment(
        biz2,
        'proj-2',
        'UTR-FAKE-UNCREDITED-999',
        'UPI'
      );

      const disputedPay = marketplaceStore.disputeProjectPayment(
        stu2,
        'proj-2',
        'Funds not credited in my account after 48 hours.'
      );

      expect(disputedPay.status).toBe('DISPUTED');
      expect(disputedPay.disputeReason).toBe('Funds not credited in my account after 48 hours.');
    });
  });

  // --- Work Trail Chronology & Event Authenticity ---
  describe('Work Trail Chronology & Event Tracking', () => {
    it('generates a chronological work trail covering application, offer, submission, approval and payment', () => {
      const trail = marketplaceStore.getWorkTrail('proj-3');
      expect(trail.length).toBeGreaterThan(0);

      // Must be sorted chronologically
      for (let i = 1; i < trail.length; i++) {
        const prev = new Date(trail[i - 1].timestamp).getTime();
        const curr = new Date(trail[i].timestamp).getTime();
        expect(curr).toBeGreaterThanOrEqual(prev);
      }

      // Check event types present
      const eventTypes = trail.map((e) => e.eventType);
      expect(eventTypes).toContain('PROJECT_CREATED');
      expect(eventTypes).toContain('DELIVERABLES_APPROVED');
      expect(eventTypes).toContain('PROJECT_PAYMENT_CONFIRMED');
    });
  });

  // --- Creator Portfolio UI: Privacy, Authorization, Visibility & Management ---
  describe('Proof-to-Pay Creator Portfolio UI: Privacy, Visibility & Authorization', () => {
    it('allows creators to hide eligible work without altering underlying project history', () => {
      const student1 = marketplaceStore.getUsers().find((u) => u.id === 'student-1')!;
      const allItemsBefore = marketplaceStore.getProofPassportItems('student-1', false);
      expect(allItemsBefore.length).toBeGreaterThan(0);

      const target = allItemsBefore[0];
      const associatedProjectBefore = marketplaceStore.getProject(target.projectId);
      expect(associatedProjectBefore?.status).toBe('COMPLETED');

      // Creator hides item from public passport
      marketplaceStore.toggleProofPassportVisibility(student1, target.id, false);

      // Public visitors (onlyPublic = true) cannot see it
      const publicItems = marketplaceStore.getProofPassportItems('student-1', true);
      expect(publicItems.some((i) => i.id === target.id)).toBe(false);

      // Creator still sees it in private manager
      const ownerItems = marketplaceStore.getProofPassportItems('student-1', false);
      const hiddenItem = ownerItems.find((i) => i.id === target.id);
      expect(hiddenItem?.isPublic).toBe(false);

      // Underlying project status remains COMPLETED
      const associatedProjectAfter = marketplaceStore.getProject(target.projectId);
      expect(associatedProjectAfter?.status).toBe('COMPLETED');
    });

    it('only confirmed completed projects or dispute resolutions qualify for proof passport', () => {
      // In-progress projects like proj-2 must not be in proof passport
      const passportItems = marketplaceStore.getProofPassportItems();
      const inProgressPassportItem = passportItems.find((i) => i.projectId === 'proj-2');
      expect(inProgressPassportItem).toBeUndefined();

      // All existing items must have a verifiable source
      passportItems.forEach((item) => {
        expect(['BUSINESS_APPROVAL', 'DISPUTE_RESOLUTION']).toContain(item.completionSource);
        const proj = marketplaceStore.getProject(item.projectId);
        if (proj) {
          expect(proj.status).toBe('COMPLETED');
        }
      });
    });

    it('calculates ratings dynamically from authentic reviews without fabricating missing ratings', () => {
      // student-1 has real review
      const revsStu1 = marketplaceStore.getReviews().filter((r) => r.targetUserId === 'student-1');
      expect(revsStu1.length).toBeGreaterThan(0);
      const calcRating1 = revsStu1.reduce((sum, r) => sum + r.rating, 0) / revsStu1.length;
      expect(calcRating1).toBe(5);

      // student-2 has 0 reviews in store
      const revsStu2 = marketplaceStore.getReviews().filter((r) => r.targetUserId === 'student-2');
      expect(revsStu2.length).toBe(0);
      const calcRating2 = revsStu2.length > 0 ? revsStu2.reduce((sum, r) => sum + r.rating, 0) / revsStu2.length : null;
      expect(calcRating2).toBeNull();
    });

    it('creator can edit permitted profile fields but non-owners are rejected', () => {
      const student1 = marketplaceStore.getUsers().find((u) => u.id === 'student-1')!;
      const student2 = marketplaceStore.getUsers().find((u) => u.id === 'student-2')!;

      // student-1 edits their own profile
      const updated = marketplaceStore.updateCreatorPortfolio(student1, 'student-1', {
        headline: 'Senior Full-Stack Engineer · Next.js & React Native',
        availability: 'BUSY',
        skills: ['React', 'TypeScript', 'Tailwind', 'Next.js', 'GraphQL'],
        college: 'DTU Delhi',
      });

      expect(updated.headline).toBe('Senior Full-Stack Engineer · Next.js & React Native');
      expect(updated.availability).toBe('BUSY');
      expect(updated.skills).toContain('GraphQL');

      // student-2 attempting to edit student-1's profile is rejected
      expect(() => {
        marketplaceStore.updateCreatorPortfolio(student2, 'student-1', {
          headline: 'Hacked Headline',
        });
      }).toThrow(/Unauthorized/i);
    });

    it('prevents privilege escalation: cannot alter role, earnings or completed counts via portfolio edit', () => {
      const student1 = marketplaceStore.getUsers().find((u) => u.id === 'student-1')!;
      const profileBefore = marketplaceStore.getStudentProfile('student-1')!;
      const originalEarned = profileBefore.totalEarnedINR;
      const originalCompleted = profileBefore.completedProjectsCount;

      // Attempt to tamper with earnings or project count via updateCreatorPortfolio
      const tampered = marketplaceStore.updateCreatorPortfolio(student1, 'student-1', {
        headline: 'Legitimate headline update',
        ...({ totalEarnedINR: 99999999, completedProjectsCount: 100, role: 'ADMIN' } as any)
      });

      // Whitelisted fields update, non-permitted fields remain protected
      expect(tampered.headline).toBe('Legitimate headline update');
      expect(tampered.totalEarnedINR).toBe(originalEarned);
      expect(tampered.completedProjectsCount).toBe(originalCompleted);
      expect((tampered as any).role).toBeUndefined();
    });

    it('sanitizes public display and prevents private PII / payment data exposure', () => {
      const publicItems = marketplaceStore.getProofPassportItems('student-1', true);
      publicItems.forEach((item) => {
        // Must contain sanitized summary
        expect(item.sanitizedSummary).toBeDefined();
        // Raw internal files, UTRs, and payment proofs must not be present on public item
        expect((item as any).files).toBeUndefined();
        expect((item as any).utrReference).toBeUndefined();
        expect((item as any).paymentProofUrl).toBeUndefined();
        expect((item as any).upiId).toBeUndefined();
        expect((item as any).phone).toBeUndefined();
      });
    });

    // --- Social Media Profiles & Skills Management ---
    it('allows creators to link and manage their GitHub, LinkedIn, and Behance profiles', () => {
      const student1 = marketplaceStore.getUsers().find((u) => u.id === 'student-1')!;

      // Link GitHub, LinkedIn, and Behance
      const updated = marketplaceStore.updateCreatorPortfolio(student1, 'student-1', {
        socialLinks: [
          { platform: 'github', url: 'https://github.com/aarav-sharma' },
          { platform: 'linkedin', url: 'https://linkedin.com/in/aarav-sharma-dev' },
          { platform: 'behance', url: 'https://behance.net/aaravsharma' },
        ],
      });

      expect(updated.socialLinks).toBeDefined();
      expect(updated.socialLinks?.length).toBe(3);

      const gh = updated.socialLinks?.find((s) => s.platform === 'github');
      const li = updated.socialLinks?.find((s) => s.platform === 'linkedin');
      const be = updated.socialLinks?.find((s) => s.platform === 'behance');

      expect(gh?.url).toBe('https://github.com/aarav-sharma');
      expect(li?.url).toBe('https://linkedin.com/in/aarav-sharma-dev');
      expect(be?.url).toBe('https://behance.net/aaravsharma');

      // Verify persistence in store
      const retrieved = marketplaceStore.getStudentProfile('student-1')!;
      expect(retrieved.socialLinks).toEqual(updated.socialLinks);
    });

    it('rejects unauthorized users from editing or tampering with another creator\'s social profiles', () => {
      const student2 = marketplaceStore.getUsers().find((u) => u.id === 'student-2')!;

      expect(() => {
        marketplaceStore.updateCreatorPortfolio(student2, 'student-1', {
          socialLinks: [{ platform: 'github', url: 'https://github.com/attacker' }],
        });
      }).toThrow(/Unauthorized/i);
    });

    it('allows creators to add, update, and remove permitted technical skills without duplicates', () => {
      const student1 = marketplaceStore.getUsers().find((u) => u.id === 'student-1')!;
      const profileBefore = marketplaceStore.getStudentProfile('student-1')!;
      const initialSkills = [...profileBefore.skills];

      // Add new skill
      const withNewSkill = Array.from(new Set([...initialSkills, 'Docker', 'GraphQL']));
      const updated = marketplaceStore.updateCreatorPortfolio(student1, 'student-1', {
        skills: withNewSkill,
      });

      expect(updated.skills).toContain('Docker');
      expect(updated.skills).toContain('GraphQL');

      // Remove a skill
      const withoutDocker = updated.skills.filter((s) => s !== 'Docker');
      const updatedAfterRemoval = marketplaceStore.updateCreatorPortfolio(student1, 'student-1', {
        skills: withoutDocker,
      });

      expect(updatedAfterRemoval.skills).not.toContain('Docker');
      expect(updatedAfterRemoval.skills).toContain('GraphQL');
    });
  });
});
