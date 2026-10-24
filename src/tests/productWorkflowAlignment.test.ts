import { describe, it, expect, beforeEach } from 'vitest';
import { marketplaceStore } from '../lib/storage';
import { getCreatorBadges } from '../lib/badges';
import { User } from '../types';

describe('End-to-End Product Workflow Alignment', () => {
  const adminUser: User = {
    id: 'admin-super-1',
    name: 'Super Admin',
    email: 'admin@proof-to-pay.internal',
    role: 'ADMIN',
    createdAt: new Date().toISOString(),
  };

  const clientUser: User = {
    id: 'test-client-biz',
    name: 'Acme Technologies',
    email: 'client@acme.test',
    role: 'BUSINESS',
    createdAt: new Date().toISOString(),
  };

  const studentUser: User = {
    id: 'test-student-dev',
    name: 'Rahul Varma',
    email: 'rahul@student.dtu.ac.in',
    role: 'STUDENT',
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    // Seed users in local test environment
    marketplaceStore.saveUser(adminUser);
    marketplaceStore.saveUser(clientUser);
    marketplaceStore.saveUser(studentUser);

    // Seed business profile
    marketplaceStore.updateBusinessProfile(clientUser.id, {
      companyName: 'Acme Technologies',
      city: 'Bengaluru',
      industry: 'Software & Technology',
    });
  });

  describe('Stage 1-4: Registration, Profile Setup & Explicit Verification', () => {
    it('initializes student profile and allows managing skills and portfolio items', () => {
      marketplaceStore.setCurrentUserId(studentUser.id);
      marketplaceStore.updateStudentProfile(studentUser.id, {
        headline: 'Full-Stack React & Node Architect',
        bio: 'Passionate computer science undergrad building high-performance web applications.',
        skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
        portfolioLinks: [{ title: 'Campus Portal', url: 'https://github.com/rahul/portal' }],
      });

      const profile = marketplaceStore.getStudentProfile(studentUser.id);
      expect(profile).toBeDefined();
      expect(profile?.skills).toContain('TypeScript');
      expect(profile?.portfolioLinks).toHaveLength(1);
    });

    it('enforces explicit verification lifecycle: UNVERIFIED -> PENDING -> VERIFIED / REJECTED', () => {
      marketplaceStore.setCurrentUserId(studentUser.id);

      // 1. Initial status is UNVERIFIED (or undefined)
      let profile = marketplaceStore.getStudentProfile(studentUser.id);
      const initialProfile = profile || {
        userId: studentUser.id,
        headline: '',
        bio: '',
        skills: [],
        experienceLevel: 'BEGINNER' as const,
        portfolioLinks: [],
        totalEarnedINR: 0,
        completedProjectsCount: 0,
        averageRating: 0,
        verifiedPortfolioSlug: 'rahul-v',
      };

      // Verify that badges do not award Verified Creator prematurely
      let badges = getCreatorBadges({ profile: initialProfile, user: studentUser });
      const verifiedBadgeBefore = badges.find((b) => b.id === 'verified-identity');
      expect(verifiedBadgeBefore?.unlocked).toBe(false);

      // 2. Creator submits verification evidence
      marketplaceStore.submitStudentVerification(
        studentUser.id,
        {
          documentType: 'College Student Identity Card',
          documentNumber: 'DTU-2024-CS-092',
          collegeEmail: 'rahul@student.dtu.ac.in',
          studentIdCardUrl: 'https://storage.proof-to-pay.internal/id-cards/rahul-dtu.jpg',
        },
        studentUser
      );

      profile = marketplaceStore.getStudentProfile(studentUser.id);
      expect(profile?.verificationStatus).toBe('PENDING');
      expect(profile?.verificationDetails?.documentNumber).toBe('DTU-2024-CS-092');

      // Still NOT verified while pending
      badges = getCreatorBadges({ profile: profile!, user: studentUser });
      expect(badges.find((b) => b.id === 'verified-identity')?.unlocked).toBe(false);

      // 3. Non-admin caller cannot approve verification
      expect(() => {
        marketplaceStore.adminVerifyStudent(studentUser, studentUser.id, true, 'Self-approval attempt');
      }).toThrow(/Admin authorization required/);

      // 4. Admin audits evidence and approves
      marketplaceStore.setCurrentUserId(adminUser.id);
      marketplaceStore.adminVerifyStudent(
        adminUser,
        studentUser.id,
        true,
        'Government student ID and institutional enrollment verified.'
      );

      profile = marketplaceStore.getStudentProfile(studentUser.id);
      expect(profile?.verificationStatus).toBe('VERIFIED');
      expect(profile?.verificationDetails?.verifiedAt).toBeDefined();

      // Badge unlocks now with genuine verification
      badges = getCreatorBadges({ profile: profile!, user: studentUser });
      expect(badges.find((b) => b.id === 'verified-identity')?.unlocked).toBe(true);
    });
  });

  describe('Stage 5-10: End-to-End Project Bidding, Workspaces, Milestone Payments & Reviews', () => {
    it('executes the full lifecycle securely across client and creator', () => {
      marketplaceStore.setCurrentUserId(clientUser.id);

      // 1. Create project listing (starts in PENDING_REVIEW or APPROVED)
      const project = marketplaceStore.createProject(clientUser, {
        title: 'E-Commerce Checkout Flow Redesign',
        summary: 'Streamline mobile checkout conversion with Tailwind and React.',
        description: 'Complete high-converting checkout workflow with real-time field validation.',
        category: 'Web & Mobile Development',
        requiredSkills: ['React', 'Tailwind CSS', 'TypeScript'],
        deliverables: [
          { id: 'del-1', title: 'React Checkout Component', description: 'Modular checkout form', format: 'GitHub PR' }
        ],
        acceptanceCriteria: ['Passes unit tests', 'Mobile responsive'],
        budgetINR: 15000,
        deadlineDays: 7,
        expectedDeliveryDate: '2026-11-15',
        applicationClosingDate: '2026-11-01',
        permittedRevisions: 2,
        paymentTerms: '100% net on verified milestone delivery',
      });

      expect(project.id).toBeDefined();
      expect(project.businessId).toBe(clientUser.id);

      // Moderate project to APPROVED if PENDING_REVIEW
      if (project.status === 'PENDING_REVIEW') {
        marketplaceStore.setCurrentUserId(adminUser.id);
        marketplaceStore.adminModerateProject(adminUser, project.id, true, 'Scope verified and compliant');
      }

      // 2. Client cannot apply to own listing
      marketplaceStore.setCurrentUserId(clientUser.id);
      expect(() => {
        marketplaceStore.applyToProject(clientUser, project.id, 'I want to bid on my own project', 5, []);
      }).toThrow(/Only students can apply to projects/);

      // 3. Student applies
      marketplaceStore.setCurrentUserId(studentUser.id);
      const app = marketplaceStore.applyToProject(
        studentUser,
        project.id,
        'I have built 4 checkout integrations with zero chargeback disputes.',
        5,
        [{ title: 'Previous Checkout Work', url: 'https://github.com/rahul/checkout-demo' }]
      );
      expect(app.id).toBeDefined();
      expect(app.studentId).toBe(studentUser.id);

      // 4. Duplicate bid blocked
      expect(() => {
        marketplaceStore.applyToProject(
          studentUser,
          project.id,
          'Second application attempt',
          5,
          []
        );
      }).toThrow(/already applied/);

      // 5. Client issues formal offer
      marketplaceStore.setCurrentUserId(clientUser.id);
      const offer = marketplaceStore.issueOffer(
        clientUser,
        project.id,
        studentUser.id,
        15000,
        '2026-11-15',
        2,
        'Agreed modular checkout deliverables'
      );
      expect(offer.id).toBeDefined();
      expect(offer.status).toBe('PENDING');

      // 6. Student accepts offer -> Scope lock activated
      marketplaceStore.setCurrentUserId(studentUser.id);
      marketplaceStore.respondToOffer(studentUser, offer.id, true, {
        deliverablesAgreed: true,
        deadlineAgreed: true,
        revisionsAgreed: true,
        cancellationAgreed: true,
        feeTermsAgreed: true,
      });
      const updatedOffer = marketplaceStore.getOffers().find((o) => o.id === offer.id);
      expect(updatedOffer?.status).toBe('ACCEPTED');
      expect(updatedOffer?.scopeLocked).toBe(true);

      const activeProj = marketplaceStore.getProject(project.id);
      expect(activeProj?.status).toBe('IN_PROGRESS');
      expect(activeProj?.selectedStudentId).toBe(studentUser.id);

      // 7. Student submits deliverable
      marketplaceStore.submitProjectWork(
        studentUser,
        project.id,
        'Initial deliverable complete with unit tests',
        'https://staging.acme.test/checkout',
        [{ name: 'PR #42', url: 'https://github.com/acme/checkout/pull/42', sizeMb: 1.2, type: 'text/html' }]
      );

      let latestSub = marketplaceStore.getSubmissions().find((s) => s.projectId === project.id);
      expect(latestSub?.status).toBe('PENDING_REVIEW');

      // 8. Client requests revision
      marketplaceStore.setCurrentUserId(clientUser.id);
      marketplaceStore.requestRevision(clientUser, project.id, 'Please make the CTA button full-width on mobile.');
      latestSub = marketplaceStore.getSubmissions().find((s) => s.projectId === project.id);
      expect(latestSub?.status).toBe('REVISION_REQUESTED');

      // 9. Student submits revised work
      marketplaceStore.setCurrentUserId(studentUser.id);
      marketplaceStore.submitProjectWork(
        studentUser,
        project.id,
        'CTA button updated with responsive Tailwind classes',
        'https://staging.acme.test/checkout',
        [{ name: 'PR #42 v2', url: 'https://github.com/acme/checkout/pull/42', sizeMb: 1.2, type: 'text/html' }]
      );

      // 10. Client approves work -> Project COMPLETED
      marketplaceStore.setCurrentUserId(clientUser.id);
      marketplaceStore.approveWorkAndComplete(clientUser, project.id);
      const completedProj = marketplaceStore.getProject(project.id);
      expect(completedProj?.status).toBe('COMPLETED');

      // 11. Payment segregation: Business reports payment with UTR
      marketplaceStore.recordPayment(
        clientUser,
        project.id,
        'UPI-REF-992384918234',
        'UPI',
        'Direct UPI settlement to creator'
      );

      const payRecord = marketplaceStore.getPayments().find((p) => p.projectId === project.id);
      expect(payRecord).toBeDefined();
      expect(payRecord?.status).toBe('REPORTED_BY_BUSINESS');

      // Earnings must NOT increase while status is merely REPORTED_BY_BUSINESS
      const profileBeforeReceipt = marketplaceStore.getStudentProfile(studentUser.id);
      const earningsBefore = profileBeforeReceipt?.totalEarnedINR || 0;

      // 12. Creator confirms bank receipt
      marketplaceStore.setCurrentUserId(studentUser.id);
      marketplaceStore.creatorConfirmPaymentReceipt(studentUser, project.id);

      const payRecordConfirmed = marketplaceStore.getPayments().find((p) => p.id === payRecord!.id);
      expect(payRecordConfirmed?.status).toBe('RECEIPT_CONFIRMED_BY_CREATOR');

      const profileAfterReceipt = marketplaceStore.getStudentProfile(studentUser.id);
      expect(profileAfterReceipt?.totalEarnedINR).toBe(earningsBefore + project.budgetINR);

      // 13. Verified Review Submission
      marketplaceStore.setCurrentUserId(clientUser.id);
      marketplaceStore.addReview(
        clientUser,
        project.id,
        5,
        'Outstanding work! Delivered modular code with flawless mobile responsiveness.',
        'Checkout redesign with Tailwind and TypeScript'
      );

      const reviews = marketplaceStore.getReviews().filter((r) => r.projectId === project.id);
      expect(reviews).toHaveLength(1);
      expect(reviews[0].reviewerId).toBe(clientUser.id);
      expect(reviews[0].rating).toBe(5);

      // 14. Duplicate review rejection
      expect(() => {
        marketplaceStore.addReview(
          clientUser,
          project.id,
          4,
          'Duplicate review attempt',
          'Duplicate summary'
        );
      }).toThrow(/already reviewed/);
    });
  });
});
