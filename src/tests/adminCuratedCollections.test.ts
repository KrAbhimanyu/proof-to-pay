import { describe, it, expect, beforeEach } from 'vitest';
import { marketplaceStore } from '../lib/storage';
import { CuratedCollectionSchema } from '../lib/schemas';
import { User } from '../types';

describe('Phase C: Admin-Curated Talent Collections', () => {
  const adminUser: User = {
    id: 'admin-1',
    name: 'Platform Admin',
    email: 'admin@prooftopay.in',
    role: 'ADMIN',
    city: 'Bengaluru',
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const recruiterUser: User = {
    id: 'recruiter-1',
    name: 'Rhea Sengupta',
    email: 'rhea@talentfoundry.in',
    role: 'RECRUITER',
    city: 'Bengaluru',
    createdAt: '2026-06-01T08:00:00.000Z',
  };

  const studentUser: User = {
    id: 'student-1',
    name: 'Aarav Sharma',
    email: 'aarav@dtu.ac.in',
    role: 'STUDENT',
    city: 'New Delhi',
    createdAt: '2026-06-01T10:00:00.000Z',
  };

  beforeEach(() => {
    marketplaceStore.resetToDefaults();
  });

  it('validates curated collection schema using CuratedCollectionSchema', () => {
    const valid = {
      name: 'Elite Web3 & Fintech Engineers',
      description: 'Creators with audited smart contracts and payment gateway integrations.',
      category: 'Fullstack Engineering',
      badge: 'Staff Pick',
      color: 'indigo',
      curatorName: 'Proof-to-Pay Staff',
      isFeatured: true,
    };
    const res = CuratedCollectionSchema.safeParse(valid);
    expect(res.success).toBe(true);

    const invalid = {
      ...valid,
      name: 'AB', // min 3 chars
    };
    const invalidRes = CuratedCollectionSchema.safeParse(invalid);
    expect(invalidRes.success).toBe(false);
  });

  it('allows administrators to create official curated talent collections', () => {
    const created = marketplaceStore.createCuratedCollection(adminUser, {
      name: 'Cloud & Kubernetes Wizards',
      description: 'Student DevOps engineers with certified cloud infrastructure projects.',
      category: 'Backend & Cloud',
      badge: 'Vetted DevOps',
      color: 'blue',
      curatorName: 'DevOps Editorial Board',
      isFeatured: true,
    });

    expect(created.id).toBeDefined();
    expect(created.isCurated).toBe(true);
    expect(created.isFeatured).toBe(true);
    expect(created.badge).toBe('Vetted DevOps');
    expect(created.ownerId).toBe(adminUser.id);

    const curated = marketplaceStore.getCuratedCollections();
    expect(curated.some((c) => c.name === 'Cloud & Kubernetes Wizards')).toBe(true);
  });

  it('strictly blocks non-admin users from creating curated collections (Privilege Escalation Prevention)', () => {
    expect(() => {
      marketplaceStore.createCuratedCollection(recruiterUser, {
        name: 'Spoofed Curated Cohort',
        description: 'Should be rejected',
        category: 'Recruiting',
        badge: 'Staff Pick',
      });
    }).toThrow(/Unauthorized/);

    expect(() => {
      marketplaceStore.createCuratedCollection(studentUser, {
        name: 'Student Self-Curated Cohort',
        description: 'Should be rejected',
        category: 'Student',
      });
    }).toThrow(/Unauthorized/);
  });

  it('allows administrators to endorse and add creators to curated collections', () => {
    const curated = marketplaceStore.getCuratedCollections()[0];
    expect(curated).toBeDefined();

    const endorsedItem = marketplaceStore.addCreatorToCuratedCollection(
      adminUser,
      curated.id,
      'student-2',
      'Demonstrated stellar architectural discipline on design tokens and mobile delivery.',
      ['Figma', 'Design Systems', 'Top Rated']
    );

    expect(endorsedItem.creatorId).toBe('student-2');
    expect(endorsedItem.endorsement).toContain('stellar architectural discipline');
    expect(endorsedItem.tags).toContain('Design Systems');

    const updated = marketplaceStore.getTalentCollection(curated.id);
    expect(updated?.items.some((i) => i.creatorId === 'student-2')).toBe(true);
  });

  it('strictly prevents non-admin users from endorsing creators or modifying curated collections', () => {
    const curated = marketplaceStore.getCuratedCollections()[0];

    expect(() => {
      marketplaceStore.addCreatorToCuratedCollection(
        recruiterUser,
        curated.id,
        'student-2',
        'Unauthorized endorsement'
      );
    }).toThrow(/Unauthorized/);

    expect(() => {
      marketplaceStore.updateCuratedCollection(recruiterUser, curated.id, {
        name: 'Tampered Name',
      });
    }).toThrow(/Unauthorized/);

    expect(() => {
      marketplaceStore.deleteCuratedCollection(recruiterUser, curated.id);
    }).toThrow(/Unauthorized/);
  });

  it('allows administrators to toggle featured status and delete curated collections', () => {
    const created = marketplaceStore.createCuratedCollection(adminUser, {
      name: 'Temporary Showcase',
      description: 'Will be deleted in test',
      category: 'General',
      isFeatured: false,
    });

    const isFeaturedNow = marketplaceStore.toggleCuratedFeatured(adminUser, created.id);
    expect(isFeaturedNow).toBe(true);

    marketplaceStore.deleteCuratedCollection(adminUser, created.id);
    const curated = marketplaceStore.getCuratedCollections();
    expect(curated.some((c) => c.id === created.id)).toBe(false);
  });

  it('allows recruiters to clone an admin-curated collection into their private workspace', () => {
    const curated = marketplaceStore.getCuratedCollections()[0];
    const initialClones = curated.clonesCount || 0;

    const cloned = marketplaceStore.cloneCuratedCollectionForRecruiter(
      recruiterUser.id,
      curated.id
    );

    expect(cloned.id).toBeDefined();
    expect(cloned.ownerId).toBe(recruiterUser.id);
    expect(cloned.isCurated).toBe(false);
    expect(cloned.name).toContain('(Copy)');
    expect(cloned.items.length).toBe(curated.items.length);

    // Verify cloned candidates retain the curator endorsement in recruiter private notes
    if (curated.items[0]?.endorsement) {
      expect(cloned.items[0].privateNotes).toContain(curated.items[0].endorsement);
    }

    // Verify clonesCount on original curated collection was incremented
    const updatedCurated = marketplaceStore.getTalentCollection(curated.id);
    expect(updatedCurated?.clonesCount).toBe(initialClones + 1);

    // Verify it appears in recruiter's private collections
    const recruiterCols = marketplaceStore.getTalentCollections(recruiterUser.id);
    expect(recruiterCols.some((c) => c.id === cloned.id)).toBe(true);
  });

  it('filters curated collections by featured status', () => {
    const featured = marketplaceStore.getCuratedCollections(true);
    expect(featured.length).toBeGreaterThan(0);
    expect(featured.every((c) => c.isFeatured === true)).toBe(true);
  });
});
