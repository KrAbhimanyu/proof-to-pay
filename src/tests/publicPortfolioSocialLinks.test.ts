import { describe, it, expect, beforeEach } from 'vitest';
import { marketplaceStore } from '../lib/storage';
import {
  normalizeSocialUrl,
  extractSocialHandle,
  GithubIcon,
  LinkedinIcon,
  BehanceIcon,
} from '../components/pages/PublicPortfolio';
import { supabaseService } from '../lib/supabaseService';
import { User } from '../types';

describe('PublicPortfolio Social Media Links (GitHub, LinkedIn, Behance) Component Suite', () => {
  const student1: User = {
    id: 'student-1',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@dtu.ac.in',
    role: 'STUDENT',
    createdAt: '2026-08-15T10:00:00.000Z',
  };

  beforeEach(() => {
    marketplaceStore.resetToDefaults();
  });

  describe('Social URL Normalization & Handle Extraction', () => {
    it('normalizes GitHub handles and raw URLs into secure https URLs', () => {
      expect(normalizeSocialUrl('github', 'aarav-sharma')).toBe('https://github.com/aarav-sharma');
      expect(normalizeSocialUrl('github', '@aarav-sharma')).toBe('https://github.com/aarav-sharma');
      expect(normalizeSocialUrl('github', 'https://github.com/aarav-sharma')).toBe('https://github.com/aarav-sharma');
    });

    it('normalizes LinkedIn handles and raw URLs correctly', () => {
      expect(normalizeSocialUrl('linkedin', 'aarav-sharma-dev')).toBe('https://linkedin.com/in/aarav-sharma-dev');
      expect(normalizeSocialUrl('linkedin', '@aarav-sharma-dev')).toBe('https://linkedin.com/in/aarav-sharma-dev');
      expect(normalizeSocialUrl('linkedin', 'https://linkedin.com/in/aarav-sharma-dev')).toBe('https://linkedin.com/in/aarav-sharma-dev');
    });

    it('normalizes Behance handles and raw URLs correctly', () => {
      expect(normalizeSocialUrl('behance', 'aaravsharma')).toBe('https://behance.net/aaravsharma');
      expect(normalizeSocialUrl('behance', '@aaravsharma')).toBe('https://behance.net/aaravsharma');
      expect(normalizeSocialUrl('behance', 'https://behance.net/aaravsharma')).toBe('https://behance.net/aaravsharma');
    });

    it('extracts concise handles for UI badge labels', () => {
      expect(extractSocialHandle('https://github.com/aarav-sharma', 'github')).toBe('@aarav-sharma');
      expect(extractSocialHandle('https://linkedin.com/in/aarav-sharma-dev', 'linkedin')).toBe('@aarav-sharma-dev');
      expect(extractSocialHandle('https://behance.net/aaravsharma', 'behance')).toBe('@aaravsharma');
    });

    it('returns empty string when normalizing blank or null-like inputs', () => {
      expect(normalizeSocialUrl('github', '')).toBe('');
      expect(normalizeSocialUrl('github', '   ')).toBe('');
    });
  });

  describe('Profile Table Social Links Retrieval & Null Filtering', () => {
    it('retrieves non-null GitHub, LinkedIn, and Behance links from the profile table', () => {
      const profile = marketplaceStore.getStudentProfile('student-1')!;
      expect(profile).toBeDefined();

      const github = profile.githubUrl || profile.socialLinks?.find((s) => s.platform.toLowerCase() === 'github')?.url;
      const linkedin = profile.linkedinUrl || profile.socialLinks?.find((s) => s.platform.toLowerCase() === 'linkedin')?.url;
      const behance = profile.behanceUrl || profile.socialLinks?.find((s) => s.platform.toLowerCase() === 'behance')?.url;

      expect(github).toBe('https://github.com/aarav-sharma');
      expect(linkedin).toBe('https://linkedin.com/in/aarav-sharma-dev');
      expect(behance).toBe('https://behance.net/aaravsharma');
    });

    it('strictly excludes null and empty social media links', () => {
      // Update creator profile where only GitHub is provided, LinkedIn and Behance are null
      const updated = marketplaceStore.updateCreatorPortfolio(student1, 'student-1', {
        githubUrl: 'https://github.com/only-github-dev',
        linkedinUrl: null,
        behanceUrl: null,
        socialLinks: [{ platform: 'github', url: 'https://github.com/only-github-dev' }],
      });

      expect(updated.githubUrl).toBe('https://github.com/only-github-dev');
      expect(updated.linkedinUrl).toBeNull();
      expect(updated.behanceUrl).toBeNull();

      // Verify active cards filtering logic: only items with non-null URLs are returned
      const activePlatforms = [
        updated.githubUrl ? { platform: 'GitHub', url: updated.githubUrl } : null,
        updated.linkedinUrl ? { platform: 'LinkedIn', url: updated.linkedinUrl } : null,
        updated.behanceUrl ? { platform: 'Behance', url: updated.behanceUrl } : null,
      ].filter((item): item is { platform: string; url: string } => item !== null && item.url.trim().length > 0);

      expect(activePlatforms.length).toBe(1);
      expect(activePlatforms[0].platform).toBe('GitHub');
      expect(activePlatforms[0].url).toBe('https://github.com/only-github-dev');
    });

    it('supports partial social links (e.g. only LinkedIn and Behance, GitHub is null)', () => {
      const updated = marketplaceStore.updateCreatorPortfolio(student1, 'student-1', {
        githubUrl: null,
        linkedinUrl: 'https://linkedin.com/in/designer-pro',
        behanceUrl: 'https://behance.net/designer-pro',
        socialLinks: [
          { platform: 'linkedin', url: 'https://linkedin.com/in/designer-pro' },
          { platform: 'behance', url: 'https://behance.net/designer-pro' },
        ],
      });

      expect(updated.githubUrl).toBeNull();
      expect(updated.linkedinUrl).toBe('https://linkedin.com/in/designer-pro');
      expect(updated.behanceUrl).toBe('https://behance.net/designer-pro');

      const nonNullItems = [
        updated.githubUrl ? 'GitHub' : null,
        updated.linkedinUrl ? 'LinkedIn' : null,
        updated.behanceUrl ? 'Behance' : null,
      ].filter(Boolean);

      expect(nonNullItems).toEqual(['LinkedIn', 'Behance']);
      expect(nonNullItems).not.toContain('GitHub');
    });
  });

  describe('Branding & Icon Exports', () => {
    it('exports proper branded SVG icon components for GitHub, LinkedIn, and Behance', () => {
      expect(GithubIcon).toBeDefined();
      expect(typeof GithubIcon).toBe('function');

      expect(LinkedinIcon).toBeDefined();
      expect(typeof LinkedinIcon).toBe('function');

      expect(BehanceIcon).toBeDefined();
      expect(typeof BehanceIcon).toBe('function');
    });
  });

  describe('Supabase Service Social Links API Interface', () => {
    it('defines getProfileSocialLinks on supabaseService returning typed null-safe links', async () => {
      expect(typeof supabaseService.getProfileSocialLinks).toBe('function');
      const links = await supabaseService.getProfileSocialLinks('student-1');
      expect(links).toHaveProperty('github');
      expect(links).toHaveProperty('linkedin');
      expect(links).toHaveProperty('behance');
    });
  });
});
