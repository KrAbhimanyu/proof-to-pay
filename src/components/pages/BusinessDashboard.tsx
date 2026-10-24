import React, { useState } from 'react';
import {
  User,
  BusinessProfile,
  ProjectListing,
  Application,
  ProjectOffer,
  ProjectSubmission,
  PaymentRecord,
  VerifiedReview,
  PlatformCommissionRecord,
  ScopeChangeRequest
} from '../../types';
import { marketplaceStore } from '../../lib/storage';
import { BusinessVerificationSchema, ProjectListingSchema, ProjectOfferSchema, RevisionRequestSchema, RecordPaymentSchema, ReviewSubmissionSchema } from '../../lib/schemas';
import { Badges } from '../common/Badges';
import { ScopeLockModal } from '../common/ScopeLockModal';
import { ScopeChangeModal } from '../common/ScopeChangeModal';
import { WorkTrail } from '../common/WorkTrail';
import { ProjectPerformanceWidget } from '../common/ProjectPerformanceWidget';
import { WorkflowJourneyTracker } from '../common/WorkflowJourneyTracker';
import confetti from 'canvas-confetti';
import {
  Building2,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Plus,
  Send,
  Eye,
  FileCheck,
  IndianRupee,
  Clock,
  RotateCcw,
  Check,
  Star,
  ExternalLink,
  Users,
  Briefcase,
  Coins,
  Receipt,
  Info,
  Sparkles,
  Lock,
  LogOut,
  MessageSquare,
  BarChart3
} from 'lucide-react';

interface Props {
  currentUser: User;
  onNavigate: (view: string, param?: string) => void;
  onLogout?: () => void;
  controlledTab?: string;
  onTabChange?: (tab: string) => void;
  onOpenChat?: (params?: {
    conversationId?: string;
    targetUser?: { id: string; name: string; role: 'STUDENT' | 'BUSINESS' | 'ADMIN' | 'RECRUITER' };
    targetProjectId?: string;
    targetOfferId?: string;
  }) => void;
}

export const BusinessDashboard: React.FC<Props> = ({
  currentUser,
  onNavigate,
  onLogout,
  controlledTab,
  onTabChange,
  onOpenChat,
}) => {
  const [internalTab, setInternalTab] = useState<'overview' | 'projects' | 'create_project' | 'applications' | 'active_work' | 'payments' | 'verification' | 'performance'>('overview');
  
  const activeTab = (controlledTab as any) || internalTab;
  const setActiveTab = (tab: any) => {
    setInternalTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const profile = marketplaceStore.getBusinessProfile(currentUser.id) || {
    userId: currentUser.id,
    companyName: currentUser.name,
    industry: 'Software & Technology',
    city: currentUser.city || 'Bengaluru',
    verificationStatus: 'UNVERIFIED',
    totalSpentINR: 0,
    projectsPostedCount: 0,
  };

  const businessProjects = marketplaceStore.getProjects().filter((p) => p.businessId === currentUser.id);
  const applications = marketplaceStore.getApplications().filter((a) => {
    const proj = businessProjects.find((p) => p.id === a.projectId);
    return !!proj;
  });
  const offers = marketplaceStore.getOffers().filter((o) => o.businessId === currentUser.id);
  const submissions = marketplaceStore.getSubmissions().filter((s) => {
    const proj = businessProjects.find((p) => p.id === s.projectId);
    return !!proj;
  });
  const payments = marketplaceStore.getPayments().filter((p) => p.businessId === currentUser.id);
  const commissions = marketplaceStore.getPlatformCommissions().filter((c) => c.businessId === currentUser.id);
  const allReviews = marketplaceStore.getReviews();
  const monetizationConfig = marketplaceStore.getMonetizationConfig();

  // --- Commission Fee Payment State ---
  const [reportingCommissionModal, setReportingCommissionModal] = useState<PlatformCommissionRecord | null>(null);
  const [commissionPaymentUTR, setCommissionPaymentUTR] = useState('');
  const [commissionPaymentMethod, setCommissionPaymentMethod] = useState<'UPI' | 'NEFT_IMPS' | 'BANK_TRANSFER'>('UPI');
  const [commissionPaymentNotes, setCommissionPaymentNotes] = useState('');
  const [paymentSubTab, setPaymentSubTab] = useState<'creator_payouts' | 'platform_fees'>('creator_payouts');

  // --- Create Project Form State ---
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('UI/UX & Product Design');
  const [newSkills, setNewSkills] = useState('Figma, UI/UX Design, Mobile App UI');
  const [newBudget, setNewBudget] = useState(15000);
  const [newDays, setNewDays] = useState(10);
  const [newRevisions, setNewRevisions] = useState(2);
  const [newTerms, setNewTerms] = useState('100% paid via direct bank transfer / UPI within 24 hours of client sign-off.');
  const [newDeliverables, setNewDeliverables] = useState<{ id: string; title: string; description: string; format: string }[]>([
    { id: 'del-1', title: 'Main Project Asset Kit', description: 'Complete source files and documentation', format: 'Figma / ZIP' }
  ]);
  const [newCriteria, setNewCriteria] = useState<string[]>([
    'Strict adherence to agreed brand guidelines and color hierarchy',
    'Responsive components tested across mobile and desktop breakpoints'
  ]);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [projectSuccess, setProjectSuccess] = useState<string | null>(null);

  // --- Offer Creation Modal / State ---
  const [offeringApp, setOfferingApp] = useState<Application | null>(null);
  const [offerBudget, setOfferBudget] = useState(15000);
  const [offerDeadline, setOfferDeadline] = useState('2026-10-30');
  const [offerRevisions, setOfferRevisions] = useState(2);
  const [offerScope, setOfferScope] = useState('');
  const [offerError, setOfferError] = useState<string | null>(null);

  // --- Revision / Approval State ---
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [revisionModalProjectId, setRevisionModalProjectId] = useState<string | null>(null);

  // --- Record Payment State ---
  const [paymentProjectId, setPaymentProjectId] = useState<string | null>(null);
  const [paymentUTR, setPaymentUTR] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'NEFT_IMPS' | 'BANK_TRANSFER'>('UPI');
  const [paymentNotes, setPaymentNotes] = useState('');

  // --- Review Modal State ---
  const [reviewProjectId, setReviewProjectId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewDeliverableSummary, setReviewDeliverableSummary] = useState('');

  // --- Scope Lock & Work Trail Modal States ---
  const [activeScopeLockProject, setActiveScopeLockProject] = useState<ProjectListing | null>(null);
  const [activeWorkTrailProjectId, setActiveWorkTrailProjectId] = useState<string | null>(null);
  const [activeScopeChangeProject, setActiveScopeChangeProject] = useState<ProjectListing | null>(null);
  const [reviewingScopeChange, setReviewingScopeChange] = useState<{ project: ProjectListing; request: ScopeChangeRequest } | null>(null);

  // --- Verification Form State ---
  const [legalName, setLegalName] = useState(profile.verificationDetails?.legalEntityName || '');
  const [docType, setDocType] = useState<'GSTIN' | 'CIN' | 'PAN' | 'UDYAM_MSME'>('GSTIN');
  const [docNumber, setDocNumber] = useState(profile.verificationDetails?.documentNumber || '');
  const [verifError, setVerifError] = useState<string | null>(null);
  const [verifSuccess, setVerifSuccess] = useState<string | null>(null);

  // Handle Verification Submission
  const handleVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setVerifError(null);
    setVerifSuccess(null);

    const validation = BusinessVerificationSchema.safeParse({
      legalEntityName: legalName,
      documentType: docType,
      documentNumber: docNumber,
    });

    if (!validation.success) {
      setVerifError(validation.error.issues[0]?.message || 'Please check document details.');
      return;
    }

    try {
      marketplaceStore.submitBusinessVerification(currentUser.id, validation.data);
      setVerifSuccess('Business verification submitted for platform administrator review!');
    } catch (err: any) {
      setVerifError(err.message);
    }
  };

  // Handle Create Project
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    setProjectError(null);
    setProjectSuccess(null);

    const skillsArray = newSkills.split(',').map((s) => s.trim()).filter(Boolean);

    const validation = ProjectListingSchema.safeParse({
      title: newTitle,
      summary: newSummary,
      description: newDesc,
      category: newCategory,
      requiredSkills: skillsArray,
      budgetINR: newBudget,
      deadlineDays: newDays,
      permittedRevisions: newRevisions,
      deliverables: newDeliverables,
      acceptanceCriteria: newCriteria,
      paymentTerms: newTerms,
    });

    if (!validation.success) {
      setProjectError(validation.error.issues[0]?.message || 'Please fill all required project fields.');
      return;
    }

    try {
      marketplaceStore.createProject(
        currentUser,
        {
          title: newTitle,
          summary: newSummary,
          description: newDesc,
          category: newCategory,
          requiredSkills: skillsArray,
          deliverables: newDeliverables,
          acceptanceCriteria: newCriteria,
          budgetINR: newBudget,
          deadlineDays: newDays,
          expectedDeliveryDate: new Date(Date.now() + newDays * 86400000).toISOString().split('T')[0],
          permittedRevisions: newRevisions,
          applicationClosingDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          paymentTerms: newTerms,
        },
        true // Submit for moderation
      );

      setProjectSuccess('Project submitted for admin moderation! Upon review, it will be published to eligible students.');
      setNewTitle('');
      setNewSummary('');
      setNewDesc('');
      setActiveTab('projects');
    } catch (err: any) {
      setProjectError(err.message);
    }
  };

  // Handle Issue Formal Offer
  const handleIssueOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offeringApp) return;
    setOfferError(null);

    const validation = ProjectOfferSchema.safeParse({
      agreedBudgetINR: offerBudget,
      agreedDeadline: offerDeadline,
      agreedRevisions: offerRevisions,
      scopeSummary: offerScope,
    });

    if (!validation.success) {
      setOfferError(validation.error.issues[0]?.message || 'Please check offer fields.');
      return;
    }

    try {
      const targetProj = businessProjects.find((p) => p.id === offeringApp.projectId);
      marketplaceStore.issueOffer(
        currentUser,
        offeringApp.projectId,
        offeringApp.studentId,
        offerBudget,
        offerDeadline,
        offerRevisions,
        offerScope,
        'Mutual cancellation permits pro-rata payment based on approved milestone deliverables. Unilateral cancellation without cause forfeits platform protections.',
        targetProj?.deliverables
      );
      setOfferingApp(null);
      alert('Formal offer extended with locked deliverable terms! Awaiting student explicit acceptance.');
    } catch (err: any) {
      setOfferError(err.message);
    }
  };

  // Handle Approve Work
  const handleApproveWork = (projectId: string) => {
    if (window.confirm('Approve student submission and mark project as completed? This initiates the payment record step.')) {
      marketplaceStore.approveWorkAndComplete(currentUser, projectId);
      confetti({ particleCount: 70, spread: 60 });
      setPaymentProjectId(projectId);
    }
  };

  // Handle Request Revision
  const handleRequestRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionModalProjectId) return;

    const validation = RevisionRequestSchema.safeParse({ feedback: revisionFeedback });
    if (!validation.success) {
      alert(validation.error.issues[0]?.message);
      return;
    }

    try {
      marketplaceStore.requestRevision(currentUser, revisionModalProjectId, revisionFeedback);
      setRevisionModalProjectId(null);
      setRevisionFeedback('');
      alert('Revision request sent to creator within permitted project limit.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle Record Payment
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentProjectId) return;

    const validation = RecordPaymentSchema.safeParse({
      transactionReferenceUTR: paymentUTR,
      paymentMethod,
      notes: paymentNotes,
    });

    if (!validation.success) {
      alert(validation.error.issues[0]?.message);
      return;
    }

    try {
      marketplaceStore.recordPayment(currentUser, paymentProjectId, paymentUTR, paymentMethod, paymentNotes);
      setPaymentProjectId(null);
      setPaymentUTR('');
      setPaymentNotes('');
      alert('Payment record successfully logged in audit trail!');
      setActiveTab('payments');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle Report Platform Commission Payment
  const handleReportCommissionPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingCommissionModal) return;

    if (!commissionPaymentUTR || commissionPaymentUTR.trim().length < 4) {
      alert('Please enter a valid bank transfer reference or UPI UTR number.');
      return;
    }

    try {
      marketplaceStore.reportPlatformCommissionPayment(
        currentUser,
        reportingCommissionModal.id,
        commissionPaymentUTR,
        commissionPaymentMethod,
        commissionPaymentNotes
      );
      setReportingCommissionModal(null);
      setCommissionPaymentUTR('');
      setCommissionPaymentNotes('');
      alert('Platform commission payment reported! An administrator will audit the transaction evidence.');
      setActiveTab('payments');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle Review Submission
  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewProjectId) return;

    const validation = ReviewSubmissionSchema.safeParse({
      rating: reviewRating,
      comment: reviewComment,
      verifiedDeliverableSummary: reviewDeliverableSummary,
    });

    if (!validation.success) {
      alert(validation.error.issues[0]?.message);
      return;
    }

    try {
      marketplaceStore.addReview(
        currentUser,
        reviewProjectId,
        reviewRating,
        reviewComment,
        reviewDeliverableSummary
      );
      setReviewProjectId(null);
      setReviewComment('');
      setReviewDeliverableSummary('');
      alert('Verified review submitted and credited to student portfolio!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Identity Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-1 shadow-md shrink-0">
            {currentUser.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover rounded-[14px]" />
            ) : (
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-white font-bold text-xl">
                {profile.companyName[0]}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                {profile.companyName}
              </h1>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                profile.verificationStatus === 'VERIFIED'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : profile.verificationStatus === 'PENDING'
                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                {profile.verificationStatus === 'VERIFIED' ? '✓ GSTIN / CIN Verified' : profile.verificationStatus}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{profile.industry} · {profile.city}</p>
          </div>
        </div>

        {/* Quick CTA */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('create_project')}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Project</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign out of account"
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 sm:gap-4 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'overview' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Overview
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`pb-3 px-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'projects' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          My Listings ({businessProjects.length})
        </button>

        <button
          onClick={() => setActiveTab('applications')}
          className={`pb-3 px-2 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'applications' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Applicants ({applications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('active_work')}
          className={`pb-3 px-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'active_work' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Active Projects & Reviews
        </button>

        <button
          onClick={() => setActiveTab('performance')}
          className={`pb-3 px-2 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'performance' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Project Performance (D3)</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 px-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'payments' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Payment Records
        </button>

        <button
          onClick={() => setActiveTab('verification')}
          className={`pb-3 px-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'verification' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Business Verification
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* End-to-End 10-Stage Workflow Journey Tracker */}
          <WorkflowJourneyTracker
            currentUser={currentUser}
            onNavigate={(view, tab) => {
              if (view === 'business_dashboard' && tab) {
                setActiveTab(tab);
              } else {
                onNavigate(view, tab);
              }
            }}
            onOpenVerificationModal={() => setActiveTab('verification')}
            onOpenPostProjectModal={() => setActiveTab('create_project')}
          />

          {profile.verificationStatus !== 'VERIFIED' && (
            <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-sm text-amber-900 dark:text-amber-300">
                  {profile.verificationStatus === 'PENDING' ? 'Verification Under Admin Review' : 'Complete Business Verification'}
                </h3>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  Verified businesses gain 4x higher applicant engagement and publish projects instantly without waiting periods.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('verification')}
                className="px-4 py-2 rounded-xl bg-amber-600 text-white font-semibold text-xs hover:bg-amber-700 transition shrink-0"
              >
                {profile.verificationStatus === 'PENDING' ? 'View Status' : 'Submit GSTIN / CIN'}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-slate-400">Total Projects Posted</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{businessProjects.length}</div>
            </div>
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-slate-400">Active Creator Applications</span>
              <div className="text-2xl font-black text-indigo-600">{applications.length}</div>
            </div>
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-slate-400">Total Disbursed (INR)</span>
              <div className="text-2xl font-black text-emerald-600">
                ₹{payments.filter((p) => p.status === 'PAID').reduce((acc, p) => acc + p.amountINR, 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* D3 Project Performance Widget */}
          <ProjectPerformanceWidget
            projects={businessProjects}
            reviews={allReviews}
            submissions={submissions}
            businessId={currentUser.id}
            onNavigateToProjects={() => setActiveTab('create_project')}
          />
        </div>
      )}

      {/* Tab: Dedicated Project Performance Analytics View */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          <ProjectPerformanceWidget
            projects={businessProjects}
            reviews={allReviews}
            submissions={submissions}
            businessId={currentUser.id}
            onNavigateToProjects={() => setActiveTab('create_project')}
          />
        </div>
      )}

      {/* Tab 2: Create Project */}
      {activeTab === 'create_project' && (
        <form onSubmit={handleCreateProject} className="max-w-3xl bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create New Project Listing</h2>
            <p className="text-xs text-slate-500 mt-1">
              Scope, deliverables, and fixed INR budget are frozen upon student offer acceptance to eliminate scope creep.
            </p>
          </div>

          {projectError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{projectError}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Project Title *
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Next.js Landing Page with Tailwind CSS"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category *
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <option>UI/UX & Product Design</option>
                  <option>Web & Mobile Development</option>
                  <option>Brand Identity & Packaging</option>
                  <option>Video Editing & Motion Graphics</option>
                  <option>AI & Automation Scripting</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Required Skills (comma separated) *
                </label>
                <input
                  type="text"
                  value={newSkills}
                  onChange={(e) => setNewSkills(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Brief One-Sentence Summary *
              </label>
              <input
                type="text"
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
                placeholder="Short summary visible on search cards..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Thorough Scope & Context *
              </label>
              <textarea
                rows={4}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Describe project background, user persona, technical constraints, and expectations..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Fixed Budget (INR ₹) *
                </label>
                <input
                  type="number"
                  min={1000}
                  step={500}
                  value={newBudget}
                  onChange={(e) => setNewBudget(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Duration (Days) *
                </label>
                <input
                  type="number"
                  min={2}
                  max={90}
                  value={newDays}
                  onChange={(e) => setNewDays(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Permitted Revisions (1-5) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={newRevisions}
                  onChange={(e) => setNewRevisions(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Terms & Release Criteria *
              </label>
              <input
                type="text"
                value={newTerms}
                onChange={(e) => setNewTerms(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                required
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-400">Moderation takes &lt; 2 hours for verified businesses.</span>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition"
            >
              Submit Project for Moderation
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: My Listings */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Posted Project Listings</h2>
            <button
              onClick={() => setActiveTab('create_project')}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
            >
              + Post Another
            </button>
          </div>

          <div className="space-y-4">
            {businessProjects.map((p) => (
              <div key={p.id} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">{p.title}</h3>
                    <div className="text-xs text-slate-500 mt-0.5">Budget: ₹{p.budgetINR.toLocaleString('en-IN')} INR · {p.category}</div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                    p.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                    p.status === 'PENDING_REVIEW' ? 'bg-amber-100 text-amber-800' :
                    p.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {p.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{p.summary}</p>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Closing Date: {p.applicationClosingDate}</span>
                  <button
                    onClick={() => onNavigate('project_detail', p.id)}
                    className="text-emerald-600 hover:underline font-semibold"
                  >
                    View Public Page
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Applications & Issue Offer */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Received Student Applications ({applications.length})
          </h2>

          {applications.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              No applications received yet for your projects.
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300">
                        {app.studentName[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">{app.studentName}</h4>
                          <button
                            onClick={() => onNavigate('portfolio', app.studentName.toLowerCase().replace(/\s+/g, '-'))}
                            className="text-[10px] text-emerald-600 font-semibold hover:underline"
                          >
                            View Portfolio
                          </button>
                        </div>
                        <div className="text-xs text-slate-500">Applied for: {app.projectTitle}</div>

                        {/* Applicant Earned Milestones */}
                        {(() => {
                          const sProfile = marketplaceStore.getStudentProfile(app.studentId);
                          const sUser = marketplaceStore.getUsers().find((u) => u.id === app.studentId) || {
                            id: app.studentId,
                            name: app.studentName,
                            email: '',
                            role: 'STUDENT' as const,
                            createdAt: app.createdAt,
                          };
                          if (!sProfile) return null;
                          return (
                            <div className="mt-1.5">
                              <Badges profile={sProfile} user={sUser} variant="strip" />
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
                        {app.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs space-y-2">
                    <p className="text-slate-700 dark:text-slate-300"><strong>Pitch:</strong> {app.pitchMessage}</p>
                    {app.portfolioSamples.length > 0 && (
                      <div>
                        <strong className="text-slate-700 dark:text-slate-300">Work Samples:</strong>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {app.portfolioSamples.map((s, i) => (
                            <a
                              key={i}
                              href={s.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-600 hover:underline inline-flex items-center gap-1"
                            >
                              <span>{s.title}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {app.status !== 'ACCEPTED' && app.status !== 'OFFER_EXTENDED' && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          setOfferingApp(app);
                          setOfferScope(`Agreed deliverables as specified in listing for "${app.projectTitle}".`);
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition"
                      >
                        Issue Formal Project Offer
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Active Work & Reviews */}
      {activeTab === 'active_work' && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Projects & Submissions</h2>

          <div className="space-y-6">
            {businessProjects.filter((p) => p.status === 'IN_PROGRESS' || p.status === 'SUBMITTED' || p.status === 'REVISION_REQUESTED' || p.status === 'COMPLETED').map((proj) => {
              const projSubs = submissions.filter((s) => s.projectId === proj.id);
              const latestSub = projSubs[0];

              return (
                <div key={proj.id} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">{proj.title}</h3>
                      <div className="text-xs text-slate-500">Student: <strong>{proj.selectedStudentName}</strong></div>
                    </div>
                    <span className="text-xs font-bold uppercase px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800">
                      {proj.status.replace('_', ' ')}
                    </span>
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

                    {onOpenChat && (
                      <button
                        onClick={() => {
                          const acceptedOffer = offers.find(
                            (o) => o.projectId === proj.id && o.status === 'ACCEPTED'
                          );
                          if (acceptedOffer) {
                            onOpenChat({ targetOfferId: acceptedOffer.id });
                          } else if (proj.selectedStudentId) {
                            onOpenChat({
                              targetUser: { id: proj.selectedStudentId, name: proj.selectedStudentName || 'Creator', role: 'STUDENT' },
                              targetProjectId: proj.id
                            });
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 transition flex items-center gap-1.5 shadow-2xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>Project Chat</span>
                      </button>
                    )}
                  </div>

                  {/* Pending Scope Change Alert (from Student) */}
                  {(() => {
                    const pendingSC = marketplaceStore.getScopeChangeRequests(proj.id).find((r) => r.status === 'PENDING');
                    if (!pendingSC) return null;
                    return (
                      <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border-2 border-indigo-200 dark:border-indigo-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-0.5">
                          <div className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                            <RotateCcw className="w-4 h-4 text-indigo-600" />
                            <span>
                              {pendingSC.requestedByUserId === currentUser.id
                                ? 'Your Scope Change Proposal is Awaiting Creator Decision'
                                : 'Incoming Scope Change Proposal from Creator'}
                            </span>
                          </div>
                          <p className="text-indigo-800 dark:text-indigo-300">
                            Proposed: Budget ₹{pendingSC.proposedBudgetINR.toLocaleString('en-IN')} INR · Deadline {pendingSC.proposedDeadline}
                          </p>
                          <p className="text-[11px] text-slate-500 italic">
                            "{pendingSC.reason}"
                          </p>
                        </div>

                        {pendingSC.requestedByUserId !== currentUser.id ? (
                          <button
                            onClick={() => setReviewingScopeChange({ project: proj, request: pendingSC })}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shrink-0 shadow-xs"
                          >
                            Review & Respond
                          </button>
                        ) : (
                          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200">
                            Awaiting Creator
                          </span>
                        )}
                      </div>
                    );
                  })()}

                  {/* Submission Evaluation */}
                  {latestSub ? (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                        <span>Latest Submission (Version {latestSub.version})</span>
                        <span className="text-slate-400 font-normal">{new Date(latestSub.submittedAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">"{latestSub.notes}"</p>
                      {latestSub.liveLink && (
                        <a
                          href={latestSub.liveLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-600 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <span>Review Live Project Link</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}

                      {proj.status !== 'COMPLETED' && (
                        <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-2">
                          <button
                            onClick={() => handleApproveWork(proj.id)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition"
                          >
                            Approve Work & Finalize
                          </button>
                          <button
                            onClick={() => setRevisionModalProjectId(proj.id)}
                            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            Request Scope Revision ({proj.permittedRevisions} max)
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic">Waiting for student to submit Version 1 deliverables.</div>
                  )}

                  {/* Completed Review & Payment Action */}
                  {proj.status === 'COMPLETED' && (() => {
                    const myReview = allReviews.find((r) => r.projectId === proj.id && r.reviewerId === currentUser.id);
                    const creatorReview = allReviews.find((r) => r.projectId === proj.id && r.reviewerId !== currentUser.id);

                    return (
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          {myReview ? (
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs space-y-1 flex-1">
                              <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-300">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>Verified Review Submitted to Creator</span>
                                <span className="text-amber-500 ml-1">★ {myReview.rating}/5</span>
                              </div>
                              <p className="text-slate-600 dark:text-slate-300 italic">"{myReview.comment}"</p>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setReviewProjectId(proj.id);
                                setReviewDeliverableSummary(`Delivered ${proj.title}`);
                              }}
                              className="px-4 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition flex items-center gap-1.5 shadow-xs"
                            >
                              <Star className="w-3.5 h-3.5 text-amber-400" />
                              <span>Leave Verified Student Review</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setPaymentProjectId(proj.id);
                            }}
                            className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition shrink-0 shadow-xs"
                          >
                            Record / Verify Payment UTR
                          </button>
                        </div>

                        {creatorReview && (
                          <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl text-xs space-y-0.5">
                            <span className="font-bold text-indigo-950 dark:text-indigo-200">
                              Creator Feedback from {proj.selectedStudentName}: ★ {creatorReview.rating}/5
                            </span>
                            <p className="text-slate-600 dark:text-slate-300 italic">"{creatorReview.comment}"</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 6: Payments — Dual Track Ledger */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Business Financial & Settlement Records
              </h2>
              <p className="text-xs text-slate-500">
                Phase 1 Beta separates direct creator earnings from platform commissions.
              </p>
            </div>

            {/* Sub-tab Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-semibold">
              <button
                onClick={() => setPaymentSubTab('creator_payouts')}
                className={`px-3.5 py-1.5 rounded-xl transition ${
                  paymentSubTab === 'creator_payouts'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Direct Creator Payouts ({payments.length})
              </button>
              <button
                onClick={() => setPaymentSubTab('platform_fees')}
                className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                  paymentSubTab === 'platform_fees'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Platform Commission ({commissions.length})</span>
              </button>
            </div>
          </div>

          {/* Sub-Track A: Direct Creator Payouts */}
          {paymentSubTab === 'creator_payouts' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/40 border border-indigo-100 dark:border-slate-800 text-xs text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  <strong>Track A:</strong> Direct settlement between business and creator via UPI or IMPS. Log the valid bank UTR so the creator can confirm receipt.
                </span>
              </div>

              {payments.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                  No creator payment records yet. Complete deliverables will generate payment entries here.
                </div>
              ) : (
                <div className="space-y-4">
                  {payments.map((pay) => (
                    <div
                      key={pay.id}
                      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{pay.projectTitle}</h4>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Amount: <strong>₹{pay.amountINR.toLocaleString('en-IN')} INR</strong> · {pay.paymentMethod}{' '}
                          {pay.transactionReferenceUTR && (
                            <span className="font-mono text-slate-700 dark:text-slate-300">(UTR: {pay.transactionReferenceUTR})</span>
                          )}
                        </div>
                        {pay.confirmedAt && (
                          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Creator confirmed receipt in bank account on {new Date(pay.confirmedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                            pay.status === 'RECEIPT_CONFIRMED_BY_CREATOR' || pay.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : pay.status === 'REPORTED_BY_BUSINESS'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {pay.status.replace(/_/g, ' ')}
                        </span>

                        <button
                          onClick={() => setPaymentProjectId(pay.projectId)}
                          className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                          {pay.transactionReferenceUTR ? 'Update UTR' : 'Record UTR'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sub-Track B: Platform Commission Fees */}
          {paymentSubTab === 'platform_fees' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40 text-xs text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                <Coins className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Track B:</strong> Business platform fee ({monetizationConfig.defaultCommissionRatePercent}% per project) payable directly to Proof-to-Pay upon milestone completion.
                </span>
              </div>

              {commissions.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                  No platform commission records generated yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {commissions.map((comm) => (
                    <div
                      key={comm.id}
                      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">{comm.projectTitle}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                            {comm.commissionRatePercent}% Rate
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Agreed Budget: ₹{comm.projectBudgetINR.toLocaleString('en-IN')} INR · Platform Commission: <strong className="font-mono text-emerald-600 dark:text-emerald-400">₹{comm.platformFeeINR.toLocaleString('en-IN')} INR</strong>
                        </div>
                        {comm.reportedUTR && (
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                            Reported Evidence UTR: {comm.reportedUTR}
                          </div>
                        )}
                        {comm.evidenceReviewedNotes && (
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            Admin Verification: {comm.evidenceReviewedNotes}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                            comm.status === 'VERIFIED_COLLECTED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : comm.status === 'REPORTED_PAID'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : comm.status === 'DUE'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                              : comm.status === 'WAIVED'
                              ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {comm.status.replace(/_/g, ' ')}
                        </span>

                        {comm.status !== 'VERIFIED_COLLECTED' && comm.status !== 'WAIVED' && (
                          <button
                            onClick={() => {
                              setReportingCommissionModal(comm);
                              setCommissionPaymentUTR(comm.reportedUTR || '');
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition"
                          >
                            {comm.reportedUTR ? 'Update Fee UTR' : 'Report Fee Payment'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 7: Verification */}
      {activeTab === 'verification' && (
        <form onSubmit={handleVerificationSubmit} className="max-w-xl bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Business Entity Verification</h2>
            <p className="text-xs text-slate-500 mt-1">
              Indian regulations require verified entity details (GSTIN, CIN, PAN, or MSME Udyam) to list paid creator projects.
            </p>
          </div>

          {verifError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">{verifError}</div>
          )}

          {verifSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs">{verifSuccess}</div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Registered Legal Entity Name *
            </label>
            <input
              type="text"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="e.g. Hyperflow Technologies Private Limited"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Document Type *
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            >
              <option value="GSTIN">GSTIN (Goods and Services Tax)</option>
              <option value="CIN">CIN (Corporate Identification Number)</option>
              <option value="PAN">Company PAN</option>
              <option value="UDYAM_MSME">Udyam MSME Registration</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Government Identifier Number *
            </label>
            <input
              type="text"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              placeholder="e.g. 29AABCH9182K1Z9"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
              required
            />
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition"
          >
            Submit for Verification
          </button>
        </form>
      )}

      {/* Offer Modal */}
      {offeringApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={handleIssueOffer} className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Issue Formal Project Offer to {offeringApp.studentName}
            </h3>
            <p className="text-xs text-slate-500">
              Upon student acceptance, these terms become contractually binding.
            </p>

            {offerError && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl">{offerError}</div>}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Agreed Budget (INR ₹) *</label>
              <input
                type="number"
                value={offerBudget}
                onChange={(e) => setOfferBudget(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                required
              />
            </div>

            {/* Real-time Monetization Commission Breakdown */}
            {(() => {
              const ratePct = monetizationConfig.defaultCommissionRatePercent;
              const feeAmount = Math.round(offerBudget * (ratePct / 100));
              const totalOutlay = offerBudget + feeAmount;

              return (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                    <span className="flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Transparent Fee Terms (Phase 1 Beta)</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                      {ratePct}% Commission
                    </span>
                  </div>

                  <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
                    <div className="flex items-center justify-between">
                      <span>Creator Agreed Payment:</span>
                      <strong className="font-mono text-slate-900 dark:text-white">₹{offerBudget.toLocaleString('en-IN')} INR</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Platform Commission ({ratePct}%):</span>
                      <strong className="font-mono text-emerald-600 dark:text-emerald-400">₹{feeAmount.toLocaleString('en-IN')} INR</strong>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
                      <span>Total Business Outlay:</span>
                      <strong className="font-mono text-indigo-600 dark:text-indigo-400">₹{totalOutlay.toLocaleString('en-IN')} INR</strong>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-emerald-500/10 text-[11px] text-emerald-700 dark:text-emerald-300 leading-relaxed flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Responsible Party:</strong> The business pays the ₹{feeAmount.toLocaleString('en-IN')} platform fee separately to Proof-to-Pay upon completion. The creator receives 100% (₹{offerBudget.toLocaleString('en-IN')} INR) with ₹0 deductions.
                    </span>
                  </div>
                </div>
              );
            })()}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Agreed Delivery Date *</label>
              <input
                type="date"
                value={offerDeadline}
                onChange={(e) => setOfferDeadline(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Scope & Acceptance Summary *</label>
              <textarea
                rows={3}
                value={offerScope}
                onChange={(e) => setOfferScope(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOfferingApp(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs"
              >
                Send Formal Offer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentProjectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={handleRecordPayment} className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Record Payment & Bank UTR</h3>
            <p className="text-xs text-slate-500">Enter bank transfer reference or UPI UTR number.</p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="UPI">UPI Payout</option>
                <option value="NEFT_IMPS">NEFT / IMPS NetBanking</option>
                <option value="BANK_TRANSFER">Direct Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Transaction Reference UTR Number *
              </label>
              <input
                type="text"
                value={paymentUTR}
                onChange={(e) => setPaymentUTR(e.target.value)}
                placeholder="e.g. UTR-HDFC-992182049182"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPaymentProjectId(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs"
              >
                Save Payment Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Revision Request Modal */}
      {revisionModalProjectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={handleRequestRevision} className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Request Deliverable Revision</h3>
            <p className="text-xs text-slate-500">Feedback must be strictly within agreed original scope.</p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Specific Feedback *</label>
              <textarea
                rows={4}
                value={revisionFeedback}
                onChange={(e) => setRevisionFeedback(e.target.value)}
                placeholder="Detail what adjustments are required according to the acceptance criteria..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRevisionModalProjectId(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-600 text-white font-semibold text-xs"
              >
                Send Revision Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Review Modal */}
      {reviewProjectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={handleReviewSubmit} className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Review Creator Deliverable</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Rating (1 to 5 Stars)</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1 text-amber-400 hover:scale-110 transition"
                  >
                    <Star className={`w-6 h-6 ${star <= reviewRating ? 'fill-amber-400' : 'text-slate-300'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Public Testimonial *</label>
              <textarea
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Describe creator speed, communication, and work quality..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Verified Deliverable Summary *</label>
              <input
                type="text"
                value={reviewDeliverableSummary}
                onChange={(e) => setReviewDeliverableSummary(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReviewProjectId(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs"
              >
                Publish Review
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Report Platform Commission Payment Modal */}
      {reportingCommissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleReportCommissionPayment}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Report Platform Commission Payment
                </h3>
                <span className="text-xs text-slate-500">{reportingCommissionModal.projectTitle}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Agreed Project Budget:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ₹{reportingCommissionModal.projectBudgetINR.toLocaleString('en-IN')} INR
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Platform Commission Rate:</span>
                <span className="font-bold text-emerald-600">
                  {reportingCommissionModal.commissionRatePercent}%
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700 font-bold">
                <span className="text-slate-900 dark:text-white">Payable Platform Fee:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                  ₹{reportingCommissionModal.platformFeeINR.toLocaleString('en-IN')} INR
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Settlement Payment Method *
              </label>
              <select
                value={commissionPaymentMethod}
                onChange={(e) => setCommissionPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="UPI">Direct UPI Transfer</option>
                <option value="NEFT_IMPS">NEFT / IMPS NetBanking</option>
                <option value="BANK_TRANSFER">Direct Current Account Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Transaction Reference UTR Number *
              </label>
              <input
                type="text"
                value={commissionPaymentUTR}
                onChange={(e) => setCommissionPaymentUTR(e.target.value)}
                placeholder="e.g. UTR-HDFC-9918230912"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Remittance Notes (Optional)
              </label>
              <input
                type="text"
                value={commissionPaymentNotes}
                onChange={(e) => setCommissionPaymentNotes(e.target.value)}
                placeholder="e.g. Paid via HDFC current account"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Verification Notice:</strong> A UTR or bank reference number is evidence to review. The fee status will remain marked <em>Reported Paid</em> until an authorized administrator verifies the deposit.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReportingCommissionModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition"
              >
                Submit Fee Report
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Scope Lock Modal */}
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

      {/* Work Trail Timeline Modal */}
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

      {/* Propose Scope Change Modal */}
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

      {/* Review Incoming Scope Change Request */}
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
