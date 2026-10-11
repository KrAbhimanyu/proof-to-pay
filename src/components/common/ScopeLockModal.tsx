import React, { useState } from 'react';
import { ProjectListing, ProjectOffer, User, ScopeChangeRequest } from '../../types';
import { marketplaceStore } from '../../lib/storage';
import {
  Lock,
  Calendar,
  IndianRupee,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  FileText,
  AlertCircle,
  Clock,
  X,
  Plus,
  ArrowRight
} from 'lucide-react';

interface Props {
  project: ProjectListing;
  currentUser: User | null;
  onClose: () => void;
  onRequestScopeChange?: () => void;
}

export const ScopeLockModal: React.FC<Props> = ({
  project,
  currentUser,
  onClose,
  onRequestScopeChange,
}) => {
  const [activeTab, setActiveTab] = useState<'TERMS' | 'CHANGELOG'>('TERMS');

  const offers = marketplaceStore.getOffers();
  const offer = offers.find((o) => o.projectId === project.id && o.status === 'ACCEPTED');
  const scopeChanges = marketplaceStore.getScopeChangeRequests(project.id);

  const canRequestChange =
    (project.status === 'IN_PROGRESS' || project.status === 'REVISION_REQUESTED') &&
    currentUser &&
    (currentUser.id === project.businessId || currentUser.id === project.selectedStudentId);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 space-y-0">
        {/* Modal Top Bar */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Scope Lock — Contract Terms
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200 dark:border-emerald-800">
                  Locked 🔒
                </span>
              </div>
              <p className="text-xs text-slate-500">{project.title}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('TERMS')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'TERMS'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Agreed Scope Terms
          </button>
          <button
            onClick={() => setActiveTab('CHANGELOG')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'CHANGELOG'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Change Request History</span>
            {scopeChanges.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] flex items-center justify-center font-bold">
                {scopeChanges.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {activeTab === 'TERMS' ? (
            <div className="space-y-6">
              {/* Mutual Agreement Notice */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Binding Mutual Execution
                </div>
                <p className="leading-relaxed">
                  These terms were explicitly confirmed by <strong>{project.businessName}</strong> and accepted by <strong>{project.selectedStudentName || 'Assigned Creator'}</strong>. Scope modifications require a formal change request accepted by both parties.
                </p>
                {offer?.lockedAt && (
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400 pt-1">
                    Timestamp of Lock: {new Date(offer.lockedAt).toLocaleString()}
                  </div>
                )}
              </div>

              {/* Financial Snapshot */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Agreed Project Budget</span>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                    ₹{project.budgetINR.toLocaleString('en-IN')} INR
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                    Creator receives 100% (₹0 fee deduction)
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Platform Beta Commission</span>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                    ₹{(project.budgetINR * 0.05).toLocaleString('en-IN')} INR
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    5% platform fee paid separately by business
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Timeline & Revisions</span>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
                    Due: {project.expectedDeliveryDate}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Permitted Revisions: {project.permittedRevisions} Cycles
                  </div>
                </div>
              </div>

              {/* Deliverables Breakdown */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Locked Deliverables Specification ({project.deliverables.length})
                </h3>
                <div className="space-y-2">
                  {project.deliverables.map((del, idx) => (
                    <div key={del.id || idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {idx + 1}. {del.title}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px] text-slate-700 dark:text-slate-300">
                          {del.format}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {del.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cancellation Terms */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-slate-500" />
                  Cancellation & Dispute Policy Terms
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {offer?.cancellationTerms || 'Mutual cancellation permits pro-rata payment based on approved milestone deliverables. Unilateral cancellation without cause forfeits platform protections and may result in account suspension.'}
                </p>
              </div>

              {/* Actions */}
              {canRequestChange && onRequestScopeChange && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      onClose();
                      onRequestScopeChange();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition flex items-center gap-2 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Propose Scope Change Request</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Formal Scope Change Requests ({scopeChanges.length})
                </h3>
                {canRequestChange && onRequestScopeChange && (
                  <button
                    onClick={() => {
                      onClose();
                      onRequestScopeChange();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Proposal</span>
                  </button>
                )}
              </div>

              {scopeChanges.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                  No scope modifications requested. The original accepted scope terms remain in effect.
                </div>
              ) : (
                <div className="space-y-3">
                  {scopeChanges.map((scr) => (
                    <div key={scr.id} className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">
                            Proposed by {scr.requestedByName} ({scr.requestedByRole})
                          </span>
                          <div className="text-[11px] text-slate-400">{new Date(scr.createdAt).toLocaleString()}</div>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          scr.status === 'ACCEPTED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : scr.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}>
                          {scr.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl space-y-1">
                        <strong>Reason:</strong>
                        <p className="italic">{scr.reason}</p>
                      </div>

                      {/* Side by side diff */}
                      <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                        <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/40">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Previous Terms</span>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            Budget: ₹{scr.previousTermsSnapshot.budgetINR.toLocaleString('en-IN')} INR
                          </div>
                          <div className="text-slate-500 text-[11px]">Due: {scr.previousTermsSnapshot.deadline}</div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60">
                          <span className="text-[10px] text-indigo-500 font-bold uppercase">Proposed Terms</span>
                          <div className="font-semibold text-indigo-900 dark:text-indigo-200">
                            Budget: ₹{scr.proposedBudgetINR.toLocaleString('en-IN')} INR
                          </div>
                          <div className="text-indigo-700 dark:text-indigo-300 text-[11px]">Due: {scr.proposedDeadline}</div>
                        </div>
                      </div>

                      {scr.rejectionReason && (
                        <div className="text-xs text-rose-600 dark:text-rose-400 pt-1">
                          <strong>Rejection Note:</strong> {scr.rejectionReason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
