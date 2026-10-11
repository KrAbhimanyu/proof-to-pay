import React, { useState } from 'react';
import { WorkTrailEvent, WorkTrailEventType, ProjectListing, User } from '../../types';
import { marketplaceStore } from '../../lib/storage';
import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Lock,
  RotateCcw,
  IndianRupee,
  Building,
  UserCheck,
  FileSpreadsheet,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Props {
  projectId: string;
  currentUser?: User | null;
  onClose?: () => void;
}

export const WorkTrail: React.FC<Props> = ({ projectId, currentUser, onClose }) => {
  const [filter, setFilter] = useState<'ALL' | 'SCOPE' | 'SUBMISSIONS' | 'PAYMENTS'>('ALL');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const project = marketplaceStore.getProject(projectId);
  const events = marketplaceStore.getWorkTrail(projectId);

  const filteredEvents = events.filter((e) => {
    if (filter === 'ALL') return true;
    if (filter === 'SCOPE') {
      return (
        e.eventType === 'PROJECT_CREATED' ||
        e.eventType === 'OFFER_EXTENDED' ||
        e.eventType === 'SCOPE_LOCKED_ACCEPTED' ||
        e.eventType === 'SCOPE_CHANGE_REQUESTED' ||
        e.eventType === 'SCOPE_CHANGE_ACCEPTED' ||
        e.eventType === 'SCOPE_CHANGE_REJECTED'
      );
    }
    if (filter === 'SUBMISSIONS') {
      return (
        e.eventType === 'APPLICATION_SUBMITTED' ||
        e.eventType === 'DELIVERABLE_SUBMITTED' ||
        e.eventType === 'REVISION_REQUESTED' ||
        e.eventType === 'DELIVERABLES_APPROVED'
      );
    }
    if (filter === 'PAYMENTS') {
      return (
        e.eventType === 'PROJECT_PAYMENT_REPORTED' ||
        e.eventType === 'PROJECT_PAYMENT_CONFIRMED' ||
        e.eventType === 'PROJECT_PAYMENT_DISPUTED' ||
        e.eventType === 'PLATFORM_FEE_DUE' ||
        e.eventType === 'PLATFORM_FEE_REPORTED' ||
        e.eventType === 'PLATFORM_FEE_VERIFIED'
      );
    }
    return true;
  });

  const getEventBadge = (type: WorkTrailEventType) => {
    switch (type) {
      case 'SCOPE_LOCKED_ACCEPTED':
        return {
          icon: <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
          color: 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300',
          label: 'Scope Locked',
        };
      case 'SCOPE_CHANGE_ACCEPTED':
        return {
          icon: <RotateCcw className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
          color: 'bg-indigo-100 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-800 dark:text-indigo-300',
          label: 'Scope Updated',
        };
      case 'DELIVERABLES_APPROVED':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />,
          color: 'bg-teal-100 dark:bg-teal-950/60 border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-300',
          label: 'Deliverables Approved',
        };
      case 'PROJECT_PAYMENT_CONFIRMED':
        return {
          icon: <IndianRupee className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
          color: 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300',
          label: 'Payment Confirmed',
        };
      case 'PLATFORM_FEE_VERIFIED':
        return {
          icon: <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
          color: 'bg-blue-100 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300',
          label: 'Admin Fee Verified',
        };
      case 'PROJECT_PAYMENT_REPORTED':
      case 'PLATFORM_FEE_REPORTED':
        return {
          icon: <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
          color: 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300',
          label: 'Evidence Submitted (Unverified)',
        };
      case 'PROJECT_PAYMENT_DISPUTED':
      case 'DISPUTE_RAISED':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
          color: 'bg-rose-100 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-300',
          label: 'Disputed',
        };
      default:
        return {
          icon: <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />,
          color: 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-300',
          label: 'Audit Trail',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Distinction Principle Banner */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400">
                <Clock className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Work Trail — Chronological Project History
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Immutable timeline documenting application, scope lock, deliverables, client review cycles, and separate dual financial records.
            </p>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="self-start sm:self-auto px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Close Trail
            </button>
          )}
        </div>

        {/* Core Differentiation Rule Banner */}
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <div className="font-bold text-amber-900 dark:text-amber-300">
              Platform Integrity Rule: Deliverables Completed ≠ Payment Confirmed
            </div>
            <p className="text-amber-800 dark:text-amber-400 leading-relaxed">
              In Proof-to-Pay, project deliverable sign-off is tracked separately from payment receipt confirmation. A bank reference or UTR is merely evidence under review, never automatic proof of settled funds. Business-to-creator payment requires creator receipt confirmation; platform commissions require authorized administrative bank reconciliation.
            </p>
          </div>
        </div>

        {/* Dual Financial Ledger Summary Pill Strip */}
        {project && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Record A: Creator Payment */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Record A: Direct Creator Compensation
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ₹{project.budgetINR.toLocaleString('en-IN')} INR
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                Payer: <strong>{project.businessName}</strong> → Payee: <strong>{project.selectedStudentName || 'Assigned Creator'}</strong> (100% net, ₹0 deductions)
              </div>
            </div>

            {/* Record B: Platform Fee */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-indigo-600" />
                  Record B: Platform Beta Commission (5%)
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ₹{(project.budgetINR * 0.05).toLocaleString('en-IN')} INR
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                Payer: <strong>{project.businessName}</strong> → Payee: <strong>Proof-to-Pay</strong> (Payable separately upon deliverable acceptance)
              </div>
            </div>
          </div>
        )}

        {/* Filter Navigation */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto text-xs font-semibold">
          <span className="text-slate-400 mr-2 text-[11px] uppercase tracking-wider">Filter:</span>
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1 rounded-lg transition ${
              filter === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Milestones ({events.length})
          </button>
          <button
            onClick={() => setFilter('SCOPE')}
            className={`px-3 py-1 rounded-lg transition ${
              filter === 'SCOPE'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Scope Lock & Offers
          </button>
          <button
            onClick={() => setFilter('SUBMISSIONS')}
            className={`px-3 py-1 rounded-lg transition ${
              filter === 'SUBMISSIONS'
                ? 'bg-teal-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Work Submissions & Reviews
          </button>
          <button
            onClick={() => setFilter('PAYMENTS')}
            className={`px-3 py-1 rounded-lg transition ${
              filter === 'PAYMENTS'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Dual Financial Ledgers
          </button>
        </div>
      </div>

      {/* Chronological Timeline List */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {filteredEvents.map((event, idx) => {
          const badge = getEventBadge(event.eventType);
          const isExpanded = expandedEventId === event.id;

          return (
            <div key={event.id} className="relative group">
              {/* Timeline marker node */}
              <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center group-hover:scale-110 group-hover:border-indigo-500 transition shadow-xs">
                {badge.icon}
              </div>

              {/* Event Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-xs space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                      {badge.label}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {event.title}
                    </h3>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 shrink-0">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(event.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {event.description}
                </p>

                {/* Actor & Verification Metadata Footer */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-2 text-slate-500">
                    <span>Initiated by: <strong>{event.actorName}</strong></span>
                    <span>·</span>
                    <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                      {event.actorRole}
                    </span>
                  </div>

                  {event.verificationNote && (
                    <div className="flex items-center gap-1 font-medium">
                      {event.isVerified ? (
                        <span className="text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{event.verificationNote}</span>
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 inline-flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{event.verificationNote}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
