export type UserRole = 'STUDENT' | 'BUSINESS' | 'ADMIN';

export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export type ProjectStatus = 
  | 'DRAFT' 
  | 'PENDING_REVIEW' 
  | 'APPROVED' 
  | 'IN_PROGRESS' 
  | 'SUBMITTED' 
  | 'REVISION_REQUESTED' 
  | 'COMPLETED' 
  | 'DISPUTED' 
  | 'CANCELLED';

export type ApplicationStatus = 
  | 'PENDING' 
  | 'SHORTLISTED' 
  | 'OFFER_EXTENDED' 
  | 'ACCEPTED' 
  | 'REJECTED' 
  | 'WITHDRAWN';

export type PaymentStatus = 
  | 'NOT_INITIATED'
  | 'PENDING'
  | 'PAID' 
  | 'FAILED'
  | 'REFUNDED'
  | 'NOT_DUE' 
  | 'PENDING_CONFIRMATION' 
  | 'DISPUTED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  isSuspended?: boolean;
  suspensionReason?: string;
  createdAt: string;
  phone?: string;
  city?: string;
  state?: string;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  behanceUrl?: string | null;
}

export interface StudentProfile {
  userId: string;
  headline: string;
  bio: string;
  age: number; // Must be 18+
  college?: string;
  degree?: string;
  graduationYear?: number;
  skills: string[];
  experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  portfolioLinks: { title: string; url: string; description?: string }[];
  upiId?: string; // For payout record reference
  totalEarnedINR: number;
  completedProjectsCount: number;
  averageRating: number;
  verifiedPortfolioSlug: string;
  pinnedBadgeIds?: string[];
  coverImageUrl?: string;
  availability?: 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE';
  socialLinks?: { platform: string; url: string }[];
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  behanceUrl?: string | null;
}

export type BadgeTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
export type BadgeCategory = 'MILESTONE' | 'REPUTATION' | 'DELIVERY' | 'COMMUNITY';

export interface MilestoneBadge {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: BadgeCategory;
  tier: BadgeTier;
  iconName: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number; // 0 to 100
  currentValue: number;
  targetValue: number;
  unit: string;
  requirement: string;
  rewardPoints: number;
  isFeatured?: boolean;
}

export interface CreatorLevelProgress {
  currentLevel: number;
  levelTitle: string;
  totalXP: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progressPercent: number;
  unlockedBadgesCount: number;
  totalBadgesCount: number;
}

export interface BusinessProfile {
  userId: string;
  companyName: string;
  tagline?: string;
  website?: string;
  industry: string;
  city: string;
  verificationStatus: VerificationStatus;
  verificationDetails?: {
    legalEntityName: string;
    documentType: 'GSTIN' | 'CIN' | 'PAN' | 'UDYAM_MSME';
    documentNumber: string;
    submittedAt: string;
    adminNotes?: string;
    verifiedAt?: string;
  };
  totalSpentINR: number;
  projectsPostedCount: number;
}

export interface DeliverableItem {
  id: string;
  title: string;
  description: string;
  format: string; // e.g., 'Figma Link', 'GitHub PR', 'MP4 4K', 'PDF Guidelines'
}

export interface ProjectListing {
  id: string;
  businessId: string;
  businessName: string;
  businessCity: string;
  businessVerified: boolean;
  title: string;
  summary: string;
  description: string;
  category: string;
  requiredSkills: string[];
  deliverables: DeliverableItem[];
  acceptanceCriteria: string[];
  budgetINR: number;
  deadlineDays: number;
  expectedDeliveryDate: string;
  permittedRevisions: number;
  applicationClosingDate: string;
  paymentTerms: string;
  status: ProjectStatus;
  moderationNotes?: string;
  selectedStudentId?: string;
  selectedStudentName?: string;
  activeOfferId?: string;
  createdAt: string;
  updatedAt: string;
  coverImage?: string;
}

export interface Application {
  id: string;
  projectId: string;
  projectTitle: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  studentSkills: string[];
  pitchMessage: string;
  portfolioSamples: { title: string; url: string }[];
  proposedDeliveryDays: number;
  status: ApplicationStatus;
  createdAt: string;
  reviewedAt?: string;
}

export type ProjectPaymentStatus =
  | 'NOT_REPORTED'
  | 'REPORTED_BY_BUSINESS'
  | 'RECEIPT_CONFIRMED_BY_CREATOR'
  | 'DISPUTED';

export type PlatformFeeStatus =
  | 'NOT_DUE'
  | 'DUE'
  | 'REPORTED_PAID'
  | 'VERIFIED_COLLECTED'
  | 'OVERDUE'
  | 'WAIVED'
  | 'REFUNDED_OR_ADJUSTED';

export interface ProjectOffer {
  id: string;
  projectId: string;
  projectTitle: string;
  businessId: string;
  businessName: string;
  studentId: string;
  studentName: string;
  agreedBudgetINR: number;
  agreedDeadline: string;
  agreedRevisions: number;
  scopeSummary: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  createdAt: string;
  respondedAt?: string;
  // Phase 1 Beta Monetization Snapshot
  commissionRatePercent: number; // e.g. 5%
  platformFeeINR: number;        // e.g. agreedBudgetINR * 0.05
  creatorReceivesINR: number;    // Exactly agreedBudgetINR (never reduced)
  feePayer: 'BUSINESS';          // Business pays separately
  commissionTermsSnapshot?: string;
  // Phase 1 Scope Lock additions
  cancellationTerms?: string;
  deliverablesSnapshot?: DeliverableItem[];
  scopeLocked?: boolean;
  lockedAt?: string;
  explicitAcceptedAt?: string;
  explicitAcceptedByStudent?: boolean;
  acceptedChecklist?: {
    deliverablesAgreed: boolean;
    deadlineAgreed: boolean;
    revisionsAgreed: boolean;
    cancellationAgreed: boolean;
    feeTermsAgreed: boolean;
  };
}

// Proof Passport: Verified projects completion credentials
export interface ProofPassportItem {
  id: string;
  studentId: string;
  projectId: string;
  projectTitle: string;
  category: string;
  completedAt: string;
  completionSource: 'BUSINESS_APPROVAL' | 'DISPUTE_RESOLUTION';
  businessName: string;
  businessCity?: string;
  sanitizedSummary: string; // Sanitized public deliverables summary (no confidential files/assets)
  rating?: number; // 1 to 5
  reviewSnippet?: string;
  isPublic: boolean; // Creator controls whether this appears on public passport
  displayOrder: number;
  badgeTitle?: string;
  createdAt: string;
  skills?: string[];
  deliverables?: string[];
  coverImage?: string;
}

// Scope Lock Change Request
export type ScopeChangeStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export interface ScopeChangeRequest {
  id: string;
  projectId: string;
  offerId: string;
  requestedByUserId: string;
  requestedByName: string;
  requestedByRole: 'STUDENT' | 'BUSINESS';
  reason: string;
  proposedBudgetINR: number;
  proposedDeadline: string;
  proposedRevisions: number;
  proposedDeliverables: DeliverableItem[];
  proposedScopeSummary: string;
  previousTermsSnapshot: {
    budgetINR: number;
    deadline: string;
    revisions: number;
    scopeSummary: string;
    deliverables: DeliverableItem[];
  };
  status: ScopeChangeStatus;
  rejectionReason?: string;
  createdAt: string;
  respondedAt?: string;
  respondedByUserId?: string;
}

// Work Trail: Chronological timeline event
export type WorkTrailEventType =
  | 'PROJECT_CREATED'
  | 'APPLICATION_SUBMITTED'
  | 'OFFER_EXTENDED'
  | 'SCOPE_LOCKED_ACCEPTED'
  | 'SCOPE_CHANGE_REQUESTED'
  | 'SCOPE_CHANGE_ACCEPTED'
  | 'SCOPE_CHANGE_REJECTED'
  | 'DELIVERABLE_SUBMITTED'
  | 'REVISION_REQUESTED'
  | 'DELIVERABLES_APPROVED'
  | 'PROJECT_PAYMENT_REPORTED'
  | 'PROJECT_PAYMENT_CONFIRMED'
  | 'PROJECT_PAYMENT_DISPUTED'
  | 'PLATFORM_FEE_DUE'
  | 'PLATFORM_FEE_REPORTED'
  | 'PLATFORM_FEE_VERIFIED'
  | 'DISPUTE_RAISED'
  | 'DISPUTE_RESOLVED';

export interface WorkTrailEvent {
  id: string;
  projectId: string;
  eventType: WorkTrailEventType;
  title: string;
  description: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole | 'SYSTEM';
  metadata?: Record<string, any>;
  isVerified: boolean;
  verificationNote?: string;
}

export interface PlatformCommissionRecord {
  id: string;
  projectId: string;
  projectTitle: string;
  businessId: string;
  businessName: string;
  studentId: string;
  studentName: string;
  projectBudgetINR: number;
  commissionRatePercent: number;
  platformFeeINR: number;
  status: PlatformFeeStatus;
  dueDate: string;
  paymentMethod?: 'UPI' | 'NEFT_IMPS' | 'BANK_TRANSFER';
  reportedUTR?: string;
  reportedAt?: string;
  reportedNotes?: string;
  verifiedByUserId?: string;
  verifiedByName?: string;
  verifiedAt?: string;
  evidenceReviewedNotes?: string;
  waiverReason?: string;
  waivedByUserId?: string;
  waivedAt?: string;
  adjustmentAmountINR?: number;
  adjustmentReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformMonetizationConfig {
  defaultCommissionRatePercent: number; // default 5
  minProjectBudgetINR: number;          // 500
  paymentWindowDays: number;            // 5 days after completion
  updatedAt: string;
  updatedByUserId?: string;
}

export interface MonetizationMetrics {
  completedProjectsCount: number;
  totalAgreedProjectValueINR: number;
  commissionDueINR: number;
  commissionReportedPaidINR: number;
  commissionVerifiedCollectedINR: number;
  overdueFeesINR: number;
  waivedFeesINR: number;
  feeCollectionRatePercent: number;
}

export interface SubmissionFile {
  name: string;
  url: string;
  sizeMb: number;
  type: string;
}

export interface ProjectSubmission {
  id: string;
  projectId: string;
  studentId: string;
  version: number;
  notes: string;
  files: SubmissionFile[];
  liveLink?: string;
  submittedAt: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REVISION_REQUESTED';
  revisionFeedback?: string;
  revisionRequestedAt?: string;
}

export interface PaymentRecord {
  id: string;
  projectId: string;
  projectTitle: string;
  businessId: string;
  studentId: string;
  amountINR: number;
  status: PaymentStatus | ProjectPaymentStatus;
  paymentMethod: 'UPI' | 'NEFT_IMPS' | 'BANK_TRANSFER';
  transactionReferenceUTR?: string;
  paymentProofUrl?: string;
  recordedByUserId: string;
  recordedAt?: string;
  createdAt?: string;
  confirmedAt?: string;
  confirmedByUserId?: string;
  disputeReason?: string;
  notes?: string;
}

export interface VerifiedReview {
  id: string;
  projectId: string;
  projectTitle: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: 'STUDENT' | 'BUSINESS';
  targetUserId: string;
  rating: number; // 1-5
  comment: string;
  verifiedDeliverableSummary: string;
  createdAt: string;
}

export interface DisputeRecord {
  id: string;
  projectId: string;
  projectTitle: string;
  raisedByUserId: string;
  raisedByName: string;
  raisedByRole: UserRole;
  reason: string;
  evidenceNotes: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED_STUDENT_PAID' | 'RESOLVED_REFUNDED' | 'DISMISSED';
  adminDecision?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorUserId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  targetType: 'PROJECT' | 'USER' | 'PAYMENT' | 'VERIFICATION' | 'DISPUTE';
  targetId: string;
  details: string;
  timestamp: string;
}

export interface BetaFeedback {
  id: string;
  userId?: string;
  userName?: string;
  userRole?: UserRole | 'VISITOR';
  email?: string;
  category: 'BUG' | 'USABILITY' | 'FEATURE_REQUEST' | 'SAFETY_PAYMENT' | 'GENERAL';
  rating: number; // 1 to 5
  message: string;
  screenOrFeature?: string;
  createdAt: string;
}

export interface AbuseReport {
  id: string;
  reporterId: string;
  reporterName: string;
  targetUserId?: string;
  targetProjectId?: string;
  targetTitle: string;
  reason: 'SPAM' | 'HARASSMENT' | 'OFF_PLATFORM_PAYMENT' | 'UNDERAGE' | 'FAKE_BUSINESS' | 'COPYRIGHT';
  description: string;
  status: 'PENDING' | 'RESOLVED_WARNED' | 'RESOLVED_SUSPENDED' | 'DISMISSED';
  adminNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface BetaMetricsReport {
  totalSignups: number;
  creatorsCount: number;
  businessesCount: number;
  adminsCount: number;
  totalProjects: number;
  approvedProjectsCount: number;
  draftOrPendingCount: number;
  totalApplications: number;
  activeAssignmentsCount: number;
  completedAssignmentsCount: number;
  totalAuditedINR: number;
  openDisputesCount: number;
  openAbuseReportsCount: number;
  feedbackCount: number;
}
