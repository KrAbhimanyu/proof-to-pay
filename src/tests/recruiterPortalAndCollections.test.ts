import { describe, it, expect, beforeEach } from 'vitest';
import { marketplaceStore } from '../lib/storage';
import { RecruiterRegistrationSchema, TalentCollectionSchema } from '../lib/schemas';
import { User, TalentCollection, RecruiterProfile } from '../types';

describe('Recruiter Portal & Talent Collections Capabilities', () => {
  beforeEach(() => {
    marketplaceStore.resetToDefaults();
  });

  it('validates recruiter registration data using RecruiterRegistrationSchema', () => {
    const validData = {
      name: 'Rhea Sengupta',
      email: 'rhea@talentfoundry.in',
      password: 'StrongPassword123!',
      companyName: 'TalentFoundry Tech Partners',
      designation: 'Principal Tech Recruiter',
      industry: 'Technical Staffing',
      hiringDomains: ['Frontend / React', 'Mobile (Android)', 'UI/UX Design'],
      referralCode: 'AARAV2026'
    };

    const result = RecruiterRegistrationSchema.safeParse(validData);
    expect(result.success).toBe(true);

    const invalidData = {
      ...validData,
      password: 'short', // must be 8+
    };
    const invalidResult = RecruiterRegistrationSchema.safeParse(invalidData);
    expect(invalidResult.success).toBe(false);
  });

  it('validates talent collection creation using TalentCollectionSchema', () => {
    const validCol = {
      name: 'Top React Devs',
      description: 'Senior candidate prospects for Q4 contracts',
      color: 'indigo'
    };
    const result = TalentCollectionSchema.safeParse(validCol);
    expect(result.success).toBe(true);

    const invalidCol = {
      name: 'AB', // too short, min 3
      color: 'invalid-color'
    };
    const invalidResult = TalentCollectionSchema.safeParse(invalidCol);
    expect(invalidResult.success).toBe(false);
  });

  it('fetches existing default recruiter profiles from marketplaceStore', () => {
    const recruiter = marketplaceStore.getRecruiterProfile('recruiter-1');
    expect(recruiter).not.toBeNull();
    expect(recruiter?.companyName).toBe('TalentFoundry Tech Partners');
    expect(recruiter?.verificationStatus).toBe('VERIFIED');
    expect(recruiter?.hiringDomains).toContain('Frontend / React');
  });

  it('creates and manages talent collections', () => {
    const newCol = marketplaceStore.createTalentCollection(
      'recruiter-1',
      'AI & ML Specialists',
      'Candidates with Python and PyTorch experience',
      'emerald'
    );

    expect(newCol.id).toBeDefined();
    expect(newCol.name).toBe('AI & ML Specialists');
    expect(newCol.ownerId).toBe('recruiter-1');
    expect(newCol.items).toHaveLength(0);

    const collections = marketplaceStore.getTalentCollections('recruiter-1');
    expect(collections.some((c) => c.name === 'AI & ML Specialists')).toBe(true);
  });

  it('adds creator to collection with private recruiter notes and tags', () => {
    const col = marketplaceStore.createTalentCollection(
      'recruiter-1',
      'Design Systems Engineers',
      'Figma to React pros'
    );

    const item = marketplaceStore.addCreatorToCollection(
      col.id,
      'student-1',
      'Candidate demonstrated outstanding component architecture',
      ['React', 'Design Systems', 'Top Rated']
    );

    expect(item.creatorId).toBe('student-1');
    expect(item.privateNotes).toContain('outstanding component architecture');
    expect(item.tags).toContain('Design Systems');

    // Retrieve collection and verify candidate item exists
    const updatedCol = marketplaceStore.getTalentCollection(col.id);
    expect(updatedCol?.items).toHaveLength(1);
    expect(updatedCol?.items[0].creatorId).toBe('student-1');
  });

  it('updates candidate private notes inside a collection without modifying student profile', () => {
    const collections = marketplaceStore.getTalentCollections('recruiter-1');
    const firstCol = collections[0];
    expect(firstCol).toBeDefined();

    marketplaceStore.updateCollectionItemNotes(
      firstCol.id,
      'student-1',
      'Updated note: Completed initial technical screening with flying colors.'
    );

    const refreshed = marketplaceStore.getTalentCollection(firstCol.id);
    const candidateItem = refreshed?.items.find((i) => i.creatorId === 'student-1');
    expect(candidateItem?.privateNotes).toBe(
      'Updated note: Completed initial technical screening with flying colors.'
    );

    // Creator's actual student profile remains clean and unaffected
    const studentProfile = marketplaceStore.getStudentProfile('student-1');
    expect(studentProfile?.headline).toBeDefined();
  });

  it('removes candidate from collection', () => {
    const col = marketplaceStore.createTalentCollection('recruiter-1', 'Temporary Roster', 'For testing removal');
    marketplaceStore.addCreatorToCollection(col.id, 'student-1', 'Test note');
    marketplaceStore.addCreatorToCollection(col.id, 'student-2', 'Test note 2');

    let refreshed = marketplaceStore.getTalentCollection(col.id);
    expect(refreshed?.items).toHaveLength(2);

    marketplaceStore.removeCreatorFromCollection(col.id, 'student-1');
    refreshed = marketplaceStore.getTalentCollection(col.id);
    expect(refreshed?.items).toHaveLength(1);
    expect(refreshed?.items[0].creatorId).toBe('student-2');
  });

  it('deletes collection and decrements active collections count', () => {
    const col = marketplaceStore.createTalentCollection('recruiter-1', 'Delete Target', 'To be deleted');
    const initialCount = marketplaceStore.getTalentCollections('recruiter-1').length;

    marketplaceStore.deleteTalentCollection(col.id);
    const afterCount = marketplaceStore.getTalentCollections('recruiter-1').length;
    expect(afterCount).toBe(initialCount - 1);
  });
});
