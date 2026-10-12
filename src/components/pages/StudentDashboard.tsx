import React, { useState } from 'react';
import { User, StudentProfile, Application, ProjectListing, ProjectSubmission, ProjectOffer, PaymentRecord, VerifiedReview, ProofPassportItem, ScopeChangeRequest } from '../../types';
import { marketplaceStore } from '../../lib/storage';
import { WorkSubmissionSchema } from '../../lib/schemas';
import { Badges } from '../common/Badges';
import { ScopeLockModal } from '../common/ScopeLockModal';
import { ScopeChangeModal } from '../common/ScopeChangeModal';
import { WorkTrail } from '../common/WorkTrail';
import confetti from 'canvas-confetti';
import {
  GraduationCap,
  Briefcase,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  ExternalLink,
  ShieldCheck,
  Star,
  Trash2,
  Send,
  Plus,
  Copy,
  ChevronRight,
  TrendingUp,
  Wallet,
  Award,
  Sparkles,
  Check,
  Lock,
  RotateCcw,
  Eye,
  EyeOff,
  Edit3,
  X,
  FileCheck,
  Shield
} from 'lucide-react';

interface Props {
  currentUser: User;
  onNavigate: (view: string, param?: string) => void;
}

export const StudentDashboard: React.FC<Props> = ({ currentUser, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'active_projects' | 'payments' | 'badges' | 'portfolio' | 'profile' | 'settings'>('overview');

  const profile = marketplaceStore.getStudentProfile(currentUser.id) || {
    userId: currentUser.id,
    headline: 'Emerging Creator',
    bio: '',
    age: 20,
    skills: ['UI/UX', 'React'],
    experienceLevel: 'INTERMEDIATE',
    portfolioLinks: [],
    totalEarnedINR: 0,
    completedProjectsCount: 0,
    averageRating: 5.0,
    verifiedPortfolioSlug: currentUser.name.toLowerCase().replace(/\s+/g, '-'),
  };

  const applications = marketplaceStore.getApplications().filter((a) => a.studentId === currentUser.id);
  const offers = marketplaceStore.getOffers().filter((o) => o.studentId === currentUser.id);
  const activeProjects = marketplaceStore.getProjects().filter((p) => p.selectedStudentId === currentUser.id);
  const submissions = marketplaceStore.getSubmissions().filter((s) => s.studentId === currentUser.id);
  const payments = marketplaceStore.getPayments().filter((p) => p.studentId === currentUser.id);
  const reviews = marketplaceStore.getReviews().filter((r) => r.targetUserId === currentUser.id);
  const passportItems = marketplaceStore.getProofPassportItems(currentUser.id, false);

  // Scope Lock & Work Trail Modal States
  const [activeScopeLockProject, setActiveScopeLockProject] = useState<ProjectListing | null>(null);
  const [activeWorkTrailProjectId, setActiveWorkTrailProjectId] = useState<string | null>(null);
  const [activeScopeChangeProject, setActiveScopeChangeProject] = useState<ProjectListing | null>(null);
  const [reviewingScopeChange, setReviewingScopeChange] = useState<{ project: ProjectListing; request: ScopeChangeRequest } | null>(null);

  // Explicit Scope Lock Acceptance Modal State
  const [explicitOfferAcceptModal, setExplicitOfferAcceptModal] = useState<ProjectOffer | null>(null);
  const [deliverablesAgreed, setDeliverablesAgreed] = useState(false);
  const [deadlineAgreed, setDeadlineAgreed] = useState(false);
  const [revisionsAgreed, setRevisionsAgreed] = useState(false);
  const [cancellationAgreed, setCancellationAgreed] = useState(false);
  const [feeTermsAgreed, setFeeTermsAgreed] = useState(false);

  // Proof Passport State
  const [editingPassportItemId, setEditingPassportItemId] = useState<string | null>(null);
  const [editingPassportSummary, setEditingPassportSummary] = useState('');
  const [newSampleTitle, setNewSampleTitle] = useState('');
  const [newSampleUrl, setNewSampleUrl] = useState('');
  const [newSampleDesc, setNewSampleDesc] = useState('');

  // Submission Form State
  const [submittingProjectId, setSubmittingProjectId] = useState<string | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [submissionLiveLink, setSubmissionLiveLink] = useState('');
  const [submissionFileName, setSubmissionFileName] = useState('Deliverable_Final_V1.zip');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Profile Form State
  const [editBio, setEditBio] = useState(profile.bio);
  const [editHeadline, setEditHeadline] = useState(profile.headline);
  const [editSkills, setEditSkills] = useState(profile.skills.join(', '));
  const [editUpi, setEditUpi] = useState(profile.upiId || '');
  const [profileSaved, setProfileSaved] = useState(false);

  // Handle Offer Explicit Acceptance Initiated
  const handleInitiateOfferAcceptance = (offer: ProjectOffer) => {
    setExplicitOfferAcceptModal(offer);
    setDeliverablesAgreed(false);
    setDeadlineAgreed(false);
    setRevisionsAgreed(false);
    setCancellationAgreed(false);
    setFeeTermsAgreed(false);
  };

  const handleConfirmExplicitScopeLock = () => {
    if (!explicitOfferAcceptModal) return;
    if (!deliverablesAgreed || !deadlineAgreed || !revisionsAgreed || !cancellationAgreed || !feeTermsAgreed) {
      alert('Please check all 5 scope lock terms to confirm explicit mutual acceptance.');
      return;
    }
    try {
      marketplaceStore.respondToOffer(currentUser, explicitOfferAcceptModal.id, true, {
        deliverablesAgreed,
        deadlineAgreed,
        revisionsAgreed,
        cancellationAgreed,
        feeTermsAgreed,
      });
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      setExplicitOfferAcceptModal(null);
      alert('Scope Lock established! Project terms are now locked and work has commenced.');
      setActiveTab('active_projects');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeclineOffer = (offerId: string) => {
    if (window.confirm('Are you sure you want to decline this project offer?')) {
      try {
        marketplaceStore.respondToOffer(currentUser, offerId, false);
        setExplicitOfferAcceptModal(null);
        alert('Offer declined.');
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleTogglePassportVisibility = (itemId: string, currentPublic: boolean) => {
    try {
      marketplaceStore.toggleProofPassportVisibility(currentUser, itemId, !currentPublic);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSavePassportSummary = (itemId: string) => {
    try {
      marketplaceStore.updateProofPassportItem(currentUser, itemId, { sanitizedSummary: editingPassportSummary });
      setEditingPassportItemId(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddSelfUploadedSample = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSampleTitle.trim() || !newSampleUrl.trim()) return;
    const currentLinks = profile.portfolioLinks || [];
    marketplaceStore.updateStudentProfile(currentUser.id, {
      portfolioLinks: [
        ...currentLinks,
        { title: newSampleTitle.trim(), url: newSampleUrl.trim(), description: newSampleDesc.trim() }
      ]
    });
    setNewSampleTitle('');
    setNewSampleUrl('');
    setNewSampleDesc('');
    alert('Self-uploaded work sample added to your portfolio profile.');
  };

  const handleRemoveSelfUploadedSample = (index: number) => {
    const currentLinks = profile.portfolioLinks || [];
    marketplaceStore.updateStudentProfile(currentUser.id, {
      portfolioLinks: currentLinks.filter((_, i) => i !== index)
    });
  };

  // Handle Payment Receipt Confirmation
  const handleConfirmPaymentReceipt = (projectId: string) => {
    if (window.confirm('Confirm that you have received the full agreed project amount in your bank account / UPI?')) {
      try {
        marketplaceStore.confirmProjectPaymentReceipt(currentUser, projectId);
        confetti({ particleCount: 60, spread: 50 });
        alert('Payment receipt confirmed! This verified settlement is permanently logged.');
        window.location.reload();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  // Handle Payment Dispute
  const handleDisputePayment = (projectId: string) => {
    const reason = prompt('Please explain the issue with this payout record (e.g. UTR is invalid, funds not received):');
    if (reason && reason.trim().length >= 4) {
      try {
        marketplaceStore.disputeProjectPayment(currentUser, projectId, reason);
        marketplaceStore.fileDispute(currentUser, projectId, 'Payout dispute: ' + reason, 'Student reported payment discrepancy with business UTR.');
        alert('Payment dispute filed. An administrator will investigate with the business.');
        window.location.reload();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  // Handle Work Submission
  const handleSubmitWork = (e: React.FormEvent, projectId: string) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const validation = WorkSubmissionSchema.safeParse({
      notes: submissionNotes,
      liveLink: submissionLiveLink,
      files: [{ name: submissionFileName, url: submissionLiveLink || '#', sizeMb: 5.4, type: 'application/zip' }]
    });

    if (!validation.success) {
      setFormError(validation.error.issues[0]?.message || 'Please check work submission fields.');
      return;
    }

    try {
      marketplaceStore.submitProjectWork(
        currentUser,
        projectId,
        submissionNotes,
        submissionLiveLink,
        validation.data.files
      );
      setFormSuccess('Deliverable submitted for business review! Client will evaluate within agreed terms.');
      setSubmittingProjectId(null);
      setSubmissionNotes('');
      setSubmissionLiveLink('');
      confetti({ particleCount: 50, spread: 50 });
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  // Handle Profile Update
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const skillsList = editSkills.split(',').map((s) => s.trim()).filter(Boolean);
    marketplaceStore.updateStudentProfile(currentUser.id, {
      bio: editBio,
      headline: editHeadline,
      skills: skillsList,
      upiId: editUpi,
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  // Handle Account Deletion
  const handleDeleteAccount = () => {
    if (window.confirm('Are you certain you want to request complete account deletion? All personal data will be removed under platform policy.')) {
      marketplaceStore.requestAccountDeletion(currentUser);
      window.location.reload();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Dashboard Top Identity & Stats */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-1 shadow-md shrink-0">
            {currentUser.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover rounded-[14px]" />
            ) : (
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-white font-bold text-xl">
                {currentUser.name[0]}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                {currentUser.name}
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                18+ Verified Creator
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{profile.headline}</p>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
              <span>{currentUser.city || 'India'}</span>
              <span>·</span>
              <span>{profile.college || 'University Student'}</span>
            </div>

            {/* Earned Milestones Strip */}
            <div className="mt-3">
              <Badges
                profile={profile}
                user={currentUser}
                reviews={reviews}
                submissions={submissions}
                projects={activeProjects}
                payments={payments}
                variant="strip"
                isOwner={true}
              />
            </div>
          </div>
        </div>

        {/* Stats Pill Strip */}
        <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase">Earned (INR)</div>
            <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              ₹{profile.totalEarnedINR.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="border-x border-slate-200 dark:border-slate-700 px-3">
            <div className="text-[10px] font-semibold text-slate-400 uppercase">Completed</div>
            <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
              {profile.completedProjectsCount}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase">Rating</div>
            <div className="text-base sm:text-lg font-black text-amber-500 flex items-center justify-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{profile.averageRating.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 sm:gap-4 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          Overview
        </button>

        <button
          onClick={() => setActiveTab('applications')}
          className={`pb-3 px-2 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'applications'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          <span>My Applications</span>
          {applications.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] flex items-center justify-center">
              {applications.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('active_projects')}
          className={`pb-3 px-2 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'active_projects'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          <span>Active Projects</span>
          {activeProjects.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] flex items-center justify-center font-bold">
              {activeProjects.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 px-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'payments'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          Payment Tracking
        </button>

        <button
          onClick={() => setActiveTab('badges')}
          className={`pb-3 px-2 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'badges'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-amber-500" />
          <span>Milestones & Badges</span>
        </button>

        <button
          onClick={() => setActiveTab('portfolio')}
          className={`pb-3 px-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'portfolio'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          Verified Portfolio
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          Profile & Skills
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 px-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'settings'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          Settings & Privacy
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Pending Offers Banner */}
          {offers.filter((o) => o.status === 'PENDING').map((offer) => (
            <div key={offer.id} className="p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border-2 border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                    🎉 Formal Project Offer Received
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {offer.projectTitle}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Offered by <strong>{offer.businessName}</strong> · Fixed Budget: <strong>₹{offer.agreedBudgetINR.toLocaleString('en-IN')} INR</strong> · Deadline: <strong>{offer.agreedDeadline}</strong>
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold">
                    ✓ 100% Net Creator Payout: ₹{offer.agreedBudgetINR.toLocaleString('en-IN')} INR
                  </span>
                  <span className="text-slate-500">
                    Platform commission (5%) paid separately by business to Proof-to-Pay. ₹0 deducted from you.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleInitiateOfferAcceptance(offer)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Review & Lock Scope</span>
                </button>
                <button
                  onClick={() => handleDeclineOffer(offer.id)}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}

          {/* Quick Actions & Recent Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Active Projects in Progress</h3>
                <button onClick={() => setActiveTab('active_projects')} className="text-xs text-emerald-600 font-semibold hover:underline">
                  View all
                </button>
              </div>

              {activeProjects.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No active projects right now. Browse projects and submit applications to start earning.
                </div>
              ) : (
                <div className="space-y-3">
                  {activeProjects.map((proj) => (
                    <div key={proj.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">{proj.title}</span>
                        <span className="font-bold text-emerald-600">₹{proj.budgetINR.toLocaleString('en-IN')} INR</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Status: <strong className="uppercase">{proj.status}</strong></span>
                        <span>Due: {proj.expectedDeliveryDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Verified Client Endorsements</h3>
                <button onClick={() => setActiveTab('portfolio')} className="text-xs text-emerald-600 font-semibold hover:underline">
                  View portfolio
                </button>
              </div>

              {reviews.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Reviews will appear here once you successfully complete your first project.
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.slice(0, 2).map((rev) => (
                    <div key={rev.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-white">
                        <span>{rev.reviewerName}</span>
                        <span className="text-amber-500">★ {rev.rating}/5</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 italic">"{rev.comment}"</p>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        ✓ Verified outcome: {rev.verifiedDeliverableSummary}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Gamified Milestones & Proof Level Showcase Card */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Proof Reputation
                </span>
                <span className="text-xs text-slate-400">· Gamified Work Milestones</span>
              </div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>Milestone Proof Badges</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h3>
              <p className="text-xs text-slate-300 max-w-xl">
                Earn verified credentials like Early Adopter, Top Rated, and Project Completed as you deliver real work for Indian businesses.
              </p>
              <div className="pt-2">
                <Badges
                  profile={profile}
                  user={currentUser}
                  reviews={reviews}
                  submissions={submissions}
                  projects={activeProjects}
                  payments={payments}
                  variant="strip"
                  isOwner={true}
                />
              </div>
            </div>

            <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-3">
              <button
                onClick={() => setActiveTab('badges')}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition shadow-md flex items-center gap-2"
              >
                <Award className="w-4 h-4" />
                <span>Explore Badges & XP</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Applications */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              My Submitted Applications ({applications.length})
            </h2>
            <button
              onClick={() => onNavigate('browse')}
              className="text-xs font-semibold text-emerald-600 hover:underline"
            >
              + Find More Projects
            </button>
          </div>

          {applications.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <Clock className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">No applications yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Explore open project listings and apply with your work samples.
              </p>
              <button
                onClick={() => onNavigate('browse')}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"
              >
                Browse Projects
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">{app.projectTitle}</h3>
                      <div className="text-xs text-slate-500 mt-0.5">Applied on {new Date(app.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                        app.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' :
                        app.status === 'OFFER_EXTENDED' ? 'bg-indigo-100 text-indigo-800 animate-pulse' :
                        app.status === 'SHORTLISTED' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs space-y-2">
                    <div>
                      <strong className="text-slate-700 dark:text-slate-300">Your Pitch:</strong>
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5">{app.pitchMessage}</p>
                    </div>
                    {app.portfolioSamples.length > 0 && (
                      <div>
                        <strong className="text-slate-700 dark:text-slate-300">Submitted Samples:</strong>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {app.portfolioSamples.map((s, idx) => (
                            <a
                              key={idx}
                              href={s.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-emerald-600 hover:underline inline-flex items-center gap-1"
                            >
                              <span>{s.title}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Active Projects & Submissions */}
      {activeTab === 'active_projects' && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Active Projects & Deliverable Submissions
          </h2>

          {activeProjects.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              No active projects in progress right now.
            </div>
          ) : (
            <div className="space-y-6">
              {activeProjects.map((proj) => {
                const projSubmissions = submissions.filter((s) => s.projectId === proj.id);
                const latestSub = projSubmissions[0];
                const isSubmittingThis = submittingProjectId === proj.id;
                const pendingScopeChange = marketplaceStore.getScopeChangeRequests(proj.id).find((r) => r.status === 'PENDING');

                return (
                  <div key={proj.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="text-xs text-slate-500 font-medium">{proj.businessName}</div>
                        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{proj.title}</h3>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-900 dark:text-white">₹{proj.budgetINR.toLocaleString('en-IN')} INR</div>
                        <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          proj.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                          proj.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' :
                          proj.status === 'REVISION_REQUESTED' ? 'bg-amber-100 text-amber-800' :
                          'bg-indigo-100 text-indigo-800'
                        }`}>
                          {proj.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Scope Lock & Work Trail Action Bar */}
                    <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => setActiveScopeLockProject(proj)}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:border-emerald-500 transition flex items-center gap-1.5 shadow-2xs"
                      >
                        <Lock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Scope Lock Contract</span>
                      </button>

                      <button
                        onClick={() => setActiveWorkTrailProjectId(proj.id)}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:border-indigo-500 transition flex items-center gap-1.5 shadow-2xs"
                      >
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Work Trail Timeline</span>
                      </button>

                      {(proj.status === 'IN_PROGRESS' || proj.status === 'REVISION_REQUESTED') && (
                        <button
                          onClick={() => setActiveScopeChangeProject(proj)}
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:border-indigo-500 transition flex items-center gap-1.5 shadow-2xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Propose Scope Change</span>
                        </button>
                      )}
                    </div>

                    {/* Pending Scope Change Alert (from Client) */}
                    {pendingScopeChange && (
                      <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border-2 border-indigo-200 dark:border-indigo-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-0.5">
                          <div className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                            <RotateCcw className="w-4 h-4 text-indigo-600" />
                            <span>
                              {pendingScopeChange.requestedByUserId === currentUser.id
                                ? 'Your Scope Change Proposal is Pending Client Decision'
                                : 'Incoming Scope Change Proposal from Business Client'}
                            </span>
                          </div>
                          <p className="text-indigo-800 dark:text-indigo-300">
                            Proposed: Budget ₹{pendingScopeChange.proposedBudgetINR.toLocaleString('en-IN')} INR · Deadline {pendingScopeChange.proposedDeadline}
                          </p>
                          <p className="text-[11px] text-slate-500 italic">
                            "{pendingScopeChange.reason}"
                          </p>
                        </div>

                        {pendingScopeChange.requestedByUserId !== currentUser.id ? (
                          <button
                            onClick={() => setReviewingScopeChange({ project: proj, request: pendingScopeChange })}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shrink-0 shadow-xs"
                          >
                            Review & Respond
                          </button>
                        ) : (
                          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200">
                            Awaiting Client
                          </span>
                        )}
                      </div>
                    )}

                    {/* Deliverables checklist */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Expected Deliverables:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {proj.deliverables.map((d) => (
                          <div key={d.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{d.title}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{d.format}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Latest Revision Feedback if requested */}
                    {latestSub?.status === 'REVISION_REQUESTED' && latestSub.revisionFeedback && (
                      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs space-y-1">
                        <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <span>Client Requested Revision:</span>
                        </div>
                        <p className="text-amber-800 dark:text-amber-400 leading-relaxed">
                          "{latestSub.revisionFeedback}"
                        </p>
                      </div>
                    )}

                    {/* Submission History */}
                    {projSubmissions.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-slate-500">Submission History:</div>
                        <div className="space-y-2">
                          {projSubmissions.map((sub) => (
                            <div key={sub.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs flex items-center justify-between">
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white">Version {sub.version}</span>
                                <span className="text-slate-400 ml-2">({new Date(sub.submittedAt).toLocaleDateString()})</span>
                                <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5 line-clamp-1">{sub.notes}</p>
                              </div>
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white dark:bg-slate-700">
                                {sub.status.replace('_', ' ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Submission Form Trigger or Box */}
                    {proj.status !== 'COMPLETED' && (
                      <div>
                        {isSubmittingThis ? (
                          <form onSubmit={(e) => handleSubmitWork(e, proj.id)} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Submit Work for Client Review</h4>
                            
                            {formError && (
                              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">{formError}</div>
                            )}

                            <div>
                              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Delivery Notes & Instructions *
                              </label>
                              <textarea
                                rows={3}
                                value={submissionNotes}
                                onChange={(e) => setSubmissionNotes(e.target.value)}
                                placeholder="Detail what you built, attached files, or deployment notes..."
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Live Preview / Figma / GitHub URL
                              </label>
                              <input
                                type="url"
                                value={submissionLiveLink}
                                onChange={(e) => setSubmissionLiveLink(e.target.value)}
                                placeholder="https://..."
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Primary Deliverable File Name
                              </label>
                              <input
                                type="text"
                                value={submissionFileName}
                                onChange={(e) => setSubmissionFileName(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                                required
                              />
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                              <button
                                type="submit"
                                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition"
                              >
                                Submit Deliverable
                              </button>
                              <button
                                type="button"
                                onClick={() => setSubmittingProjectId(null)}
                                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium hover:bg-slate-100"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <button
                            onClick={() => setSubmittingProjectId(proj.id)}
                            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs hover:opacity-90 transition flex items-center gap-2"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Submit Deliverable (Version {projSubmissions.length + 1})</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Payment Tracking */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Audited Payment Records</h2>
              <p className="text-xs text-slate-500">All payments are in INR with traceable bank UTR references</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Total Cleared</span>
              <div className="text-xl font-black text-emerald-600">
                ₹{profile.totalEarnedINR.toLocaleString('en-IN')} INR
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40 text-xs text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Zero Deductions Guarantee:</strong> You receive 100% of agreed micro-project budgets. Proof-to-Pay charges businesses separately for platform commissions—no fee is deducted from your earnings.
            </span>
          </div>

          <div className="space-y-4">
            {payments.map((pay) => {
              const canConfirm = pay.status === 'REPORTED_BY_BUSINESS' || (pay.status === 'PAID' && !pay.confirmedAt);
              const isConfirmed = pay.status === 'RECEIPT_CONFIRMED_BY_CREATOR' || !!pay.confirmedAt;
              const isDisputed = pay.status === 'DISPUTED';

              return (
                <div key={pay.id} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-slate-900 dark:text-white">{pay.projectTitle}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Method: {pay.paymentMethod} {pay.transactionReferenceUTR && `· UTR: ${pay.transactionReferenceUTR}`}
                    </div>
                    {pay.notes && <p className="text-xs text-slate-400 italic">{pay.notes}</p>}
                    {isConfirmed && pay.confirmedAt && (
                      <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>You confirmed receipt on {new Date(pay.confirmedAt).toLocaleDateString()}</span>
                      </p>
                    )}
                    {isDisputed && (
                      <p className="text-[11px] text-rose-600 font-semibold">
                        Dispute filed with platform administration.
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col sm:items-end gap-2 shrink-0">
                    <div className="font-extrabold text-base text-slate-900 dark:text-white">
                      ₹{pay.amountINR.toLocaleString('en-IN')} INR
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-block ${
                      isConfirmed
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : isDisputed
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        : pay.status === 'REPORTED_BY_BUSINESS' || pay.status === 'PAID'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}>
                      {pay.status.replace(/_/g, ' ')}
                    </span>

                    {/* Creator Actions when business reported payment */}
                    {canConfirm && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleConfirmPaymentReceipt(pay.projectId)}
                          className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition shadow-sm"
                        >
                          Confirm Receipt
                        </button>
                        <button
                          onClick={() => handleDisputePayment(pay.projectId)}
                          className="px-2.5 py-1 rounded-xl border border-rose-300 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-[11px] font-medium transition"
                        >
                          Dispute
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Milestones & Badges */}
      {activeTab === 'badges' && (
        <Badges
          profile={profile}
          user={currentUser}
          reviews={reviews}
          submissions={submissions}
          projects={activeProjects}
          payments={payments}
          variant="full"
          isOwner={true}
          onUpdatePinnedBadges={(newPinned) => {
            marketplaceStore.updateStudentProfile(currentUser.id, { pinnedBadgeIds: newPinned });
          }}
        />
      )}

      {/* Tab 5: Proof Passport Management */}
      {activeTab === 'portfolio' && (
        <div className="space-y-8">
          {/* Top Shareable Passport Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20 dark:border-emerald-500/30">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                  <FileCheck className="w-4 h-4" />
                </span>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Your Public Proof Passport
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl">
                Distinguishes platform-verified deliverables from self-uploaded samples. You decide which eligible completed projects appear publicly. Confidential client files and internal communications remain strictly protected.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  const url = `${window.location.origin}/#portfolio/${profile.verifiedPortfolioSlug}`;
                  navigator.clipboard.writeText(url);
                  alert('Shareable Proof Passport URL copied to clipboard!');
                }}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:border-emerald-500 transition flex items-center gap-1.5 shadow-2xs"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Link</span>
              </button>
              <button
                onClick={() => onNavigate('portfolio', profile.verifiedPortfolioSlug)}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-sm"
              >
                <span>View Public Passport</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* SECTION 1: PROOF PASSPORT VERIFIED CREDENTIALS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Proof Passport: Platform-Verified Outcomes</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                    {passportItems.length} Eligible
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Only projects completed through client deliverable sign-off or platform dispute arbitration qualify. Toggle public visibility anytime.
                </p>
              </div>
            </div>

            {passportItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
                <FileCheck className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p>No completed Proof-to-Pay projects recorded yet.</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  When a client confirms deliverables or an authorized dispute is settled in your favor, the project will automatically appear here with full privacy controls.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {passportItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-emerald-500/20 dark:border-emerald-500/30 space-y-4 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            {item.badgeTitle}
                          </span>

                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-semibold">
                            {item.completionSource === 'DISPUTE_RESOLUTION'
                              ? '⚖️ Confirmed by Dispute Arbitration'
                              : '✓ Confirmed by Client Sign-Off'}
                          </span>

                          <span className="text-[10px] text-slate-400">
                            {item.category}
                          </span>
                        </div>

                        <h4 className="font-extrabold text-base text-slate-900 dark:text-white pt-0.5">
                          {item.projectTitle}
                        </h4>

                        <div className="text-xs text-slate-500">
                          Client: <strong>{item.businessName}</strong> {item.businessCity ? `(${item.businessCity})` : ''} · Completed on {new Date(item.completedAt).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Public Visibility Control Switch */}
                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        <button
                          onClick={() => handleTogglePassportVisibility(item.id, item.isPublic)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs ${
                            item.isPublic
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {item.isPublic ? (
                            <>
                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Public on Passport</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                              <span>Hidden (Private)</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Sanitized Deliverables Description & Inline Edit */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Sanitized Deliverable Outcomes:</span>
                        </span>
                        {editingPassportItemId !== item.id && (
                          <button
                            onClick={() => {
                              setEditingPassportItemId(item.id);
                              setEditingPassportSummary(item.sanitizedSummary);
                            }}
                            className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit Summary</span>
                          </button>
                        )}
                      </div>

                      {editingPassportItemId === item.id ? (
                        <div className="space-y-2 pt-1">
                          <textarea
                            rows={3}
                            value={editingPassportSummary}
                            onChange={(e) => setEditingPassportSummary(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSavePassportSummary(item.id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition"
                            >
                              Save Summary
                            </button>
                            <button
                              onClick={() => setEditingPassportItemId(null)}
                              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium hover:bg-slate-100"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                          {item.sanitizedSummary}
                        </p>
                      )}
                    </div>

                    {item.reviewSnippet && (
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic pl-3 border-l-2 border-emerald-500">
                        "{item.reviewSnippet}"
                      </p>
                    )}

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>Private files and client correspondence are confidential</span>
                      </span>
                      {item.rating ? (
                        <span>★ {item.rating}.0 Verified Rating</span>
                      ) : (
                        <span className="text-slate-400 italic">Rating Pending Client Review</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: SELF-REPORTED PORTFOLIO WORK SAMPLES */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400">
                    <Briefcase className="w-4 h-4" />
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Self-Reported Work Samples ({profile?.portfolioLinks?.length || 0})
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  External portfolio samples (GitHub, Behance, Figma) uploaded by you. Marked as self-reported and distinguished from Proof-to-Pay verified projects.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
                Self-Reported · Not Platform-Verified
              </span>
            </div>

            {/* List of current self-uploaded samples */}
            {profile.portfolioLinks && profile.portfolioLinks.length > 0 ? (
              <div className="space-y-2">
                {profile.portfolioLinks.map((link, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{link.title}</span>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-indigo-600 transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      <p className="text-slate-500 text-[11px] line-clamp-1">{link.description || link.url}</p>
                    </div>

                    <button
                      onClick={() => handleRemoveSelfUploadedSample(idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl">
                No self-uploaded portfolio links yet. Add your external case studies below.
              </div>
            )}

            {/* Add new self-uploaded sample form */}
            <form onSubmit={handleAddSelfUploadedSample} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Add Self-Uploaded Work Link</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newSampleTitle}
                  onChange={(e) => setNewSampleTitle(e.target.value)}
                  placeholder="Sample Title (e.g., E-Commerce App UI Case Study)"
                  className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  required
                />
                <input
                  type="url"
                  value={newSampleUrl}
                  onChange={(e) => setNewSampleUrl(e.target.value)}
                  placeholder="https://behance.net/... or github.com/..."
                  className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  required
                />
              </div>
              <input
                type="text"
                value={newSampleDesc}
                onChange={(e) => setNewSampleDesc(e.target.value)}
                placeholder="Brief description of tech stack, tools used, and deliverables..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Portfolio Sample</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 6: Profile & Skills */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="max-w-2xl bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Edit Creator Profile</h2>

          {profileSaved && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs">
              Profile updated successfully!
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Professional Headline
            </label>
            <input
              type="text"
              value={editHeadline}
              onChange={(e) => setEditHeadline(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Bio & Experience
            </label>
            <textarea
              rows={4}
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Skills (comma separated)
            </label>
            <input
              type="text"
              value={editSkills}
              onChange={(e) => setEditSkills(e.target.value)}
              placeholder="React, TypeScript, Figma, Tailwind CSS"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Payout UPI ID (for INR payment records)
            </label>
            <input
              type="text"
              value={editUpi}
              onChange={(e) => setEditUpi(e.target.value)}
              placeholder="yourname@okhdfcbank"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition"
          >
            Save Profile Changes
          </button>
        </form>
      )}

      {/* Tab 7: Settings & Account Deletion */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Account Settings & Privacy</h2>
            <p className="text-xs text-slate-500 mt-1">Manage data retention and account deletion per platform policy.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white">Adult Participation Policy</h4>
            <p className="text-slate-600 dark:text-slate-400">
              Your age is recorded as {profile.age} years. Proof-to-Pay restricts marketplace participation to adults 18 or older to guarantee legally binding project deliverables.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="font-bold text-rose-600 text-sm">Danger Zone</h4>
            <p className="text-xs text-slate-500">
              Request immediate account deletion. In accordance with data privacy guidelines, your personal identity information, email, and credentials will be purged permanently.
            </p>
            <button
              onClick={handleDeleteAccount}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete My Account</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: EXPLICIT SCOPE LOCK ACCEPTANCE MODAL */}
      {explicitOfferAcceptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 space-y-0">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">
                      Scope Lock — Formal Offer Acceptance
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                      Explicit Agreement Required
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{explicitOfferAcceptModal.projectTitle}</p>
                </div>
              </div>

              <button
                onClick={() => setExplicitOfferAcceptModal(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
              {/* Financial Snapshot */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Your Net Compensation</span>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                    ₹{explicitOfferAcceptModal.agreedBudgetINR.toLocaleString('en-IN')} INR
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                    100% net (₹0 fee deduction)
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Agreed Deadline</span>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
                    {explicitOfferAcceptModal.agreedDeadline}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Permitted Revisions: {explicitOfferAcceptModal.agreedRevisions} cycles
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Hiring Business</span>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
                    {explicitOfferAcceptModal.businessName}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Platform fee (5%) paid separately by client
                  </div>
                </div>
              </div>

              {/* Deliverables Snapshot */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Locked Deliverables Specification ({explicitOfferAcceptModal.deliverablesSnapshot?.length || 0}):
                </h4>
                <div className="space-y-2">
                  {(explicitOfferAcceptModal.deliverablesSnapshot || []).map((del, idx) => (
                    <div key={del.id || idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{idx + 1}. {del.title}</span>
                        <p className="text-slate-500 text-[11px] mt-0.5">{del.description}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-slate-700 dark:text-slate-300 shrink-0 ml-2">
                        {del.format}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cancellation Terms */}
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-1 text-xs text-amber-900 dark:text-amber-300">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Cancellation & Dispute Policy:
                </div>
                <p className="leading-relaxed">
                  {explicitOfferAcceptModal.cancellationTerms || 'Mutual cancellation permits pro-rata payment based on approved milestone deliverables. Unilateral cancellation without cause forfeits platform protections.'}
                </p>
              </div>

              {/* Explicit Acceptance Checklist (ALL REQUIRED) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Required Explicit Acknowledgments:
                </div>

                <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deliverablesAgreed}
                      onChange={(e) => setDeliverablesAgreed(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>I have reviewed the agreed deliverables and accept responsibility to deliver all specifications.</span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deadlineAgreed}
                      onChange={(e) => setDeadlineAgreed(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>I commit to delivering the final assets by the agreed deadline of <strong>{explicitOfferAcceptModal.agreedDeadline}</strong>.</span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={revisionsAgreed}
                      onChange={(e) => setRevisionsAgreed(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>I agree to provide up to <strong>{explicitOfferAcceptModal.agreedRevisions} revisions</strong> within the original agreed project scope.</span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cancellationAgreed}
                      onChange={(e) => setCancellationAgreed(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>I agree to the cancellation terms and understand scope cannot be unilaterally altered without a mutual change request.</span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={feeTermsAgreed}
                      onChange={(e) => setFeeTermsAgreed(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>I confirm understanding that I receive the full ₹{explicitOfferAcceptModal.agreedBudgetINR.toLocaleString('en-IN')} INR directly with ₹0 fee deduction.</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleDeclineOffer(explicitOfferAcceptModal.id)}
                  className="px-4 py-2.5 rounded-xl border border-rose-300 text-rose-600 dark:text-rose-400 hover:bg-rose-50 text-xs font-semibold transition"
                >
                  Decline Offer
                </button>

                <button
                  type="button"
                  onClick={handleConfirmExplicitScopeLock}
                  disabled={!deliverablesAgreed || !deadlineAgreed || !revisionsAgreed || !cancellationAgreed || !feeTermsAgreed}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md transition flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Confirm & Explicitly Accept Scope Lock</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SCOPE LOCK MODAL */}
      {activeScopeLockProject && (
        <ScopeLockModal
          project={activeScopeLockProject}
          currentUser={currentUser}
          onClose={() => setActiveScopeLockProject(null)}
          onRequestScopeChange={() => {
            const p = activeScopeLockProject;
            setActiveScopeLockProject(null);
            setActiveScopeChangeProject(p);
          }}
        />
      )}

      {/* MODAL 3: WORK TRAIL TIMELINE MODAL */}
      {activeWorkTrailProjectId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 my-8 max-h-[85vh] overflow-y-auto">
            <WorkTrail
              projectId={activeWorkTrailProjectId}
              currentUser={currentUser}
              onClose={() => setActiveWorkTrailProjectId(null)}
            />
          </div>
        </div>
      )}

      {/* MODAL 4: PROPOSE SCOPE CHANGE MODAL */}
      {activeScopeChangeProject && (
        <ScopeChangeModal
          project={activeScopeChangeProject}
          currentUser={currentUser}
          onClose={() => setActiveScopeChangeProject(null)}
          onSuccess={() => {
            setActiveScopeChangeProject(null);
            window.location.reload();
          }}
        />
      )}

      {/* MODAL 5: REVIEW INCOMING SCOPE CHANGE REQUEST */}
      {reviewingScopeChange && (
        <ScopeChangeModal
          project={reviewingScopeChange.project}
          currentUser={currentUser}
          pendingRequest={reviewingScopeChange.request}
          onClose={() => setReviewingScopeChange(null)}
          onSuccess={() => {
            setReviewingScopeChange(null);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};
