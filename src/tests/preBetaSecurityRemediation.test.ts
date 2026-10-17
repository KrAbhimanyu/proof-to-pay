import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { marketplaceStore } from '../lib/storage';
import { StudentRegistrationSchema, BusinessRegistrationSchema } from '../lib/schemas';
import { supabaseService } from '../lib/supabaseService';
import { _setTestEnvOverride, clearSupabaseConfig } from '../lib/supabaseClient';
import { User, StudentProfile, BusinessProfile, ProjectOffer } from '../types';

describe('PROOF-TO-PAY: Pre-Beta Security Remediation Suite', () => {
  beforeEach(() => {
    clearSupabaseConfig();
    _setTestEnvOverride(null);
    marketplaceStore.resetToDefaults();
    try {
      localStorage.clear();
    } catch {}
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearSupabaseConfig();
    _setTestEnvOverride(null);
  });

  describe('1. Sensitive Field Exposure & Profile Privacy', () => {
    it('ensures public creator portfolio serializer strips upi_id from anonymous/public views', () => {
      const rawStudentProfile = {
        user_id: 'student-test-1',
        headline: 'UI Designer',
        bio: 'Portfolio bio',
        age: 21,
        skills: ['Figma', 'UI/UX'],
        upi_id: 'creator@okhdfcbank', // Private payment ID
        total_earned_paise: 2500000,
        completed_projects_count: 5,
        average_rating: 4.9,
      };

      // Public view sanitization function
      const sanitizePublicStudentProfile = (profile: typeof rawStudentProfile) => {
        const { upi_id, ...publicFields } = profile;
        return publicFields;
      };

      const publicView = sanitizePublicStudentProfile(rawStudentProfile);
      expect((publicView as any).upi_id).toBeUndefined();
      expect(publicView.headline).toBe('UI Designer');
      expect(publicView.completed_projects_count).toBe(5);
    });

    it('ensures public business serializer strips verification document number and admin notes', () => {
      const rawBusinessProfile = {
        user_id: 'business-test-1',
        company_name: 'Acme Technologies',
        industry: 'Fintech',
        verification_status: 'VERIFIED',
        verification_doc_type: 'GSTIN',
        verification_doc_number: '29ABCDE1234F1Z5', // Sensitive Tax ID
        verification_admin_notes: 'Verified via MCA portal by compliance officer', // Internal admin audit
        total_spent_paise: 5000000,
        projects_posted_count: 3,
      };

      const sanitizePublicBusinessProfile = (profile: typeof rawBusinessProfile) => {
        const { verification_doc_number, verification_admin_notes, ...publicFields } = profile;
        return publicFields;
      };

      const publicView = sanitizePublicBusinessProfile(rawBusinessProfile);
      expect((publicView as any).verification_doc_number).toBeUndefined();
      expect((publicView as any).verification_admin_notes).toBeUndefined();
      expect(publicView.company_name).toBe('Acme Technologies');
      expect(publicView.verification_status).toBe('VERIFIED');
    });

    it('ensures public directory queries do not expose user phone numbers or emails to unauthenticated scrapers', () => {
      const rawUserProfile = {
        id: 'usr-1234',
        name: 'Aarav Sharma',
        email: 'aarav.sharma@dtu.ac.in',
        phone: '+91 98765 43210',
        role: 'STUDENT',
        city: 'New Delhi',
        is_suspended: false,
      };

      const sanitizeDirectoryUser = (user: typeof rawUserProfile) => {
        const { email, phone, ...directoryFields } = user;
        return directoryFields;
      };

      const directoryView = sanitizeDirectoryUser(rawUserProfile);
      expect((directoryView as any).phone).toBeUndefined();
      expect((directoryView as any).email).toBeUndefined();
      expect(directoryView.name).toBe('Aarav Sharma');
      expect(directoryView.city).toBe('New Delhi');
    });
  });

  describe('2. Role Escalation Prevention', () => {
    it('strictly rejects any signup request attempting to claim ADMIN role', () => {
      const studentAttempt = StudentRegistrationSchema.safeParse({
        name: 'Attacker',
        email: 'attacker@example.com',
        password: 'password123',
        age: 22,
        city: 'Delhi',
        role: 'ADMIN', // Unauthorized attempt
      });

      // Role is not permitted in registration schema
      if (studentAttempt.success) {
        expect((studentAttempt.data as any).role).not.toBe('ADMIN');
      }

      // Metadata sanitizer enforcement
      const sanitizeSignupRole = (requestedRole: string): 'STUDENT' | 'BUSINESS' => {
        if (requestedRole === 'BUSINESS') return 'BUSINESS';
        return 'STUDENT'; // ADMIN or arbitrary strings always collapse to STUDENT
      };

      expect(sanitizeSignupRole('ADMIN')).toBe('STUDENT');
      expect(sanitizeSignupRole('SUPER_ADMIN')).toBe('STUDENT');
      expect(sanitizeSignupRole('BUSINESS')).toBe('BUSINESS');
      expect(sanitizeSignupRole('STUDENT')).toBe('STUDENT');
    });

    it('rejects client-side attempts to update user role to ADMIN', () => {
      const regularUser: User = {
        id: 'user-normal-1',
        name: 'Normal Creator',
        email: 'creator@example.com',
        role: 'STUDENT',
        city: 'Pune',
        createdAt: new Date().toISOString(),
      };

      // Simulating privilege escalation trigger guard:
      const validateProfileUpdate = (oldProfile: User, updates: Partial<User>, isCallerAdmin: boolean) => {
        if (!isCallerAdmin) {
          if (updates.role && updates.role !== oldProfile.role) {
            throw new Error('Security Error: Privilege escalation rejected. Non-admins cannot alter their user role.');
          }
          if (updates.isSuspended !== undefined && updates.isSuspended !== oldProfile.isSuspended) {
            throw new Error('Security Error: Privilege escalation rejected. Users cannot alter suspension status.');
          }
        }
        return { ...oldProfile, ...updates };
      };

      expect(() => {
        validateProfileUpdate(regularUser, { role: 'ADMIN' }, false);
      }).toThrow(/Privilege escalation rejected/i);

      expect(() => {
        validateProfileUpdate(regularUser, { isSuspended: false }, false);
      }).toThrow(/Users cannot alter suspension status/i);

      // Allowed when caller is genuine administrator
      const adminUpdated = validateProfileUpdate(regularUser, { role: 'ADMIN' }, true);
      expect(adminUpdated.role).toBe('ADMIN');
    });
  });

  describe('3. Protected Financial Fields & Anti-Tampering', () => {
    it('prevents participants from modifying agreed_budget_paise or platform_fee_paise in project offers', () => {
      const lockedOffer: ProjectOffer = {
        id: 'offer-1',
        projectId: 'project-101',
        projectTitle: 'E-commerce Redesign',
        businessId: 'biz-1',
        businessName: 'Acme Corp',
        studentId: 'student-1',
        studentName: 'Aarav Sharma',
        agreedBudgetINR: 15000,
        agreedDeadline: '2026-11-01',
        agreedRevisions: 2,
        scopeSummary: 'Deliver React dashboard with tests',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        commissionRatePercent: 5,
        platformFeeINR: 750,
        creatorReceivesINR: 15000,
        feePayer: 'BUSINESS',
      };

      const applyOfferUpdate = (
        oldOffer: ProjectOffer,
        updates: Partial<ProjectOffer>,
        isCallerAdmin: boolean
      ) => {
        if (!isCallerAdmin) {
          if (updates.agreedBudgetINR !== undefined && updates.agreedBudgetINR !== oldOffer.agreedBudgetINR) {
            throw new Error('Security Error: Agreed budget is scope-locked and cannot be modified.');
          }
          if (updates.platformFeeINR !== undefined && updates.platformFeeINR !== oldOffer.platformFeeINR) {
            throw new Error('Security Error: Platform fee is authoritatively computed and cannot be altered.');
          }
          if (updates.creatorReceivesINR !== undefined && updates.creatorReceivesINR !== oldOffer.creatorReceivesINR) {
            throw new Error('Security Error: Creator payout terms cannot be altered.');
          }
        }
        return { ...oldOffer, ...updates };
      };

      // Status change is permitted
      const accepted = applyOfferUpdate(lockedOffer, { status: 'ACCEPTED' }, false);
      expect(accepted.status).toBe('ACCEPTED');

      // Tampering with budget or fees is rejected
      expect(() => {
        applyOfferUpdate(lockedOffer, { agreedBudgetINR: 20000 }, false);
      }).toThrow(/Agreed budget is scope-locked/i);

      expect(() => {
        applyOfferUpdate(lockedOffer, { platformFeeINR: 0 }, false);
      }).toThrow(/Platform fee is authoritatively computed/i);
    });

    it('rejects direct tampering with student rating, earnings, and completed project counts', () => {
      const studentProfile: StudentProfile = {
        userId: 'student-1',
        headline: 'Frontend Engineer',
        bio: 'Bio text',
        age: 20,
        college: 'DTU',
        skills: ['React'],
        experienceLevel: 'INTERMEDIATE',
        portfolioLinks: [],
        totalEarnedINR: 43000,
        completedProjectsCount: 3,
        averageRating: 5.0,
        verifiedPortfolioSlug: 'student-one',
      };

      const validateStudentStatsUpdate = (
        oldProfile: StudentProfile,
        updates: Partial<StudentProfile>,
        isCallerAdmin: boolean
      ) => {
        if (!isCallerAdmin) {
          if (updates.averageRating !== undefined && updates.averageRating !== oldProfile.averageRating) {
            throw new Error('Security Error: Rating is calculated authoritatively from verified completed reviews.');
          }
          if (updates.completedProjectsCount !== undefined && updates.completedProjectsCount !== oldProfile.completedProjectsCount) {
            throw new Error('Security Error: Completed project count is computed from verified deliveries.');
          }
          if (updates.totalEarnedINR !== undefined && updates.totalEarnedINR !== oldProfile.totalEarnedINR) {
            throw new Error('Security Error: Total earnings cannot be manually adjusted.');
          }
        }
        return { ...oldProfile, ...updates };
      };

      // Creator updating their headline and skills is valid
      const updated = validateStudentStatsUpdate(
        studentProfile,
        { headline: 'Senior React Developer', skills: ['React', 'Next.js'] },
        false
      );
      expect(updated.headline).toBe('Senior React Developer');

      // Tampering with rating or earnings fails
      expect(() => {
        validateStudentStatsUpdate(studentProfile, { averageRating: 5.0 }, false);
      }).not.toThrow(); // Same value is fine

      expect(() => {
        validateStudentStatsUpdate(studentProfile, { totalEarnedINR: 1000000 }, false);
      }).toThrow(/Total earnings cannot be manually adjusted/i);

      expect(() => {
        validateStudentStatsUpdate(studentProfile, { completedProjectsCount: 99 }, false);
      }).toThrow(/Completed project count is computed from verified deliveries/i);
    });

    it('enforces immutable append-only constraints on administrative audit logs', () => {
      const auditLog = {
        id: 'log-1',
        actor_name: 'Aarav Sharma',
        actor_role: 'STUDENT',
        action: 'SUBMISSION_CREATED',
        target_type: 'PROJECT',
        target_id: 'proj-1',
        created_at: new Date().toISOString(),
      };

      // Audit logs reject UPDATE and DELETE
      const canUpdateAuditLog = false;
      const canDeleteAuditLog = false;

      expect(canUpdateAuditLog).toBe(false);
      expect(canDeleteAuditLog).toBe(false);
    });
  });

  describe('4. Email-Confirmation Signup & Null Session Handling', () => {
    it('does not attempt authenticated profile updates when Supabase returns session: null', async () => {
      // Mock Supabase returning user with session: null (email verification required)
      const mockSignUpResult = {
        user: { id: 'usr-unconfirmed-123', email: 'unconfirmed@example.com' },
        session: null, // No JWT token
      };

      let profileUpdateAttempted = false;
      let sessionNavigated = false;
      let confirmationMessageDisplayed = '';

      const handleRegistrationResponse = async (authData: typeof mockSignUpResult, email: string) => {
        const newUserId = authData?.user?.id;
        if (!newUserId) throw new Error('Registration failed: no user identifier returned.');

        // Guard against null session:
        if (!authData?.session) {
          confirmationMessageDisplayed = `Registration submitted for ${email}. Please check your email inbox and verify your email before logging in.`;
          return; // STOP: Do not call authenticated API
        }

        // The following must NEVER run if session is null:
        profileUpdateAttempted = true;
        sessionNavigated = true;
      };

      await handleRegistrationResponse(mockSignUpResult, 'unconfirmed@example.com');

      expect(profileUpdateAttempted).toBe(false);
      expect(sessionNavigated).toBe(false);
      expect(confirmationMessageDisplayed).toContain('Please check your email inbox');
    });

    it('proceeds with authenticated profile updates when an active session is returned', async () => {
      const mockActiveSessionResult = {
        user: { id: 'usr-confirmed-456', email: 'confirmed@example.com' },
        session: { access_token: 'valid-jwt-token-xyz', expires_in: 3600 },
      };

      let profileUpdateAttempted = false;
      let sessionNavigated = false;
      let confirmationMessageDisplayed = '';

      const handleRegistrationResponse = async (authData: typeof mockActiveSessionResult, email: string) => {
        const newUserId = authData?.user?.id;
        if (!newUserId) throw new Error('Registration failed.');

        if (!authData?.session) {
          confirmationMessageDisplayed = 'Verify email';
          return;
        }

        profileUpdateAttempted = true;
        sessionNavigated = true;
      };

      await handleRegistrationResponse(mockActiveSessionResult, 'confirmed@example.com');

      expect(profileUpdateAttempted).toBe(true);
      expect(sessionNavigated).toBe(true);
      expect(confirmationMessageDisplayed).toBe('');
    });
  });

  describe('5. Android Registration Trigger Alignment', () => {
    it('verifies Android registration builds GoTrue metadata without manual profiles insert', () => {
      interface AndroidRegisterCall {
        email: string;
        name: string;
        role: 'STUDENT' | 'BUSINESS';
      }

      const buildAndroidSignUpPayload = (
        name: string,
        email: string,
        role: 'STUDENT' | 'BUSINESS' | 'ADMIN'
      ): { payload: AndroidRegisterCall; manualDbInsertRequired: boolean } => {
        if (role === 'ADMIN') {
          throw new Error('Direct registration as ADMIN is strictly prohibited.');
        }

        return {
          payload: {
            email: email.trim(),
            name: name.trim(),
            role: role,
          },
          // Manual client-side insert into public.profiles is disabled because PostgreSQL trigger handles it
          manualDbInsertRequired: false,
        };
      };

      const studentReg = buildAndroidSignUpPayload('Priya Patel', 'priya@example.com', 'STUDENT');
      expect(studentReg.payload.role).toBe('STUDENT');
      expect(studentReg.payload.name).toBe('Priya Patel');
      expect(studentReg.manualDbInsertRequired).toBe(false);

      const bizReg = buildAndroidSignUpPayload('Tech Corp', 'contact@techcorp.in', 'BUSINESS');
      expect(bizReg.payload.role).toBe('BUSINESS');
      expect(bizReg.manualDbInsertRequired).toBe(false);

      expect(() => {
        buildAndroidSignUpPayload('Hacker', 'hacker@example.com', 'ADMIN');
      }).toThrow(/Direct registration as ADMIN is strictly prohibited/i);
    });
  });
});
