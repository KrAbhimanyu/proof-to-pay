import { describe, it, expect, beforeEach } from 'vitest';
import { marketplaceStore } from '../lib/storage';
import { PaymentRecord, User } from '../types';

describe('PaymentHistory Component & Data Layer Test Suite', () => {
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

  it('fetches student payments correctly for student-1', () => {
    const payments = marketplaceStore.getPayments().filter((p) => p.studentId === studentUser.id);
    expect(payments.length).toBeGreaterThan(0);
    expect(payments[0].projectTitle).toContain('Landing Page');
    expect(payments[0].amountINR).toBe(15000);
    expect(payments[0].paymentMethod).toBe('UPI');
  });

  it('calculates cleared versus pending payout metrics accurately', () => {
    const studentPayments = marketplaceStore.getPayments().filter((p) => p.studentId === studentUser.id);
    let cleared = 0;
    let pending = 0;

    studentPayments.forEach((p) => {
      const isConfirmed = p.status === 'RECEIPT_CONFIRMED_BY_CREATOR' || !!p.confirmedAt;
      const isPending = (p.status === 'REPORTED_BY_BUSINESS' || p.status === 'PAID') && !p.confirmedAt;

      if (isConfirmed) cleared += p.amountINR;
      else if (isPending) pending += p.amountINR;
    });

    expect(cleared + pending).toBeGreaterThanOrEqual(15000);
  });

  it('verifies bank UTR references are present and traceable on payments', () => {
    const studentPayments = marketplaceStore.getPayments().filter((p) => p.studentId === studentUser.id);
    const paidPayment = studentPayments.find((p) => p.transactionReferenceUTR);
    expect(paidPayment).toBeDefined();
    expect(paidPayment?.transactionReferenceUTR).toMatch(/UTR-/);
  });

  it('updates payment status when student confirms receipt', () => {
    const studentPayments = marketplaceStore.getPayments().filter((p) => p.studentId === studentUser.id);
    const target = studentPayments[0];

    // Confirm receipt
    marketplaceStore.confirmProjectPaymentReceipt(studentUser, target.projectId);

    const updated = marketplaceStore.getPayments().find((p) => p.id === target.id);
    expect(updated?.status).toBe('RECEIPT_CONFIRMED_BY_CREATOR');
    expect(updated?.confirmedAt).toBeDefined();
    expect(updated?.confirmedByUserId).toBe(studentUser.id);
  });

  it('allows filing a dispute when business payment has discrepancies', () => {
    // Add a test pending payment
    const newPayment: PaymentRecord = {
      id: 'pay-test-dispute',
      projectId: 'proj-1',
      projectTitle: 'Brand Identity Design',
      businessId: 'business-1',
      studentId: studentUser.id,
      amountINR: 8000,
      status: 'REPORTED_BY_BUSINESS',
      paymentMethod: 'UPI',
      transactionReferenceUTR: 'UTR-TEST-12345',
      recordedByUserId: 'business-1',
      recordedAt: new Date().toISOString(),
    };

    marketplaceStore['set']('ptp_payments', [newPayment, ...marketplaceStore.getPayments()]);

    // Dispute payment
    marketplaceStore.disputeProjectPayment(studentUser, 'proj-1', 'Invalid UTR reference, funds not credited');

    const updated = marketplaceStore.getPayments().find((p) => p.id === 'pay-test-dispute');
    expect(updated?.status).toBe('DISPUTED');
    expect(updated?.disputeReason).toContain('Invalid UTR reference');
  });

  describe('Color-Coded Status Badges Logic', () => {
    it('returns green badge styling and "Paid" label for paid/cleared payments', async () => {
      const { getPaymentStatusBadge } = await import('../components/common/PaymentHistory');
      
      const paidResult = getPaymentStatusBadge('PAID', false);
      expect(paidResult.category).toBe('PAID');
      expect(paidResult.label).toBe('Paid');
      expect(paidResult.badgeClasses).toContain('bg-emerald-50');
      expect(paidResult.badgeClasses).toContain('text-emerald-700');
      expect(paidResult.dotColor).toContain('bg-emerald-500');

      const confirmedResult = getPaymentStatusBadge('REPORTED_BY_BUSINESS', true);
      expect(confirmedResult.category).toBe('PAID');
      expect(confirmedResult.label).toBe('Paid');
      expect(confirmedResult.detail).toContain('Cleared');
    });

    it('returns amber badge styling and "Pending" label for pending payments', async () => {
      const { getPaymentStatusBadge } = await import('../components/common/PaymentHistory');

      const pendingResult = getPaymentStatusBadge('PENDING', false);
      expect(pendingResult.category).toBe('PENDING');
      expect(pendingResult.label).toBe('Pending');
      expect(pendingResult.badgeClasses).toContain('bg-amber-50');
      expect(pendingResult.badgeClasses).toContain('text-amber-800');
      expect(pendingResult.dotColor).toContain('bg-amber-500');

      const reportedResult = getPaymentStatusBadge('REPORTED_BY_BUSINESS', false);
      expect(reportedResult.category).toBe('PENDING');
      expect(reportedResult.label).toBe('Pending');
    });

    it('returns red badge styling and "Failed" label for failed or disputed payments', async () => {
      const { getPaymentStatusBadge } = await import('../components/common/PaymentHistory');

      const failedResult = getPaymentStatusBadge('FAILED', false);
      expect(failedResult.category).toBe('FAILED');
      expect(failedResult.label).toBe('Failed');
      expect(failedResult.badgeClasses).toContain('bg-rose-50');
      expect(failedResult.badgeClasses).toContain('text-rose-700');
      expect(failedResult.dotColor).toContain('bg-rose-500');

      const disputedResult = getPaymentStatusBadge('DISPUTED', false);
      expect(disputedResult.category).toBe('FAILED');
      expect(disputedResult.label).toBe('Failed');
      expect(disputedResult.detail).toContain('Disputed');
    });
  });
});
