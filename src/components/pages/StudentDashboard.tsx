import React, { useState } from 'react';
import { User, StudentProfile, Application, ProjectListing, ProjectSubmission, ProjectOffer, PaymentRecord, VerifiedReview } from '../../types';
import { marketplaceStore } from '../../lib/storage';
import { WorkSubmissionSchema } from '../../lib/schemas';
import { Badges } from '../common/Badges';
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
  Check
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

  // Handle Offer Response
  const handleOfferResponse = (offerId: string, accept: boolean) => {
    try {
      marketplaceStore.respondToOffer(currentUser, offerId, accept);
      if (accept) {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      }
      setActiveTab('active_projects');
    } catch (err: any) {
      alert(err.message);
    }
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
                  onClick={() => handleOfferResponse(offer.id, true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition"
                >
                  Accept & Start Project
                </button>
                <button
                  onClick={() => handleOfferResponse(offer.id, false)}
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

      {/* Tab 5: Verified Portfolio */}
      {activeTab === 'portfolio' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
            <div>
              <h3 className="font-bold text-sm text-indigo-900 dark:text-indigo-300">Your Shareable Verified Portfolio</h3>
              <p className="text-xs text-indigo-700 dark:text-indigo-400">
                Share this link with recruiters, clients, or on your LinkedIn profile to prove completed projects with verified ratings.
              </p>
            </div>
            <button
              onClick={() => onNavigate('portfolio', profile.verifiedPortfolioSlug)}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition flex items-center gap-1.5 shrink-0"
            >
              <span>View Public Profile</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Verified Work Proofs ({reviews.length})</h3>
            {reviews.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No verified project reviews yet. Completed projects automatically appear here with client testimony and deliverable specifications.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">{rev.projectTitle}</span>
                      <span className="text-amber-500 font-bold">★ {rev.rating}/5</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                      "{rev.comment}"
                    </p>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Reviewed by {rev.reviewerName}</span>
                      <span className="text-emerald-600 font-medium">✓ Verified Deliverable</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
    </div>
  );
};
