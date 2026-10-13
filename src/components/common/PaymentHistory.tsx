import React, { useState, useEffect, useMemo } from 'react';
import { PaymentRecord, ProjectListing, User } from '../../types';
import { marketplaceStore } from '../../lib/storage';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  Search,
  Filter,
  Download,
  ArrowUpRight,
  ShieldCheck,
  Receipt,
  Building2,
  FileText,
  RotateCw,
  ExternalLink,
  ChevronDown,
  X
} from 'lucide-react';

interface PaymentHistoryProps {
  studentId: string;
  onConfirmReceipt?: (projectId: string) => void;
  onDisputePayment?: (projectId: string) => void;
  className?: string;
  limit?: number;
}

export interface PaymentStatusBadgeConfig {
  category: 'PAID' | 'PENDING' | 'FAILED';
  label: 'Paid' | 'Pending' | 'Failed';
  detail: string;
  badgeClasses: string;
  dotColor: string;
}

/**
 * Returns color-coded status badge configuration:
 * - Green for 'Paid'
 * - Amber for 'Pending'
 * - Red for 'Failed'
 */
export function getPaymentStatusBadge(
  status: string,
  isConfirmed: boolean = false
): PaymentStatusBadgeConfig {
  const norm = (status || '').toUpperCase();

  // Red for 'Failed' / 'Disputed' / 'Cancelled'
  if (
    norm === 'FAILED' ||
    norm === 'DISPUTED' ||
    norm === 'CANCELLED' ||
    norm === 'REJECTED'
  ) {
    return {
      category: 'FAILED',
      label: 'Failed',
      detail: norm === 'DISPUTED' ? 'Disputed' : 'Failed',
      badgeClasses:
        'bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800',
      dotColor: 'bg-rose-500',
    };
  }

  // Green for 'Paid'
  if (
    isConfirmed ||
    norm === 'PAID' ||
    norm === 'RECEIPT_CONFIRMED_BY_CREATOR' ||
    norm === 'CLEARED' ||
    norm === 'COMPLETED'
  ) {
    return {
      category: 'PAID',
      label: 'Paid',
      detail: isConfirmed ? 'Cleared & Verified' : 'Settlement Paid',
      badgeClasses:
        'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800',
      dotColor: 'bg-emerald-500',
    };
  }

  // Amber for 'Pending'
  return {
    category: 'PENDING',
    label: 'Pending',
    detail: norm === 'REPORTED_BY_BUSINESS' ? 'Verification Needed' : 'Awaiting Payment',
    badgeClasses:
      'bg-amber-50 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800',
    dotColor: 'bg-amber-500',
  };
}

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({
  studentId,
  onConfirmReceipt,
  onDisputePayment,
  className = '',
  limit,
}) => {
  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    try {
      const allPayments = marketplaceStore.getPayments() || [];
      const studentPayments = allPayments.filter((p) => p.studentId === studentId);
      return studentPayments.sort((a, b) => {
        const dateA = new Date(a.recordedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.recordedAt || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'FAILED'>('ALL');
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);

  // Fetch payments for the student
  const fetchPayments = () => {
    setIsLoading(true);
    try {
      const allPayments = marketplaceStore.getPayments() || [];
      const studentPayments = allPayments.filter((p) => p.studentId === studentId);
      // Sort newest first
      studentPayments.sort((a, b) => {
        const dateA = new Date(a.recordedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.recordedAt || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      setPayments(studentPayments);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [studentId]);

  // Lookup businesses and projects for enriched display
  const projectsMap = useMemo(() => {
    const list = marketplaceStore.getProjects() || [];
    const map = new Map<string, ProjectListing>();
    list.forEach((p) => map.set(p.id, p));
    return map;
  }, []);

  const usersMap = useMemo(() => {
    const list = marketplaceStore.getUsers() || [];
    const map = new Map<string, User>();
    list.forEach((u) => map.set(u.id, u));
    return map;
  }, []);

  // Filtered payments
  const filteredPayments = useMemo(() => {
    const q = (searchQuery || '').toLowerCase();
    return payments.filter((pay) => {
      const title = (pay.projectTitle || '').toLowerCase();
      const utr = (pay.transactionReferenceUTR || '').toLowerCase();
      const method = (pay.paymentMethod || '').toLowerCase();

      const matchesSearch = title.includes(q) || utr.includes(q) || method.includes(q);

      if (!matchesSearch) return false;

      const isConfirmed = pay.status === 'RECEIPT_CONFIRMED_BY_CREATOR' || !!pay.confirmedAt;
      const badge = getPaymentStatusBadge(pay.status, isConfirmed);

      if (statusFilter === 'PAID') return badge.category === 'PAID';
      if (statusFilter === 'PENDING') return badge.category === 'PENDING';
      if (statusFilter === 'FAILED') return badge.category === 'FAILED';

      return true;
    });
  }, [payments, searchQuery, statusFilter]);

  const displayedPayments = limit ? filteredPayments.slice(0, limit) : filteredPayments;

  // Calculation Metrics
  const metrics = useMemo(() => {
    let paidTotal = 0;
    let pendingTotal = 0;
    let failedTotal = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let failedCount = 0;

    payments.forEach((p) => {
      const isConfirmed = p.status === 'RECEIPT_CONFIRMED_BY_CREATOR' || !!p.confirmedAt;
      const badge = getPaymentStatusBadge(p.status, isConfirmed);
      const amount = Number(p.amountINR) || 0;

      if (badge.category === 'PAID') {
        paidTotal += amount;
        paidCount++;
      } else if (badge.category === 'PENDING') {
        pendingTotal += amount;
        pendingCount++;
      } else if (badge.category === 'FAILED') {
        failedTotal += amount;
        failedCount++;
      }
    });

    return {
      cleared: paidTotal,
      pending: pendingTotal,
      disputed: failedTotal,
      paidCount,
      pendingCount,
      failedCount,
      count: payments.length,
    };
  }, [payments]);

  // Copy UTR to clipboard
  const handleCopyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  // CSV Export
  const handleExportCsv = () => {
    if (payments.length === 0) return;
    const headers = ['Transaction ID', 'Project Title', 'Client Name', 'Amount (INR)', 'Method', 'UTR / Reference', 'Status', 'Recorded Date'];
    const rows = payments.map((p) => {
      const project = projectsMap.get(p.projectId);
      const client = usersMap.get(p.businessId);
      return [
        p.id,
        `"${p.projectTitle.replace(/"/g, '""')}"`,
        `"${(client?.name || project?.businessName || 'Business Client').replace(/"/g, '""')}"`,
        p.amountINR,
        p.paymentMethod,
        p.transactionReferenceUTR || 'N/A',
        p.status,
        p.recordedAt || p.createdAt || 'N/A',
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ProofToPay_Payments_${studentId}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`space-y-5 ${className}`}>
      {/* 1. Header & Financial Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Cleared & Confirmed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            ₹{metrics.cleared.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            100% net creator payout without commission deductions
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Awaiting Confirmation</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            ₹{metrics.pending.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Reported by business with UTR, awaiting your receipt verify
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Total Transactions</span>
            <ShieldCheck className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {metrics.count} <span className="text-xs font-semibold text-slate-400 font-sans">records</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Traceable UPI & NEFT payment audit logs
          </p>
        </div>
      </div>

      {/* 2. Search, Filters, and Table Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by project title, UTR reference, or method..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Badges & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg transition ${
                statusFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({metrics.count})
            </button>
            <button
              onClick={() => setStatusFilter('PAID')}
              className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1.5 ${
                statusFilter === 'PAID'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-emerald-600'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Paid ({metrics.paidCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1.5 ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-amber-600'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Pending ({metrics.pendingCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('FAILED')}
              className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1.5 ${
                statusFilter === 'FAILED'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-rose-600'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Failed ({metrics.failedCount})</span>
            </button>
          </div>

          <button
            onClick={fetchPayments}
            title="Refresh transactions"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-500' : ''}`} />
          </button>

          <button
            onClick={handleExportCsv}
            disabled={payments.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* 3. Transaction Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Project & Client</th>
                <th className="py-3.5 px-4">Method</th>
                <th className="py-3.5 px-4">UTR / Bank Reference</th>
                <th className="py-3.5 px-4 text-right">Amount (INR)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {displayedPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600 stroke-[1.5]" />
                    <div className="font-semibold text-slate-700 dark:text-slate-300 text-sm">No transaction records found</div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {searchQuery
                        ? 'Try modifying your search or clearing the status filter.'
                        : 'Transactions appear here once clients report direct payments for completed milestones.'}
                    </p>
                  </td>
                </tr>
              ) : (
                displayedPayments.map((pay) => {
                  const project = projectsMap.get(pay.projectId);
                  const client = usersMap.get(pay.businessId);
                  const isConfirmed = pay.status === 'RECEIPT_CONFIRMED_BY_CREATOR' || !!pay.confirmedAt;
                  const isPending = (pay.status === 'REPORTED_BY_BUSINESS' || pay.status === 'PAID') && !pay.confirmedAt;
                  const isDisputed = pay.status === 'DISPUTED';
                  const badge = getPaymentStatusBadge(pay.status, isConfirmed);

                  const recordDate = pay.recordedAt || pay.createdAt;
                  const formattedDate = recordDate
                    ? new Date(recordDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Recent';

                  return (
                    <tr
                      key={pay.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        <div className="font-semibold">{formattedDate}</div>
                        <div className="text-[10px] text-slate-400">
                          {recordDate ? new Date(recordDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </td>

                      {/* Project & Client */}
                      <td className="py-3.5 px-4 min-w-[220px]">
                        <div className="font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {pay.projectTitle}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{client?.name || project?.businessName || 'Verified Client'}</span>
                        </div>
                      </td>

                      {/* Method */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold border border-slate-200 dark:border-slate-700">
                          {pay.paymentMethod === 'UPI' ? '⚡ UPI' : pay.paymentMethod === 'NEFT_IMPS' ? '🏦 IMPS/NEFT' : '💳 Bank'}
                        </span>
                      </td>

                      {/* UTR Reference */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {pay.transactionReferenceUTR ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] font-medium text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                              {pay.transactionReferenceUTR}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyUtr(pay.transactionReferenceUTR!)}
                              title="Copy UTR number"
                              className="p-1 rounded text-slate-400 hover:text-emerald-600 transition"
                            >
                              {copiedUtr === pay.transactionReferenceUTR ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Pending UTR</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="font-extrabold text-sm text-slate-900 dark:text-white font-mono">
                          ₹{pay.amountINR.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          0% Fee Deducted
                        </div>
                      </td>

                      {/* Status: Color-Coded Status Badges (Green for 'Paid', Amber for 'Pending', Red for 'Failed') */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-tight shadow-2xs ${badge.badgeClasses}`}
                          title={`Status: ${badge.label} (${badge.detail})`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${badge.dotColor} ${
                              badge.category === 'PENDING' ? 'animate-pulse' : ''
                            }`}
                          />
                          {badge.category === 'PAID' && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          )}
                          {badge.category === 'PENDING' && (
                            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                          )}
                          {badge.category === 'FAILED' && (
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                          )}
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && onConfirmReceipt && (
                            <button
                              type="button"
                              onClick={() => onConfirmReceipt(pay.projectId)}
                              className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition shadow-xs"
                            >
                              Confirm
                            </button>
                          )}

                          {isPending && onDisputePayment && (
                            <button
                              type="button"
                              onClick={() => onDisputePayment(pay.projectId)}
                              className="px-2 py-1 rounded-xl border border-rose-200 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-medium text-[11px] transition"
                            >
                              Dispute
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedReceipt(pay)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="View receipt details"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Color-Coded Status Legend & Counters */}
        <div className="bg-slate-50/70 dark:bg-slate-800/40 px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-bold text-slate-700 dark:text-slate-300">Status Legend:</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Paid (Green)</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Pending (Amber)</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Failed / Disputed (Red)</span>
            </span>
          </div>
          <div className="text-[10px] text-slate-400">
            Showing {displayedPayments.length} of {payments.length} transactions
          </div>
        </div>
      </div>

      {/* 4. Detailed Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Transaction Settlement Receipt</h3>
                  <p className="text-xs text-slate-400 font-mono">ID: {selectedReceipt.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Receipt Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Agreed Project</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white text-right max-w-[240px] truncate">
                  {selectedReceipt.projectTitle}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Settlement Amount</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  ₹{selectedReceipt.amountINR.toLocaleString('en-IN')} INR
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Payment Channel</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {selectedReceipt.paymentMethod}
                </span>
              </div>

              {selectedReceipt.transactionReferenceUTR && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Bank Reference (UTR)</span>
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-900 dark:text-white">
                    <span>{selectedReceipt.transactionReferenceUTR}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyUtr(selectedReceipt.transactionReferenceUTR!)}
                      className="p-0.5 text-slate-400 hover:text-emerald-600"
                    >
                      {copiedUtr === selectedReceipt.transactionReferenceUTR ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {selectedReceipt.notes && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Client Note:</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic">{selectedReceipt.notes}</p>
                </div>
              )}
            </div>

            {/* Proof Guarantee Notice */}
            <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Zero Commission Policy:</strong> 100% of the project budget is disbursed directly to your bank/UPI without deductions.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
