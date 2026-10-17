import { describe, it, expect, beforeEach } from 'vitest';
import { marketplaceStore } from '../lib/storage';
import { User, ReferralRecord, ReferralStats } from '../types';

describe('Referral Network & Rewards System', () => {
  beforeEach(() => {
    marketplaceStore.resetToDefaults();
  });

  it('generates a consistent, clean referral code for users', () => {
    const studentCode = marketplaceStore.getReferralCodeForUser('student-1');
    expect(studentCode).toBe('AARAV2026');

    const bizCode = marketplaceStore.getReferralCodeForUser('business-1');
    expect(bizCode).toBe('SIDDHARTH2026');
  });

  it('retrieves referral records and telemetry stats for user', () => {
    const stats: ReferralStats = marketplaceStore.getReferralStats('student-1');
    expect(stats.referralCode).toBe('AARAV2026');
    expect(stats.totalInvited).toBeGreaterThanOrEqual(1);
    expect(stats.totalActivated).toBeGreaterThanOrEqual(1);
    expect(stats.totalEarnedINR).toBeGreaterThanOrEqual(500);

    const referrals: ReferralRecord[] = marketplaceStore.getReferrals('student-1');
    expect(referrals.length).toBeGreaterThanOrEqual(1);
    expect(referrals[0].refereeName).toBe('Ananya Iyer');
    expect(referrals[0].status).toBe('ACTIVE_MILESTONE');
  });

  it('applies a valid referral code during new user registration', () => {
    // Add a new user first
    const users = marketplaceStore.getUsers();
    const newUser: User = {
      id: 'student-new-1',
      name: 'Rohan Mehra',
      email: 'rohan.mehra@college.edu',
      role: 'STUDENT',
      createdAt: new Date().toISOString()
    };
    marketplaceStore['set']('ptp_users', [newUser, ...users]);

    // Apply Aarav's referral code
    const applied = marketplaceStore.applyReferralCode('student-new-1', 'AARAV2026');
    expect(applied).toBe(true);

    const referrals = marketplaceStore.getReferrals('student-1');
    const matched = referrals.find((r) => r.refereeId === 'student-new-1');
    expect(matched).toBeDefined();
    expect(matched?.refereeName).toBe('Rohan Mehra');
    expect(matched?.status).toBe('SIGNED_UP');
    expect(matched?.rewardAmountINR).toBe(500);
  });

  it('prevents self-referral attempts', () => {
    const applied = marketplaceStore.applyReferralCode('student-1', 'AARAV2026');
    expect(applied).toBe(false);
  });

  it('rejects invalid or non-existent referral codes', () => {
    const applied = marketplaceStore.applyReferralCode('student-2', 'NONEXISTENT999');
    expect(applied).toBe(false);
  });

  it('activates referral milestone reward when referred creator completes a project', () => {
    // Register invitee
    const users = marketplaceStore.getUsers();
    const newUser: User = {
      id: 'student-new-2',
      name: 'Pooja Verma',
      email: 'pooja.v@college.edu',
      role: 'STUDENT',
      createdAt: new Date().toISOString()
    };
    marketplaceStore['set']('ptp_users', [newUser, ...users]);
    marketplaceStore.applyReferralCode('student-new-2', 'AARAV2026');

    // Simulate completion of first project
    marketplaceStore.recordReferralMilestone(
      'student-new-2',
      'Completed verified deliverable: Brand Identity System'
    );

    const referrals = marketplaceStore.getReferrals('student-1');
    const poojaReferral = referrals.find((r) => r.refereeId === 'student-new-2');
    expect(poojaReferral?.status).toBe('ACTIVE_MILESTONE');
    expect(poojaReferral?.activatedAt).toBeDefined();
    expect(poojaReferral?.milestoneTitle).toContain('Brand Identity System');

    // Verify stats updated
    const stats = marketplaceStore.getReferralStats('student-1');
    expect(stats.totalActivated).toBeGreaterThanOrEqual(2);
  });

  it('awards ₹1,500 INR referral bonus for recruiter referrals', () => {
    const users = marketplaceStore.getUsers();
    const newRecruiter: User = {
      id: 'recruiter-new-1',
      name: 'Karan Mehra',
      email: 'karan@staffing.com',
      role: 'RECRUITER',
      createdAt: new Date().toISOString()
    };
    marketplaceStore['set']('ptp_users', [newRecruiter, ...users]);

    // Recruiter Rhea's code
    const rheaCode = marketplaceStore.getReferralCodeForUser('recruiter-1');
    const applied = marketplaceStore.applyReferralCode('recruiter-new-1', rheaCode);
    expect(applied).toBe(true);

    const rheaReferrals = marketplaceStore.getReferrals('recruiter-1');
    const karanRef = rheaReferrals.find((r) => r.refereeId === 'recruiter-new-1');
    expect(karanRef).toBeDefined();
    expect(karanRef?.rewardAmountINR).toBe(1500);
  });
});
