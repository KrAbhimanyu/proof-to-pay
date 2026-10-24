import React, { useState } from 'react';
import { User, StudentProfile, Application, ProjectListing, ProjectSubmission, ProjectOffer, PaymentRecord, VerifiedReview, ProofPassportItem, ScopeChangeRequest } from '../../types';
import { marketplaceStore } from '../../lib/storage';
import { WorkSubmissionSchema } from '../../lib/schemas';
import { Badges } from '../common/Badges';
import { ScopeLockModal } from '../common/ScopeLockModal';
import { ScopeChangeModal } from '../common/ScopeChangeModal';
import { WorkTrail } from '../common/WorkTrail';
import { PaymentHistory } from '../common/PaymentHistory';
import { VerifiedSkills } from '../common/VerifiedSkills';
import { EarningsPerformanceChart } from '../common/EarningsPerformanceChart';
import { ThemeToggle } from '../common/ThemeToggle';
import { WorkflowJourneyTracker } from '../common/WorkflowJourneyTracker';
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
  Shield,
  Search,
  HelpCircle,
  LifeBuoy,
  ArrowRight,
  LogOut,
  MessageSquare,
  Palette,
  UserPlus,
  Link2,
  Globe,
  UserCheck,
  Share2
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

export const StudentDashboard: React.FC<Props> = ({
  currentUser,
  onNavigate,
  onLogout,
  controlledTab,
  onTabChange,
  onOpenChat,
}) => {
  const [internalTab, setInternalTab] = useState<'overview' | 'applications' | 'active_projects' | 'skills' | 'payments' | 'badges' | 'portfolio' | 'profile' | 'settings'>('overview');
  
  const activeTab = (controlledTab as any) || internalTab;
  const setActiveTab = (tab: any) => {
    setInternalTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const [profileRefreshKey, setProfileRefreshKey] = useState(0);
  const userId = currentUser?.id || 'student-1';
  const userName = currentUser?.name || 'Creator';
  const rawProfile = marketplaceStore.getStudentProfile(userId);

  const profile: StudentProfile = {
    userId,
    headline: rawProfile?.headline || 'Emerging Creator',
    bio: rawProfile?.bio || '',
    age: rawProfile?.age,
    skills: Array.isArray(rawProfile?.skills) ? rawProfile.skills : ['UI/UX', 'React'],
    experienceLevel: rawProfile?.experienceLevel || 'INTERMEDIATE',
    portfolioLinks: rawProfile?.portfolioLinks || [],
    totalEarnedINR: rawProfile?.totalEarnedINR ?? 0,
    completedProjectsCount: rawProfile?.completedProjectsCount ?? 0,
    averageRating: rawProfile?.averageRating ?? 5.0,
    verifiedPortfolioSlug: rawProfile?.verifiedPortfolioSlug || userName.toLowerCase().replace(/\s+/g, '-'),
    college: rawProfile?.college || 'University Student',
    degree: rawProfile?.degree || '',
    upiId: rawProfile?.upiId || '',
    pinnedBadgeIds: rawProfile?.pinnedBadgeIds || ['early-adopter', 'top-rated', 'project-completed'],
    availability: rawProfile?.availability || 'AVAILABLE',
    coverImageUrl: rawProfile?.coverImageUrl || 'emerald',
    connections: rawProfile?.connections || [],
    githubUrl: rawProfile?.githubUrl || currentUser?.githubUrl || null,
    linkedinUrl: rawProfile?.linkedinUrl || currentUser?.linkedinUrl || null,
    behanceUrl: rawProfile?.behanceUrl || currentUser?.behanceUrl || null,
    socialLinks: rawProfile?.socialLinks || [],
    verificationStatus: rawProfile?.verificationStatus || 'UNVERIFIED',
    verificationDetails: rawProfile?.verificationDetails,
  };

  const applications = (marketplaceStore.getApplications() || []).filter((a) => a.studentId === userId);
  const offers = (marketplaceStore.getOffers() || []).filter((o) => o.studentId === userId);
  const activeProjects = (marketplaceStore.getProjects() || []).filter((p) => p.selectedStudentId === userId);
  const submissions = (marketplaceStore.getSubmissions() || []).filter((s) => s.studentId === userId);
  const payments = (marketplaceStore.getPayments() || []).filter((p) => p.studentId === userId);
  const reviews = (marketplaceStore.getReviews() || []).filter((r) => r.targetUserId === userId);
  const passportItems = marketplaceStore.getProofPassportItems(userId, false) || [];

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
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Profile Form & Presentation Modal States
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editHeadline, setEditHeadline] = useState(profile.headline);
  const [editBio, setEditBio] = useState(profile.bio);
  const [editCollege, setEditCollege] = useState(profile.college || '');
  const [editDegree, setEditDegree] = useState(profile.degree || '');
  const [editCity, setEditCity] = useState(currentUser?.city || '');
  const [editAvailability, setEditAvailability] = useState<'AVAILABLE' | 'BUSY' | 'UNAVAILABLE'>(profile.availability || 'AVAILABLE');
  const [editUpi, setEditUpi] = useState(profile.upiId || '');
  const [editGithub, setEditGithub] = useState(profile.githubUrl || '');
  const [editLinkedin, setEditLinkedin] = useState(profile.linkedinUrl || '');
  const [editBehance, setEditBehance] = useState(profile.behanceUrl || '');
  const [editSkillsList, setEditSkillsList] = useState<string[]>(profile.skills);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Customize Banner Modal State
  const [isCustomizeBannerOpen, setIsCustomizeBannerOpen] = useState(false);
  const [selectedBannerPreset, setSelectedBannerPreset] = useState(profile.coverImageUrl || 'emerald');
  const [customBannerUrl, setCustomBannerUrl] = useState(profile.coverImageUrl?.startsWith('http') ? profile.coverImageUrl : '');
  const [isSavingBanner, setIsSavingBanner] = useState(false);

  // +Connection Profile Modal State
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [connPlatform, setConnPlatform] = useState<string>('LinkedIn');
  const [connName, setConnName] = useState<string>('');
  const [connUrl, setConnUrl] = useState<string>('');
  const [connRole, setConnRole] = useState<string>('Senior Recruiter');
  const [connNotes, setConnNotes] = useState<string>('');
  const [isAddingConnection, setIsAddingConnection] = useState(false);

  // Quick Skill & Link States (Profile Tab)
  const [quickSkillInput, setQuickSkillInput] = useState('');
  const [newLinkPlatform, setNewLinkPlatform] = useState('GitHub');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  // Verification Modal State
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [verificationDocType, setVerificationDocType] = useState('College Student Identity Card');
  const [verificationDocNumber, setVerificationDocNumber] = useState('');
  const [verificationCollegeEmail, setVerificationCollegeEmail] = useState('');
  const [verificationIdCardUrl, setVerificationIdCardUrl] = useState('');
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);

  // Review Modal State
  const [reviewingProjectId, setReviewingProjectId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewDeliverableSummary, setReviewDeliverableSummary] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Support Request Modal State
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportCategory, setSupportCategory] = useState<string>('MILESTONE_ISSUE');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportRelatedProjectId, setSupportRelatedProjectId] = useState('');
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);

  const handleSubmitVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationDocNumber.trim()) {
      showToast('Please enter your student identity or enrollment roll number.', 'error');
      return;
    }
    setIsSubmittingVerification(true);
    try {
      marketplaceStore.submitStudentVerification(userId, {
        documentType: verificationDocType,
        documentNumber: verificationDocNumber.trim(),
        collegeEmail: verificationCollegeEmail.trim() || undefined,
        studentIdCardUrl: verificationIdCardUrl.trim() || undefined,
      });
      setProfileRefreshKey((k) => k + 1);
      setIsVerificationModalOpen(false);
      showToast('Verification submitted! Proof-to-Pay editorial audit team will review your credentials within 24 hours.', 'success');
      confetti({ particleCount: 40, spread: 50 });
    } catch (err: any) {
      showToast(err.message || 'Failed to submit verification.', 'error');
    } finally {
      setIsSubmittingVerification(false);
    }
  };

  const handleSubmitCreatorReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingProjectId) return;
    if (!reviewComment.trim() || reviewComment.trim().length < 10) {
      showToast('Please write a detailed review (at least 10 characters).', 'error');
      return;
    }
    setIsSubmittingReview(true);
    try {
      marketplaceStore.addReview(
        currentUser,
        reviewingProjectId,
        reviewRating,
        reviewComment.trim(),
        reviewDeliverableSummary.trim() || 'Verified milestone deliverables completed on agreed terms'
      );
      setProfileRefreshKey((k) => k + 1);
      setReviewingProjectId(null);
      setReviewComment('');
      setReviewDeliverableSummary('');
      showToast('Verified review submitted and published to project audit record!', 'success');
      confetti({ particleCount: 50, spread: 60 });
    } catch (err: any) {
      showToast(err.message || 'Failed to submit review.', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleSendSupportRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSubject.trim() || !supportMessage.trim()) {
      showToast('Please provide a subject and details for your support request.', 'error');
      return;
    }
    setIsSubmittingSupport(true);
    try {
      marketplaceStore.logAudit(
        currentUser || { id: userId, name: userName, email: '', role: 'STUDENT', createdAt: new Date().toISOString() },
        'REQUESTED_CREATOR_SUPPORT',
        'USER',
        userId,
        `Category: ${supportCategory} | Subject: "${supportSubject.trim()}" | Details: "${supportMessage.trim()}"`
      );
      confetti({ particleCount: 40, spread: 50 });
      setIsSupportModalOpen(false);
      setSupportSubject('');
      setSupportMessage('');
      setSupportRelatedProjectId('');
      showToast('Support request submitted! Proof-to-Pay assistance team will review and respond within 4 hours.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit support request.', 'error');
    } finally {
      setIsSubmittingSupport(false);
    }
  };

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
      showToast('Please check all 5 scope lock terms to confirm explicit mutual acceptance.', 'error');
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
      showToast('Scope Lock established! Project terms are now locked and work has commenced.', 'success');
      setActiveTab('active_projects');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeclineOffer = (offerId: string) => {
    try {
      marketplaceStore.respondToOffer(currentUser, offerId, false);
      setExplicitOfferAcceptModal(null);
      showToast('Offer declined.', 'info');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleTogglePassportVisibility = (itemId: string, currentPublic: boolean) => {
    try {
      marketplaceStore.toggleProofPassportVisibility(currentUser, itemId, !currentPublic);
      showToast(`Proof Passport item is now ${!currentPublic ? 'publicly visible' : 'hidden'}.`);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleSavePassportSummary = (itemId: string) => {
    try {
      marketplaceStore.updateProofPassportItem(currentUser, itemId, { sanitizedSummary: editingPassportSummary });
      setEditingPassportItemId(null);
      showToast('Summary updated successfully.');
    } catch (err: any) {
      showToast(err.message, 'error');
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
    showToast('Self-uploaded work sample added to your portfolio profile.');
  };

  const handleRemoveSelfUploadedSample = (index: number) => {
    const currentLinks = profile.portfolioLinks || [];
    marketplaceStore.updateStudentProfile(currentUser.id, {
      portfolioLinks: currentLinks.filter((_, i) => i !== index)
    });
    showToast('Work sample removed.');
  };

  // Handle Payment Receipt Confirmation
  const handleConfirmPaymentReceipt = (projectId: string) => {
    try {
      marketplaceStore.confirmProjectPaymentReceipt(currentUser, projectId);
      confetti({ particleCount: 60, spread: 50 });
      showToast('Payment receipt confirmed! This verified settlement is permanently logged.', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Handle Payment Dispute
  const handleDisputePayment = (projectId: string) => {
    const reason = prompt('Please explain the issue with this payout record (e.g. UTR is invalid, funds not received):');
    if (reason && reason.trim().length >= 4) {
      try {
        marketplaceStore.disputeProjectPayment(currentUser, projectId, reason);
        marketplaceStore.fileDispute(currentUser, projectId, 'Payout dispute: ' + reason, 'Student reported payment discrepancy with business UTR.');
        showToast('Payment dispute filed. An administrator will investigate with the business.', 'info');
      } catch (err: any) {
        showToast(err.message, 'error');
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

  // Banner presets
  const BANNER_PRESETS = [
    { id: 'emerald', label: 'Emerald Forest', gradient: 'from-emerald-600 via-teal-700 to-indigo-800' },
    { id: 'indigo', label: 'Deep Indigo', gradient: 'from-indigo-600 via-purple-700 to-slate-900' },
    { id: 'cyber', label: 'Cyber Slate', gradient: 'from-slate-900 via-slate-800 to-emerald-950' },
    { id: 'sunset', label: 'Sunset Horizon', gradient: 'from-amber-600 via-rose-600 to-purple-800' },
    { id: 'ocean', label: 'Ocean Teal', gradient: 'from-cyan-600 via-teal-600 to-blue-800' },
    { id: 'carbon', label: 'Carbon Minimal', gradient: 'from-zinc-800 via-neutral-900 to-black' },
  ];

  const getBannerBackground = (coverUrl?: string) => {
    if (!coverUrl || coverUrl === 'emerald') return 'bg-gradient-to-r from-emerald-600 via-teal-700 to-indigo-800';
    if (coverUrl === 'indigo') return 'bg-gradient-to-r from-indigo-600 via-purple-700 to-slate-900';
    if (coverUrl === 'cyber') return 'bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950';
    if (coverUrl === 'sunset') return 'bg-gradient-to-r from-amber-600 via-rose-600 to-purple-800';
    if (coverUrl === 'ocean') return 'bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-800';
    if (coverUrl === 'carbon') return 'bg-gradient-to-r from-zinc-800 via-neutral-900 to-black';
    if (coverUrl.startsWith('from-')) return `bg-gradient-to-r ${coverUrl}`;
    return 'bg-gradient-to-r from-emerald-600 via-teal-700 to-indigo-800';
  };

  // Open Edit Profile modal with fresh state
  const handleOpenEditProfile = () => {
    setEditName(currentUser?.name || '');
    setEditHeadline(profile.headline);
    setEditBio(profile.bio);
    setEditCollege(profile.college || '');
    setEditDegree(profile.degree || '');
    setEditCity(currentUser?.city || '');
    setEditAvailability(profile.availability || 'AVAILABLE');
    setEditUpi(profile.upiId || '');
    setEditGithub(profile.githubUrl || '');
    setEditLinkedin(profile.linkedinUrl || '');
    setEditBehance(profile.behanceUrl || '');
    setEditSkillsList([...profile.skills]);
    setIsEditProfileOpen(true);
  };

  // Save Edit Profile & Presentation Modal
  const handleSaveEditProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editHeadline.trim() || editHeadline.trim().length < 5) {
      showToast('Professional headline must be at least 5 characters.', 'error');
      return;
    }
    setIsSavingProfile(true);

    try {
      const socialLinks: { platform: string; url: string }[] = [];
      if (editGithub.trim()) socialLinks.push({ platform: 'github', url: editGithub.trim() });
      if (editLinkedin.trim()) socialLinks.push({ platform: 'linkedin', url: editLinkedin.trim() });
      if (editBehance.trim()) socialLinks.push({ platform: 'behance', url: editBehance.trim() });

      (profile.socialLinks || []).forEach((sl) => {
        if (!['github', 'linkedin', 'behance'].includes(sl.platform.toLowerCase())) {
          socialLinks.push(sl);
        }
      });

      marketplaceStore.updateCreatorPortfolio(currentUser, userId, {
        headline: editHeadline.trim(),
        bio: editBio.trim(),
        college: editCollege.trim(),
        degree: editDegree.trim(),
        availability: editAvailability,
        upiId: editUpi.trim(),
        skills: editSkillsList,
        socialLinks,
        githubUrl: editGithub.trim() || null,
        linkedinUrl: editLinkedin.trim() || null,
        behanceUrl: editBehance.trim() || null,
      });

      if (editCity.trim() || editName.trim()) {
        const allUsers = marketplaceStore.getUsers();
        const uIdx = allUsers.findIndex((u) => u.id === userId);
        if (uIdx !== -1) {
          allUsers[uIdx] = {
            ...allUsers[uIdx],
            name: editName.trim() || allUsers[uIdx].name,
            city: editCity.trim() || allUsers[uIdx].city,
          };
          marketplaceStore['set']('ptp_users', allUsers);
        }
      }

      setProfileRefreshKey((k) => k + 1);
      setIsEditProfileOpen(false);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
      showToast('Creator profile & presentation updated successfully!');
      confetti({ particleCount: 30, spread: 50 });
    } catch (err: any) {
      showToast(err.message || 'Failed to save profile changes', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Add Skill Directly (Profile Tab & Suggestions)
  const handleAddSkillDirectly = (skillName: string) => {
    const s = skillName.trim();
    if (!s) return;
    if (s.length > 30) {
      showToast('Skill name too long (maximum 30 characters).', 'error');
      return;
    }
    if (profile.skills.some((sk) => sk.toLowerCase() === s.toLowerCase())) {
      showToast(`Skill "${s}" is already in your stack.`, 'info');
      return;
    }
    const updated = [...profile.skills, s];
    try {
      marketplaceStore.updateCreatorPortfolio(currentUser, userId, { skills: updated });
      setQuickSkillInput('');
      setProfileRefreshKey((k) => k + 1);
      showToast(`Added "${s}" to your technical stack!`);
    } catch (err: any) {
      showToast(err.message || 'Failed to add skill', 'error');
    }
  };

  // Remove Skill Directly
  const handleRemoveSkillDirectly = (skillName: string) => {
    const updated = profile.skills.filter((sk) => sk !== skillName);
    try {
      marketplaceStore.updateCreatorPortfolio(currentUser, userId, { skills: updated });
      setProfileRefreshKey((k) => k + 1);
      showToast(`Removed "${skillName}" from your stack.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to remove skill', 'error');
    }
  };

  // Add Connection Profile
  const handleAddConnection = (e: React.FormEvent) => {
    e.preventDefault();
    const name = connName.trim();
    if (!name) {
      showToast('Please enter connection name or handle.', 'error');
      return;
    }
    if (connUrl.trim() && !/^https?:\/\//i.test(connUrl.trim())) {
      showToast('Please enter a valid URL starting with http:// or https://', 'error');
      return;
    }

    const currentConnections = profile.connections || [];
    const isDuplicate = currentConnections.some(
      (c) =>
        c.name.toLowerCase() === name.toLowerCase() ||
        (connUrl.trim() && c.profileUrl?.toLowerCase() === connUrl.trim().toLowerCase())
    );

    if (isDuplicate) {
      showToast(`A connection for "${name}" or this profile URL already exists.`, 'error');
      return;
    }

    setIsAddingConnection(true);
    try {
      const newConn = {
        id: `conn-${Date.now()}`,
        name,
        platform: connPlatform,
        profileUrl: connUrl.trim() || undefined,
        role: connRole.trim() || undefined,
        addedAt: new Date().toISOString(),
      };

      const updated = [newConn, ...currentConnections];
      marketplaceStore.updateCreatorPortfolio(currentUser, userId, { connections: updated });
      setProfileRefreshKey((k) => k + 1);
      setIsConnectionModalOpen(false);
      setConnName('');
      setConnUrl('');
      setConnRole('Senior Recruiter');
      setConnNotes('');
      showToast(`Connected with ${name}! Profile added to your network.`);
      confetti({ particleCount: 35, spread: 60 });
    } catch (err: any) {
      showToast(err.message || 'Failed to add connection profile', 'error');
    } finally {
      setIsAddingConnection(false);
    }
  };

  // Remove Connection Profile
  const handleRemoveConnection = (connId: string) => {
    const currentConnections = profile.connections || [];
    const updated = currentConnections.filter((c) => c.id !== connId);
    try {
      marketplaceStore.updateCreatorPortfolio(currentUser, userId, { connections: updated });
      setProfileRefreshKey((k) => k + 1);
      showToast('Connection removed from your network.');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove connection', 'error');
    }
  };

  // Save Banner Customization
  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBanner(true);
    try {
      const bannerVal = customBannerUrl.trim() || selectedBannerPreset;
      marketplaceStore.updateCreatorPortfolio(currentUser, userId, { coverImageUrl: bannerVal });
      setProfileRefreshKey((k) => k + 1);
      setIsCustomizeBannerOpen(false);
      showToast('Profile banner customized successfully!');
    } catch (err: any) {
      showToast(err.message || 'Failed to save banner', 'error');
    } finally {
      setIsSavingBanner(false);
    }
  };

  // Add / Update Links
  const handleAddSocialLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkUrl.trim() || !/^https?:\/\//i.test(newLinkUrl.trim())) {
      showToast('Please enter a valid link starting with http:// or https://', 'error');
      return;
    }
    const currentLinks = profile.socialLinks || [];
    const updated = [
      ...currentLinks.filter((l) => l.platform.toLowerCase() !== newLinkPlatform.toLowerCase()),
      { platform: newLinkPlatform.toLowerCase(), url: newLinkUrl.trim() },
    ];
    try {
      marketplaceStore.updateCreatorPortfolio(currentUser, userId, { socialLinks: updated });
      setNewLinkUrl('');
      setProfileRefreshKey((k) => k + 1);
      showToast(`Added ${newLinkPlatform} profile link!`);
    } catch (err: any) {
      showToast(err.message || 'Failed to save link', 'error');
    }
  };

  // Remove Social Link
  const handleRemoveSocialLink = (platform: string) => {
    const currentLinks = profile.socialLinks || [];
    const updated = currentLinks.filter((l) => l.platform.toLowerCase() !== platform.toLowerCase());
    try {
      marketplaceStore.updateCreatorPortfolio(currentUser, userId, { socialLinks: updated });
      setProfileRefreshKey((k) => k + 1);
      showToast(`Removed ${platform} profile link.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to remove link', 'error');
    }
  };

  // Handle Account Deletion
  const handleDeleteAccount = () => {
    if (window.confirm('Are you certain you want to request complete account deletion? All personal data will be removed under platform policy.')) {
      marketplaceStore.requestAccountDeletion(currentUser);
      window.location.reload();
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Dashboard Top Identity & Stats with Customizable Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Banner Strip */}
        <div className={`relative h-28 sm:h-36 md:h-40 w-full ${getBannerBackground(profile.coverImageUrl)} overflow-hidden`}>
          {profile.coverImageUrl && profile.coverImageUrl.startsWith('http') && (
            <img
              src={profile.coverImageUrl}
              alt="Profile Cover"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />

          {/* Banner Action Buttons */}
          <div className="absolute top-3 right-3 flex flex-wrap items-center gap-2 z-10">
            <button
              onClick={() => setIsCustomizeBannerOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-md text-[11px] font-semibold flex items-center gap-1.5 transition border border-white/20 shadow-sm"
              title="Customize profile banner cover or gradient"
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Customize Banner</span>
            </button>
            <button
              onClick={() => setIsConnectionModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white backdrop-blur-md text-[11px] font-semibold flex items-center gap-1.5 transition border border-emerald-400/30 shadow-sm"
              title="Add a professional connection, recruiter, or peer network"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+Connection Profile</span>
            </button>
            <button
              onClick={handleOpenEditProfile}
              className="px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-slate-900 backdrop-blur-md text-[11px] font-bold flex items-center gap-1.5 transition border border-slate-200 shadow-sm"
              title="Edit profile information and presentation"
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Edit Profile & Presentation</span>
            </button>
          </div>
        </div>

        {/* Identity & Stats Row */}
        <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 -mt-8 sm:-mt-10 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 p-1 shadow-lg ring-4 ring-white dark:ring-slate-900 shrink-0">
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name || 'Creator'}
                  className="w-full h-full object-cover rounded-[14px]"
                />
              ) : (
                <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-white font-bold text-2xl">
                  {(currentUser?.name || 'C')[0] || 'C'}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  {currentUser?.name || 'Verified Creator'}
                </h1>
                {profile.verificationStatus === 'VERIFIED' ? (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Verified Creator</span>
                  </span>
                ) : profile.verificationStatus === 'PENDING' ? (
                  <button
                    onClick={() => setIsVerificationModalOpen(true)}
                    className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800 flex items-center gap-1 hover:bg-amber-200 transition"
                  >
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>Verification Pending</span>
                  </button>
                ) : profile.verificationStatus === 'REJECTED' ? (
                  <button
                    onClick={() => setIsVerificationModalOpen(true)}
                    className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800 flex items-center gap-1 hover:bg-rose-200 transition"
                  >
                    <AlertCircle className="w-3 h-3 text-rose-600" />
                    <span>Verification Rejected (Resubmit)</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsVerificationModalOpen(true)}
                    className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-300 dark:border-slate-700 flex items-center gap-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 transition"
                  >
                    <ShieldCheck className="w-3 h-3 text-slate-400" />
                    <span>Get Verified</span>
                  </button>
                )}
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    profile.availability === 'BUSY'
                      ? 'bg-amber-100 text-amber-800'
                      : profile.availability === 'UNAVAILABLE'
                      ? 'bg-slate-100 text-slate-700'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {profile.availability === 'BUSY'
                    ? 'In Active Sprint'
                    : profile.availability === 'UNAVAILABLE'
                    ? 'Unavailable'
                    : 'Available for Micro-Projects'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{profile.headline}</p>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-2 flex-wrap">
                <span>{currentUser?.city || 'India'}</span>
                <span>·</span>
                <span>{profile.college || 'University Student'}</span>
                {profile.degree && (
                  <>
                    <span>·</span>
                    <span>{profile.degree}</span>
                  </>
                )}
              </div>

              {/* Earned Milestones Strip */}
              <div className="mt-3">
                <Badges
                  profile={profile}
                  user={currentUser || { id: userId, name: userName, email: '', role: 'STUDENT', createdAt: new Date().toISOString() }}
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

          {/* Stats Pill Strip & Sign Out */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Earned (INR)</div>
                <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  ₹{(profile.totalEarnedINR ?? 0).toLocaleString('en-IN')}
                </div>
              </div>
              <div className="border-x border-slate-200 dark:border-slate-700 px-3">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Completed</div>
                <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {profile.completedProjectsCount ?? 0}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Rating</div>
                <div className="text-base sm:text-lg font-black text-amber-500 flex items-center justify-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{(profile.averageRating ?? 5.0).toFixed(1)}</span>
                </div>
              </div>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                title="Sign out of account"
                className="px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Proof-to-Pay End-to-End Workflow Journey Stepper */}
      <WorkflowJourneyTracker
        currentUser={currentUser}
        onNavigate={onNavigate}
        onOpenProfileModal={handleOpenEditProfile}
        onOpenVerificationModal={() => setIsVerificationModalOpen(true)}
      />

      {/* Quick Actions Row */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              Quick Actions
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Direct shortcuts to discover projects, share credentials, and contact support
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 1. Find New Projects */}
          <button
            onClick={() => onNavigate('browse')}
            className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/40 dark:from-emerald-950/40 dark:to-slate-900 border border-emerald-200 dark:border-emerald-800/80 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md transition text-left group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition shrink-0">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                  Find New Projects
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Browse open listings & submit pitches
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition shrink-0 ml-2" />
          </button>

          {/* 2. View Portfolio */}
          <button
            onClick={() => onNavigate('portfolio', profile.verifiedPortfolioSlug || userName.toLowerCase().replace(/\s+/g, '-'))}
            className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50/40 dark:from-indigo-950/40 dark:to-slate-900 border border-indigo-200 dark:border-indigo-800/80 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md transition text-left group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition shrink-0">
                <ExternalLink className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                  View Portfolio
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Public Proof Passport & verified badges
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition shrink-0 ml-2" />
          </button>

          {/* 3. Request Support */}
          <button
            onClick={() => setIsSupportModalOpen(true)}
            className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/40 dark:from-amber-950/40 dark:to-slate-900 border border-amber-200 dark:border-amber-800/80 hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-md transition text-left group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                  Request Support
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Payments, scope lock & arbitration help
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition shrink-0 ml-2" />
          </button>
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
          onClick={() => setActiveTab('skills')}
          className={`pb-3 px-2 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'skills'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-emerald-500" />
          <span>Verified Skills</span>
          <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] flex items-center justify-center font-bold">
            ✓
          </span>
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

          {/* Summary Card with Bar Chart: Visualizing Total Projects Completed & Total Earnings */}
          <EarningsPerformanceChart
            profile={profile}
            payments={payments}
            projects={activeProjects}
          />

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

          {/* Client-Endorsed Skills Showcase Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Award className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Client-Endorsed Skills
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Verified by Businesses
                </span>
              </div>
              <button
                onClick={() => setActiveTab('skills')}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
              >
                <span>View skills breakdown</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Technical and creative capabilities verified through completed client milestones and client review feedback:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Performance Optimization', 'Figma', 'UI/UX Design'].map((s) => (
                <button
                  key={s}
                  onClick={() => setActiveTab('skills')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold hover:scale-105 transition shadow-2xs"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>{s}</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">★ 5.0</span>
                </button>
              ))}
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

                      {onOpenChat && (
                        <button
                          onClick={() => {
                            const acceptedOffer = offers.find(
                              (o) => o.projectId === proj.id && o.studentId === currentUser.id && o.status === 'ACCEPTED'
                            );
                            if (acceptedOffer) {
                              onOpenChat({ targetOfferId: acceptedOffer.id });
                            } else {
                              onOpenChat({
                                targetUser: { id: proj.businessId, name: proj.businessName, role: 'BUSINESS' },
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

                    {/* Completed Project Status & Review Trigger */}
                    {proj.status === 'COMPLETED' && (
                      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="font-bold text-xs text-emerald-900 dark:text-emerald-300">
                              Project Completed & Deliverables Approved
                            </span>
                          </div>
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
                            Verified Outcome Delivered
                          </span>
                        </div>

                        {/* Verified Review Section */}
                        {(() => {
                          const existingReview = reviews.find((r) => r.projectId === proj.id && r.reviewerId === currentUser.id);
                          if (existingReview) {
                            return (
                              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200/60 dark:border-emerald-800/40 text-xs space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">Your Verified Review for Client:</span>
                                  <span className="text-amber-500 font-bold flex items-center gap-0.5">
                                    ★ {existingReview.rating}.0
                                  </span>
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 italic">"{existingReview.comment}"</p>
                              </div>
                            );
                          }
                          return (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                              <span className="text-xs text-slate-600 dark:text-slate-400">
                                Leave a verified client review to build transparent marketplace reputation.
                              </span>
                              <button
                                onClick={() => {
                                  setReviewingProjectId(proj.id);
                                  setReviewRating(5);
                                  setReviewComment('');
                                  setReviewDeliverableSummary(proj.deliverables.map(d => d.title).join(', '));
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 shrink-0"
                              >
                                <Star className="w-3.5 h-3.5" />
                                <span>Leave Verified Review</span>
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Verified Skills Endorsed by Businesses */}
      {activeTab === 'skills' && (
        <VerifiedSkills
          studentId={currentUser.id}
          currentUser={currentUser}
          onNavigateToProject={(projId) => onNavigate('project_detail', projId)}
        />
      )}

      {/* Tab 4: Payment Tracking */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Audited Payment Records</h2>
              <p className="text-xs text-slate-500">Live ledger of all direct UPI & bank settlements with traceable bank UTR references</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Total Cleared</span>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                ₹{(profile.totalEarnedINR ?? 0).toLocaleString('en-IN')} INR
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40 text-xs text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Zero Deductions Guarantee:</strong> You receive 100% of agreed micro-project budgets. Proof-to-Pay charges businesses separately for platform commissions—no fee is deducted from your earnings.
            </span>
          </div>

          <PaymentHistory
            studentId={userId}
            onConfirmReceipt={handleConfirmPaymentReceipt}
            onDisputePayment={handleDisputePayment}
          />
        </div>
      )}

      {/* Tab: Milestones & Badges */}
      {activeTab === 'badges' && (
        <Badges
          profile={profile}
          user={currentUser || { id: userId, name: userName, email: '', role: 'STUDENT', createdAt: new Date().toISOString() }}
          reviews={reviews}
          submissions={submissions}
          projects={activeProjects}
          payments={payments}
          variant="full"
          isOwner={true}
          onUpdatePinnedBadges={(newPinned) => {
            marketplaceStore.updateStudentProfile(userId, { pinnedBadgeIds: newPinned });
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
                  const slug = profile.verifiedPortfolioSlug || userName.toLowerCase().replace(/\s+/g, '-');
                  const url = `${window.location.origin}/#portfolio/${slug}`;
                  navigator.clipboard.writeText(url);
                  showToast('Shareable Proof Passport URL copied to clipboard!', 'success');
                }}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:border-emerald-500 transition flex items-center gap-1.5 shadow-2xs"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Link</span>
              </button>
              <button
                onClick={() => onNavigate('portfolio', profile.verifiedPortfolioSlug || userName.toLowerCase().replace(/\s+/g, '-'))}
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

      {/* Tab 6: Profile & Skills Management */}
      {activeTab === 'profile' && (
        <div className="space-y-6 max-w-4xl">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Creator Profile & Presentation</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                  Live
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Customize your presentation, skills, external links, and professional connections visible to hiring businesses.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsCustomizeBannerOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <Palette className="w-3.5 h-3.5 text-indigo-500" />
                <span>Customize Banner</span>
              </button>
              <button
                onClick={() => setIsConnectionModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5 text-teal-500" />
                <span>+Connection Profile</span>
              </button>
              <button
                onClick={handleOpenEditProfile}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile & Presentation</span>
              </button>
            </div>
          </div>

          {/* Section 1: Presentation Overview Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] text-slate-400">
                Presentation Overview
              </h3>
              <button
                onClick={handleOpenEditProfile}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                <span>Modify Details</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Headline</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {profile.headline || 'No headline specified yet.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Education & Institution</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {profile.degree ? `${profile.degree} · ` : ''}{profile.college || 'College not specified'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1 md:col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Creator Bio</span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {profile.bio || 'Add a bio describing your design/engineering focus and background.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Work Availability</span>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {profile.availability === 'AVAILABLE' ? '🟢 Open to New Projects' : '🟡 Busy / Selected Projects Only'}
                  </div>
                </div>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                  {profile.availability || 'AVAILABLE'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Payout UPI ID</span>
                  <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {profile.upiId || 'Not set (Required for INR payouts)'}
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 font-mono">
                  Direct UTR
                </span>
              </div>

              {/* Creator Verification Status Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2 md:col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Institutional Identity & Verification</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        profile.verificationStatus === 'VERIFIED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : profile.verificationStatus === 'PENDING'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : profile.verificationStatus === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Status: {profile.verificationStatus || 'UNVERIFIED'}</span>
                      </span>
                      {profile.verificationDetails?.documentType && (
                        <span className="text-xs text-slate-500">
                          {profile.verificationDetails.documentType}: <code className="font-mono">{profile.verificationDetails.documentNumber}</code>
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsVerificationModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition flex items-center gap-1.5 self-start sm:self-auto shrink-0"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{profile.verificationStatus === 'VERIFIED' ? 'View Credentials' : profile.verificationStatus === 'PENDING' ? 'Update Evidence' : 'Submit Verification'}</span>
                  </button>
                </div>
                {profile.verificationDetails?.adminNotes && (
                  <p className="text-[11px] text-slate-500 italic bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    Editorial Notes: {profile.verificationDetails.adminNotes}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Technical Stack & Skills Management */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Technical Stack & Skills</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 text-xs font-bold">
                    {profile.skills.length} Added
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Highlighted to hiring businesses when evaluating project applications and skill matches.
                </p>
              </div>
            </div>

            {/* Quick Skill Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (quickSkillInput.trim()) {
                  handleAddSkillDirectly(quickSkillInput.trim());
                }
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={quickSkillInput}
                onChange={(e) => setQuickSkillInput(e.target.value)}
                placeholder="Type a skill (e.g. Next.js, Flutter, Three.js, Figma) and press Enter..."
                className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shrink-0 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Skill</span>
              </button>
            </form>

            {/* Quick Skill Suggestions */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Quick Suggestions:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'React',
                  'TypeScript',
                  'Tailwind CSS',
                  'Next.js',
                  'Figma',
                  'UI/UX Design',
                  'Node.js',
                  'Python',
                  'PostgreSQL',
                  'GraphQL',
                  'Docker',
                  'Three.js',
                  'Mobile App Dev',
                  'Brand Identity',
                ].map((s) => {
                  const alreadyHas = profile.skills.some((sk) => sk.toLowerCase() === s.toLowerCase());
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={alreadyHas}
                      onClick={() => handleAddSkillDirectly(s)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                        alreadyHas
                          ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 cursor-default opacity-60'
                          : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 font-medium'
                      }`}
                    >
                      {alreadyHas ? '✓' : '+'} {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Skills Chip List */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
                Active Skills ({profile.skills.length}):
              </span>
              {profile.skills.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl">
                  No skills listed yet. Type a skill or pick one from the quick suggestions above.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold group hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 transition"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkillDirectly(skill)}
                        className="text-slate-400 group-hover:text-rose-600 hover:scale-110 transition p-0.5"
                        title={`Remove ${skill}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Online Profiles & Links */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-teal-600" />
                  <span>Online Profiles & Web Links</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Connect your GitHub, LinkedIn, Behance, and portfolio showcases.
                </p>
              </div>
            </div>

            {/* Primary Platform Links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">GitHub Profile</span>
                {profile.githubUrl ? (
                  <a
                    href={profile.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 truncate"
                  >
                    <span>{profile.githubUrl.replace('https://', '')}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                ) : (
                  <div className="text-xs text-slate-400 italic">Not connected</div>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">LinkedIn Profile</span>
                {profile.linkedinUrl ? (
                  <a
                    href={profile.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 truncate"
                  >
                    <span>{profile.linkedinUrl.replace('https://', '')}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                ) : (
                  <div className="text-xs text-slate-400 italic">Not connected</div>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Behance / Dribbble</span>
                {profile.behanceUrl ? (
                  <a
                    href={profile.behanceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 truncate"
                  >
                    <span>{profile.behanceUrl.replace('https://', '')}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                ) : (
                  <div className="text-xs text-slate-400 italic">Not connected</div>
                )}
              </div>
            </div>

            {/* Custom Extra Links List */}
            {profile.socialLinks && profile.socialLinks.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Custom Online Links:</span>
                <div className="space-y-2">
                  {profile.socialLinks.map((sl, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                          {sl.platform}
                        </span>
                        <a
                          href={sl.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-800 dark:text-slate-200 hover:text-emerald-600 transition truncate"
                        >
                          {sl.url}
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSocialLink(sl.platform)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition shrink-0 ml-2"
                        title="Remove link"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Custom Link Form */}
            <form onSubmit={handleAddSocialLink} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-indigo-500" />
                <span>Add Extra Web or Portfolio Link</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  value={newLinkPlatform}
                  onChange={(e) => setNewLinkPlatform(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                >
                  <option value="portfolio">Personal Portfolio</option>
                  <option value="dribbble">Dribbble</option>
                  <option value="twitter">X / Twitter</option>
                  <option value="gitlab">GitLab</option>
                  <option value="medium">Medium / Substack</option>
                  <option value="other">Other Link</option>
                </select>
                <input
                  type="url"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="sm:col-span-2 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition flex items-center gap-1.5"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Save Link</span>
                </button>
              </div>
            </form>
          </div>

          {/* Section 4: Professional Connections */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>Professional Connections & Endorsements</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                    {(profile.connections || []).length} Connected
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Link verified recruiters, collaborating creators, mentors, and corporate contacts to reinforce credibility.
                </p>
              </div>
              <button
                onClick={() => setIsConnectionModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center gap-1.5 self-start sm:self-auto shadow-2xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+Connection Profile</span>
              </button>
            </div>

            {(!profile.connections || profile.connections.length === 0) ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl space-y-2">
                <UserCheck className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">No Professional Connections Added Yet</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Click "+Connection Profile" to add recruiters, past clients, or peer creators you have collaborated with.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {profile.connections.map((conn) => (
                  <div
                    key={conn.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{conn.name}</span>
                        {conn.platform && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                            {conn.platform}
                          </span>
                        )}
                      </div>
                      {conn.role && (
                        <p className="text-[11px] text-slate-500 font-medium">{conn.role}</p>
                      )}
                      {conn.profileUrl && (
                        <a
                          href={conn.profileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 pt-0.5"
                        >
                          <span className="truncate max-w-[200px]">{conn.profileUrl.replace('https://', '')}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveConnection(conn.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition shrink-0"
                      title="Remove connection"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 7: Settings & Account Deletion */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Account Settings & Privacy</h2>
            <p className="text-xs text-slate-500 mt-1">Manage appearance, theme preferences, and data privacy.</p>
          </div>

          {/* Theme & Appearance */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">Appearance & Theme</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Select Light, Dark, or automatically adapt to your device's System Default.
                </p>
              </div>
            </div>
            <div className="pt-1">
              <ThemeToggle variant="segmented" showLabels={true} />
            </div>
          </div>

          {/* Platform Verification Policy */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h4 className="font-bold text-slate-900 dark:text-white">Creator Protection & Verification</h4>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
              Proof-to-Pay verifies student deliverable milestones and protects 100% of agreed compensation. Zero commissions are deducted from your project payouts, and direct bank UTR settlement numbers are provided on deliverable confirmation.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-xs">Active Creator Session</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Signed in as <strong className="text-slate-800 dark:text-slate-200">{currentUser?.email || currentUser?.name}</strong> (Student Creator)
              </p>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out of Account</span>
              </button>
            )}
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
      {/* MODAL 6: REQUEST SUPPORT MODAL */}
      {isSupportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 space-y-0">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-amber-50/50 dark:bg-amber-950/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs shrink-0">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Request Platform Support
                  </h2>
                  <p className="text-xs text-slate-500">
                    Direct creator assistance for payouts, scope locks & arbitration
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsSupportModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSendSupportRequest} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Support Category *
                </label>
                <select
                  value={supportCategory}
                  onChange={(e) => setSupportCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  required
                >
                  <option value="PAYMENT_UTR">Payment Settlement & Bank UTR Tracking</option>
                  <option value="SCOPE_LOCK">Scope Lock & Deliverable Specifications</option>
                  <option value="DELIVERABLES">Work Submission & Review Feedback</option>
                  <option value="DISPUTE">File Project Milestone Dispute / Mediation</option>
                  <option value="ACCOUNT">Identity Verification & Creator Passport</option>
                  <option value="GENERAL">General Platform Question</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Related Project (Optional)
                </label>
                <select
                  value={supportRelatedProjectId}
                  onChange={(e) => setSupportRelatedProjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  <option value="">-- No specific project / Platform general --</option>
                  {activeProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} (₹{p.budgetINR.toLocaleString('en-IN')})
                    </option>
                  ))}
                  {offers.map((o) => (
                    <option key={o.id} value={o.projectId}>
                      Offer: {o.projectTitle}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  value={supportSubject}
                  onChange={(e) => setSupportSubject(e.target.value)}
                  placeholder="e.g., Verification of direct UPI UTR settlement"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description & Details *
                </label>
                <textarea
                  rows={4}
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Provide details about your query or milestone. If reporting payment discrepancy, mention reference date or bank details..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white leading-relaxed"
                  required
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 space-y-1">
                <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Proof-to-Pay Support SLA</span>
                </div>
                <p>
                  Creators receive priority resolution within 4 business hours. Student earnings remain protected under platform scope-lock policies.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSupportModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSupport}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingSupport ? 'Submitting...' : 'Submit Support Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: EDIT PROFILE & PRESENTATION MODAL */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 space-y-0">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs shrink-0">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Edit Profile & Presentation
                  </h2>
                  <p className="text-xs text-slate-500">
                    Update your public presentation, bio, institution, links, and payout ID
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEditProfile} className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    City / Location
                  </label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    placeholder="e.g., Bengaluru, Mumbai, Delhi"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Professional Headline *
                </label>
                <input
                  type="text"
                  value={editHeadline}
                  onChange={(e) => setEditHeadline(e.target.value)}
                  placeholder="e.g., Full-Stack TypeScript Engineer & UI Systems Designer"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    College / University
                  </label>
                  <input
                    type="text"
                    value={editCollege}
                    onChange={(e) => setEditCollege(e.target.value)}
                    placeholder="e.g., IIT Bombay / BITS Pilani"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Degree / Specialization
                  </label>
                  <input
                    type="text"
                    value={editDegree}
                    onChange={(e) => setEditDegree(e.target.value)}
                    placeholder="e.g., B.Tech Computer Science"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Creator Bio & Overview *
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Describe your design and engineering experience, past client achievements, and preferred tech stack..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Work Availability
                  </label>
                  <select
                    value={editAvailability}
                    onChange={(e) => setEditAvailability(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                  >
                    <option value="AVAILABLE">Available for New Projects</option>
                    <option value="BUSY">Selected Projects Only (Busy)</option>
                    <option value="UNAVAILABLE">Temporarily Unavailable</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payout UPI ID (Direct Settlements)
                  </label>
                  <input
                    type="text"
                    value={editUpi}
                    onChange={(e) => setEditUpi(e.target.value)}
                    placeholder="yourname@okaxis"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              {/* Online Social Links */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Online Profiles & Links
                </span>
                <div className="space-y-2">
                  <input
                    type="url"
                    value={editGithub}
                    onChange={(e) => setEditGithub(e.target.value)}
                    placeholder="GitHub URL: https://github.com/..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                  <input
                    type="url"
                    value={editLinkedin}
                    onChange={(e) => setEditLinkedin(e.target.value)}
                    placeholder="LinkedIn URL: https://linkedin.com/in/..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                  <input
                    type="url"
                    value={editBehance}
                    onChange={(e) => setEditBehance(e.target.value)}
                    placeholder="Behance / Dribbble URL: https://behance.net/..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              {/* Skills Editor */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Skills ({editSkillsList.length})
                </label>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 min-h-[48px]">
                  {editSkillsList.map((sk) => (
                    <span
                      key={sk}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 text-xs font-semibold"
                    >
                      <span>{sk}</span>
                      <button
                        type="button"
                        onClick={() => setEditSkillsList(editSkillsList.filter((s) => s !== sk))}
                        className="text-indigo-400 hover:text-rose-600 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50"
                >
                  <span>{isSavingProfile ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 8: CUSTOMIZE BANNER MODAL */}
      {isCustomizeBannerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 space-y-0">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-indigo-50/50 dark:bg-indigo-950/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs shrink-0">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Customize Profile Banner
                  </h2>
                  <p className="text-xs text-slate-500">
                    Select a gradient theme or enter an external image URL
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCustomizeBannerOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Live Preview Box */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Live Banner Preview:
                </span>
                <div
                  className={`h-28 rounded-2xl border border-slate-200 dark:border-slate-700 relative overflow-hidden flex items-end p-3 shadow-inner ${
                    customBannerUrl.trim().startsWith('http')
                      ? 'bg-cover bg-center'
                      : getBannerBackground(selectedBannerPreset)
                  }`}
                  style={
                    customBannerUrl.trim().startsWith('http')
                      ? { backgroundImage: `url(${customBannerUrl.trim()})` }
                      : undefined
                  }
                >
                  <div className="flex items-center gap-2 bg-slate-900/70 backdrop-blur-xs px-3 py-1 rounded-xl text-white text-xs font-bold">
                    <span>{userName}</span>
                    <span className="text-[10px] text-emerald-400">✓ Verified</span>
                  </div>
                </div>
              </div>

              {/* Theme Presets */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Select Theme Gradient Preset:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {BANNER_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setSelectedBannerPreset(preset.id);
                        setCustomBannerUrl('');
                      }}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                        selectedBannerPreset === preset.id && !customBannerUrl.trim()
                          ? 'border-indigo-600 ring-2 ring-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/30'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg bg-gradient-to-r ${preset.gradient} shrink-0 shadow-xs`} />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Image URL */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Or Custom Image URL (Optional):
                </label>
                <input
                  type="url"
                  value={customBannerUrl}
                  onChange={(e) => setCustomBannerUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or https://..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCustomizeBannerOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveBanner}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Apply Banner</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 9: +CONNECTION PROFILE MODAL */}
      {isConnectionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 space-y-0">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-teal-50/50 dark:bg-teal-950/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-xs shrink-0">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Add Professional Connection
                  </h2>
                  <p className="text-xs text-slate-500">
                    Link verified recruiters, clients, collaborating peers, or mentors
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsConnectionModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddConnection} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Connection Category *
                </label>
                <select
                  value={connPlatform}
                  onChange={(e) => setConnPlatform(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                >
                  <option value="Recruiter">Corporate / Tech Recruiter</option>
                  <option value="Peer Creator">Peer Student / Creator</option>
                  <option value="Client">Past Hiring Client / Business</option>
                  <option value="Mentor">Industry Mentor / Professor</option>
                  <option value="LinkedIn">LinkedIn Contact</option>
                  <option value="GitHub">GitHub Collaborator</option>
                  <option value="Other">Professional Network</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name or Handle *
                </label>
                <input
                  type="text"
                  value={connName}
                  onChange={(e) => setConnName(e.target.value)}
                  placeholder="e.g., Priya Sharma or @priyatech"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Profile or Portfolio URL
                </label>
                <input
                  type="text"
                  value={connUrl}
                  onChange={(e) => setConnUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/... or https://github.com/..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Role / Organization / Context
                </label>
                <input
                  type="text"
                  value={connRole}
                  onChange={(e) => setConnRole(e.target.value)}
                  placeholder="e.g., Senior Tech Recruiter at Razorpay"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsConnectionModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Connection</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 10: SUBMIT STUDENT VERIFICATION MODAL */}
      {isVerificationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 space-y-0">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Submit Creator Verification
                  </h2>
                  <p className="text-xs text-slate-500">
                    Verify student enrollment or creative credential to unlock Verified Creator status
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsVerificationModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitVerification} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Document / Evidence Type *
                </label>
                <select
                  value={verificationDocType}
                  onChange={(e) => setVerificationDocType(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                >
                  <option value="College Student Identity Card">University / College Student ID Card</option>
                  <option value="Institutional Department Email">Official .edu / .ac.in College Email</option>
                  <option value="Campus Enrollment / Fee Receipt">Active Campus Semester Fee Receipt</option>
                  <option value="Government Photo ID (PAN / Aadhaar)">Government Identity Card (Adult / Student)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Student Roll / Enrollment / ID Number *
                </label>
                <input
                  type="text"
                  value={verificationDocNumber}
                  onChange={(e) => setVerificationDocNumber(e.target.value)}
                  placeholder="e.g. DTU/2023/CSE/084 or IITB-2024-MECH-102"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Institutional College Email (Optional)
                </label>
                <input
                  type="email"
                  value={verificationCollegeEmail}
                  onChange={(e) => setVerificationCollegeEmail(e.target.value)}
                  placeholder="e.g. yourname@dtu.ac.in or student@iitb.ac.in"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ID Document Image / Cloud Drive URL (Optional)
                </label>
                <input
                  type="url"
                  value={verificationIdCardUrl}
                  onChange={(e) => setVerificationIdCardUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or https://..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 space-y-1">
                <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Proof-to-Pay Verification Protocol</span>
                </div>
                <p>
                  Platform administrators verify your enrollment and portfolio evidence to prevent impersonation and protect direct milestone client payments.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsVerificationModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingVerification}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isSubmittingVerification ? 'Submitting...' : 'Submit for Verification'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 11: LEAVE VERIFIED CLIENT REVIEW MODAL */}
      {reviewingProjectId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 space-y-0">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-amber-50/50 dark:bg-amber-950/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs shrink-0">
                  <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Leave Verified Client Review
                  </h2>
                  <p className="text-xs text-slate-500">
                    Share feedback on business client communication, scope clarity & settlement
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReviewingProjectId(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitCreatorReview} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Client Collaboration Rating *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 text-2xl transition hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= reviewRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300 dark:text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 ml-2">
                    {reviewRating}.0 / 5.0
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Verified Deliverable Summary
                </label>
                <input
                  type="text"
                  value={reviewDeliverableSummary}
                  onChange={(e) => setReviewDeliverableSummary(e.target.value)}
                  placeholder="e.g. Next.js App Router MVP, Figma Design System, Brand Guidelines"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Collaboration Review & Feedback *
                </label>
                <textarea
                  rows={4}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Describe your working experience with this client: responsiveness, clarity of specifications, milestone feedback, and promptness of direct UPI/bank settlement..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white leading-relaxed"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setReviewingProjectId(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Star className="w-3.5 h-3.5 fill-white" />
                  <span>{isSubmittingReview ? 'Submitting...' : 'Submit Verified Review'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification Container */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 bg-slate-900 text-white border border-slate-700">
          {toastMsg.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
          <button onClick={() => setToastMsg(null)} className="ml-2 text-slate-400 hover:text-white p-0.5">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
