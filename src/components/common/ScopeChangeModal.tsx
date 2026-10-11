import React, { useState } from 'react';
import { ProjectListing, User, DeliverableItem, ScopeChangeRequest } from '../../types';
import { marketplaceStore } from '../../lib/storage';
import { ScopeChangeRequestSchema } from '../../lib/schemas';
import {
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  X,
  IndianRupee,
  Calendar,
  Plus,
  Trash2,
  ShieldCheck
} from 'lucide-react';

interface Props {
  project: ProjectListing;
  currentUser: User;
  pendingRequest?: ScopeChangeRequest | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ScopeChangeModal: React.FC<Props> = ({
  project,
  currentUser,
  pendingRequest,
  onClose,
  onSuccess,
}) => {
  // If reviewing an existing pending proposal
  const isReviewingCounterparty =
    pendingRequest &&
    pendingRequest.status === 'PENDING' &&
    pendingRequest.requestedByUserId !== currentUser.id;

  const [reason, setReason] = useState('');
  const [proposedBudget, setProposedBudget] = useState(project.budgetINR);
  const [proposedDeadline, setProposedDeadline] = useState(project.expectedDeliveryDate);
  const [proposedRevisions, setProposedRevisions] = useState(project.permittedRevisions);
  const [proposedScopeSummary, setProposedScopeSummary] = useState(project.summary);
  const [deliverables, setDeliverables] = useState<DeliverableItem[]>(project.deliverables || []);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const config = marketplaceStore.getMonetizationConfig();
  const ratePct = config.defaultCommissionRatePercent;
  const proposedFee = Math.round((proposedBudget * ratePct) / 100);

  const handleAddDeliverable = () => {
    setDeliverables([
      ...deliverables,
      {
        id: `del-new-${Date.now()}`,
        title: '',
        description: '',
        format: 'Figma / Code / Asset',
      },
    ]);
  };

  const handleRemoveDeliverable = (idx: number) => {
    if (deliverables.length <= 1) {
      setErrorMsg('At least one deliverable must be specified');
      return;
    }
    setDeliverables(deliverables.filter((_, i) => i !== idx));
  };

  const handleSubmitProposal = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const validation = ScopeChangeRequestSchema.safeParse({
      reason,
      proposedBudgetINR: proposedBudget,
      proposedDeadline,
      proposedRevisions,
      proposedScopeSummary,
    });

    if (!validation.success) {
      setErrorMsg(validation.error.issues[0]?.message || 'Please check all required fields.');
      return;
    }

    if (deliverables.some((d) => !d.title.trim() || !d.description.trim())) {
      setErrorMsg('Please complete titles and descriptions for all deliverables.');
      return;
    }

    setIsSubmitting(true);
    try {
      marketplaceStore.createScopeChangeRequest(currentUser, {
        projectId: project.id,
        reason,
        proposedBudgetINR: proposedBudget,
        proposedDeadline,
        proposedRevisions,
        proposedDeliverables: deliverables,
        proposedScopeSummary,
      });
      alert('Scope Change Proposal submitted! Awaiting counterparty acceptance.');
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit scope change proposal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRespond = (accept: boolean) => {
    if (!pendingRequest) return;
    setErrorMsg(null);

    if (!accept && (!rejectionReason || rejectionReason.trim().length < 5)) {
      setShowRejectInput(true);
      setErrorMsg('Please state a brief reason for declining this scope change proposal.');
      return;
    }

    setIsSubmitting(true);
    try {
      marketplaceStore.respondToScopeChangeRequest(
        currentUser,
        pendingRequest.id,
        accept,
        rejectionReason.trim() || undefined
      );
      alert(accept ? 'Scope change accepted! Project terms updated.' : 'Scope change declined.');
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to respond to scope change');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 space-y-0">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {isReviewingCounterparty ? 'Review Incoming Scope Change Request' : 'Propose Formal Scope Change'}
              </h2>
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

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isReviewingCounterparty && pendingRequest ? (
            /* Review Mode */
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200 space-y-1.5">
                <div className="font-bold">
                  Proposed by {pendingRequest.requestedByName} ({pendingRequest.requestedByRole})
                </div>
                <p className="leading-relaxed italic">
                  "{pendingRequest.reason}"
                </p>
                <div className="text-[11px] text-indigo-600 dark:text-indigo-400">
                  Submitted: {new Date(pendingRequest.createdAt).toLocaleString()}
                </div>
              </div>

              {/* Side by side comparison */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Current Locked Terms</span>
                  <div className="font-black text-slate-900 dark:text-white text-base">
                    ₹{pendingRequest.previousTermsSnapshot.budgetINR.toLocaleString('en-IN')} INR
                  </div>
                  <div className="text-slate-500">Deadline: {pendingRequest.previousTermsSnapshot.deadline}</div>
                  <div className="text-slate-500">Revisions: {pendingRequest.previousTermsSnapshot.revisions} cycles</div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-1">
                  <span className="text-[10px] text-emerald-600 font-bold uppercase">Proposed Modified Terms</span>
                  <div className="font-black text-emerald-900 dark:text-emerald-200 text-base">
                    ₹{pendingRequest.proposedBudgetINR.toLocaleString('en-IN')} INR
                  </div>
                  <div className="text-emerald-700 dark:text-emerald-300">Deadline: {pendingRequest.proposedDeadline}</div>
                  <div className="text-emerald-700 dark:text-emerald-300">Revisions: {pendingRequest.proposedRevisions} cycles</div>
                </div>
              </div>

              {/* Proposed Deliverables */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Proposed Deliverables:</h4>
                <div className="space-y-2">
                  {pendingRequest.proposedDeliverables.map((del, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                      <div className="font-bold text-slate-900 dark:text-white">{i + 1}. {del.title}</div>
                      <p className="text-slate-500 text-[11px]">{del.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {showRejectInput && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Reason for declining scope modification *
                  </label>
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="State reason (e.g. proposed budget is insufficient for 2 additional complex screens)..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              )}

              {/* Decision Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => handleRespond(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-rose-300 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold transition"
                >
                  Decline Proposal
                </button>
                <button
                  type="button"
                  onClick={() => handleRespond(true)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
                >
                  Accept & Update Scope Lock
                </button>
              </div>
            </div>
          ) : (
            /* Proposal Form */
            <form onSubmit={handleSubmitProposal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Rationale for Proposed Scope Change *
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why the scope is expanding or adjusting (e.g., adding 2 extra packaging flavors, requiring additional dielines and 4 extra days)..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Proposed Budget (₹ INR) *
                  </label>
                  <input
                    type="number"
                    min={1000}
                    value={proposedBudget}
                    onChange={(e) => setProposedBudget(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                  />
                  <div className="text-[10px] text-slate-400 mt-1">
                    Platform fee (5%): ₹{proposedFee} INR
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Proposed Deadline *
                  </label>
                  <input
                    type="date"
                    value={proposedDeadline}
                    onChange={(e) => setProposedDeadline(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Permitted Revisions *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={proposedRevisions}
                    onChange={(e) => setProposedRevisions(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Updated Summary of Deliverables *
                </label>
                <input
                  type="text"
                  value={proposedScopeSummary}
                  onChange={(e) => setProposedScopeSummary(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              {/* Deliverables List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Deliverables Checklist ({deliverables.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddDeliverable}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add deliverable</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {deliverables.map((del, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={del.title}
                          onChange={(e) => {
                            const updated = [...deliverables];
                            updated[idx].title = e.target.value;
                            setDeliverables(updated);
                          }}
                          placeholder="Deliverable Title (e.g., 2 New Packaging Dielines)"
                          className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold"
                          required
                        />
                        {deliverables.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDeliverable(idx)}
                            className="text-slate-400 hover:text-rose-500 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={del.description}
                        onChange={(e) => {
                          const updated = [...deliverables];
                          updated[idx].description = e.target.value;
                          setDeliverables(updated);
                        }}
                        placeholder="Detailed deliverable specification"
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Send Scope Change Proposal'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
