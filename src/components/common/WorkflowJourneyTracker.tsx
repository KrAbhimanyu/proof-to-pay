import React, { useState } from 'react';
import { User } from '../../types';
import { marketplaceStore } from '../../lib/storage';
import {
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Award,
  Search,
  FileText,
  Lock,
  Briefcase,
  Wallet,
  Star,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
  AlertCircle
} from 'lucide-react';

interface Props {
  currentUser: User;
  onNavigate: (view: string, param?: string) => void;
  onOpenProfileModal?: () => void;
  onOpenVerificationModal?: () => void;
  onOpenPostProjectModal?: () => void;
}

export interface WorkflowStage {
  id: number;
  key: string;
  label: string;
  creatorTitle: string;
  businessTitle: string;
  creatorDescription: string;
  businessDescription: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'UPCOMING';
  actionLabel?: string;
  onAction?: () => void;
}

export const WorkflowJourneyTracker: React.FC<Props> = ({
  currentUser,
  onNavigate,
  onOpenProfileModal,
  onOpenVerificationModal,
  onOpenPostProjectModal,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const isStudent = currentUser.role === 'STUDENT';
  const isBusiness = currentUser.role === 'BUSINESS';

  const studentProfile = isStudent ? marketplaceStore.getStudentProfile(currentUser.id) : null;
  const businessProfile = isBusiness ? marketplaceStore.getBusinessProfile(currentUser.id) : null;
  const projects = marketplaceStore.getProjects();
  const applications = marketplaceStore.getApplications();
  const offers = marketplaceStore.getOffers();
  const submissions = marketplaceStore.getSubmissions();
  const payments = marketplaceStore.getPayments();
  const reviews = marketplaceStore.getReviews();

  // Dynamic status evaluations
  // Stage 1: Signup / Login
  const stage1Done = true;

  // Stage 2: Create Profile
  const stage2Done = isStudent
    ? !!(studentProfile?.headline && studentProfile.headline.length >= 5 && studentProfile?.bio)
    : !!(businessProfile?.companyName && businessProfile.city);

  // Stage 3: Add Skills + Portfolio
  const stage3Done = isStudent
    ? (studentProfile?.skills?.length || 0) >= 1
    : !!(businessProfile?.industry && businessProfile.tagline);

  // Stage 4: Profile Verification
  const verificationStatus = isStudent
    ? (studentProfile?.verificationStatus || 'UNVERIFIED')
    : (businessProfile?.verificationStatus || 'UNVERIFIED');
  const stage4Done = verificationStatus === 'VERIFIED';
  const stage4Pending = verificationStatus === 'PENDING';

  // Stage 5: Search Projects / Post Listing
  const stage5Done = isStudent
    ? applications.some((a) => a.studentId === currentUser.id) || projects.some((p) => p.status === 'APPROVED')
    : projects.some((p) => p.businessId === currentUser.id);

  // Stage 6: Apply / Bid or Receive Applications
  const userApplications = isStudent
    ? applications.filter((a) => a.studentId === currentUser.id)
    : applications.filter((a) => {
        const p = projects.find((proj) => proj.id === a.projectId);
        return p?.businessId === currentUser.id;
      });
  const stage6Done = userApplications.length > 0;

  // Stage 7: Client Selection & Scope Lock Offer
  const userOffers = isStudent
    ? offers.filter((o) => o.studentId === currentUser.id)
    : offers.filter((o) => o.businessId === currentUser.id);
  const stage7Done = userOffers.some((o) => o.status === 'ACCEPTED');
  const stage7Pending = userOffers.some((o) => o.status === 'PENDING');

  // Stage 8: Project Workspace & Deliverables
  const activeProjects = isStudent
    ? projects.filter((p) => p.selectedStudentId === currentUser.id)
    : projects.filter((p) => p.businessId === currentUser.id && !!p.selectedStudentId);
  const stage8Done = activeProjects.some((p) => p.status === 'COMPLETED') || submissions.some((s) => s.studentId === currentUser.id || activeProjects.some(ap => ap.id === s.projectId));
  const stage8Active = activeProjects.some((p) => p.status === 'IN_PROGRESS' || p.status === 'SUBMITTED' || p.status === 'REVISION_REQUESTED');

  // Stage 9: Milestone Payments
  const userPayments = isStudent
    ? payments.filter((p) => p.studentId === currentUser.id)
    : payments.filter((p) => p.businessId === currentUser.id);
  const stage9Done = userPayments.some((p) => p.status === 'RECEIPT_CONFIRMED_BY_CREATOR' || p.status === 'PAID');
  const stage9Pending = userPayments.some((p) => p.status === 'REPORTED_BY_BUSINESS');

  // Stage 10: Reviews & Ratings
  const userReviews = reviews.filter((r) => r.reviewerId === currentUser.id || r.targetUserId === currentUser.id);
  const stage10Done = userReviews.length > 0;

  // Compute 10 Stages
  const stages: WorkflowStage[] = [
    {
      id: 1,
      key: 'signup_login',
      label: 'Signup / Login',
      creatorTitle: 'Account Authentication',
      businessTitle: 'Account Authentication',
      creatorDescription: 'User account created and authenticated session established.',
      businessDescription: 'Business profile credentials secured on platform.',
      icon: CheckCircle2,
      status: 'COMPLETED',
    },
    {
      id: 2,
      key: 'create_profile',
      label: 'Create Profile',
      creatorTitle: 'Creator Presentation',
      businessTitle: 'Company Profile',
      creatorDescription: studentProfile?.headline ? studentProfile.headline : 'Add professional headline, bio, and college details.',
      businessDescription: businessProfile?.companyName ? `${businessProfile.companyName} (${businessProfile.city})` : 'Set company legal entity name, industry & city.',
      icon: Award,
      status: stage2Done ? 'COMPLETED' : 'IN_PROGRESS',
      actionLabel: stage2Done ? undefined : 'Complete Profile',
      onAction: onOpenProfileModal,
    },
    {
      id: 3,
      key: 'skills_portfolio',
      label: 'Skills + Portfolio',
      creatorTitle: 'Tech Stack & Samples',
      businessTitle: 'Scope Specifications',
      creatorDescription: `${studentProfile?.skills.length || 0} skills listed · ${studentProfile?.portfolioLinks.length || 0} work samples`,
      businessDescription: 'Define core technical stacks and deliverable expectations.',
      icon: Briefcase,
      status: stage3Done ? 'COMPLETED' : (stage2Done ? 'IN_PROGRESS' : 'UPCOMING'),
      actionLabel: stage3Done ? undefined : 'Add Skills',
      onAction: onOpenProfileModal,
    },
    {
      id: 4,
      key: 'verification',
      label: 'Profile Verification',
      creatorTitle: 'Campus & ID Vetting',
      businessTitle: 'GSTIN / CIN Verification',
      creatorDescription: verificationStatus === 'VERIFIED'
        ? '✓ Platform-verified creator credential'
        : verificationStatus === 'PENDING'
        ? '⏳ Verification pending administrative audit'
        : verificationStatus === 'REJECTED'
        ? '⚠️ Verification rejected. Please resubmit evidence.'
        : 'Submit college ID card or student enrollment proof.',
      businessDescription: businessProfile?.verificationStatus === 'VERIFIED'
        ? '✓ Verified corporate entity (GSTIN/CIN)'
        : 'Submit GSTIN or CIN registration certificate for vetting.',
      icon: ShieldCheck,
      status: stage4Done ? 'COMPLETED' : (stage4Pending ? 'IN_PROGRESS' : 'IN_PROGRESS'),
      actionLabel: stage4Done ? undefined : (verificationStatus === 'PENDING' ? 'Audit Pending' : 'Submit Verification'),
      onAction: onOpenVerificationModal,
    },
    {
      id: 5,
      key: 'search_projects',
      label: 'Search Projects',
      creatorTitle: 'Project Discovery',
      businessTitle: 'Post Listing',
      creatorDescription: 'Search live client briefs matching your technical stack.',
      businessDescription: 'Publish project specifications with transparent deliverable criteria.',
      icon: Search,
      status: stage5Done ? 'COMPLETED' : 'IN_PROGRESS',
      actionLabel: isStudent ? 'Browse Projects' : 'Post Project',
      onAction: () => {
        if (isStudent) onNavigate('browse');
        else if (onOpenPostProjectModal) onOpenPostProjectModal();
      },
    },
    {
      id: 6,
      key: 'apply_bid',
      label: 'Apply / Bid',
      creatorTitle: 'Proposal Submission',
      businessTitle: 'Candidate Evaluation',
      creatorDescription: `${userApplications.length} proposals submitted to hiring clients.`,
      businessDescription: `${userApplications.length} candidate applications received for review.`,
      icon: FileText,
      status: stage6Done ? 'COMPLETED' : (stage5Done ? 'IN_PROGRESS' : 'UPCOMING'),
      actionLabel: isStudent ? 'Find Projects' : undefined,
      onAction: () => isStudent && onNavigate('browse'),
    },
    {
      id: 7,
      key: 'client_selection',
      label: 'Client Selection',
      creatorTitle: 'Scope Lock Offer',
      businessTitle: 'Issue Formal Offer',
      creatorDescription: stage7Done
        ? 'Formal offer accepted with locked deliverable terms.'
        : stage7Pending
        ? 'Pending offer received! Review and accept Scope Lock.'
        : 'Clients select top candidate and extend formal Scope Lock.',
      businessDescription: stage7Done
        ? 'Offer accepted by creator. Scope locked.'
        : 'Extend formal offer with milestone budgets and revisions.',
      icon: Lock,
      status: stage7Done ? 'COMPLETED' : (stage7Pending ? 'IN_PROGRESS' : (stage6Done ? 'IN_PROGRESS' : 'UPCOMING')),
      actionLabel: stage7Pending ? 'Review Offer' : undefined,
    },
    {
      id: 8,
      key: 'project_workspace',
      label: 'Project Workspace',
      creatorTitle: 'Deliverable WorkTrail',
      businessTitle: 'Review & Approvals',
      creatorDescription: 'Submit production files, receive feedback, and collaborate via WorkTrail.',
      businessDescription: 'Review submitted assets and request revision within agreed limit.',
      icon: Briefcase,
      status: stage8Done ? 'COMPLETED' : (stage8Active ? 'IN_PROGRESS' : (stage7Done ? 'IN_PROGRESS' : 'UPCOMING')),
    },
    {
      id: 9,
      key: 'milestone_payments',
      label: 'Milestone Payments',
      creatorTitle: 'Direct UPI / Bank UTR',
      businessTitle: 'Direct Settlement',
      creatorDescription: stage9Done
        ? 'Bank UTR verified and creator receipt confirmed.'
        : stage9Pending
        ? 'Client reported payment UTR. Confirm receipt in bank.'
        : '100% net compensation paid directly without platform deductions.',
      businessDescription: stage9Done
        ? 'Payment completed and confirmed.'
        : 'Report direct bank settlement UTR upon deliverable sign-off.',
      icon: Wallet,
      status: stage9Done ? 'COMPLETED' : (stage9Pending ? 'IN_PROGRESS' : (stage8Done ? 'IN_PROGRESS' : 'UPCOMING')),
    },
    {
      id: 10,
      key: 'completion_reviews',
      label: 'Completion & Reviews',
      creatorTitle: 'Verified Ratings',
      businessTitle: 'Feedback & Ratings',
      creatorDescription: stage10Done
        ? 'Verified client review published on Proof Passport.'
        : 'Outcomes finalized and verified reviews recorded.',
      businessDescription: stage10Done
        ? 'Verified project outcome completed.'
        : 'Rate creator performance on delivery and communication.',
      icon: Star,
      status: stage10Done ? 'COMPLETED' : (stage9Done ? 'IN_PROGRESS' : 'UPCOMING'),
    },
  ];

  const completedCount = stages.filter((s) => s.status === 'COMPLETED').length;
  const currentStage = stages.find((s) => s.status === 'IN_PROGRESS') || stages[stages.length - 1];
  const progressPercent = Math.round((completedCount / stages.length) * 100);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
      {/* Top Banner Header */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <span>Proof-to-Pay Workflow Journey</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                {completedCount}/10 Steps Complete ({progressPercent}%)
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Current Stage: <strong className="text-slate-800 dark:text-slate-200">{currentStage.label}</strong> ({isStudent ? currentStage.creatorTitle : currentStage.businessTitle})
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {currentStage.actionLabel && currentStage.onAction && (
            <button
              onClick={currentStage.onAction}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
            >
              <span>{currentStage.actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 transition flex items-center gap-1"
          >
            <span>{isExpanded ? 'Hide Steps' : 'View 10 Steps'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Progress Bar Line */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5">
        <div
          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-1.5 transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Expandable Step-by-Step Grid */}
      {isExpanded && (
        <div className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {stages.map((stage) => {
              const Icon = stage.icon;
              const isCurrent = stage.id === currentStage.id;
              const isDone = stage.status === 'COMPLETED';

              return (
                <div
                  key={stage.id}
                  className={`p-3.5 rounded-2xl border transition relative flex flex-col justify-between ${
                    isCurrent
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/20'
                      : isDone
                      ? 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                      : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/60 opacity-80'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        Stage {stage.id.toString().padStart(2, '0')}
                      </span>
                      {isDone ? (
                        <span className="p-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </span>
                      ) : isCurrent ? (
                        <span className="flex h-2.5 w-2.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                        </span>
                      ) : (
                        <Circle className="w-3 h-3 text-slate-300 dark:text-slate-700" />
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                        isDone
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : isCurrent
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                        {stage.label}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {isStudent ? stage.creatorDescription : stage.businessDescription}
                    </p>
                  </div>

                  {stage.actionLabel && stage.onAction && (
                    <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={stage.onAction}
                        className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <span>{stage.actionLabel}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
