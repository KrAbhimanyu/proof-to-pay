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
  status: PaymentStatus;
  paymentMethod: 'UPI' | 'NEFT_IMPS' | 'BANK_TRANSFER';
  transactionReferenceUTR?: string;
  paymentProofUrl?: string;
  recordedByUserId: string;
  recordedAt?: string;
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
