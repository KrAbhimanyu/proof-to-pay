import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('PROOF-TO-PAY: Supabase Schema & Migration File Verification', () => {
  const schemaPath = path.resolve(process.cwd(), 'supabase/schema.sql');
  const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20240101000000_init_schema.sql');
  const migrationPlanPath = path.resolve(process.cwd(), 'supabase/MIGRATION_PLAN.md');

  it('ensures supabase/schema.sql, migration file, and MIGRATION_PLAN.md exist on disk', () => {
    expect(fs.existsSync(schemaPath)).toBe(true);
    expect(fs.existsSync(migrationPath)).toBe(true);
    expect(fs.existsSync(migrationPlanPath)).toBe(true);
  });

  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const migrationContent = fs.readFileSync(migrationPath, 'utf8');

  const targetFiles = [
    { name: 'supabase/schema.sql', content: schemaContent },
    { name: 'supabase/migrations/20240101000000_init_schema.sql', content: migrationContent },
  ];

  const coreTables = ['profiles', 'projects', 'reviews'];
  const allExpectedTables = [
    'profiles',
    'student_profiles',
    'business_profiles',
    'projects',
    'deliverables',
    'applications',
    'project_offers',
    'scope_change_requests',
    'submissions',
    'project_payments',
    'platform_commissions',
    'proof_passport_items',
    'reviews',
    'audit_logs',
    'disputes',
    'abuse_reports',
    'notifications',
  ];

  targetFiles.forEach(({ name, content }) => {
    describe(`Verification for ${name}`, () => {
      describe('Core Tables & Idempotent Definition', () => {
        coreTables.forEach((table) => {
          it(`defines core table public.${table} with IF NOT EXISTS`, () => {
            const regex = new RegExp(`create\\s+table\\s+if\\s+not\\s+exists\\s+public\\.${table}`, 'i');
            expect(content).toMatch(regex);
          });

          it(`enables Row Level Security on core table public.${table}`, () => {
            const regex = new RegExp(`alter\\s+table\\s+public\\.${table}\\s+enable\\s+row\\s+level\\s+security`, 'i');
            expect(content).toMatch(regex);
          });
        });

        allExpectedTables.forEach((table) => {
          it(`defines table public.${table} with IF NOT EXISTS`, () => {
            const regex = new RegExp(`create\\s+table\\s+if\\s+not\\s+exists\\s+public\\.${table}`, 'i');
            expect(content).toMatch(regex);
          });
        });
      });

      describe('Constraints on Core Tables', () => {
        it('enforces foreign key to auth.users on profiles', () => {
          expect(content).toMatch(/id\s+uuid\s+references\s+auth\.users\(id\)\s+on\s+delete\s+cascade\s+primary\s+key/i);
        });

        it('enforces financial and timing constraints on projects', () => {
          expect(content).toMatch(/budget_paise\s+bigint\s+not\s+null\s+check\s*\(budget_paise\s*>=\s*100000\)/i);
          expect(content).toMatch(/deadline_days\s+int\s+not\s+null\s+check\s*\(deadline_days\s+between\s+2\s+and\s+90\)/i);
          expect(content).toMatch(/permitted_revisions\s+int\s+not\s+null\s+default\s+2\s+check\s*\(permitted_revisions\s+between\s+1\s+and\s+5\)/i);
        });

        it('enforces 1-5 rating constraint on reviews', () => {
          expect(content).toMatch(/rating\s+int\s+not\s+null\s+check\s*\(rating\s+between\s+1\s+and\s+5\)/i);
        });
      });

      describe('Performance Indexes on Core Tables', () => {
        const requiredCoreIndexes = [
          'idx_profiles_role',
          'idx_profiles_email',
          'idx_projects_business_id',
          'idx_projects_status',
          'idx_reviews_project_id',
          'idx_reviews_target_user_id',
          'idx_reviews_reviewer_id',
        ];

        requiredCoreIndexes.forEach((indexName) => {
          it(`creates index ${indexName} with IF NOT EXISTS`, () => {
            const regex = new RegExp(`create\\s+index\\s+if\\s+not\\s+exists\\s+${indexName}`, 'i');
            expect(content).toMatch(regex);
          });
        });
      });

      describe('RLS Policies for Core Tables (Idempotent)', () => {
        it('defines idempotent policies for profiles with DROP POLICY IF EXISTS', () => {
          expect(content).toMatch(/drop\s+policy\s+if\s+exists\s+"Users can read own profile"\s+on\s+public\.profiles;/i);
          expect(content).toMatch(/create\s+policy\s+"Users can read own profile"\s+on\s+public\.profiles/i);
          expect(content).toMatch(/drop\s+policy\s+if\s+exists\s+"Users can update own basic profile"\s+on\s+public\.profiles;/i);
          expect(content).toMatch(/create\s+policy\s+"Users can update own basic profile"\s+on\s+public\.profiles/i);
        });

        it('defines idempotent policies for projects with DROP POLICY IF EXISTS', () => {
          expect(content).toMatch(/drop\s+policy\s+if\s+exists\s+"Approved projects are viewable by all"\s+on\s+public\.projects;/i);
          expect(content).toMatch(/create\s+policy\s+"Approved projects are viewable by all"\s+on\s+public\.projects/i);
          expect(content).toMatch(/drop\s+policy\s+if\s+exists\s+"Businesses can insert own projects"\s+on\s+public\.projects;/i);
          expect(content).toMatch(/create\s+policy\s+"Businesses can insert own projects"\s+on\s+public\.projects/i);
        });

        it('defines idempotent policies for reviews with DROP POLICY IF EXISTS', () => {
          expect(content).toMatch(/drop\s+policy\s+if\s+exists\s+"Reviews are publicly readable"\s+on\s+public\.reviews;/i);
          expect(content).toMatch(/create\s+policy\s+"Reviews are publicly readable"\s+on\s+public\.reviews/i);
          expect(content).toMatch(/drop\s+policy\s+if\s+exists\s+"Participants can submit review"\s+on\s+public\.reviews;/i);
          expect(content).toMatch(/create\s+policy\s+"Participants can submit review"\s+on\s+public\.reviews/i);
        });
      });

      describe('Embedded Verification Step', () => {
        it('includes an automated verification block that validates table existence and RLS', () => {
          expect(content).toContain('Migration Verification Failed');
          expect(content).toContain('Verification Succeeded');
          expect(content).toMatch(/select\s+unnest\(array\['profiles',\s*'projects',\s*'reviews'\]\)/i);
          expect(content).toContain('rowsecurity = true');
        });
      });
    });
  });
});
