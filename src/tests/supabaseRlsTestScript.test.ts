import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('PROOF-TO-PAY: Supabase RLS Verification SQL Test Script', () => {
  const rlsTestPath = path.resolve(process.cwd(), 'supabase/tests/rls_verification.sql');

  it('verifies supabase/tests/rls_verification.sql exists on disk', () => {
    expect(fs.existsSync(rlsTestPath)).toBe(true);
  });

  const sqlContent = fs.readFileSync(rlsTestPath, 'utf8');

  describe('Unauthenticated Role Context Simulation', () => {
    it('switches execution context to anon role and empty JWT sub', () => {
      expect(sqlContent).toMatch(/set_config\('role',\s*'anon'/i);
      expect(sqlContent).toMatch(/set_config\('request\.jwt\.claim\.role',\s*'anon'/i);
      expect(sqlContent).toMatch(/set_config\('request\.jwt\.claim\.sub',\s*''/i);
    });

    it('resets role back to administrative context after testing', () => {
      expect(sqlContent).toMatch(/reset\s+role/i);
    });
  });

  describe('CRUD Verification on public.profiles', () => {
    it('tests INSERT on profiles and validates that RLS blocks unauthorized creation', () => {
      expect(sqlContent).toMatch(/insert\s+into\s+public\.profiles/i);
      expect(sqlContent).toMatch(/insufficient_privilege/i);
      expect(sqlContent).toContain('Unauthenticated user cannot create profile');
    });

    it('tests SELECT on profiles and validates that suspended/private profiles are hidden', () => {
      expect(sqlContent).toMatch(/select\s+count\(\*\)\s+into\s+v_count\s+from\s+public\.profiles\s+where\s+id\s+=\s+v_suspended_user_id/i);
      expect(sqlContent).toContain('Unauthenticated user cannot read suspended profiles');
    });

    it('tests UPDATE on profiles and validates that 0 rows are affected', () => {
      expect(sqlContent).toMatch(/update\s+public\.profiles\s+set\s+name\s+=/i);
      expect(sqlContent).toContain('v_rows_affected = 0');
      expect(sqlContent).toContain('Unauthenticated user cannot update profiles');
    });

    it('tests DELETE on profiles and validates that 0 rows are deleted', () => {
      expect(sqlContent).toMatch(/delete\s+from\s+public\.profiles\s+where\s+id\s+=/i);
      expect(sqlContent).toContain('Unauthenticated user cannot delete profiles');
    });
  });

  describe('CRUD Verification on public.projects', () => {
    it('tests INSERT on projects and validates that RLS WITH CHECK blocks creation', () => {
      expect(sqlContent).toMatch(/insert\s+into\s+public\.projects/i);
      expect(sqlContent).toContain('Unauthenticated user cannot create projects');
      expect(sqlContent).toContain('RLS WITH CHECK policy');
    });

    it('tests SELECT on projects and validates that draft/private projects are hidden', () => {
      expect(sqlContent).toMatch(/select\s+count\(\*\)\s+into\s+v_count\s+from\s+public\.projects\s+where\s+id\s+=\s+v_draft_project_id/i);
      expect(sqlContent).toContain('Unauthenticated user cannot read draft projects');
    });

    it('tests UPDATE on projects and validates that 0 rows are affected', () => {
      expect(sqlContent).toMatch(/update\s+public\.projects\s+set\s+budget_paise\s+=/i);
      expect(sqlContent).toContain('Unauthenticated user cannot update projects');
    });

    it('tests DELETE on projects and validates that 0 rows are deleted', () => {
      expect(sqlContent).toMatch(/delete\s+from\s+public\.projects\s+where\s+id\s+=/i);
      expect(sqlContent).toContain('Unauthenticated user cannot delete projects');
    });

    it('tests positive control confirming approved projects remain publicly visible', () => {
      expect(sqlContent).toMatch(/select\s+count\(\*\)\s+into\s+v_count\s+from\s+public\.projects\s+where\s+id\s+=\s+v_approved_project_id/i);
      expect(sqlContent).toContain('Approved projects are publicly viewable');
    });
  });

  describe('Lifecycle, Teardown & Reporting', () => {
    it('cleans up seeded test fixtures', () => {
      expect(sqlContent).toMatch(/delete\s+from\s+public\.projects\s+where\s+id\s+in/i);
      expect(sqlContent).toMatch(/delete\s+from\s+public\.profiles\s+where\s+id\s+in/i);
    });

    it('returns a formatted tabular report of test results', () => {
      expect(sqlContent).toMatch(/select[\s\S]*from\s+pg_temp\.rls_test_results\s+order\s+by\s+test_id/i);
    });
  });
});
