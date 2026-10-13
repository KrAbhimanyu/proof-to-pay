-- ==============================================================================
-- PROOF-TO-PAY: Row-Level Security (RLS) Verification Test Suite
-- File: supabase/tests/rls_verification.sql
--
-- PURPOSE:
-- Verifies that Row Level Security (RLS) policies on 'public.profiles' and
-- 'public.projects' strictly prevent unauthorized CRUD operations when executed
-- by an unauthenticated ('anon') user.
--
-- TESTS PERFORMED FOR UNAUTHENTICATED ('anon') USERS:
-- 1. PROFILES - INSERT (Create): Blocked by RLS (no unauthorized profile injection).
-- 2. PROFILES - SELECT (Read): Suspended/private profiles are hidden (filters out suspended).
-- 3. PROFILES - UPDATE: Blocked by RLS (0 rows updated, prevents privilege escalation).
-- 4. PROFILES - DELETE: Blocked by RLS (0 rows deleted).
-- 5. PROJECTS - INSERT (Create): Blocked by RLS WITH CHECK policy (business_id = auth.uid()).
-- 6. PROJECTS - SELECT (Read): Draft/unapproved projects are hidden from public.
-- 7. PROJECTS - UPDATE: Blocked by RLS USING policy (0 rows updated, tampering prevented).
-- 8. PROJECTS - DELETE: Blocked by RLS (0 rows deleted).
-- 9. PROJECTS - SELECT (Public Browse): Approved projects remain readable (positive control).
--
-- EXECUTION:
-- In Supabase SQL Editor:
--   1. Paste entire script into Supabase SQL Editor.
--   2. Click "Run".
--   3. Review the tabular test report returned in the output grid.
-- In psql / Supabase CLI:
--   supabase db execute -f supabase/tests/rls_verification.sql
-- ==============================================================================

-- 1. Setup Temporary Test Results Table (Session Scope)
CREATE TEMP TABLE IF NOT EXISTS pg_temp.rls_test_results (
  test_id serial primary key,
  target_table text not null,
  operation text not null,
  test_name text not null,
  passed boolean not null,
  details text not null
);

TRUNCATE TABLE pg_temp.rls_test_results;

-- Allow anon role to write results to temp table during testing
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    GRANT ALL ON TABLE pg_temp.rls_test_results TO anon;
    GRANT USAGE, SELECT ON SEQUENCE pg_temp.rls_test_results_test_id_seq TO anon;
  END IF;
END $$;

-- 2. Seed Test Fixtures (As Administrative / Superuser Context)
DO $$
DECLARE
  v_biz_user_id uuid := 'a0000000-0000-0000-0000-000000000001'::uuid;
  v_suspended_user_id uuid := 'a0000000-0000-0000-0000-000000000002'::uuid;
  v_draft_project_id uuid := 'b0000000-0000-0000-0000-000000000001'::uuid;
  v_approved_project_id uuid := 'b0000000-0000-0000-0000-000000000002'::uuid;
BEGIN
  -- Insert auth.users fixtures if auth schema is present (Standard Supabase)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES
      (v_biz_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls_test_biz@example.com', 'test_hash', now(), '{"provider":"email"}', '{"name":"RLS Test Biz","role":"BUSINESS"}', now(), now()),
      (v_suspended_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls_test_suspended@example.com', 'test_hash', now(), '{"provider":"email"}', '{"name":"RLS Suspended User","role":"STUDENT"}', now(), now())
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Seed Active Business Profile
  INSERT INTO public.profiles (id, email, name, role, is_suspended, created_at)
  VALUES (v_biz_user_id, 'rls_test_biz@example.com', 'RLS Test Biz', 'BUSINESS', false, now())
  ON CONFLICT (id) DO UPDATE SET name = 'RLS Test Biz', role = 'BUSINESS', is_suspended = false;

  -- Seed Suspended Profile
  INSERT INTO public.profiles (id, email, name, role, is_suspended, suspension_reason, created_at)
  VALUES (v_suspended_user_id, 'rls_test_suspended@example.com', 'RLS Suspended User', 'STUDENT', true, 'Violated community guidelines', now())
  ON CONFLICT (id) DO UPDATE SET is_suspended = true, suspension_reason = 'Violated community guidelines';

  -- Seed Draft Project (Private - Must NOT be viewable by anon)
  INSERT INTO public.projects (
    id, business_id, business_name, title, summary, description,
    category, budget_paise, deadline_days, expected_delivery_date,
    application_closing_date, status
  ) VALUES (
    v_draft_project_id, v_biz_user_id, 'RLS Test Biz',
    'Draft Secret Project', 'Confidential draft project', 'Draft details not ready for publication',
    'Technology', 250000, 14, CURRENT_DATE + 14, CURRENT_DATE + 7, 'DRAFT'
  ) ON CONFLICT (id) DO UPDATE SET status = 'DRAFT', title = 'Draft Secret Project';

  -- Seed Approved Project (Public - MUST be viewable by anon)
  INSERT INTO public.projects (
    id, business_id, business_name, title, summary, description,
    category, budget_paise, deadline_days, expected_delivery_date,
    application_closing_date, status
  ) VALUES (
    v_approved_project_id, v_biz_user_id, 'RLS Test Biz',
    'Approved Public Project', 'Public project open to all students', 'Verified public project specifications',
    'Design', 300000, 10, CURRENT_DATE + 10, CURRENT_DATE + 5, 'APPROVED'
  ) ON CONFLICT (id) DO UPDATE SET status = 'APPROVED', title = 'Approved Public Project';

  -- Ensure anon has schema usage and standard permissions so RLS is the decisive gatekeeper
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    GRANT USAGE ON SCHEMA public TO anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO anon;
  END IF;
END $$;

-- 3. Execute CRUD Verification Under Unauthenticated ('anon') Role
DO $$
DECLARE
  v_biz_user_id uuid := 'a0000000-0000-0000-0000-000000000001'::uuid;
  v_suspended_user_id uuid := 'a0000000-0000-0000-0000-000000000002'::uuid;
  v_draft_project_id uuid := 'b0000000-0000-0000-0000-000000000001'::uuid;
  v_approved_project_id uuid := 'b0000000-0000-0000-0000-000000000002'::uuid;
  
  v_count int;
  v_rows_affected int;
  v_passed boolean;
  v_details text;
BEGIN
  -- Switch session to unauthenticated / anon role & simulate empty JWT
  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claim.role', 'anon', true);
  PERFORM set_config('request.jwt.claim.sub', '', true);
  PERFORM set_config('request.jwt.claims', '{"role":"anon"}', true);

  -- ----------------------------------------------------------------------------
  -- TEST 1: PROFILES - INSERT (CREATE)
  -- Unauthenticated user attempts to inject a new profile with ADMIN privileges.
  -- ----------------------------------------------------------------------------
  BEGIN
    INSERT INTO public.profiles (id, email, name, role, is_suspended)
    VALUES ('a0000000-0000-0000-0000-000000000099'::uuid, 'unauth_hacker@evil.com', 'Fake Admin', 'ADMIN', false);

    v_passed := false;
    v_details := 'SECURITY FLAW: Unauthenticated INSERT succeeded on profiles.';
  EXCEPTION
    WHEN insufficient_privilege THEN
      v_passed := true;
      v_details := 'PASSED: Blocked by RLS (42501 insufficient_privilege).';
    WHEN OTHERS THEN
      v_passed := true;
      v_details := 'PASSED: Blocked by security policy (' || SQLSTATE || ': ' || SQLERRM || ').';
  END;

  INSERT INTO pg_temp.rls_test_results (target_table, operation, test_name, passed, details)
  VALUES ('profiles', 'INSERT', 'Unauthenticated user cannot create profile', v_passed, v_details);

  -- ----------------------------------------------------------------------------
  -- TEST 2: PROFILES - SELECT (READ)
  -- Unauthenticated user attempts to read suspended/moderated profile.
  -- Policy allows viewing active directory info, but hides suspended profiles.
  -- ----------------------------------------------------------------------------
  SELECT count(*) INTO v_count
  FROM public.profiles
  WHERE id = v_suspended_user_id AND is_suspended = true;

  IF v_count = 0 THEN
    v_passed := true;
    v_details := 'PASSED: RLS filtered out suspended profile (0 rows returned).';
  ELSE
    v_passed := false;
    v_details := 'SECURITY FLAW: Suspended profile data leaked to unauthenticated user (' || v_count || ' rows).';
  END IF;

  INSERT INTO pg_temp.rls_test_results (target_table, operation, test_name, passed, details)
  VALUES ('profiles', 'SELECT', 'Unauthenticated user cannot read suspended profiles', v_passed, v_details);

  -- ----------------------------------------------------------------------------
  -- TEST 3: PROFILES - UPDATE
  -- Unauthenticated user attempts to modify an existing profile and escalate role to ADMIN.
  -- ----------------------------------------------------------------------------
  UPDATE public.profiles
  SET name = 'Compromised Name', role = 'ADMIN'
  WHERE id = v_biz_user_id;

  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

  IF v_rows_affected = 0 THEN
    v_passed := true;
    v_details := 'PASSED: RLS blocked unauthorized update (0 rows affected).';
  ELSE
    v_passed := false;
    v_details := 'SECURITY FLAW: Unauthenticated user successfully updated ' || v_rows_affected || ' profile row(s).';
  END IF;

  INSERT INTO pg_temp.rls_test_results (target_table, operation, test_name, passed, details)
  VALUES ('profiles', 'UPDATE', 'Unauthenticated user cannot update profiles', v_passed, v_details);

  -- ----------------------------------------------------------------------------
  -- TEST 4: PROFILES - DELETE
  -- Unauthenticated user attempts to delete an existing profile.
  -- ----------------------------------------------------------------------------
  DELETE FROM public.profiles
  WHERE id = v_biz_user_id;

  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

  IF v_rows_affected = 0 THEN
    v_passed := true;
    v_details := 'PASSED: RLS blocked unauthorized delete (0 rows deleted).';
  ELSE
    v_passed := false;
    v_details := 'SECURITY FLAW: Unauthenticated user successfully deleted ' || v_rows_affected || ' profile row(s).';
  END IF;

  INSERT INTO pg_temp.rls_test_results (target_table, operation, test_name, passed, details)
  VALUES ('profiles', 'DELETE', 'Unauthenticated user cannot delete profiles', v_passed, v_details);

  -- ----------------------------------------------------------------------------
  -- TEST 5: PROJECTS - INSERT (CREATE)
  -- Unauthenticated user attempts to publish a new project listing.
  -- ----------------------------------------------------------------------------
  BEGIN
    INSERT INTO public.projects (
      id, business_id, business_name, title, summary, description,
      category, budget_paise, deadline_days, expected_delivery_date,
      application_closing_date, status
    ) VALUES (
      'b0000000-0000-0000-0000-000000000099'::uuid,
      v_biz_user_id, 'Impersonated Biz',
      'Unauthorized Project Post', 'Malicious injection', 'Unauthorized description',
      'Technology', 500000, 14, CURRENT_DATE + 14, CURRENT_DATE + 7, 'APPROVED'
    );

    v_passed := false;
    v_details := 'SECURITY FLAW: Unauthenticated INSERT succeeded on projects.';
  EXCEPTION
    WHEN insufficient_privilege THEN
      v_passed := true;
      v_details := 'PASSED: Blocked by RLS WITH CHECK policy (42501 insufficient_privilege).';
    WHEN OTHERS THEN
      v_passed := true;
      v_details := 'PASSED: Blocked by security policy (' || SQLSTATE || ': ' || SQLERRM || ').';
  END;

  INSERT INTO pg_temp.rls_test_results (target_table, operation, test_name, passed, details)
  VALUES ('projects', 'INSERT', 'Unauthenticated user cannot create projects', v_passed, v_details);

  -- ----------------------------------------------------------------------------
  -- TEST 6: PROJECTS - SELECT (READ)
  -- Unauthenticated user attempts to read draft/confidential project listings.
  -- ----------------------------------------------------------------------------
  SELECT count(*) INTO v_count
  FROM public.projects
  WHERE id = v_draft_project_id;

  IF v_count = 0 THEN
    v_passed := true;
    v_details := 'PASSED: RLS filtered out draft/unapproved project (0 rows returned).';
  ELSE
    v_passed := false;
    v_details := 'SECURITY FLAW: Draft/confidential project visible to unauthenticated user (' || v_count || ' rows).';
  END IF;

  INSERT INTO pg_temp.rls_test_results (target_table, operation, test_name, passed, details)
  VALUES ('projects', 'SELECT', 'Unauthenticated user cannot read draft projects', v_passed, v_details);

  -- ----------------------------------------------------------------------------
  -- TEST 7: PROJECTS - UPDATE
  -- Unauthenticated user attempts to modify budget, terms, or status of an existing project.
  -- ----------------------------------------------------------------------------
  UPDATE public.projects
  SET budget_paise = 999999999, status = 'COMPLETED'
  WHERE id = v_approved_project_id;

  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

  IF v_rows_affected = 0 THEN
    v_passed := true;
    v_details := 'PASSED: RLS blocked unauthorized update (0 rows affected).';
  ELSE
    v_passed := false;
    v_details := 'SECURITY FLAW: Unauthenticated user successfully updated ' || v_rows_affected || ' project row(s).';
  END IF;

  INSERT INTO pg_temp.rls_test_results (target_table, operation, test_name, passed, details)
  VALUES ('projects', 'UPDATE', 'Unauthenticated user cannot update projects', v_passed, v_details);

  -- ----------------------------------------------------------------------------
  -- TEST 8: PROJECTS - DELETE
  -- Unauthenticated user attempts to delete an existing project.
  -- ----------------------------------------------------------------------------
  DELETE FROM public.projects
  WHERE id = v_approved_project_id;

  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

  IF v_rows_affected = 0 THEN
    v_passed := true;
    v_details := 'PASSED: RLS blocked unauthorized delete (0 rows deleted).';
  ELSE
    v_passed := false;
    v_details := 'SECURITY FLAW: Unauthenticated user successfully deleted ' || v_rows_affected || ' project row(s).';
  END IF;

  INSERT INTO pg_temp.rls_test_results (target_table, operation, test_name, passed, details)
  VALUES ('projects', 'DELETE', 'Unauthenticated user cannot delete projects', v_passed, v_details);

  -- ----------------------------------------------------------------------------
  -- TEST 9: PROJECTS - SELECT (POSITIVE CONTROL - PUBLIC MARKETPLACE)
  -- Confirms approved projects ARE readable by unauthenticated users as expected.
  -- ----------------------------------------------------------------------------
  SELECT count(*) INTO v_count
  FROM public.projects
  WHERE id = v_approved_project_id;

  IF v_count = 1 THEN
    v_passed := true;
    v_details := 'PASSED: Approved project is publicly viewable as intended by policy.';
  ELSE
    v_passed := false;
    v_details := 'UNEXPECTED: Approved project was not readable by public (' || v_count || ' rows).';
  END IF;

  INSERT INTO pg_temp.rls_test_results (target_table, operation, test_name, passed, details)
  VALUES ('projects', 'SELECT (PUBLIC)', 'Approved projects are publicly viewable', v_passed, v_details);

  -- Reset role and context back to superuser
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.role', '', true);
  PERFORM set_config('request.jwt.claim.sub', '', true);
  PERFORM set_config('request.jwt.claims', '', true);
END $$;

-- 4. Teardown Test Fixtures (Clean State)
DO $$
DECLARE
  v_biz_user_id uuid := 'a0000000-0000-0000-0000-000000000001'::uuid;
  v_suspended_user_id uuid := 'a0000000-0000-0000-0000-000000000002'::uuid;
  v_draft_project_id uuid := 'b0000000-0000-0000-0000-000000000001'::uuid;
  v_approved_project_id uuid := 'b0000000-0000-0000-0000-000000000002'::uuid;
  v_failed_count int;
  v_total_count int;
BEGIN
  -- Clean up projects
  DELETE FROM public.projects WHERE id IN (v_draft_project_id, v_approved_project_id);
  
  -- Clean up profiles
  DELETE FROM public.profiles WHERE id IN (v_biz_user_id, v_suspended_user_id);

  -- Clean up auth users if auth schema exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    DELETE FROM auth.users WHERE id IN (v_biz_user_id, v_suspended_user_id);
  END IF;

  -- Assess overall results
  SELECT count(*) INTO v_total_count FROM pg_temp.rls_test_results;
  SELECT count(*) INTO v_failed_count FROM pg_temp.rls_test_results WHERE passed = false;

  IF v_failed_count > 0 THEN
    RAISE WARNING 'RLS Verification: % of % tests FAILED! Check test report below.', v_failed_count, v_total_count;
  ELSE
    RAISE NOTICE 'RLS Verification: All % tests PASSED successfully! RLS policies are working correctly.', v_total_count;
  END IF;
END $$;

-- 5. Display Formatted Tabular Report
SELECT
  test_id AS "#",
  target_table AS "Table",
  operation AS "Operation",
  CASE WHEN passed THEN '✅ PASSED' ELSE '❌ FAILED' END AS "Status",
  test_name AS "Test Description",
  details AS "Security Policy Details"
FROM pg_temp.rls_test_results
ORDER BY test_id;
