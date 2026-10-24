import { describe, it, expect, beforeEach } from 'vitest';
import { marketplaceStore } from '../lib/storage';
import { PaymentRecord, User } from '../types';

describe('Proof-to-Pay Phase 3: Payment Safety & Verification Regression Suite', () => {
  const creatorUser: User = {
    id: 'student-phase3-creator',
    name: 'Dev Creator',
    email: 'dev.creator@dtu.ac.in',
    role: 'STUDENT',
    createdAt: '2026-09-01T10:00:00.000Z',
  };

  const unauthorizedCreator: User = {
    id: 'student-phase3-intruder',
    name: 'Unauthorized Creator',
    email: 'intruder@dtu.ac.in',
    role: 'STUDENT',
    createdAt: '2026-09-01T10:00:00.000Z',
  };

  const businessUser: User = {
    id: 'business-phase3',
    name: 'Acme Software',
    email: 'finance@acme.com',
    role: 'BUSINESS',
    createdAt: '2026-08-01T10:00:00.000Z',
  };

  const adminUser: User = {
    id: 'admin-phase3',
    name: 'Platform Auditor',
    email: 'security@prooftopay.in',
    role: 'ADMIN',
    createdAt: '2026-07-01T10:00:00.000Z',
  };

  const testProjectId = 'proj-phase3-security';
  const testProjectBudget = 20000;

  beforeEach(() => {
    marketplaceStore.resetToDefaults();

    // Register creator and business users
    marketplaceStore.saveUser(creatorUser);
    marketplaceStore.saveUser(unauthorizedCreator);
    marketplaceStore.saveUser(businessUser);
    marketplaceStore.saveUser(adminUser);

    // Initialize student profile with 0 earnings
    const baseProfile = marketplaceStore.getStudentProfile(creatorUser.id) || {
      userId: creatorUser.id,
      headline: 'Full-Stack Creator',
      bio: 'Audited Profile',
      skills: ['React', 'TypeScript'],
      portfolioLinks: [],
      college: 'DTU',
      degree: 'B.Tech',
      graduationYear: 2026,
      experienceLevel: 'INTERMEDIATE',
      verificationStatus: 'UNVERIFIED',
      totalEarnedINR: 0,
      completedProjectsCount: 0,
      averageRating: 5.0,
      reviewsCount: 0,
      age: 21,
    };
    baseProfile.totalEarnedINR = 0;
    baseProfile.completedProjectsCount = 0;
    marketplaceStore.updateStudentProfile(creatorUser.id, baseProfile);

    // Initialize business profile
    marketplaceStore.updateBusinessProfile(businessUser.id, {
      userId: businessUser.id,
      companyName: 'Acme Software',
      industry: 'Technology',
      city: 'Bengaluru',
      verificationStatus: 'VERIFIED',
      totalSpentINR: 0,
      projectsPostedCount: 1,
    });

    // Create and approve project
    const project = marketplaceStore.createProject(businessUser, {
      title: 'Real-Time Financial Dashboard',
      summary: 'High-security telemetry interface',
      description: 'Production audit testing',
      category: 'Web & Mobile Development',
      requiredSkills: ['React', 'TypeScript'],
      deliverables: [{ id: 'del-p3', title: 'Codebase', description: 'GitHub PR', format: 'PR' }],
      acceptanceCriteria: ['Passes security audit'],
      budgetINR: testProjectBudget,
      deadlineDays: 7,
      expectedDeliveryDate: '2026-11-20',
      applicationClosingDate: '2026-11-05',
      permittedRevisions: 2,
      paymentTerms: '100% on delivery and creator receipt confirmation',
    });

    // Manually assign student to project and assign testProjectId for the test
    const projects = marketplaceStore.getProjects();
    const targetProj = projects.find((p) => p.id === project.id);
    if (targetProj) {
      targetProj.id = testProjectId;
      targetProj.selectedStudentId = creatorUser.id;
      targetProj.selectedStudentName = creatorUser.name;
      targetProj.status = 'COMPLETED';
      marketplaceStore['set']('ptp_projects', projects);
    }
  });

  describe('Payment State Machine & Security Controls', () => {
    it('1. Entering a UTR records REPORTED_BY_BUSINESS without crediting creator earnings prematurely', () => {
      const initialProfile = marketplaceStore.getStudentProfile(creatorUser.id);
      expect(initialProfile?.totalEarnedINR).toBe(0);
      expect(initialProfile?.completedProjectsCount).toBe(0);

      // Business reports UTR payment
      const payment = marketplaceStore.reportProjectPayment(
        businessUser,
        testProjectId,
        'UTR-HDFC-998877665544',
        'UPI',
        'Transferred via UPI on milestone signoff'
      );

      expect(payment.status).toBe('REPORTED_BY_BUSINESS');
      expect(payment.transactionReferenceUTR).toBe('UTR-HDFC-998877665544');
      expect(payment.confirmedAt).toBeUndefined();

      // Verify creator earnings and completed projects were NOT credited prematurely
      const currentProfile = marketplaceStore.getStudentProfile(creatorUser.id);
      expect(currentProfile?.totalEarnedINR).toBe(0);
      expect(currentProfile?.completedProjectsCount).toBe(0);
    });

    it('2. Unauthorized creator cannot confirm payment receipt', () => {
      // Business reports UTR
      marketplaceStore.reportProjectPayment(
        businessUser,
        testProjectId,
        'UTR-HDFC-998877665544',
        'UPI'
      );

      // Unauthorized student attempts to confirm
      expect(() => {
        marketplaceStore.confirmProjectPaymentReceipt(unauthorizedCreator, testProjectId);
      }).toThrow(/Payment record not found for this creator/i);

      // Business or other non-student role also cannot confirm
      expect(() => {
        marketplaceStore.confirmProjectPaymentReceipt(businessUser, testProjectId);
      }).toThrow(/Unauthorized/i);
    });

    it('3. Creator confirmation transitions state and credits earnings exactly once', () => {
      // Business reports UTR
      marketplaceStore.reportProjectPayment(
        businessUser,
        testProjectId,
        'UTR-SBI-443322110099',
        'UPI'
      );

      // Authorized creator confirms receipt
      const confirmed = marketplaceStore.confirmProjectPaymentReceipt(creatorUser, testProjectId);
      expect(confirmed.status).toBe('RECEIPT_CONFIRMED_BY_CREATOR');
      expect(confirmed.confirmedAt).toBeDefined();
      expect(confirmed.confirmedByUserId).toBe(creatorUser.id);

      // Verify earnings and completed count are credited exactly once
      const updatedProfile = marketplaceStore.getStudentProfile(creatorUser.id);
      expect(updatedProfile?.totalEarnedINR).toBe(testProjectBudget);
      expect(updatedProfile?.completedProjectsCount).toBe(1);
    });

    it('4. Repeated confirmation is blocked and does NOT double-credit earnings', () => {
      // Business reports UTR
      marketplaceStore.reportProjectPayment(
        businessUser,
        testProjectId,
        'UTR-KOTAK-112233445566',
        'UPI'
      );

      // First confirmation succeeds
      marketplaceStore.confirmProjectPaymentReceipt(creatorUser, testProjectId);
      const profileAfterFirst = marketplaceStore.getStudentProfile(creatorUser.id);
      expect(profileAfterFirst?.totalEarnedINR).toBe(testProjectBudget);
      expect(profileAfterFirst?.completedProjectsCount).toBe(1);

      // Second confirmation attempt must be rejected
      expect(() => {
        marketplaceStore.confirmProjectPaymentReceipt(creatorUser, testProjectId);
      }).toThrow(/already been confirmed/i);

      // Ensure earnings and completed count did NOT increase
      const profileAfterSecond = marketplaceStore.getStudentProfile(creatorUser.id);
      expect(profileAfterSecond?.totalEarnedINR).toBe(testProjectBudget);
      expect(profileAfterSecond?.completedProjectsCount).toBe(1);
    });

    it('5. Disputes prevent inappropriate confirmation and lock the payment state', () => {
      // Business reports UTR
      marketplaceStore.reportProjectPayment(
        businessUser,
        testProjectId,
        'UTR-FAKE-000000',
        'UPI'
      );

      // Creator discovers funds never arrived and raises a dispute
      const disputed = marketplaceStore.disputeProjectPayment(
        creatorUser,
        testProjectId,
        'UTR invalid; bank statement confirms no funds received.'
      );
      expect(disputed.status).toBe('DISPUTED');
      expect(disputed.disputeReason).toContain('bank statement confirms no funds received');

      // Attempting to confirm receipt while payment is disputed must be rejected
      expect(() => {
        marketplaceStore.confirmProjectPaymentReceipt(creatorUser, testProjectId);
      }).toThrow(/Cannot confirm payment receipt while payment is disputed/i);

      // Balance remains 0
      const profile = marketplaceStore.getStudentProfile(creatorUser.id);
      expect(profile?.totalEarnedINR).toBe(0);
    });

    it('6. Existing legacy PAID records remain fully compatible and support creator confirmation', () => {
      // Create a legacy payment with status 'PAID' (simulating older pre-migration records)
      const legacyPayment: PaymentRecord = {
        id: 'pay-legacy-compatibility',
        projectId: 'proj-legacy-test',
        projectTitle: 'Legacy Migration Project',
        businessId: businessUser.id,
        studentId: creatorUser.id,
        amountINR: 10000,
        status: 'PAID', // Legacy status
        paymentMethod: 'UPI',
        transactionReferenceUTR: 'UTR-LEGACY-123456',
        recordedByUserId: businessUser.id,
        recordedAt: '2026-09-01T12:00:00.000Z',
      };

      marketplaceStore['set']('ptp_payments', [legacyPayment, ...marketplaceStore.getPayments()]);

      // Ensure legacy PAID payment is readable and categorized properly
      const stored = marketplaceStore.getPayments().find((p) => p.id === 'pay-legacy-compatibility');
      expect(stored).toBeDefined();
      expect(stored?.status).toBe('PAID');

      // Legacy PAID record can transition to RECEIPT_CONFIRMED_BY_CREATOR upon creator confirmation
      const confirmed = marketplaceStore.confirmProjectPaymentReceipt(creatorUser, 'proj-legacy-test');
      expect(confirmed.status).toBe('RECEIPT_CONFIRMED_BY_CREATOR');
      expect(confirmed.confirmedAt).toBeDefined();
    });
  });

  describe('Student Verification Parity & RBAC Controls', () => {
    it('1. Submitting student verification transitions status to PENDING (never automatically VERIFIED)', () => {
      const studentId = creatorUser.id;
      const initialProfile = marketplaceStore.getStudentProfile(studentId);
      expect(initialProfile?.verificationStatus).toBe('UNVERIFIED');

      // Student submits ID verification evidence
      const submitted = marketplaceStore.submitStudentVerification(
        studentId,
        {
          documentType: 'COLLEGE_ID',
          documentNumber: 'DTU-2026-SE-4421',
          collegeEmail: 'dev.creator@dtu.ac.in',
          studentIdCardUrl: 'https://prooftopay.in/docs/dtu-id-dev.jpg',
        },
        creatorUser
      );

      expect(submitted.verificationStatus).toBe('PENDING');
      expect(submitted.verificationDetails?.documentNumber).toBe('DTU-2026-SE-4421');
      expect(submitted.verificationDetails?.verifiedAt).toBeUndefined();

      // Profile in storage is PENDING
      const inStore = marketplaceStore.getStudentProfile(studentId);
      expect(inStore?.verificationStatus).toBe('PENDING');
    });

    it('2. Non-admin users cannot approve student verification', () => {
      const studentId = creatorUser.id;

      // Submit verification first
      marketplaceStore.submitStudentVerification(
        studentId,
        {
          documentType: 'COLLEGE_ID',
          documentNumber: 'DTU-2026-SE-4421',
        },
        creatorUser
      );

      // Business attempts to verify student
      expect(() => {
        marketplaceStore.adminVerifyStudent(businessUser, studentId, true, 'Approved by business');
      }).toThrow(/Admin authorization required/i);

      // Student attempts to self-verify
      expect(() => {
        marketplaceStore.adminVerifyStudent(creatorUser, studentId, true, 'Self approval');
      }).toThrow(/Admin authorization required/i);

      // Status remains PENDING
      const inStore = marketplaceStore.getStudentProfile(studentId);
      expect(inStore?.verificationStatus).toBe('PENDING');
    });

    it('3. Authorized administrator can approve or reject verification with audit trail', () => {
      const studentId = creatorUser.id;

      // Submit verification
      marketplaceStore.submitStudentVerification(
        studentId,
        {
          documentType: 'COLLEGE_ID',
          documentNumber: 'DTU-2026-SE-4421',
        },
        creatorUser
      );

      // Admin approves
      const verifiedProfile = marketplaceStore.adminVerifyStudent(
        adminUser,
        studentId,
        true,
        'Government university ID verified against institutional directory'
      );

      expect(verifiedProfile.verificationStatus).toBe('VERIFIED');
      expect(verifiedProfile.verificationDetails?.verifiedAt).toBeDefined();
      expect(verifiedProfile.verificationDetails?.adminNotes).toContain('institutional directory');

      // Verify audit log entry was generated
      const auditLogs = marketplaceStore.getAuditLogs();
      const verificationLog = auditLogs.find((l) => l.action === 'APPROVED_STUDENT_VERIFICATION' && l.targetId === studentId);
      expect(verificationLog).toBeDefined();
      expect(verificationLog?.actorRole).toBe('ADMIN');
    });
  });
});
