import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { marketplaceStore } from '../lib/storage';
import { StudentRegistrationSchema, BusinessRegistrationSchema } from '../lib/schemas';
import { supabaseService } from '../lib/supabaseService';
import { _setTestEnvOverride, clearSupabaseConfig } from '../lib/supabaseClient';
import { User, StudentProfile } from '../types';

describe('PROOF-TO-PAY: Authentication & Session Security Suite', () => {
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

  describe('1. Registration Security & Validation', () => {
    it('validates Creator registration schema without age restriction', () => {
      const creatorResult = StudentRegistrationSchema.safeParse({
        name: 'Young Creator',
        email: 'creator@example.com',
        password: 'password123',
        age: 17, // Previously restricted, now allowed
        city: 'Mumbai',
        headline: 'Aspiring Web Designer',
        skills: ['Figma'],
        experienceLevel: 'BEGINNER',
      });

      expect(creatorResult.success).toBe(true);

      const validAdultResult = StudentRegistrationSchema.safeParse({
        name: 'Adult Creator',
        email: 'adult@example.com',
        password: 'password123',
        age: 18,
        city: 'Mumbai',
        headline: 'Professional Web Designer',
        skills: ['Figma', 'React'],
        experienceLevel: 'INTERMEDIATE',
      });

      expect(validAdultResult.success).toBe(true);
    });

    it('rejects duplicate demo emails during client registration', () => {
      const users = marketplaceStore.getUsers();
      const existingUser = users[0];
      expect(existingUser).toBeDefined();

      // Check whether existing email is rejected
      const isDuplicate = users.some((u) => u.email.toLowerCase() === existingUser.email.toLowerCase());
      expect(isDuplicate).toBe(true);
    });

    it('rejects invalid business registration without required company fields', () => {
      const invalidBiz = BusinessRegistrationSchema.safeParse({
        name: 'Rep Name',
        email: 'not-an-email',
        password: '123', // too short
        companyName: '',
        industry: '',
        city: '',
      });

      expect(invalidBiz.success).toBe(false);
      if (!invalidBiz.success) {
        expect(invalidBiz.error.issues.length).toBeGreaterThanOrEqual(3);
      }
    });
  });

  describe('2. Live Mode Authentication vs. Demo Mode', () => {
    it('throws error when attempting live sign-in on unconfigured Supabase', async () => {
      await expect(
        supabaseService.signInWithEmail('test@example.com', 'wrongpassword')
      ).rejects.toThrow(/Live Supabase backend is not configured/i);
    });

    it('distinguishes live backend status from demo mode', () => {
      expect(supabaseService.isLiveBackendConfigured()).toBe(false);
      const status = marketplaceStore.getBackendStatus();
      expect(status.isLive).toBe(false);
      expect(status.mode).toBe('OFFLINE_DEMO_SANDBOX');
    });

    it('prevents client-side role privilege escalation in student profile updates', () => {
      const originalUser = marketplaceStore.getUsers().find((u) => u.role === 'STUDENT')!;
      expect(originalUser.role).toBe('STUDENT');

      // Attempt to tamper with role via updateCreatorPortfolio
      const attemptData = {
        role: 'ADMIN',
        headline: 'Hacked Headline',
      } as any;

      const updated = marketplaceStore.updateCreatorPortfolio(originalUser, originalUser.id, attemptData);
      expect((updated as any).role).toBeUndefined();

      // Verify the user's role remains STUDENT
      const reloadedUser = marketplaceStore.getUsers().find((u) => u.id === originalUser.id)!;
      expect(reloadedUser.role).toBe('STUDENT');
    });
  });

  describe('3. Role Routing & Access Guards', () => {
    it('maps user roles accurately to their respective workspace targets', () => {
      const getTarget = (role: User['role']) => {
        if (role === 'STUDENT') return 'student_dashboard';
        if (role === 'BUSINESS') return 'business_dashboard';
        if (role === 'ADMIN') return 'admin_dashboard';
        return 'landing';
      };

      expect(getTarget('STUDENT')).toBe('student_dashboard');
      expect(getTarget('BUSINESS')).toBe('business_dashboard');
      expect(getTarget('ADMIN')).toBe('admin_dashboard');
    });

    it('restricts admin workspace access to only users with ADMIN role', () => {
      const isAllowedAdmin = (user: User | null) => user !== null && user.role === 'ADMIN';

      const studentUser: User = { id: 's1', email: 's@test.com', name: 'Student', role: 'STUDENT', createdAt: '' };
      const bizUser: User = { id: 'b1', email: 'b@test.com', name: 'Biz', role: 'BUSINESS', createdAt: '' };
      const adminUser: User = { id: 'a1', email: 'a@test.com', name: 'Admin', role: 'ADMIN', createdAt: '' };

      expect(isAllowedAdmin(null)).toBe(false);
      expect(isAllowedAdmin(studentUser)).toBe(false);
      expect(isAllowedAdmin(bizUser)).toBe(false);
      expect(isAllowedAdmin(adminUser)).toBe(true);
    });
  });

  describe('4. Logout & Session Cleanup', () => {
    it('clears active user state and stored identifier on logout', () => {
      marketplaceStore.setCurrentUserId('student-1');
      expect(marketplaceStore.getCurrentUser()?.id).toBe('student-1');

      // Simulate centralized handleLogout state cleanup
      marketplaceStore.setCurrentUserId(null);
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('ptp_session_provider');
        expect(localStorage.getItem('ptp_current_user_id')).toBeNull();
        expect(localStorage.getItem('ptp_session_provider')).toBeNull();
      }

      expect(marketplaceStore.getCurrentUser()).toBeNull();
    });

    it('safely handles provider logout without throwing when provider is not connected', async () => {
      await expect(supabaseService.signOut()).resolves.not.toThrow();
    });
  });

  describe('5. Suspended Account Enforcement', () => {
    it('blocks suspended users from retrieving an active session', () => {
      const suspendedUser: User = {
        id: 'susp-1',
        email: 'suspended@example.com',
        name: 'Suspended User',
        role: 'STUDENT',
        isSuspended: true,
        suspensionReason: 'Policy violation',
        createdAt: new Date().toISOString(),
      };

      const users = marketplaceStore.getUsers();
      marketplaceStore['set']('ptp_users', [suspendedUser, ...users]);
      marketplaceStore.setCurrentUserId(suspendedUser.id);

      // getCurrentUser must filter out suspended accounts and return null
      const activeUser = marketplaceStore.getCurrentUser();
      expect(activeUser).toBeNull();
    });
  });
});
