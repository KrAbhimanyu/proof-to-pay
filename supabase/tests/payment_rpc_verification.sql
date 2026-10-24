-- ==============================================================================
-- PROOF-TO-PAY: Payment RPC & Settlement Security Verification Suite
-- File: supabase/tests/payment_rpc_verification.sql
-- Description: Automated PL/pgSQL verification for public.confirm_payment_receipt
--              Validates authorization, state transition, atomicity, idempotency,
--              duplicate prevention, and RLS direct-mutation resistance.
-- ==============================================================================

CREATE TEMP TABLE IF NOT EXISTS pg_temp.payment_test_results (
  id serial PRIMARY KEY,
  test_name text NOT NULL,
  expected_outcome text NOT NULL,
  passed boolean NOT NULL,
  error_code text,
  details text
);

TRUNCATE TABLE pg_temp.payment_test_results;

-- 1. SETUP FIXTURES (Disposable Synthetic UUIDs)
DO $$
DECLARE
  v_creator_id uuid := 'c0000000-0000-0000-0000-000000000001'::uuid;
  v_intruder_id uuid := 'c0000000-0000-0000-0000-000000000002'::uuid;
  v_biz_id uuid := 'b0000000-0000-0000-0000-000000000001'::uuid;
  v_proj_id uuid := 'p0000000-0000-0000-0000-000000000001'::uuid;
  v_proj_disp_id uuid := 'p0000000-0000-0000-0000-000000000002'::uuid;
  v_proj_unrep_id uuid := 'p0000000-0000-0000-0000-000000000003'::uuid;
  v_pay_id uuid := 'f0000000-0000-0000-0000-000000000001'::uuid;
  v_pay_disp_id uuid := 'f0000000-0000-0000-0000-000000000002'::uuid;
  v_pay_unrep_id uuid := 'f0000000-0000-0000-0000-000000000003'::uuid;
BEGIN
  -- Insert Profiles
  INSERT INTO public.profiles (id, email, name, role, is_suspended)
  VALUES
    (v_creator_id, 'creator.test@prooftopay.in', 'Authorized Creator', 'STUDENT', false),
    (v_intruder_id, 'intruder.test@prooftopay.in', 'Unauthorized Creator', 'STUDENT', false),
    (v_biz_id, 'business.test@prooftopay.in', 'Test Client Org', 'BUSINESS', false)
  ON CONFLICT (id) DO NOTHING;

  -- Insert Student Profiles (0 initial earnings)
  INSERT INTO public.student_profiles (user_id, headline, age, total_earned_paise, completed_projects_count)
  VALUES
    (v_creator_id, 'Full-Stack Developer', 21, 0, 0),
    (v_intruder_id, 'UI Designer', 20, 0, 0)
  ON CONFLICT (user_id) DO UPDATE SET total_earned_paise = 0, completed_projects_count = 0;

  -- Insert Projects
  INSERT INTO public.projects (id, business_id, business_name, title, description, category, budget_paise, deadline_days, expected_delivery_date, application_closing_date, status)
  VALUES
    (v_proj_id, v_biz_id, 'Test Client Org', 'Payment Audit Project', 'Production verification', 'Engineering', 1500000, 7, '2026-11-20', '2026-11-05', 'COMPLETED'),
    (v_proj_disp_id, v_biz_id, 'Test Client Org', 'Disputed Project', 'Production verification', 'Engineering', 1000000, 7, '2026-11-20', '2026-11-05', 'DISPUTED'),
    (v_proj_unrep_id, v_biz_id, 'Test Client Org', 'Unreported Project', 'Production verification', 'Engineering', 1200000, 7, '2026-11-20', '2026-11-05', 'IN_PROGRESS')
  ON CONFLICT (id) DO NOTHING;

  -- Insert Payments
  INSERT INTO public.project_payments (id, project_id, project_title, business_id, business_name, student_id, student_name, amount_paise, status, utr, payment_method)
  VALUES
    (v_pay_id, v_proj_id, 'Payment Audit Project', v_biz_id, 'Test Client Org', v_creator_id, 'Authorized Creator', 1500000, 'REPORTED_BY_BUSINESS', 'UTR-TEST-88990011', 'UPI'),
    (v_pay_disp_id, v_proj_disp_id, 'Disputed Project', v_biz_id, 'Test Client Org', v_creator_id, 'Authorized Creator', 1000000, 'DISPUTED', 'UTR-TEST-DISPUTED', 'UPI'),
    (v_pay_unrep_id, v_proj_unrep_id, 'Unreported Project', v_biz_id, 'Test Client Org', v_creator_id, 'Authorized Creator', 1200000, 'NOT_REPORTED', NULL, 'UPI')
  ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, utr = EXCLUDED.utr;
END $$;

-- 2. RUN TESTS
DO $$
DECLARE
  v_creator_id uuid := 'c0000000-0000-0000-0000-000000000001'::uuid;
  v_intruder_id uuid := 'c0000000-0000-0000-0000-000000000002'::uuid;
  v_biz_id uuid := 'b0000000-0000-0000-0000-000000000001'::uuid;
  v_pay_id uuid := 'f0000000-0000-0000-0000-000000000001'::uuid;
  v_pay_disp_id uuid := 'f0000000-0000-0000-0000-000000000002'::uuid;
  v_pay_unrep_id uuid := 'f0000000-0000-0000-0000-000000000003'::uuid;
  v_missing_pay_id uuid := 'f0000000-0000-0000-0000-000000000099'::uuid;
  v_res jsonb;
  v_earned bigint;
  v_count int;
  v_rows int;
BEGIN
  -- TEST 1: Unauthenticated caller is rejected
  PERFORM set_config('request.jwt.claim.sub', '', true);
  PERFORM set_config('role', 'anon', true);
  BEGIN
    v_res := public.confirm_payment_receipt(v_pay_id, 'Testing unauthenticated');
    INSERT INTO pg_temp.payment_test_results (test_name, expected_outcome, passed, details)
    VALUES ('Unauthenticated caller', 'Rejected with 42501', false, 'SECURITY FLAW: Function succeeded without valid session');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO pg_temp.payment_test_results (test_name, expected_outcome, passed, error_code, details)
    VALUES ('Unauthenticated caller', 'Rejected with 42501', SQLSTATE = '42501', SQLSTATE, 'PASSED: Rejected with ' || SQLSTATE);
  END;

  -- TEST 2: Different creator (intruder) cannot confirm payment
  PERFORM set_config('request.jwt.claim.sub', v_intruder_id::text, true);
  PERFORM set_config('role', 'authenticated', true);
  BEGIN
    v_res := public.confirm_payment_receipt(v_pay_id, 'Intruder confirmation attempt');
    INSERT INTO pg_temp.payment_test_results (test_name, expected_outcome, passed, details)
    VALUES ('Different creator cannot confirm', 'Rejected with 42501', false, 'SECURITY FLAW: Intruder confirmed another creator payment');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO pg_temp.payment_test_results (test_name, expected_outcome, passed, error_code, details)
    VALUES ('Different creator cannot confirm', 'Rejected with 42501', SQLSTATE = '42501', SQLSTATE, 'PASSED: Rejected with ' || SQLSTATE);
  END;

  -- TEST 3: Business user cannot confirm payment on behalf of creator
  PERFORM set_config('request.jwt.claim.sub', v_biz_id::text, true);
  PERFORM set_config('role', 'authenticated', true);
  BEGIN
    v_res := public.confirm_payment_receipt(v_pay_id, 'Business self-confirm attempt');
    INSERT INTO pg_temp.payment_test_results (test_name, expected_outcome, passed, details)
    VALUES ('Business cannot confirm', 'Rejected with 42501', false, 'SECURITY FLAW: Business user confirmed creator receipt');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO pg_temp.payment_test_results (test_name, expected_outcome, passed, error_code, details)
    VALUES ('Business cannot confirm', 'Rejected with 42501', SQLSTATE = '42501', SQLSTATE, 'PASSED: Rejected with ' || SQLSTATE);
  END;

  -- TEST 4: Missing payment ID is rejected
  PERFORM set_config('request.jwt.claim.sub', v_creator_id::text, true);
  PERFORM set_config('role', 'authenticated', true);
  BEGIN
    v_res := public.confirm_payment_receipt(v_missing_pay_id, 'Nonexistent payment');
    INSERT INTO pg_temp.payment_test_results (test_name, expected_outcome, passed, details)
    VALUES ('Missing payment ID', 'Rejected with P0002', false, 'SECURITY FLAW: Missing payment did not error');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO pg_temp.payment_test_results (test_name, expected_outcome, passed, error_code, details)
    VALUES ('Missing payment ID', 'Rejected with P0002', SQLSTATE = 'P0002', SQLSTATE, 'PASSED: Rejected with ' || SQLSTATE);
  END;

  -- TEST 5: Unreported payment (NOT_REPORTED) cannot be confirmed
  BEGIN
    v_res := public.confirm_payment_receipt(v_pay_unrep_id, 'Unreported confirmation');
    INSERT INTO pg_temp.payment_test_results (test_name, expected_outcome, passed, details)
    VALUES ('Invalid status (NOT_REPORTED)', 'Rejected with 23514', false, 'SECURITY FLAW: Confirmed unreported payment');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO pg_temp.payment_test_results (test_name, expected_outcome, passed, error_code, details)
    VALUES ('Invalid status (NOT_REPORTED)', 'Rejected with 23514', SQLSTATE = '23514', SQLSTATE, 'PASSED: Rejected with ' || SQLSTATE);
  END;

  -- TEST 6: Disputed payment (DISPUTED) cannot be confirmed
  BEGIN
    v_res := public.confirm_payment_receipt(v_pay_disp_id, 'Disputed confirmation');
    INSERT INTO pg_temp.payment_test_results (test_name, expected_outcome, passed, details)
    VALUES ('Disputed payment', 'Rejected with 23514', false, 'SECURITY FLAW: Confirmed disputed payment');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO pg_temp.payment_test_results (test_name, expected_outcome, passed, error_code, details)
    VALUES ('Disputed payment', 'Rejected with 23514', SQLSTATE = '23514', SQLSTATE, 'PASSED: Rejected with ' || SQLSTATE);
  END;

  -- TEST 7: Authorized creator successfully confirms eligible payment
  BEGIN
    v_res := public.confirm_payment_receipt(v_pay_id, 'Funds verified in HDFC account');
    SELECT total_earned_paise, completed_projects_count INTO v_earned, v_count
    FROM public.student_profiles WHERE user_id = v_creator_id;

    IF (v_res->>'success')::boolean = true AND v_earned = 1500000 AND v_count = 1 THEN
      INSERT INTO pg_temp.payment_test_results (test_name, expected_outcome, passed, details)
      VALUES ('Authorized confirmation', 'Success and exact credit of ₹15,000 INR', true, 'PASSED: State confirmed and 15,00,000 paise credited');
    ELSE
      INSERT INTO pg_temp.payment_test_results (test_name, expected_outcome, passed, details)
      VALUES ('Authorized confirmation', 'Success and exact credit of ₹15,000 INR', false, 'FAILED: Balance=' || v_earned || ', count=' || v_count);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO pg_temp.payment_test_results (test_name, expected_outcome, passed, error_code, details)
    VALUES ('Authorized confirmation', 'Success', false, SQLSTATE, 'UNEXPECTED ERROR: ' || SQLERRM);
  END;

  -- TEST 8: Duplicate confirmation attempt is rejected and does NOT double-credit
  BEGIN
    v_res := public.confirm_payment_receipt(v_pay_id, 'Duplicate confirmation attempt');
    INSERT INTO pg_temp.payment_test_results (test_name, expected_outcome, passed, details)
    VALUES ('Duplicate confirmation', 'Rejected with 23514', false, 'SECURITY FLAW: Duplicate confirmation succeeded');
  EXCEPTION WHEN OTHERS THEN
    SELECT total_earned_paise, completed_projects_count INTO v_earned, v_count
    FROM public.student_profiles WHERE user_id = v_creator_id;

    IF SQLSTATE = '23514' AND v_earned = 1500000 AND v_count = 1 THEN
      INSERT INTO pg_temp.payment_test_results (test_name, expected_outcome, passed, error_code, details)
      VALUES ('Duplicate confirmation', 'Rejected without double crediting', true, SQLSTATE, 'PASSED: Rejected with 23514, balance remained 15,00,000 paise');
    ELSE
      INSERT INTO pg_temp.payment_test_results (test_name, expected_outcome, passed, error_code, details)
      VALUES ('Duplicate confirmation', 'Rejected without double crediting', false, SQLSTATE, 'FAILED: Balance was modified to ' || v_earned);
    END IF;
  END;

  -- TEST 9: Direct unauthorized table update by student on project_payments is blocked by RLS
  UPDATE public.project_payments
  SET amount_paise = 999999999, status = 'RECEIPT_CONFIRMED_BY_CREATOR'
  WHERE id = v_pay_unrep_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF v_rows = 0 THEN
    INSERT INTO pg_temp.payment_test_results (test_name, expected_outcome, passed, details)
    VALUES ('Direct table update by student', '0 rows updated due to RLS', true, 'PASSED: RLS blocked direct client table update (0 rows affected)');
  ELSE
    INSERT INTO pg_temp.payment_test_results (test_name, expected_outcome, passed, details)
    VALUES ('Direct table update by student', '0 rows updated due to RLS', false, 'SECURITY FLAW: Student directly updated ' || v_rows || ' row(s)');
  END IF;

  -- TEST 10: Direct unauthorized table update on student_profiles to alter earnings is blocked by trigger
  BEGIN
    UPDATE public.student_profiles
    SET total_earned_paise = 999999999
    WHERE user_id = v_creator_id;
    INSERT INTO pg_temp.payment_test_results (test_name, expected_outcome, passed, details)
    VALUES ('Direct stats tampering trigger', 'Blocked by trigger', false, 'SECURITY FLAW: Direct earnings update succeeded without admin privileges');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO pg_temp.payment_test_results (test_name, expected_outcome, passed, error_code, details)
    VALUES ('Direct stats tampering trigger', 'Blocked by trigger', true, SQLSTATE, 'PASSED: Blocked by trigger (' || SQLERRM || ')');
  END;

  -- Reset role context
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
END $$;

-- 3. CLEAN TEARDOWN (Synthetic fixtures only)
DO $$
DECLARE
  v_creator_id uuid := 'c0000000-0000-0000-0000-000000000001'::uuid;
  v_intruder_id uuid := 'c0000000-0000-0000-0000-000000000002'::uuid;
  v_biz_id uuid := 'b0000000-0000-0000-0000-000000000001'::uuid;
  v_proj_id uuid := 'p0000000-0000-0000-0000-000000000001'::uuid;
  v_proj_disp_id uuid := 'p0000000-0000-0000-0000-000000000002'::uuid;
  v_proj_unrep_id uuid := 'p0000000-0000-0000-0000-000000000003'::uuid;
BEGIN
  DELETE FROM public.audit_logs WHERE actor_user_id IN (v_creator_id, v_intruder_id, v_biz_id);
  DELETE FROM public.project_payments WHERE business_id = v_biz_id;
  DELETE FROM public.projects WHERE id IN (v_proj_id, v_proj_disp_id, v_proj_unrep_id);
  DELETE FROM public.student_profiles WHERE user_id IN (v_creator_id, v_intruder_id);
  DELETE FROM public.profiles WHERE id IN (v_creator_id, v_intruder_id, v_biz_id);
END $$;
