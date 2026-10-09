import React, { useState } from 'react';
import { User, AbuseReport } from '../../types';
import { marketplaceStore } from '../../lib/storage';
import { X, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  currentUser: User | null;
  targetProjectId?: string;
  targetUserId?: string;
  targetTitle: string;
  onClose: () => void;
}

export const ReportAbuseModal: React.FC<Props> = ({
  isOpen,
  currentUser,
  targetProjectId,
  targetUserId,
  targetTitle,
  onClose,
}) => {
  const [reason, setReason] = useState<AbuseReport['reason']>('OFF_PLATFORM_PAYMENT');
  const [description, setDescription] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('You must be signed in to submit an abuse report.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide specific details explaining the issue.');
      return;
    }

    try {
      marketplaceStore.submitAbuseReport(currentUser, {
        targetProjectId,
        targetUserId,
        targetTitle,
        reason,
        description: description.trim(),
      });
      setIsSubmitted(true);
      setError(null);
    } catch {
      setError('Failed to submit report. Please try again.');
    }
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setDescription('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-white" />
            <h3 className="font-bold text-sm">Report Suspicious Activity / Abuse</h3>
          </div>
          <button
            onClick={handleResetAndClose}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {isSubmitted ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Report Received</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Our trust & safety moderators have received your incident report for <strong>{targetTitle}</strong> and will inspect it promptly. Thank you for protecting the platform.
              </p>
              <button
                onClick={handleResetAndClose}
                className="mt-3 px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <p>
                  Reporting: <strong>{targetTitle}</strong>. Proof-to-Pay strictly enforces safety, 18+ creator protection, and zero off-platform payment solicitations.
                </p>
              </div>

              {error && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300">
                  {error}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Violation Reason
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="OFF_PLATFORM_PAYMENT">Soliciting Off-Platform Payment / Contact</option>
                  <option value="UNDERAGE">Suspected Underage User (&lt;18)</option>
                  <option value="FAKE_BUSINESS">Unregistered or Suspicious Business</option>
                  <option value="SPAM">Spam or Misleading Scope</option>
                  <option value="COPYRIGHT">Copyright / IP Infringement</option>
                  <option value="HARASSMENT">Unprofessional Harassment</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Details / Evidence
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Provide context, links, or describe what occurred..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold transition"
                >
                  Submit Report
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
