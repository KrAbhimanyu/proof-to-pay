import { describe, it, expect, beforeEach } from 'vitest';
import { marketplaceStore } from '../lib/storage';
import { User, ReferralLeaderboardEntry } from '../types';

describe('Referral Leaderboard Component & Telemetry', () => {
  beforeEach(() => {
    marketplaceStore.resetToDefaults();
  });

  it('retrieves the top referrers ordered by successful conversions', () => {
    const leaderboard = marketplaceStore.getReferralLeaderboard();
    expect(leaderboard.length).toBeGreaterThanOrEqual(3);

    // Verify ranks are sequentially ordered 1, 2, 3...
    leaderboard.forEach((entry, idx) => {
      expect(entry.rank).toBe(idx + 1);
    });

    // Check that entry 0 has greater or equal conversions than entry 1
    for (let i = 0; i < leaderboard.length - 1; i++) {
      expect(leaderboard[i].successfulConversions).toBeGreaterThanOrEqual(
        leaderboard[i + 1].successfulConversions
      );
    }
  });

  it('awards Grand Ambassador and top scout badges to podium spots', () => {
    const leaderboard = marketplaceStore.getReferralLeaderboard();
    const rank1 = leaderboard.find((e) => e.rank === 1);
    const rank2 = leaderboard.find((e) => e.rank === 2);
    const rank3 = leaderboard.find((e) => e.rank === 3);

    expect(rank1?.badge).toBe('Grand Ambassador 🏆');
    expect(rank2?.badge).toBe('Super Connector ⭐');
    expect(rank3?.badge).toBe('Top Scout 🌟');
  });

  it('filters leaderboard by user role', () => {
    const studentLeaderboard = marketplaceStore.getReferralLeaderboard('STUDENT');
    expect(studentLeaderboard.length).toBeGreaterThanOrEqual(1);
    studentLeaderboard.forEach((entry) => {
      expect(entry.userRole).toBe('STUDENT');
    });

    const recruiterLeaderboard = marketplaceStore.getReferralLeaderboard('RECRUITER');
    expect(recruiterLeaderboard.length).toBeGreaterThanOrEqual(1);
    recruiterLeaderboard.forEach((entry) => {
      expect(entry.userRole).toBe('RECRUITER');
    });

    const businessLeaderboard = marketplaceStore.getReferralLeaderboard('BUSINESS');
    expect(businessLeaderboard.length).toBeGreaterThanOrEqual(1);
    businessLeaderboard.forEach((entry) => {
      expect(entry.userRole).toBe('BUSINESS');
    });
  });

  it('accurately identifies current user and flags isCurrentUser', () => {
    const studentLeaderboard = marketplaceStore.getReferralLeaderboard('ALL', 'student-1');
    const userEntry = studentLeaderboard.find((e) => e.userId === 'student-1');

    expect(userEntry).toBeDefined();
    expect(userEntry?.isCurrentUser).toBe(true);
    expect(userEntry?.userName).toBe('Aarav Sharma');

    const otherEntries = studentLeaderboard.filter((e) => e.userId !== 'student-1');
    otherEntries.forEach((e) => {
      expect(e.isCurrentUser).toBe(false);
    });
  });

  it('computes accurate conversion rate percentage', () => {
    const leaderboard = marketplaceStore.getReferralLeaderboard();
    leaderboard.forEach((entry) => {
      if (entry.totalInvited > 0) {
        const expectedRate = Math.round(
          (entry.successfulConversions / entry.totalInvited) * 100
        );
        expect(entry.conversionRate).toBe(expectedRate);
      }
    });
  });

  it('dynamically increases conversions and updates rank when a referee activates milestone', () => {
    // Add invitee
    const users = marketplaceStore.getUsers();
    const newUser: User = {
      id: 'student-new-leaderboard',
      name: 'Sahil Kapoor',
      email: 'sahil@iitd.ac.in',
      role: 'STUDENT',
      createdAt: new Date().toISOString()
    };
    marketplaceStore['set']('ptp_users', [newUser, ...users]);

    // Apply Aarav's referral code
    marketplaceStore.applyReferralCode('student-new-leaderboard', 'AARAV2026');

    const beforeStats = marketplaceStore
      .getReferralLeaderboard('ALL', 'student-1')
      .find((e) => e.userId === 'student-1');
    const beforeConversions = beforeStats?.successfulConversions || 0;

    // Activate milestone
    marketplaceStore.recordReferralMilestone(
      'student-new-leaderboard',
      'Completed verified backend API milestone'
    );

    const afterStats = marketplaceStore
      .getReferralLeaderboard('ALL', 'student-1')
      .find((e) => e.userId === 'student-1');
    expect(afterStats?.successfulConversions).toBe(beforeConversions + 1);
  });
});
