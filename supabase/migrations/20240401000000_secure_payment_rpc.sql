-- ==============================================================================
-- PROOF-TO-PAY: Atomic Payment Confirmation RPC & RLS Hardening Migration
-- File: supabase/migrations/20240401000000_secure_payment_rpc.sql
-- Description: Adds atomic confirm_payment_receipt RPC with row-level locking,
--              transaction-authorized earnings increment, and tightens RLS
--              to prevent direct student table updates on public.project_payments.
-- ==============================================================================

-- 1. HARDEN STUDENT STATS TAMPERING TRIGGER FUNCTION
-- Allow atomic settlement RPC to update earnings/completed count via transaction-local setting
CREATE OR REPLACE FUNCTION public.prevent_student_stats_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow authorized administrative updates OR atomic settlement RPC via transaction-local setting
  IF NOT public.is_admin() AND current_setting('app.payment_settlement_authorized', true) IS DISTINCT FROM 'true' THEN
    IF NEW.average_rating IS DISTINCT FROM OLD.average_rating THEN
      RAISE EXCEPTION 'Security Error: Rating is calculated authoritatively from verified completed reviews.' USING ERRCODE = '42501';
    END IF;
    IF NEW.completed_projects_count <> OLD.completed_projects_count THEN
      RAISE EXCEPTION 'Security Error: Completed project count is computed from verified deliveries.' USING ERRCODE = '42501';
    END IF;
    IF NEW.total_earned_paise <> OLD.total_earned_paise THEN
      RAISE EXCEPTION 'Security Error: Total earnings cannot be manually adjusted.' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 2. SECURE ATOMIC PAYMENT RECEIPT CONFIRMATION RPC
CREATE OR REPLACE FUNCTION public.confirm_payment_receipt(
  p_payment_id uuid,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id uuid;
  v_caller_role public.user_role;
  v_caller_name text;
  v_payment RECORD;
  v_new_total_paise bigint;
  v_new_completed_count int;
  v_now timestamp with time zone;
BEGIN
  v_now := timezone('utc'::text, now());

  -- 1. Identity & Session verification: Never trust client-supplied identity
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated: Valid session required to confirm payment receipt' USING ERRCODE = '42501';
  END IF;

  -- 2. Verify caller profile and active status
  SELECT role, name INTO v_caller_role, v_caller_name
  FROM public.profiles
  WHERE id = v_caller_id AND is_suspended = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unauthorized: Caller profile not found or account suspended' USING ERRCODE = '42501';
  END IF;

  -- 3. Row-level locking on payment record to prevent concurrent double-credit
  SELECT * INTO v_payment
  FROM public.project_payments
  WHERE id = p_payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment record % not found', p_payment_id USING ERRCODE = 'P0002';
  END IF;

  -- 4. Authorization check: caller MUST be the assigned student creator
  IF v_payment.student_id <> v_caller_id THEN
    RAISE EXCEPTION 'Unauthorized: Caller % is not the assigned creator for payment %', v_caller_id, p_payment_id USING ERRCODE = '42501';
  END IF;

  -- 5. Status validation & dispute gating
  IF v_payment.status = 'RECEIPT_CONFIRMED_BY_CREATOR' THEN
    RAISE EXCEPTION 'Payment % has already been confirmed', p_payment_id USING ERRCODE = '23514';
  END IF;

  IF v_payment.status = 'DISPUTED' THEN
    RAISE EXCEPTION 'Payment % is in dispute and cannot be confirmed until resolution', p_payment_id USING ERRCODE = '23514';
  END IF;

  IF v_payment.status <> 'REPORTED_BY_BUSINESS' THEN
    RAISE EXCEPTION 'Payment % cannot be confirmed in current status: %', p_payment_id, v_payment.status USING ERRCODE = '23514';
  END IF;

  -- 6. Ensure student profile exists
  IF NOT EXISTS (SELECT 1 FROM public.student_profiles WHERE user_id = v_caller_id) THEN
    RAISE EXCEPTION 'Student profile not found for creator %', v_caller_id USING ERRCODE = 'P0002';
  END IF;

  -- 7. Authorize transaction-scoped stats update
  PERFORM set_config('app.payment_settlement_authorized', 'true', true);

  -- 8. Apply atomic state transition on project_payments
  UPDATE public.project_payments
  SET
    status = 'RECEIPT_CONFIRMED_BY_CREATOR',
    confirmed_by_creator_at = v_now,
    creator_notes = coalesce(p_notes, creator_notes),
    updated_at = v_now
  WHERE id = p_payment_id;

  -- 9. Authoritative earnings & completed project count mutation
  UPDATE public.student_profiles
  SET
    total_earned_paise = total_earned_paise + v_payment.amount_paise,
    completed_projects_count = completed_projects_count + 1
  WHERE user_id = v_caller_id
  RETURNING total_earned_paise, completed_projects_count INTO v_new_total_paise, v_new_completed_count;

  -- 10. Write append-only audit trail
  INSERT INTO public.audit_logs (
    actor_user_id,
    actor_name,
    actor_role,
    action,
    target_type,
    target_id,
    details,
    created_at
  ) VALUES (
    v_caller_id,
    v_caller_name,
    v_caller_role,
    'CONFIRMED_PAYMENT_RECEIPT',
    'PAYMENT',
    p_payment_id::text,
    'Creator confirmed receipt of ' || (v_payment.amount_paise / 100)::text || ' INR (Project: ' || v_payment.project_id::text || ', UTR: ' || coalesce(v_payment.utr, 'N/A') || ')',
    v_now
  );

  -- 11. Return minimal safe result
  RETURN jsonb_build_object(
    'success', true,
    'payment_id', p_payment_id,
    'project_id', v_payment.project_id,
    'status', 'RECEIPT_CONFIRMED_BY_CREATOR',
    'confirmed_at', v_now,
    'amount_paise', v_payment.amount_paise,
    'amount_inr', (v_payment.amount_paise::numeric / 100.0),
    'total_earned_inr', (v_new_total_paise::numeric / 100.0),
    'completed_projects_count', v_new_completed_count
  );
END;
$$;

-- Revoke public access and grant strictly to authenticated and service_role
REVOKE ALL ON FUNCTION public.confirm_payment_receipt(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_payment_receipt(uuid, text) TO authenticated, service_role;

-- 3. RLS POLICY HARDENING ON public.project_payments
-- Remove loose update policy that previously permitted arbitrary student table updates
DROP POLICY IF EXISTS "Parties can report and confirm payment" ON public.project_payments;
DROP POLICY IF EXISTS "Business can report payment" ON public.project_payments;

-- Replaced with narrow business UTR reporting policy
CREATE POLICY "Business can report payment" ON public.project_payments
  FOR UPDATE
  USING (business_id = auth.uid() OR public.is_admin())
  WITH CHECK (
    (business_id = auth.uid() AND status IN ('NOT_REPORTED', 'REPORTED_BY_BUSINESS')) OR
    public.is_admin()
  );
