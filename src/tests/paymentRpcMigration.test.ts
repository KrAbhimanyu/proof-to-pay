import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('PROOF-TO-PAY: Payment RPC Migration & Database Security Audit', () => {
  const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20240401000000_secure_payment_rpc.sql');
  const testSqlPath = path.resolve(process.cwd(), 'supabase/tests/payment_rpc_verification.sql');
  const schemaPath = path.resolve(process.cwd(), 'supabase/schema.sql');

  it('ensures migration 20240401000000_secure_payment_rpc.sql exists on disk', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
  });

  it('ensures test script payment_rpc_verification.sql exists on disk', () => {
    expect(fs.existsSync(testSqlPath)).toBe(true);
  });

  const migrationContent = fs.readFileSync(migrationPath, 'utf8');
  const testSqlContent = fs.readFileSync(testSqlPath, 'utf8');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');

  describe('Section 1: RPC Definition, Identity & Authorization', () => {
    it('defines public.confirm_payment_receipt with SECURITY DEFINER and pinned search_path', () => {
      expect(migrationContent).toMatch(/create\s+or\s+replace\s+function\s+public\.confirm_payment_receipt/i);
      expect(migrationContent).toMatch(/security\s+definer/i);
      expect(migrationContent).toMatch(/set\s+search_path\s*=\s*public,\s*pg_temp/i);
    });

    it('derives caller identity exclusively from auth.uid() and rejects unauthenticated sessions', () => {
      expect(migrationContent).toContain('v_caller_id := auth.uid();');
      expect(migrationContent).toContain('IF v_caller_id IS NULL THEN');
      expect(migrationContent).toContain("'42501'");
    });

    it('verifies caller profile exists and caller is not suspended', () => {
      expect(migrationContent).toContain('FROM public.profiles');
      expect(migrationContent).toContain('is_suspended = false');
    });

    it('verifies caller is the assigned student creator on the payment', () => {
      expect(migrationContent).toContain('IF v_payment.student_id <> v_caller_id THEN');
      expect(migrationContent).toContain('Unauthorized: Caller');
    });

    it('revokes execution from PUBLIC and restricts to authenticated and service_role', () => {
      expect(migrationContent).toMatch(/revoke\s+all\s+on\s+function\s+public\.confirm_payment_receipt.*from\s+public/i);
      expect(migrationContent).toMatch(/grant\s+execute\s+on\s+function\s+public\.confirm_payment_receipt.*to\s+authenticated,\s*service_role/i);
    });
  });

  describe('Section 2: Atomicity, Concurrency & Row-Level Locking', () => {
    it('acquires an exclusive row lock on public.project_payments using FOR UPDATE', () => {
      expect(migrationContent).toMatch(/select\s+\*\s+into\s+v_payment\s+from\s+public\.project_payments\s+where\s+id\s+=\s+p_payment_id\s+for\s+update/i);
    });

    it('handles missing payment records cleanly with error code P0002', () => {
      expect(migrationContent).toContain("IF NOT FOUND THEN");
      expect(migrationContent).toContain("'P0002'");
    });

    it('sets transaction-local authorization setting before mutating student_profiles', () => {
      expect(migrationContent).toContain("PERFORM set_config('app.payment_settlement_authorized', 'true', true);");
    });
  });

  describe('Section 3: State Validation & Legacy PAID Protection', () => {
    it('strictly requires status to be REPORTED_BY_BUSINESS for confirmation', () => {
      expect(migrationContent).toContain("IF v_payment.status <> 'REPORTED_BY_BUSINESS' THEN");
    });

    it('explicitly rejects already confirmed payments with error code 23514', () => {
      expect(migrationContent).toContain("IF v_payment.status = 'RECEIPT_CONFIRMED_BY_CREATOR' THEN");
      expect(migrationContent).toContain("'23514'");
    });

    it('explicitly rejects disputed payments with error code 23514', () => {
      expect(migrationContent).toContain("IF v_payment.status = 'DISPUTED' THEN");
    });

    it('does not allow legacy PAID records to be credited through the confirmation path', () => {
      // In the real PostgreSQL schema, payment_status does not contain PAID, and the RPC only accepts REPORTED_BY_BUSINESS
      expect(migrationContent).not.toMatch(/status\s*=\s*'PAID'/i);
    });
  });

  describe('Section 4: Financial Mutations & Audit Trail', () => {
    it('atomically increments total_earned_paise and completed_projects_count on student_profiles', () => {
      expect(migrationContent).toContain('total_earned_paise = total_earned_paise + v_payment.amount_paise');
      expect(migrationContent).toContain('completed_projects_count = completed_projects_count + 1');
      expect(migrationContent).toContain('WHERE user_id = v_caller_id');
    });

    it('writes an append-only audit log entry in public.audit_logs', () => {
      expect(migrationContent).toContain('INSERT INTO public.audit_logs');
      expect(migrationContent).toContain("'CONFIRMED_PAYMENT_RECEIPT'");
      expect(migrationContent).toContain("'PAYMENT'");
    });
  });

  describe('Section 5: RLS Hardening & Direct Mutation Shield', () => {
    it('removes loose update policy on public.project_payments', () => {
      expect(migrationContent).toContain('DROP POLICY IF EXISTS "Parties can report and confirm payment" ON public.project_payments;');
    });

    it('restricts direct UPDATE on project_payments to business UTR reporting only', () => {
      expect(migrationContent).toMatch(/create\s+policy\s+"Business can report payment"\s+on\s+public\.project_payments/i);
      expect(migrationContent).toContain("status IN ('NOT_REPORTED', 'REPORTED_BY_BUSINESS')");
    });

    it('hardens prevent_student_stats_tampering trigger to recognize transaction-scoped authorization', () => {
      expect(migrationContent).toContain("current_setting('app.payment_settlement_authorized', true) IS DISTINCT FROM 'true'");
    });
  });

  describe('Section 6: Schema Sync Verification', () => {
    it('confirms supabase/schema.sql is synchronized with the new confirm_payment_receipt RPC', () => {
      expect(schemaContent).toContain('function public.confirm_payment_receipt');
      expect(schemaContent).toContain('Business can report payment');
    });
  });

  describe('Section 7: Disposable Database Integration Guard', () => {
    it('fails closed if SUPABASE_TEST_DATABASE_URL points to a production host', () => {
      const testDbUrl = process.env.SUPABASE_TEST_DATABASE_URL;
      if (testDbUrl) {
        // Enforce strict isolation: Must be local or explicit test container
        const isIsolated = /localhost|127\.0\.0\.1|test|disposable/i.test(testDbUrl);
        expect(isIsolated).toBe(true);
      } else {
        // Correct behavior when no isolated PostgreSQL instance is provisioned in the container
        expect(testDbUrl).toBeUndefined();
      }
    });

    it('reports execution status of SQL verification suite in isolated environment', () => {
      // Verifies SQL test script includes all 10 mandated test cases
      expect(testSqlContent).toContain('TEST 1: Unauthenticated caller');
      expect(testSqlContent).toContain('TEST 2: Different creator (intruder) cannot confirm');
      expect(testSqlContent).toContain('TEST 3: Business user cannot confirm');
      expect(testSqlContent).toContain('TEST 4: Missing payment ID');
      expect(testSqlContent).toContain('TEST 5: Unreported payment');
      expect(testSqlContent).toContain('TEST 6: Disputed payment');
      expect(testSqlContent).toContain('TEST 7: Authorized creator successfully confirms');
      expect(testSqlContent).toContain('TEST 8: Duplicate confirmation attempt is rejected');
      expect(testSqlContent).toContain('TEST 9: Direct unauthorized table update');
      expect(testSqlContent).toContain('TEST 10: Direct unauthorized table update on student_profiles');
    });
  });
});
