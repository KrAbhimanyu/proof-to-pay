import { describe, it, expect, beforeEach } from 'vitest';
import { marketplaceStore } from '../lib/storage';
import { User, VerifiedReview } from '../types';

describe('Verified Skills Section & Business Endorsements Suite', () => {
  const studentUser: User = {
    id: 'student-1',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@dtu.ac.in',
    role: 'STUDENT',
    createdAt: '2026-08-15T10:00:00.000Z',
  };

  beforeEach(() => {
    marketplaceStore.resetToDefaults();
  });

  it('retrieves business reviews with endorsedSkills for student-1', () => {
    const reviews = marketplaceStore.getReviews().filter(
      (r) => r.targetUserId === studentUser.id && r.reviewerRole === 'BUSINESS'
    );
    expect(reviews.length).toBeGreaterThan(0);

    const reviewWithSkills = reviews.find((r) => r.endorsedSkills && r.endorsedSkills.length > 0);
    expect(reviewWithSkills).toBeDefined();
    expect(reviewWithSkills?.endorsedSkills).toContain('React');
    expect(reviewWithSkills?.endorsedSkills).toContain('TypeScript');
  });

  it('aggregates skills verified through completed client projects and feedback', () => {
    const reviews = marketplaceStore.getReviews().filter(
      (r) => r.targetUserId === studentUser.id && r.reviewerRole === 'BUSINESS'
    );
    const passportItems = marketplaceStore.getProofPassportItems(studentUser.id, false);

    const verifiedSkillsSet = new Set<string>();

    reviews.forEach((r) => {
      if (r.endorsedSkills) {
        r.endorsedSkills.forEach((s) => verifiedSkillsSet.add(s.toLowerCase()));
      }
    });

    passportItems.forEach((item) => {
      if (item.skills) {
        item.skills.forEach((s) => verifiedSkillsSet.add(s.toLowerCase()));
      }
    });

    // Check core verified capabilities
    expect(verifiedSkillsSet.has('react')).toBe(true);
    expect(verifiedSkillsSet.has('typescript')).toBe(true);
    expect(verifiedSkillsSet.has('next.js')).toBe(true);
    expect(verifiedSkillsSet.has('tailwind css')).toBe(true);
  });

  it('links each verified skill to authentic business client feedback quotes', () => {
    const reviews = marketplaceStore.getReviews().filter(
      (r) => r.targetUserId === studentUser.id && r.reviewerRole === 'BUSINESS'
    );

    const review = reviews.find((r) => r.endorsedSkills?.includes('Performance Optimization'));
    expect(review).toBeDefined();
    expect(review?.comment).toContain('optimized our bundle size');
    expect(review?.rating).toBe(5);
    expect(review?.reviewerName).toContain('HyperFlow Labs');
  });

  it('distinguishes between verified client endorsements and self-declared profile skills', () => {
    const profile = marketplaceStore.getStudentProfile(studentUser.id)!;
    expect(profile).toBeDefined();

    const reviews = marketplaceStore.getReviews().filter(
      (r) => r.targetUserId === studentUser.id && r.reviewerRole === 'BUSINESS'
    );

    const verifiedSkillsLower = new Set(
      reviews.flatMap((r) => r.endorsedSkills || []).map((s) => s.toLowerCase())
    );

    // Profile has skills
    expect(profile.skills.length).toBeGreaterThan(0);
    
    // Check that some profile skills match verified skills
    const hasVerified = profile.skills.some((s) => verifiedSkillsLower.has(s.toLowerCase()));
    expect(hasVerified).toBe(true);
  });
});
