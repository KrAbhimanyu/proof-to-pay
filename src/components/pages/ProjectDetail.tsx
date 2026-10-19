import React, { useState } from 'react';
import { ProjectListing, User, Application } from '../../types';
import { marketplaceStore } from '../../lib/storage';
import { ApplicationSubmissionSchema } from '../../lib/schemas';
import { ScopeLockModal } from '../common/ScopeLockModal';
import { ScopeChangeModal } from '../common/ScopeChangeModal';
import { WorkTrail } from '../common/WorkTrail';
import {
  ChevronLeft,
  ShieldCheck,
  Calendar,
  IndianRupee,
  Clock,
  RotateCcw,
  CheckCircle2,
  FileText,
  Send,
  AlertCircle,
  ExternalLink,
  Plus,
  Trash2,
  Lock,
  X,
  MessageSquare
} from 'lucide-react';

interface Props {
  project: ProjectListing;
  currentUser: User | null;
  onBack: () => void;
  onOpenAuth: (mode?: 'login' | 'register_student') => void;
  onNavigate: (view: string, param?: string) => void;
  onOpenChat?: (params?: {
    conversationId?: string;
    targetUser?: { id: string; name: string; role: 'STUDENT' | 'BUSINESS' | 'ADMIN' | 'RECRUITER' };
    targetProjectId?: string;
    targetOfferId?: string;
  }) => void;
}

export const ProjectDetail: React.FC<Props> = ({
  project,
  currentUser,
  onBack,
  onOpenAuth,
  onNavigate,
  onOpenChat,
}) => {
  const [pitch, setPitch] = useState('');
  const [deliveryDays, setDeliveryDays] = useState(project.deadlineDays);
  const [portfolioSamples, setPortfolioSamples] = useState<{ title: string; url: string }[]>([
    { title: 'Relevant Case Study / GitHub Repo', url: 'https://' }
  ]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals state
  const [showScopeLockModal, setShowScopeLockModal] = useState(false);
  const [showWorkTrailModal, setShowWorkTrailModal] = useState(false);
  const [showScopeChangeModal, setShowScopeChangeModal] = useState(false);

  // Check if current user already applied
  const existingApp = currentUser
    ? marketplaceStore.getApplications().find((a) => a.projectId === project.id && a.studentId === currentUser.id)
    : null;

  const studentProfile = currentUser && currentUser.role === 'STUDENT'
    ? marketplaceStore.getStudentProfile(currentUser.id)
    : null;

  const handleAddSample = () => {
    setPortfolioSamples([...portfolioSamples, { title: '', url: 'https://' }]);
  };

  const handleRemoveSample = (index: number) => {
    setPortfolioSamples(portfolioSamples.filter((_, i) => i !== index));
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!currentUser) {
      onOpenAuth('login');
      return;
    }

    if (currentUser.role !== 'STUDENT') {
      setErrorMsg('Only student creator accounts can apply for projects. Switch role to apply.');
      return;
    }

    if (studentProfile && studentProfile.age < 18) {
      setErrorMsg('Participation is restricted to adults aged 18 or older under platform policy.');
      return;
    }

    // Validate with Zod
    const validation = ApplicationSubmissionSchema.safeParse({
      pitchMessage: pitch,
      proposedDeliveryDays: deliveryDays,
      portfolioSamples: portfolioSamples.filter((s) => s.title.trim() && s.url.trim() && s.url !== 'https://'),
    });

    if (!validation.success) {
      setErrorMsg(validation.error.issues[0]?.message || 'Please check all required application fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      marketplaceStore.applyToProject(
        currentUser,
        project.id,
        pitch,
        deliveryDays,
        validation.data.portfolioSamples
      );
      setSuccessMsg('Application submitted successfully! The business will review your work samples and issue an offer if selected.');
      setPitch('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Projects</span>
      </button>

      {/* Main Project Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{project.businessName}</span>
              <span>·</span>
              <span>{project.businessCity}</span>
              {project.businessVerified && (
                <>
                  <span>·</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    GSTIN/CIN Verified
                  </span>
                </>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {project.title}
            </h1>

            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
              {project.summary}
            </p>
          </div>

          {/* Budget & Timeline card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 min-w-[240px] space-y-3 shrink-0">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Fixed Budget</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                ₹{project.budgetINR.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-500">INR</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
              <div>
                <span className="text-slate-400 text-[10px]">Expected Duration</span>
                <div className="font-semibold text-slate-800 dark:text-slate-200">{project.deadlineDays} Days</div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px]">Permitted Revisions</span>
                <div className="font-semibold text-slate-800 dark:text-slate-200">{project.permittedRevisions} Cycles</div>
              </div>
            </div>
          </div>
        </div>

        {/* Required Skills */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-500 mb-2">Required Skills & Stack:</div>
          <div className="flex flex-wrap gap-1.5">
            {project.requiredSkills.map((s) => (
              <span key={s} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Scope Lock & Work Trail Action Bar */}
        <div className="flex flex-wrap items-center gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setShowScopeLockModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:border-emerald-500 transition flex items-center gap-1.5 shadow-2xs"
          >
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Scope Lock Terms</span>
          </button>

          <button
            onClick={() => setShowWorkTrailModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:border-indigo-500 transition flex items-center gap-1.5 shadow-2xs"
          >
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>Work Trail Timeline</span>
          </button>

          {currentUser &&
            (project.status === 'IN_PROGRESS' || project.status === 'REVISION_REQUESTED') &&
            (currentUser.id === project.businessId || currentUser.id === project.selectedStudentId) && (
              <button
                onClick={() => setShowScopeChangeModal(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:border-indigo-500 transition flex items-center gap-1.5 shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                <span>Propose Scope Change</span>
              </button>
            )}
        </div>
      </div>

      {/* Grid: Scope & Acceptance Criteria vs Application Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Scope, Deliverables & Payment Terms */}
        <div className="lg:col-span-7 space-y-6">
          {/* Detailed Description */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Project Scope & Requirements</span>
            </h2>
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {project.description}
            </div>
          </div>

          {/* Deliverables Breakdown */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Agreed Deliverables ({project.deliverables.length})
            </h2>
            <div className="space-y-3">
              {project.deliverables.map((del, idx) => (
                <div key={del.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {idx + 1}. {del.title}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                      {del.format}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {del.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Acceptance Criteria */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Objective Acceptance Criteria
            </h2>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              {project.acceptanceCriteria.map((crit, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{crit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Payment Terms & Audit Contract */}
          <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-3xl p-6 sm:p-7 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
            <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Payment Terms & Guarantee</span>
            </h3>
            <p className="text-xs text-emerald-800 dark:text-emerald-400 leading-relaxed">
              {project.paymentTerms}
            </p>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-500">
              ✓ No unilateral scope changes permitted after offer acceptance.<br />
              ✓ Payment status changes require verified bank UTR / payment evidence.<br />
              ✓ Unresolved disputes handled by platform admin investigation.
            </div>
          </div>
        </div>

        {/* Right Column: Application Box or Status */}
        <div className="lg:col-span-5 space-y-6">
          {currentUser && currentUser.id === project.businessId ? (
            /* Business viewing their own listing */
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Your Project Listing</h3>
              <p className="text-xs text-slate-500">
                You created this project. Manage applicants and issue formal offers from your business portal.
              </p>
              <button
                onClick={() => onNavigate('business_dashboard')}
                className="w-full py-3 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition"
              >
                Go to Business Dashboard & Applications
              </button>
            </div>
          ) : existingApp ? (
            /* Already applied */
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">You have applied to this project</h3>
              <p className="text-xs text-slate-500">
                Status: <span className="font-bold uppercase text-emerald-600">{existingApp.status}</span>
              </p>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-300">
                <strong>Your pitch:</strong>
                <p className="mt-1 line-clamp-3">{existingApp.pitchMessage}</p>
              </div>
              <button
                onClick={() => onNavigate('student_dashboard')}
                className="w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Track in Student Dashboard
              </button>
              {onOpenChat && currentUser && currentUser.id !== project.businessId && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenChat({
                      targetUser: { id: project.businessId, name: project.businessName, role: 'BUSINESS' },
                      targetProjectId: project.id
                    })
                  }
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 transition shadow-2xs"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat with Business</span>
                </button>
              )}
            </div>
          ) : (
            /* Application Form */
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Apply for this Project</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Explain your approach and link 1-3 relevant portfolio samples.
                  </p>
                </div>
                {onOpenChat && currentUser && currentUser.id !== project.businessId && (
                  <button
                    type="button"
                    onClick={() =>
                      onOpenChat({
                        targetUser: { id: project.businessId, name: project.businessName, role: 'BUSINESS' },
                        targetProjectId: project.id
                      })
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 transition whitespace-nowrap shrink-0"
                    title="Ask business questions before submitting application"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Ask Questions</span>
                  </button>
                )}
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleApply} className="space-y-4">
                {/* Pitch */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Your Pitch & Execution Approach *
                  </label>
                  <textarea
                    rows={4}
                    value={pitch}
                    onChange={(e) => setPitch(e.target.value)}
                    placeholder="Describe how you will execute these deliverables, your tools, and previous similar experience..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <div className="text-[10px] text-slate-400 mt-1">
                    Minimum 30 characters.
                  </div>
                </div>

                {/* Proposed Delivery Days */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Proposed Delivery Time (Days) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={project.deadlineDays + 5}
                    value={deliveryDays}
                    onChange={(e) => setDeliveryDays(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                {/* Portfolio Samples */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Portfolio Samples & Evidence Links *
                    </label>
                    <button
                      type="button"
                      onClick={handleAddSample}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add link</span>
                    </button>
                  </div>

                  {portfolioSamples.map((sample, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={sample.title}
                          onChange={(e) => {
                            const updated = [...portfolioSamples];
                            updated[idx].title = e.target.value;
                            setPortfolioSamples(updated);
                          }}
                          placeholder="Project title (e.g., Mobile UI Design)"
                          className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                          required
                        />
                        {portfolioSamples.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSample(idx)}
                            className="text-slate-400 hover:text-rose-500 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <input
                        type="url"
                        value={sample.url}
                        onChange={(e) => {
                          const updated = [...portfolioSamples];
                          updated[idx].url = e.target.value;
                          setPortfolioSamples(updated);
                        }}
                        placeholder="https://behance.net/..."
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono"
                        required
                      />
                    </div>
                  ))}
                </div>

                {/* Adult 18+ policy notice */}
                <div className="text-[11px] text-slate-500 leading-tight">
                  By applying, you confirm you are 18 years or older and accept Proof-to-Pay terms for verified project completion.
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Submitting Application...' : 'Submit Application'}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Scope Lock Modal */}
      {showScopeLockModal && (
        <ScopeLockModal
          project={project}
          currentUser={currentUser}
          onClose={() => setShowScopeLockModal(false)}
          onRequestScopeChange={() => {
            setShowScopeLockModal(false);
            setShowScopeChangeModal(true);
          }}
        />
      )}

      {/* Work Trail Modal */}
      {showWorkTrailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 my-8 max-h-[85vh] overflow-y-auto">
            <WorkTrail
              projectId={project.id}
              currentUser={currentUser}
              onClose={() => setShowWorkTrailModal(false)}
            />
          </div>
        </div>
      )}

      {/* Propose Scope Change Modal */}
      {showScopeChangeModal && currentUser && (
        <ScopeChangeModal
          project={project}
          currentUser={currentUser}
          onClose={() => setShowScopeChangeModal(false)}
          onSuccess={() => {
            setShowScopeChangeModal(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};
