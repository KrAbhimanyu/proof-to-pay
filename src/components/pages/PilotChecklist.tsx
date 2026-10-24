import React, { useState } from 'react';
import { User } from '../../types';
import { marketplaceStore } from '../../lib/storage';
import {
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  Shield,
  FileCheck2,
  Sparkles,
  Award,
  Layers,
  Send,
  Upload,
  Star,
  Receipt,
  Building2,
  UserCheck,
  ChevronRight,
  Info,
  Check,
  MessageSquareHeart
} from 'lucide-react';

interface Props {
  currentUser: User | null;
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: (mode?: 'login' | 'register_student' | 'register_business') => void;
  onOpenFeedback: () => void;
}

export const PilotChecklist: React.FC<Props> = ({
  currentUser,
  onNavigate,
  onOpenAuth,
  onOpenFeedback
}) => {
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'CREATOR' | 'BUSINESS' | 'ADMIN'>('ALL');

  // Load real state from store
  const projects = marketplaceStore.getProjects();
  const applications = marketplaceStore.getApplications();
  const offers = marketplaceStore.getOffers();
  const submissions = marketplaceStore.getSubmissions();
  const payments = marketplaceStore.getPayments();
  const commissions = marketplaceStore.getPlatformCommissions();
  const reviews = marketplaceStore.getReviews();
  const studentProfile = currentUser && currentUser.role === 'STUDENT' ? marketplaceStore.getStudentProfile(currentUser.id) : null;
  const businessProfile = currentUser && currentUser.role === 'BUSINESS' ? marketplaceStore.getBusinessProfile(currentUser.id) : null;

  // Real-time step status calculations
  // 1. Registration & Verification
  const step1CreatorDone = !!studentProfile && studentProfile.skills.length > 0;
  const step1BusinessDone = !!businessProfile && businessProfile.verificationStatus === 'VERIFIED';
  const step1Completed = currentUser?.role === 'STUDENT' ? step1CreatorDone : (currentUser?.role === 'BUSINESS' ? step1BusinessDone : (step1CreatorDone || step1BusinessDone));

  // 2. Project Creation & Moderation
  const approvedProjects = projects.filter((p) => p.status === 'APPROVED' || p.status === 'IN_PROGRESS' || p.status === 'COMPLETED');
  const userProjects = currentUser?.role === 'BUSINESS' ? projects.filter((p) => p.businessId === currentUser.id) : projects;
  const step2Completed = userProjects.some((p) => p.status === 'APPROVED' || p.status === 'IN_PROGRESS' || p.status === 'COMPLETED');

  // 3. Application
  const userApplications = currentUser?.role === 'STUDENT' ? applications.filter((a) => a.studentId === currentUser.id) : applications;
  const step3Completed = userApplications.length > 0;

  // 4. Offer Extended & Scope Lockdown
  const userOffers = currentUser?.role === 'STUDENT'
    ? offers.filter((o) => o.studentId === currentUser.id)
    : (currentUser?.role === 'BUSINESS' ? offers.filter((o) => o.businessId === currentUser.id) : offers);
  const step4Completed = userOffers.some((o) => o.status === 'ACCEPTED');

  // 5. Deliverables Submission & Review Cycle
  const userSubmissions = currentUser?.role === 'STUDENT'
    ? submissions.filter((s) => s.studentId === currentUser.id)
    : submissions;
  const step5Completed = userSubmissions.length > 0;

  // 6. Sign-off & Verified Reviews
  const step6Completed = reviews.length > 0 || projects.some((p) => p.status === 'COMPLETED');

  // 7. Payment Settlement & Platform Commission
  const hasSettledPayment = payments.some((p) => p.status === 'REPORTED_BY_BUSINESS' || p.status === 'RECEIPT_CONFIRMED_BY_CREATOR' || p.status === 'PAID');
  const hasCommissionTracked = commissions.some((c) => c.status === 'VERIFIED_COLLECTED' || c.status === 'REPORTED_PAID' || c.status === 'DUE');
  const step7Completed = hasSettledPayment && hasCommissionTracked;

  const checklistSteps = [
    {
      id: 1,
      title: 'Registration & Identity Verification',
      roles: ['CREATOR', 'BUSINESS'],
      description: 'Create an account and complete required verification. Creators showcase skills and build verified portfolios; businesses register entity proof (GSTIN/CIN/PAN).',
      isCompleted: step1Completed,
      statusLabel: step1Completed ? 'Verified & Complete' : (currentUser ? 'Profile In Progress' : 'Sign In Required'),
      actionLabel: currentUser?.role === 'STUDENT' ? 'View Creator Profile' : (currentUser?.role === 'BUSINESS' ? 'View Business Verification' : 'Get Started'),
      onAction: () => {
        if (!currentUser) onOpenAuth('login');
        else if (currentUser.role === 'STUDENT') onNavigate('student_dashboard');
        else if (currentUser.role === 'BUSINESS') onNavigate('business_dashboard');
        else onNavigate('admin_dashboard');
      },
      tips: 'Proof-to-Pay verifies identity and active profiles to ensure high quality micro-contracts.'
    },
    {
      id: 2,
      title: 'Project Posting & Admin Moderation',
      roles: ['BUSINESS', 'ADMIN'],
      description: 'Business posts a digital micro-project with structured deliverables and fixed INR budget. Platform admins review against scope guidelines before public listing.',
      isCompleted: step2Completed,
      statusLabel: step2Completed ? `${approvedProjects.length} Active Listings` : 'Pending Project Posting',
      actionLabel: currentUser?.role === 'BUSINESS' ? 'Post New Project' : 'Browse All Projects',
      onAction: () => {
        if (currentUser?.role === 'BUSINESS') onNavigate('business_dashboard');
        else onNavigate('browse');
      },
      tips: 'Zero spec work allowed: every approved listing must specify transparent deliverable formats and clear acceptance criteria.'
    },
    {
      id: 3,
      title: 'Marketplace Discovery & Application',
      roles: ['CREATOR'],
      description: 'Student discovers an approved listing matching their skill stack, crafts a tailored pitch, specifies delivery timeline, and includes proof links.',
      isCompleted: step3Completed,
      statusLabel: step3Completed ? `${userApplications.length} Applications Filed` : 'No Applications Filed Yet',
      actionLabel: 'Find Projects & Apply',
      onAction: () => onNavigate('browse'),
      tips: 'Students submit direct portfolio proof rather than lengthy generic resumes.'
    },
    {
      id: 4,
      title: 'Offer Terms & 5% Transparent Fee Calculation',
      roles: ['BUSINESS', 'CREATOR'],
      description: 'Business sends a formal offer with locked scope and deadline. Platform calculates 5% commission separately; creator receives 100% of agreed budget with ₹0 platform deductions.',
      isCompleted: step4Completed,
      statusLabel: step4Completed ? 'Offer Scope Locked' : 'Awaiting Offer Acceptance',
      actionLabel: currentUser?.role === 'STUDENT' ? 'Check Offers in Dashboard' : 'Manage Offers',
      onAction: () => {
        if (currentUser?.role === 'STUDENT') onNavigate('student_dashboard');
        else onNavigate('business_dashboard');
      },
      tips: 'Commission snapshot is immutable once accepted. Creator payout is never reduced by platform fees.'
    },
    {
      id: 5,
      title: 'Deliverables Submission & Revision Rounds',
      roles: ['CREATOR', 'BUSINESS'],
      description: 'Creator uploads deliverable files, links, and version notes. Business reviews work and can request up to agreed revisions or sign off.',
      isCompleted: step5Completed,
      statusLabel: step5Completed ? `${userSubmissions.length} Versions Submitted` : 'Deliverables Pending',
      actionLabel: currentUser?.role === 'STUDENT' ? 'Submit Deliverables' : 'Review Deliverables',
      onAction: () => {
        if (currentUser?.role === 'STUDENT') onNavigate('student_dashboard');
        else onNavigate('business_dashboard');
      },
      tips: 'Revision limits prevent scope creep. Feedback must align strictly with initial acceptance criteria.'
    },
    {
      id: 6,
      title: 'Final Sign-off & Verified Creator Review',
      roles: ['BUSINESS', 'CREATOR'],
      description: 'Business approves final version, marks project completed, and submits a verified 5-star review that permanently showcases on creator\'s public portfolio.',
      isCompleted: step6Completed,
      statusLabel: step6Completed ? 'Completed & Reviewed' : 'Pending Milestone Approval',
      actionLabel: 'View Verified Portfolios',
      onAction: () => onNavigate('portfolio', 'aarav-sharma'),
      tips: 'Only paying clients on completed projects can write verified reviews with attached deliverable tags.'
    },
    {
      id: 7,
      title: 'Settlement & Commission Verification',
      roles: ['BUSINESS', 'CREATOR', 'ADMIN'],
      description: 'Dual-track settlement: Business pays creator directly via UPI/NEFT and records UTR; creator confirms receipt. Business pays 5% platform commission to Proof-to-Pay, which admin audits.',
      isCompleted: step7Completed,
      statusLabel: step7Completed ? 'Settled & Audited' : (hasSettledPayment ? 'Commission Awaiting Verification' : 'Pending Payout'),
      actionLabel: currentUser?.role === 'ADMIN' ? 'Open Monetization Audit' : 'View Payment Records',
      onAction: () => {
        if (currentUser?.role === 'ADMIN') onNavigate('admin_dashboard');
        else if (currentUser?.role === 'BUSINESS') onNavigate('business_dashboard');
        else onNavigate('student_dashboard');
      },
      tips: 'A UTR number is evidence to audit, not automatic verification. Platform fees are only marked verified once confirmed in bank statements.'
    }
  ];

  // Filter steps according to selected role
  const filteredSteps = checklistSteps.filter((step) => {
    if (roleFilter === 'ALL') return true;
    return step.roles.includes(roleFilter);
  });

  const completedCount = checklistSteps.filter((s) => s.isCompleted).length;
  const progressPercent = Math.round((completedCount / checklistSteps.length) * 100);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-slate-900 text-white rounded-3xl p-8 sm:p-10 border border-slate-800 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Phase 1 Pilot Launch Checklist</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Proof-to-Pay End-to-End Pilot Journey
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Follow our 7-step guided workflow to test the entire marketplace lifecycle: from creator onboarding and micro-project creation to transparent 5% commission calculation, deliverable submission, and audited settlement.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700">
              <span className="text-slate-400">Current Role:</span>
              <strong className="text-white capitalize">{currentUser ? currentUser.role.toLowerCase() : 'Guest Visitor'}</strong>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700">
              <span className="text-slate-400">Total Steps:</span>
              <strong className="text-emerald-400">{completedCount} of {checklistSteps.length} Verified</strong>
            </div>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Progress Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Pilot Verification Progress</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status computed directly from your current session data in Proof-to-Pay.
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {progressPercent}%
            </span>
            <span className="text-xs text-slate-400 ml-1">Completed</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-700/50">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Role Filtering Tabs */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-400">
            <span>Filter Checklist By Perspective:</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setRoleFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl font-medium transition ${
                roleFilter === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              All Roles ({checklistSteps.length})
            </button>
            <button
              onClick={() => setRoleFilter('CREATOR')}
              className={`px-3 py-1.5 rounded-xl font-medium transition ${
                roleFilter === 'CREATOR'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Creator Flow
            </button>
            <button
              onClick={() => setRoleFilter('BUSINESS')}
              className={`px-3 py-1.5 rounded-xl font-medium transition ${
                roleFilter === 'BUSINESS'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Business Flow
            </button>
            <button
              onClick={() => setRoleFilter('ADMIN')}
              className={`px-3 py-1.5 rounded-xl font-medium transition ${
                roleFilter === 'ADMIN'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Admin Flow
            </button>
          </div>
        </div>
      </div>

      {/* Checklist Step Cards */}
      <div className="space-y-4">
        {filteredSteps.map((step) => {
          return (
            <div
              key={step.id}
              className={`p-6 sm:p-7 rounded-3xl border transition-all ${
                step.isCompleted
                  ? 'bg-emerald-500/[0.03] dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800/40'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 mt-0.5">
                    {step.isCompleted ? (
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-xs border border-slate-200 dark:border-slate-700">
                        {step.id}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                        Step 0{step.id}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">·</span>
                      <div className="flex items-center gap-1.5">
                        {step.roles.map((r) => (
                          <span
                            key={r}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              r === 'CREATOR' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' :
                              r === 'BUSINESS' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' :
                              'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {step.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                      {step.description}
                    </p>

                    <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
                      <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="italic">{step.tips}</span>
                    </div>
                  </div>
                </div>

                {/* Right Action & Status */}
                <div className="sm:text-right shrink-0 space-y-2.5 pt-2 sm:pt-0">
                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        step.isCompleted
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                      }`}
                    >
                      {step.isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      <span>{step.statusLabel}</span>
                    </span>
                  </div>

                  <div>
                    <button
                      onClick={step.onAction}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs transition shadow-sm"
                    >
                      <span>{step.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tester Help & Quick Feedback Card */}
      <div className="bg-gradient-to-br from-indigo-50 to-emerald-50 dark:from-slate-900 dark:to-slate-850 rounded-3xl p-6 sm:p-8 border border-indigo-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquareHeart className="w-4 h-4 text-pink-500" />
            <span>Encountered an issue during pilot testing?</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Share screenshots, edge cases, or usability impressions directly with the engineering team. Your reports shape the public release.
          </p>
        </div>
        <button
          onClick={onOpenFeedback}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition whitespace-nowrap shrink-0"
        >
          Submit Tester Feedback
        </button>
      </div>
    </div>
  );
};
