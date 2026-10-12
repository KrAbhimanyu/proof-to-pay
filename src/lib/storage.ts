import {
  User,
  StudentProfile,
  BusinessProfile,
  ProjectListing,
  Application,
  ProjectOffer,
  ProjectSubmission,
  PaymentRecord,
  VerifiedReview,
  DisputeRecord,
  AuditLog,
  BetaFeedback,
  AbuseReport,
  BetaMetricsReport,
  UserRole,
  VerificationStatus,
  ProjectStatus,
  PlatformCommissionRecord,
  PlatformMonetizationConfig,
  MonetizationMetrics,
  ProjectPaymentStatus,
  PlatformFeeStatus,
  ProofPassportItem,
  ScopeChangeRequest,
  WorkTrailEvent,
  WorkTrailEventType,
  DeliverableItem
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_STUDENT_PROFILES,
  INITIAL_BUSINESS_PROFILES,
  INITIAL_PROJECTS,
  INITIAL_APPLICATIONS,
  INITIAL_OFFERS,
  INITIAL_SUBMISSIONS,
  INITIAL_PAYMENTS,
  INITIAL_REVIEWS,
  INITIAL_DISPUTES,
  INITIAL_AUDIT_LOGS,
  INITIAL_PLATFORM_COMMISSIONS,
  INITIAL_MONETIZATION_CONFIG,
  INITIAL_PROOF_PASSPORT_ITEMS,
  INITIAL_SCOPE_CHANGE_REQUESTS
} from './mockData';

const STORAGE_KEYS = {
  USERS: 'ptp_users',
  STUDENT_PROFILES: 'ptp_student_profiles',
  BUSINESS_PROFILES: 'ptp_business_profiles',
  PROJECTS: 'ptp_projects',
  APPLICATIONS: 'ptp_applications',
  OFFERS: 'ptp_offers',
  SUBMISSIONS: 'ptp_submissions',
  PAYMENTS: 'ptp_payments',
  REVIEWS: 'ptp_reviews',
  DISPUTES: 'ptp_disputes',
  AUDIT_LOGS: 'ptp_audit_logs',
  BETA_FEEDBACK: 'ptp_beta_feedback',
  ABUSE_REPORTS: 'ptp_abuse_reports',
  CURRENT_USER_ID: 'ptp_current_user_id',
  PLATFORM_COMMISSIONS: 'ptp_platform_commissions',
  MONETIZATION_CONFIG: 'ptp_monetization_config',
  PROOF_PASSPORT_ITEMS: 'ptp_proof_passport_items',
  SCOPE_CHANGE_REQUESTS: 'ptp_scope_change_requests',
};

class MarketplaceStore {
  private memoryStore: Record<string, string> = {};

  private get<T>(key: string, fallback: T): T {
    try {
      if (typeof localStorage !== 'undefined') {
        const data = localStorage.getItem(key);
        if (!data) return fallback;
        return JSON.parse(data) as T;
      } else {
        const data = this.memoryStore[key];
        if (!data) return fallback;
        return JSON.parse(data) as T;
      }
    } catch {
      return fallback;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      const json = JSON.stringify(value);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, json);
      }
      this.memoryStore[key] = json;
    } catch {
      // localStorage may fail in edge cases
    }
  }

  public isDemoMode(): boolean {
    // Demo mode is active when live Supabase credentials are not connected
    const config = this.get<{ isDemoOverride?: boolean }>('ptp_mode_override', { isDemoOverride: true });
    return config.isDemoOverride ?? true;
  }

  public setDemoMode(isDemo: boolean): void {
    this.set('ptp_mode_override', { isDemoOverride: isDemo });
  }

  public init(): void {
    if (typeof localStorage !== 'undefined') {
      if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
        this.resetToDefaults();
      }
    } else {
      if (!this.memoryStore[STORAGE_KEYS.USERS]) {
        this.resetToDefaults();
      }
    }
  }

  public resetToDefaults(): void {
    this.set(STORAGE_KEYS.USERS, INITIAL_USERS);
    this.set(STORAGE_KEYS.STUDENT_PROFILES, INITIAL_STUDENT_PROFILES);
    this.set(STORAGE_KEYS.BUSINESS_PROFILES, INITIAL_BUSINESS_PROFILES);
    this.set(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
    this.set(STORAGE_KEYS.APPLICATIONS, INITIAL_APPLICATIONS);
    this.set(STORAGE_KEYS.OFFERS, INITIAL_OFFERS);
    this.set(STORAGE_KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
    this.set(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
    this.set(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
    this.set(STORAGE_KEYS.DISPUTES, INITIAL_DISPUTES);
    this.set(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    this.set(STORAGE_KEYS.PLATFORM_COMMISSIONS, INITIAL_PLATFORM_COMMISSIONS);
    this.set(STORAGE_KEYS.MONETIZATION_CONFIG, INITIAL_MONETIZATION_CONFIG);
    this.set(STORAGE_KEYS.PROOF_PASSPORT_ITEMS, INITIAL_PROOF_PASSPORT_ITEMS);
    this.set(STORAGE_KEYS.SCOPE_CHANGE_REQUESTS, INITIAL_SCOPE_CHANGE_REQUESTS);
    this.set(STORAGE_KEYS.CURRENT_USER_ID, 'student-1');
  }

  // --- Auth & Session ---
  public getUsers(): User[] {
    return this.get<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  public getCurrentUser(): User | null {
    const users = this.getUsers();
    const currentId = this.get<string>(STORAGE_KEYS.CURRENT_USER_ID, 'student-1');
    if (!currentId) return null;
    return users.find((u) => u.id === currentId && !u.isSuspended) || users[0] || null;
  }

  public setCurrentUserId(userId: string | null): void {
    if (!userId) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    } else {
      this.set(STORAGE_KEYS.CURRENT_USER_ID, userId);
    }
  }

  public logAudit(actor: User, action: string, targetType: AuditLog['targetType'], targetId: string, details: string): void {
    const logs = this.get<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      actorUserId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action,
      targetType,
      targetId,
      details,
      timestamp: new Date().toISOString(),
    };
    this.set(STORAGE_KEYS.AUDIT_LOGS, [newLog, ...logs]);
  }

  public getAuditLogs(): AuditLog[] {
    return this.get<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  }

  // --- Student Profiles ---
  public getStudentProfile(userId: string): StudentProfile | null {
    const profiles = this.get<Record<string, StudentProfile>>(STORAGE_KEYS.STUDENT_PROFILES, INITIAL_STUDENT_PROFILES);
    return profiles[userId] || null;
  }

  public updateStudentProfile(userId: string, data: Partial<StudentProfile>): StudentProfile {
    const profiles = this.get<Record<string, StudentProfile>>(STORAGE_KEYS.STUDENT_PROFILES, INITIAL_STUDENT_PROFILES);
    const current = profiles[userId] || {
      userId,
      headline: '',
      bio: '',
      age: 18,
      skills: [],
      experienceLevel: 'BEGINNER',
      portfolioLinks: [],
      totalEarnedINR: 0,
      completedProjectsCount: 0,
      averageRating: 0,
      verifiedPortfolioSlug: userId,
    };
    const updated = { ...current, ...data };
    profiles[userId] = updated;
    this.set(STORAGE_KEYS.STUDENT_PROFILES, profiles);
    return updated;
  }

  public updateCreatorPortfolio(user: User, profileUserId: string, data: Partial<StudentProfile>): StudentProfile {
    if (user.id !== profileUserId && user.role !== 'ADMIN') {
      throw new Error('Unauthorized to edit this creator profile');
    }
    // Whitelist only editable portfolio presentation fields to prevent privilege escalation
    const sanitized: Partial<StudentProfile> = {};
    if (data.headline !== undefined) sanitized.headline = data.headline.trim();
    if (data.bio !== undefined) sanitized.bio = data.bio.trim();
    if (data.college !== undefined) sanitized.college = data.college.trim();
    if (data.degree !== undefined) sanitized.degree = data.degree.trim();
    if (data.graduationYear !== undefined) sanitized.graduationYear = data.graduationYear;
    if (data.skills !== undefined) sanitized.skills = data.skills;
    if (data.experienceLevel !== undefined) sanitized.experienceLevel = data.experienceLevel;
    if (data.portfolioLinks !== undefined) sanitized.portfolioLinks = data.portfolioLinks;
    if (data.pinnedBadgeIds !== undefined) sanitized.pinnedBadgeIds = data.pinnedBadgeIds;
    if (data.coverImageUrl !== undefined) sanitized.coverImageUrl = data.coverImageUrl;
    if (data.availability !== undefined) sanitized.availability = data.availability;
    if (data.socialLinks !== undefined) sanitized.socialLinks = data.socialLinks;

    const result = this.updateStudentProfile(profileUserId, sanitized);
    this.logAudit(user, 'UPDATED_PORTFOLIO_PRESENTATION', 'USER', profileUserId, 'Updated public creator profile fields and presentation.');
    return result;
  }

  // --- Business Profiles ---
  public getBusinessProfile(userId: string): BusinessProfile | null {
    const profiles = this.get<Record<string, BusinessProfile>>(STORAGE_KEYS.BUSINESS_PROFILES, INITIAL_BUSINESS_PROFILES);
    return profiles[userId] || null;
  }

  public updateBusinessProfile(userId: string, data: Partial<BusinessProfile>): BusinessProfile {
    const profiles = this.get<Record<string, BusinessProfile>>(STORAGE_KEYS.BUSINESS_PROFILES, INITIAL_BUSINESS_PROFILES);
    const current = profiles[userId] || {
      userId,
      companyName: 'Company',
      industry: 'Tech',
      city: 'India',
      verificationStatus: 'UNVERIFIED',
      totalSpentINR: 0,
      projectsPostedCount: 0,
    };
    const updated = { ...current, ...data };
    profiles[userId] = updated;
    this.set(STORAGE_KEYS.BUSINESS_PROFILES, profiles);
    return updated;
  }

  public submitBusinessVerification(businessId: string, details: {
    legalEntityName: string;
    documentType: 'GSTIN' | 'CIN' | 'PAN' | 'UDYAM_MSME';
    documentNumber: string;
  }): void {
    const user = this.getCurrentUser();
    if (!user || user.id !== businessId) throw new Error('Unauthorized');
    const profile = this.getBusinessProfile(businessId);
    if (!profile) throw new Error('Business profile not found');

    const updated = {
      ...profile,
      verificationStatus: 'PENDING' as VerificationStatus,
      verificationDetails: {
        ...details,
        submittedAt: new Date().toISOString(),
      }
    };
    this.updateBusinessProfile(businessId, updated);
    this.logAudit(user, 'SUBMITTED_BUSINESS_VERIFICATION', 'VERIFICATION', businessId, `Submitted ${details.documentType} (${details.documentNumber}) for verification.`);
  }

  public adminVerifyBusiness(adminUser: User, businessId: string, approved: boolean, notes: string): void {
    if (adminUser.role !== 'ADMIN') throw new Error('Admin authorization required');
    const profile = this.getBusinessProfile(businessId);
    if (!profile) throw new Error('Business not found');

    const updated = {
      ...profile,
      verificationStatus: (approved ? 'VERIFIED' : 'REJECTED') as VerificationStatus,
      verificationDetails: profile.verificationDetails ? {
        ...profile.verificationDetails,
        verifiedAt: new Date().toISOString(),
        adminNotes: notes,
      } : undefined
    };
    this.updateBusinessProfile(businessId, updated);
    this.logAudit(adminUser, approved ? 'APPROVED_BUSINESS_VERIFICATION' : 'REJECTED_BUSINESS_VERIFICATION', 'VERIFICATION', businessId, notes);
  }

  // --- Projects ---
  public getProjects(): ProjectListing[] {
    return this.get<ProjectListing[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  }

  public getProject(id: string): ProjectListing | null {
    return this.getProjects().find((p) => p.id === id) || null;
  }

  public createProject(businessUser: User, projectData: Omit<ProjectListing, 'id' | 'businessId' | 'businessName' | 'businessCity' | 'businessVerified' | 'status' | 'createdAt' | 'updatedAt'>, submitForReview = true): ProjectListing {
    if (businessUser.role !== 'BUSINESS') throw new Error('Only businesses can post projects');
    const bProfile = this.getBusinessProfile(businessUser.id);
    if (!bProfile) throw new Error('Business profile required');

    const projects = this.getProjects();
    const newProj: ProjectListing = {
      ...projectData,
      id: `proj-${Date.now()}`,
      businessId: businessUser.id,
      businessName: bProfile.companyName || businessUser.name,
      businessCity: bProfile.city || 'India',
      businessVerified: bProfile.verificationStatus === 'VERIFIED',
      status: submitForReview ? 'PENDING_REVIEW' : 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.set(STORAGE_KEYS.PROJECTS, [newProj, ...projects]);
    this.logAudit(businessUser, submitForReview ? 'SUBMITTED_PROJECT_FOR_REVIEW' : 'SAVED_PROJECT_DRAFT', 'PROJECT', newProj.id, `Created project "${newProj.title}"`);
    return newProj;
  }

  public adminModerateProject(adminUser: User, projectId: string, approved: boolean, notes?: string): void {
    if (adminUser.role !== 'ADMIN') throw new Error('Admin authorization required');
    const projects = this.getProjects();
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) throw new Error('Project not found');

    proj.status = approved ? 'APPROVED' : 'CANCELLED';
    proj.moderationNotes = notes;
    proj.updatedAt = new Date().toISOString();

    this.set(STORAGE_KEYS.PROJECTS, projects);
    this.logAudit(adminUser, approved ? 'APPROVED_PROJECT_LISTING' : 'REJECTED_PROJECT_LISTING', 'PROJECT', projectId, notes || 'Moderation decision recorded');
  }

  // --- Applications ---
  public getApplications(): Application[] {
    return this.get<Application[]>(STORAGE_KEYS.APPLICATIONS, INITIAL_APPLICATIONS);
  }

  public applyToProject(studentUser: User, projectId: string, pitchMessage: string, proposedDeliveryDays: number, portfolioSamples: { title: string; url: string }[]): Application {
    if (studentUser.role !== 'STUDENT') throw new Error('Only students can apply to projects');
    const studentProfile = this.getStudentProfile(studentUser.id);
    if (!studentProfile || studentProfile.age < 18) {
      throw new Error('You must be 18+ and have a completed student profile to apply.');
    }

    const project = this.getProject(projectId);
    if (!project || project.status !== 'APPROVED') {
      throw new Error('Project is not accepting applications');
    }

    const apps = this.getApplications();
    const existing = apps.find((a) => a.projectId === projectId && a.studentId === studentUser.id);
    if (existing) {
      throw new Error('You have already applied to this project');
    }

    const newApp: Application = {
      id: `app-${Date.now()}`,
      projectId,
      projectTitle: project.title,
      studentId: studentUser.id,
      studentName: studentUser.name,
      studentAvatar: studentUser.avatarUrl,
      studentSkills: studentProfile.skills,
      pitchMessage,
      portfolioSamples,
      proposedDeliveryDays,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    this.set(STORAGE_KEYS.APPLICATIONS, [newApp, ...apps]);
    this.logAudit(studentUser, 'SUBMITTED_APPLICATION', 'PROJECT', projectId, `Applied to ${project.title}`);
    return newApp;
  }

  // --- Offers & Monetization Snapshots ---
  public getMonetizationConfig(): PlatformMonetizationConfig {
    return this.get<PlatformMonetizationConfig>(STORAGE_KEYS.MONETIZATION_CONFIG, INITIAL_MONETIZATION_CONFIG);
  }

  public updateMonetizationConfig(adminUser: User, newRatePercent: number, paymentWindowDays = 5): PlatformMonetizationConfig {
    if (adminUser.role !== 'ADMIN') throw new Error('Admin authorization required');
    if (newRatePercent < 0 || newRatePercent > 50) {
      throw new Error('Commission rate must be between 0% and 50%');
    }

    const current = this.getMonetizationConfig();
    const updated: PlatformMonetizationConfig = {
      ...current,
      defaultCommissionRatePercent: newRatePercent,
      paymentWindowDays,
      updatedAt: new Date().toISOString(),
      updatedByUserId: adminUser.id,
    };

    this.set(STORAGE_KEYS.MONETIZATION_CONFIG, updated);
    this.logAudit(
      adminUser,
      'UPDATED_MONETIZATION_COMMISSION_RATE',
      'USER',
      adminUser.id,
      `Updated platform default commission to ${newRatePercent}%. Existing accepted offers remain immutable.`
    );
    return updated;
  }

  public getOffers(): ProjectOffer[] {
    return this.get<ProjectOffer[]>(STORAGE_KEYS.OFFERS, INITIAL_OFFERS);
  }

  public issueOffer(
    businessUser: User,
    projectId: string,
    studentId: string,
    agreedBudgetINR: number,
    agreedDeadline: string,
    agreedRevisions: number,
    scopeSummary: string,
    cancellationTerms?: string,
    deliverablesSnapshot?: DeliverableItem[]
  ): ProjectOffer {
    if (businessUser.role !== 'BUSINESS') throw new Error('Unauthorized');
    if (agreedBudgetINR <= 0) throw new Error('Agreed budget must be a positive amount in INR');

    const project = this.getProject(projectId);
    if (!project || project.businessId !== businessUser.id) throw new Error('Project not found or unauthorized');

    const student = this.getUsers().find((u) => u.id === studentId);
    if (!student) throw new Error('Student not found');

    // Safe integer paise representation for financial precision
    const config = this.getMonetizationConfig();
    const ratePct = config.defaultCommissionRatePercent;
    const budgetPaise = Math.round(agreedBudgetINR * 100);
    const feePaise = Math.round((budgetPaise * ratePct) / 100);
    const platformFeeINR = feePaise / 100;
    const creatorReceivesINR = agreedBudgetINR; // Never reduced!

    const offers = this.getOffers();
    const newOffer: ProjectOffer = {
      id: `offer-${Date.now()}`,
      projectId,
      projectTitle: project.title,
      businessId: businessUser.id,
      businessName: project.businessName,
      studentId,
      studentName: student.name,
      agreedBudgetINR,
      agreedDeadline,
      agreedRevisions,
      scopeSummary,
      status: 'PENDING',
      commissionRatePercent: ratePct,
      platformFeeINR,
      creatorReceivesINR,
      feePayer: 'BUSINESS',
      commissionTermsSnapshot: `Agreed budget: ₹${agreedBudgetINR.toLocaleString('en-IN')} INR. Platform fee: ₹${platformFeeINR.toLocaleString('en-IN')} INR (${ratePct}%) payable separately by ${project.businessName} directly to Proof-to-Pay upon completion. Creator ${student.name} receives full ₹${agreedBudgetINR.toLocaleString('en-IN')} INR with ₹0 deductions.`,
      cancellationTerms: cancellationTerms || 'Mutual cancellation permits pro-rata payment based on approved milestone deliverables. Unilateral cancellation without cause forfeits platform protections.',
      deliverablesSnapshot: deliverablesSnapshot || project.deliverables,
      scopeLocked: false,
      createdAt: new Date().toISOString(),
    };

    this.set(STORAGE_KEYS.OFFERS, [newOffer, ...offers]);

    // Update application status
    const apps = this.getApplications();
    const targetApp = apps.find((a) => a.projectId === projectId && a.studentId === studentId);
    if (targetApp) {
      targetApp.status = 'OFFER_EXTENDED';
      this.set(STORAGE_KEYS.APPLICATIONS, apps);
    }

    this.logAudit(
      businessUser,
      'ISSUED_OFFER_WITH_COMMISSION',
      'PROJECT',
      projectId,
      `Offered ₹${agreedBudgetINR} to ${student.name} (Platform fee: ₹${platformFeeINR} @ ${ratePct}%)`
    );
    return newOffer;
  }

  public respondToOffer(
    studentUser: User,
    offerId: string,
    accept: boolean,
    acceptedChecklist?: {
      deliverablesAgreed: boolean;
      deadlineAgreed: boolean;
      revisionsAgreed: boolean;
      cancellationAgreed: boolean;
      feeTermsAgreed: boolean;
    }
  ): ProjectOffer {
    if (studentUser.role !== 'STUDENT') throw new Error('Unauthorized');
    const offers = this.getOffers();
    const offer = offers.find((o) => o.id === offerId && o.studentId === studentUser.id);
    if (!offer) throw new Error('Offer not found');

    offer.status = accept ? 'ACCEPTED' : 'DECLINED';
    offer.respondedAt = new Date().toISOString();
    if (accept) {
      offer.scopeLocked = true;
      offer.lockedAt = new Date().toISOString();
      offer.explicitAcceptedAt = new Date().toISOString();
      offer.explicitAcceptedByStudent = true;
      if (acceptedChecklist) {
        offer.acceptedChecklist = acceptedChecklist;
      }
    }
    this.set(STORAGE_KEYS.OFFERS, offers);

    // Update project state if accepted
    const projects = this.getProjects();
    const proj = projects.find((p) => p.id === offer.projectId);
    if (proj && accept) {
      proj.status = 'IN_PROGRESS';
      proj.selectedStudentId = studentUser.id;
      proj.selectedStudentName = studentUser.name;
      proj.activeOfferId = offer.id;
      proj.budgetINR = offer.agreedBudgetINR;
      proj.expectedDeliveryDate = offer.agreedDeadline;
      proj.permittedRevisions = offer.agreedRevisions;
      if (offer.deliverablesSnapshot) {
        proj.deliverables = offer.deliverablesSnapshot;
      }
      proj.updatedAt = new Date().toISOString();
      this.set(STORAGE_KEYS.PROJECTS, projects);

      // Record A: Initialize Business-to-Creator project payment record as NOT_REPORTED
      const payments = this.getPayments();
      const existingPay = payments.find((p) => p.projectId === offer.projectId);
      if (!existingPay) {
        const newPayment: PaymentRecord = {
          id: `pay-${offer.projectId}`,
          projectId: offer.projectId,
          projectTitle: proj.title,
          businessId: offer.businessId,
          studentId: studentUser.id,
          amountINR: offer.agreedBudgetINR,
          status: 'NOT_REPORTED',
          paymentMethod: 'UPI',
          recordedByUserId: offer.businessId,
          notes: `Direct project payout: ₹${offer.agreedBudgetINR.toLocaleString('en-IN')} INR due to ${studentUser.name} upon final acceptance.`,
        };
        this.set(STORAGE_KEYS.PAYMENTS, [newPayment, ...payments]);
      }

      // Record B: Initialize Business-to-Platform Commission Record as NOT_DUE
      const commissions = this.getPlatformCommissions();
      const existingComm = commissions.find((c) => c.projectId === offer.projectId);
      if (!existingComm) {
        const newCommission: PlatformCommissionRecord = {
          id: `comm-${offer.projectId}`,
          projectId: offer.projectId,
          projectTitle: proj.title,
          businessId: offer.businessId,
          businessName: offer.businessName,
          studentId: studentUser.id,
          studentName: studentUser.name,
          projectBudgetINR: offer.agreedBudgetINR,
          commissionRatePercent: offer.commissionRatePercent || 5,
          platformFeeINR: offer.platformFeeINR,
          status: 'NOT_DUE',
          dueDate: offer.agreedDeadline,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.set(STORAGE_KEYS.PLATFORM_COMMISSIONS, [newCommission, ...commissions]);
      }
    }

    this.logAudit(
      studentUser,
      accept ? 'ACCEPTED_OFFER_SCOPE_LOCKED' : 'DECLINED_OFFER',
      'PROJECT',
      offer.projectId,
      `Offer ${accept ? 'accepted with Scope Lock executed' : 'declined'}`
    );
    return offer;
  }

  // --- Submissions & Revisions ---
  public getSubmissions(): ProjectSubmission[] {
    return this.get<ProjectSubmission[]>(STORAGE_KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
  }

  public submitProjectWork(studentUser: User, projectId: string, notes: string, liveLink?: string, files?: ProjectSubmission['files']): ProjectSubmission {
    if (studentUser.role !== 'STUDENT') throw new Error('Unauthorized');
    const proj = this.getProject(projectId);
    if (!proj || proj.selectedStudentId !== studentUser.id) throw new Error('Unauthorized: not assigned to this project');

    const subs = this.getSubmissions();
    const currentVersions = subs.filter((s) => s.projectId === projectId);
    const versionNumber = currentVersions.length + 1;

    const newSub: ProjectSubmission = {
      id: `sub-${projectId}-v${versionNumber}`,
      projectId,
      studentId: studentUser.id,
      version: versionNumber,
      notes,
      liveLink,
      files: files || [{ name: 'Deliverable_Master_File.zip', url: '#', sizeMb: 4.8, type: 'application/zip' }],
      submittedAt: new Date().toISOString(),
      status: 'PENDING_REVIEW',
    };

    this.set(STORAGE_KEYS.SUBMISSIONS, [newSub, ...subs]);

    // Update project status
    const projects = this.getProjects();
    const targetProj = projects.find((p) => p.id === projectId);
    if (targetProj) {
      targetProj.status = 'SUBMITTED';
      targetProj.updatedAt = new Date().toISOString();
      this.set(STORAGE_KEYS.PROJECTS, projects);
    }

    this.logAudit(studentUser, 'SUBMITTED_WORK', 'PROJECT', projectId, `Submitted Version ${versionNumber}`);
    return newSub;
  }

  public requestRevision(businessUser: User, projectId: string, feedback: string): void {
    if (businessUser.role !== 'BUSINESS') throw new Error('Unauthorized');
    const proj = this.getProject(projectId);
    if (!proj || proj.businessId !== businessUser.id) throw new Error('Unauthorized');

    const subs = this.getSubmissions().filter((s) => s.projectId === projectId);
    if (subs.length >= proj.permittedRevisions + 1) {
      throw new Error(`Permitted revision limit (${proj.permittedRevisions}) exceeded. Please approve or contact admin.`);
    }

    const latestSub = subs[0];
    if (latestSub) {
      latestSub.status = 'REVISION_REQUESTED';
      latestSub.revisionFeedback = feedback;
      latestSub.revisionRequestedAt = new Date().toISOString();
      this.set(STORAGE_KEYS.SUBMISSIONS, this.getSubmissions());
    }

    const projects = this.getProjects();
    const p = projects.find((item) => item.id === projectId);
    if (p) {
      p.status = 'REVISION_REQUESTED';
      p.updatedAt = new Date().toISOString();
      this.set(STORAGE_KEYS.PROJECTS, projects);
    }

    this.logAudit(businessUser, 'REQUESTED_REVISION', 'PROJECT', projectId, `Requested revision: "${feedback.substring(0, 60)}..."`);
  }

  public approveWorkAndComplete(businessUser: User, projectId: string): void {
    if (businessUser.role !== 'BUSINESS') throw new Error('Unauthorized');
    const proj = this.getProject(projectId);
    if (!proj || proj.businessId !== businessUser.id) throw new Error('Unauthorized');

    // Mark project as completed
    const projects = this.getProjects();
    const p = projects.find((item) => item.id === projectId);
    if (p) {
      p.status = 'COMPLETED';
      p.updatedAt = new Date().toISOString();
      this.set(STORAGE_KEYS.PROJECTS, projects);
    }

    // Mark submission approved
    const subs = this.getSubmissions();
    const latest = subs.find((s) => s.projectId === projectId && s.status === 'PENDING_REVIEW');
    if (latest) {
      latest.status = 'APPROVED';
      this.set(STORAGE_KEYS.SUBMISSIONS, subs);
    }

    // Move payment status to pending confirmation
    const payments = this.getPayments();
    const pay = payments.find((item) => item.projectId === projectId);
    if (pay) {
      pay.status = 'PENDING_CONFIRMATION';
      this.set(STORAGE_KEYS.PAYMENTS, payments);
    }

    // Move platform commission record to DUE
    const commissions = this.getPlatformCommissions();
    const comm = commissions.find((c) => c.projectId === projectId);
    if (comm) {
      comm.status = 'DUE';
      const config = this.getMonetizationConfig();
      comm.dueDate = new Date(Date.now() + config.paymentWindowDays * 86400000).toISOString().split('T')[0];
      comm.updatedAt = new Date().toISOString();
      this.set(STORAGE_KEYS.PLATFORM_COMMISSIONS, commissions);
    }

    // Proof Passport: Create or update verified completion record
    this.createOrUpdateProofPassportItem(proj, 'BUSINESS_APPROVAL');

    this.logAudit(businessUser, 'APPROVED_DELIVERABLE_COMPLETED', 'PROJECT', projectId, `Approved deliverable for "${proj.title}"`);
  }

  // --- Financial Record A: Business-to-Creator Project Payments ---
  public getPayments(): PaymentRecord[] {
    return this.get<PaymentRecord[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
  }

  public recordPayment(businessUser: User, projectId: string, utrReference: string, paymentMethod: PaymentRecord['paymentMethod'] = 'UPI', notes?: string): PaymentRecord {
    return this.reportProjectPayment(businessUser, projectId, utrReference, paymentMethod, notes);
  }

  public reportProjectPayment(
    businessUser: User,
    projectId: string,
    utrReference: string,
    paymentMethod: PaymentRecord['paymentMethod'] = 'UPI',
    notes?: string
  ): PaymentRecord {
    if (businessUser.role !== 'BUSINESS' && businessUser.role !== 'ADMIN') throw new Error('Unauthorized');
    if (!utrReference || utrReference.trim().length < 4) {
      throw new Error('A valid bank transaction reference or UPI UTR number is required');
    }

    const proj = this.getProject(projectId);
    if (!proj) throw new Error('Project not found');

    const payments = this.getPayments();
    let pay = payments.find((p) => p.projectId === projectId);
    if (!pay) {
      pay = {
        id: `pay-${projectId}`,
        projectId,
        projectTitle: proj.title,
        businessId: proj.businessId,
        studentId: proj.selectedStudentId || '',
        amountINR: proj.budgetINR,
        status: 'REPORTED_BY_BUSINESS',
        paymentMethod,
        transactionReferenceUTR: utrReference.trim(),
        recordedByUserId: businessUser.id,
        recordedAt: new Date().toISOString(),
        notes,
      };
      payments.unshift(pay);
    } else {
      pay.status = 'REPORTED_BY_BUSINESS';
      pay.transactionReferenceUTR = utrReference.trim();
      pay.paymentMethod = paymentMethod;
      pay.recordedByUserId = businessUser.id;
      pay.recordedAt = new Date().toISOString();
      if (notes) pay.notes = notes;
    }

    this.set(STORAGE_KEYS.PAYMENTS, payments);

    this.logAudit(
      businessUser,
      'REPORTED_CREATOR_PAYMENT_UTR',
      'PAYMENT',
      pay.id,
      `Reported ₹${proj.budgetINR} INR creator payment via ${paymentMethod} (UTR: ${utrReference}). Awaiting creator receipt confirmation.`
    );
    return pay;
  }

  public creatorConfirmPaymentReceipt(studentUser: User, projectId: string): PaymentRecord {
    return this.confirmProjectPaymentReceipt(studentUser, projectId);
  }

  public confirmProjectPaymentReceipt(studentUser: User, projectId: string): PaymentRecord {
    if (studentUser.role !== 'STUDENT') throw new Error('Unauthorized');
    const payments = this.getPayments();
    const pay = payments.find((p) => p.projectId === projectId && p.studentId === studentUser.id);
    if (!pay) throw new Error('Payment record not found for this creator');

    pay.status = 'RECEIPT_CONFIRMED_BY_CREATOR';
    pay.confirmedAt = new Date().toISOString();
    pay.confirmedByUserId = studentUser.id;
    this.set(STORAGE_KEYS.PAYMENTS, payments);

    // Update student earnings & completed count ONLY upon actual confirmed receipt
    const proj = this.getProject(projectId);
    if (proj && proj.selectedStudentId) {
      const studentProfile = this.getStudentProfile(proj.selectedStudentId);
      if (studentProfile) {
        studentProfile.totalEarnedINR += pay.amountINR;
        studentProfile.completedProjectsCount += 1;
        this.updateStudentProfile(proj.selectedStudentId, studentProfile);
      }
    }

    this.logAudit(
      studentUser,
      'CONFIRMED_PAYMENT_RECEIPT',
      'PAYMENT',
      pay.id,
      `Creator confirmed receipt of ₹${pay.amountINR} INR in bank/UPI.`
    );
    return pay;
  }

  public disputeProjectPayment(user: User, projectId: string, reason: string): PaymentRecord {
    const payments = this.getPayments();
    const pay = payments.find((p) => p.projectId === projectId);
    if (!pay) throw new Error('Payment record not found');
    if (user.id !== pay.studentId && user.id !== pay.businessId && user.role !== 'ADMIN') {
      throw new Error('Unauthorized');
    }

    pay.status = 'DISPUTED';
    pay.disputeReason = reason;
    this.set(STORAGE_KEYS.PAYMENTS, payments);

    this.logAudit(user, 'DISPUTED_PROJECT_PAYMENT', 'PAYMENT', pay.id, `Payment disputed: ${reason}`);
    return pay;
  }

  // --- Financial Record B: Business-to-Platform Commission Fees ---
  public getPlatformCommissions(): PlatformCommissionRecord[] {
    return this.get<PlatformCommissionRecord[]>(STORAGE_KEYS.PLATFORM_COMMISSIONS, INITIAL_PLATFORM_COMMISSIONS);
  }

  public getPlatformCommissionForProject(projectId: string): PlatformCommissionRecord | null {
    return this.getPlatformCommissions().find((c) => c.projectId === projectId) || null;
  }

  public reportPlatformCommissionPayment(
    businessUser: User,
    commissionId: string,
    utrReference: string,
    paymentMethod: PlatformCommissionRecord['paymentMethod'] = 'UPI',
    notes?: string
  ): PlatformCommissionRecord {
    if (businessUser.role !== 'BUSINESS' && businessUser.role !== 'ADMIN') throw new Error('Unauthorized');
    if (!utrReference || utrReference.trim().length < 4) {
      throw new Error('Valid bank transfer reference or UTR number is required as evidence');
    }

    const commissions = this.getPlatformCommissions();
    const comm = commissions.find((c) => c.id === commissionId);
    if (!comm) throw new Error('Platform commission invoice not found');
    if (comm.businessId !== businessUser.id && businessUser.role !== 'ADMIN') throw new Error('Unauthorized');

    comm.status = 'REPORTED_PAID';
    comm.reportedUTR = utrReference.trim();
    comm.reportedAt = new Date().toISOString();
    comm.paymentMethod = paymentMethod;
    if (notes) comm.reportedNotes = notes;
    comm.updatedAt = new Date().toISOString();

    this.set(STORAGE_KEYS.PLATFORM_COMMISSIONS, commissions);

    this.logAudit(
      businessUser,
      'REPORTED_PLATFORM_COMMISSION_PAYMENT',
      'PAYMENT',
      comm.id,
      `Reported ₹${comm.platformFeeINR} INR platform fee payment with UTR ${utrReference}. Awaiting administrative verification.`
    );
    return comm;
  }

  public adminVerifyPlatformCommission(
    adminUser: User,
    commissionId: string,
    evidenceReviewedNotes: string
  ): PlatformCommissionRecord {
    if (adminUser.role !== 'ADMIN') throw new Error('Admin authorization required');
    if (!evidenceReviewedNotes || evidenceReviewedNotes.trim().length < 5) {
      throw new Error('Please describe the evidence reviewed (e.g. Bank statement credit verification)');
    }

    const commissions = this.getPlatformCommissions();
    const comm = commissions.find((c) => c.id === commissionId);
    if (!comm) throw new Error('Commission record not found');

    comm.status = 'VERIFIED_COLLECTED';
    comm.verifiedByUserId = adminUser.id;
    comm.verifiedByName = adminUser.name;
    comm.verifiedAt = new Date().toISOString();
    comm.evidenceReviewedNotes = evidenceReviewedNotes.trim();
    comm.updatedAt = new Date().toISOString();

    this.set(STORAGE_KEYS.PLATFORM_COMMISSIONS, commissions);

    this.logAudit(
      adminUser,
      'VERIFIED_PLATFORM_COMMISSION_COLLECTED',
      'PAYMENT',
      comm.id,
      `Verified ₹${comm.platformFeeINR} INR collected. Evidence: "${evidenceReviewedNotes.trim()}".`
    );
    return comm;
  }

  public adminWaivePlatformCommission(
    adminUser: User,
    commissionId: string,
    waiverReason: string
  ): PlatformCommissionRecord {
    if (adminUser.role !== 'ADMIN') throw new Error('Admin authorization required');
    if (!waiverReason || waiverReason.trim().length < 5) {
      throw new Error('Formal administrative justification required to waive platform fee');
    }

    const commissions = this.getPlatformCommissions();
    const comm = commissions.find((c) => c.id === commissionId);
    if (!comm) throw new Error('Commission record not found');

    comm.status = 'WAIVED';
    comm.waiverReason = waiverReason.trim();
    comm.waivedByUserId = adminUser.id;
    comm.waivedAt = new Date().toISOString();
    comm.updatedAt = new Date().toISOString();

    this.set(STORAGE_KEYS.PLATFORM_COMMISSIONS, commissions);

    this.logAudit(
      adminUser,
      'WAIVED_PLATFORM_COMMISSION',
      'PAYMENT',
      comm.id,
      `Waived ₹${comm.platformFeeINR} INR fee. Reason: "${waiverReason.trim()}".`
    );
    return comm;
  }

  public adminAdjustPlatformCommission(
    adminUser: User,
    commissionId: string,
    adjustedFeeINR: number,
    adjustmentReason: string
  ): PlatformCommissionRecord {
    if (adminUser.role !== 'ADMIN') throw new Error('Admin authorization required');
    if (adjustedFeeINR < 0) throw new Error('Adjusted fee cannot be negative');

    const commissions = this.getPlatformCommissions();
    const comm = commissions.find((c) => c.id === commissionId);
    if (!comm) throw new Error('Commission record not found');

    const oldAmount = comm.platformFeeINR;
    comm.adjustmentAmountINR = adjustedFeeINR;
    comm.adjustmentReason = adjustmentReason;
    comm.platformFeeINR = adjustedFeeINR;
    comm.status = 'REFUNDED_OR_ADJUSTED';
    comm.updatedAt = new Date().toISOString();

    this.set(STORAGE_KEYS.PLATFORM_COMMISSIONS, commissions);

    this.logAudit(
      adminUser,
      'ADJUSTED_PLATFORM_COMMISSION',
      'PAYMENT',
      comm.id,
      `Adjusted fee from ₹${oldAmount} to ₹${adjustedFeeINR} INR. Reason: "${adjustmentReason}".`
    );
    return comm;
  }

  public getMonetizationMetrics(): MonetizationMetrics {
    const projects = this.getProjects();
    const commissions = this.getPlatformCommissions();
    const completedProjects = projects.filter((p) => p.status === 'COMPLETED');

    const totalAgreed = commissions.reduce((sum, c) => sum + c.projectBudgetINR, 0);

    const verifiedCollected = commissions
      .filter((c) => c.status === 'VERIFIED_COLLECTED')
      .reduce((sum, c) => sum + c.platformFeeINR, 0);

    const reportedPaid = commissions
      .filter((c) => c.status === 'REPORTED_PAID')
      .reduce((sum, c) => sum + c.platformFeeINR, 0);

    const due = commissions
      .filter((c) => c.status === 'DUE')
      .reduce((sum, c) => sum + c.platformFeeINR, 0);

    const overdue = commissions
      .filter((c) => c.status === 'OVERDUE')
      .reduce((sum, c) => sum + c.platformFeeINR, 0);

    const waived = commissions
      .filter((c) => c.status === 'WAIVED')
      .reduce((sum, c) => sum + c.platformFeeINR, 0);

    const totalChargeable = verifiedCollected + due + overdue;
    const collectionRate = totalChargeable > 0 ? Math.round((verifiedCollected / totalChargeable) * 100) : 100;

    return {
      completedProjectsCount: completedProjects.length,
      totalAgreedProjectValueINR: totalAgreed,
      commissionDueINR: due,
      commissionReportedPaidINR: reportedPaid,
      commissionVerifiedCollectedINR: verifiedCollected,
      overdueFeesINR: overdue,
      waivedFeesINR: waived,
      feeCollectionRatePercent: collectionRate,
    };
  }

  // --- Reviews ---
  public getReviews(): VerifiedReview[] {
    return this.get<VerifiedReview[]>(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
  }

  public addReview(user: User, projectId: string, rating: number, comment: string, verifiedDeliverableSummary: string): VerifiedReview {
    const proj = this.getProject(projectId);
    if (!proj || proj.status !== 'COMPLETED') {
      throw new Error('Can only review successfully completed projects');
    }

    const isStudent = user.id === proj.selectedStudentId;
    const isBusiness = user.id === proj.businessId;
    if (!isStudent && !isBusiness) throw new Error('Only participating parties can leave a verified review');

    const reviews = this.getReviews();
    const existing = reviews.find((r) => r.projectId === projectId && r.reviewerId === user.id);
    if (existing) throw new Error('You have already reviewed this project');

    const targetUserId = isStudent ? proj.businessId : (proj.selectedStudentId || '');

    const newRev: VerifiedReview = {
      id: `rev-${Date.now()}`,
      projectId,
      projectTitle: proj.title,
      reviewerId: user.id,
      reviewerName: user.name,
      reviewerRole: isStudent ? 'STUDENT' : 'BUSINESS',
      targetUserId,
      rating,
      comment,
      verifiedDeliverableSummary,
      createdAt: new Date().toISOString(),
    };

    this.set(STORAGE_KEYS.REVIEWS, [newRev, ...reviews]);
    this.logAudit(user, 'SUBMITTED_VERIFIED_REVIEW', 'PROJECT', projectId, `Submitted rating ${rating}/5 for project`);
    return newRev;
  }

  // --- Disputes ---
  public getDisputes(): DisputeRecord[] {
    return this.get<DisputeRecord[]>(STORAGE_KEYS.DISPUTES, INITIAL_DISPUTES);
  }

  public fileDispute(user: User, projectId: string, reason: string, evidenceNotes: string): DisputeRecord {
    const proj = this.getProject(projectId);
    if (!proj) throw new Error('Project not found');
    if (user.id !== proj.selectedStudentId && user.id !== proj.businessId) {
      throw new Error('Only parties to this project can raise a dispute');
    }

    const disputes = this.getDisputes();
    const newDisp: DisputeRecord = {
      id: `disp-${Date.now()}`,
      projectId,
      projectTitle: proj.title,
      raisedByUserId: user.id,
      raisedByName: user.name,
      raisedByRole: user.role,
      reason,
      evidenceNotes,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    };

    this.set(STORAGE_KEYS.DISPUTES, [newDisp, ...disputes]);

    // Update project status to DISPUTED
    const projects = this.getProjects();
    const p = projects.find((item) => item.id === projectId);
    if (p) {
      p.status = 'DISPUTED';
      this.set(STORAGE_KEYS.PROJECTS, projects);
    }

    this.logAudit(user, 'FILED_DISPUTE', 'DISPUTE', newDisp.id, `Dispute filed for ${proj.title}: ${reason}`);
    return newDisp;
  }

  public adminResolveDispute(adminUser: User, disputeId: string, decision: DisputeRecord['status'], decisionNotes: string): void {
    if (adminUser.role !== 'ADMIN') throw new Error('Admin authorization required');
    const disputes = this.getDisputes();
    const disp = disputes.find((d) => d.id === disputeId);
    if (!disp) throw new Error('Dispute not found');

    disp.status = decision;
    disp.adminDecision = decisionNotes;
    disp.resolvedAt = new Date().toISOString();
    this.set(STORAGE_KEYS.DISPUTES, disputes);

    // If dispute ruled in favor of student, record verified completion in Proof Passport
    if (decision === 'RESOLVED_STUDENT_PAID') {
      const proj = this.getProject(disp.projectId);
      if (proj) {
        this.createOrUpdateProofPassportItem(proj, 'DISPUTE_RESOLUTION', 5, decisionNotes);
      }
    }

    this.logAudit(adminUser, 'RESOLVED_DISPUTE', 'DISPUTE', disputeId, `Decision: ${decision} — ${decisionNotes}`);
  }

  // --- Proof Passport: Verified Project Credentials ---
  public getProofPassportItems(studentId?: string, onlyPublic: boolean = false): ProofPassportItem[] {
    const items = this.get<ProofPassportItem[]>(STORAGE_KEYS.PROOF_PASSPORT_ITEMS, INITIAL_PROOF_PASSPORT_ITEMS);
    return items.filter((item) => {
      if (studentId && item.studentId !== studentId) return false;
      if (onlyPublic && !item.isPublic) return false;
      return true;
    });
  }

  public toggleProofPassportVisibility(user: User, itemId: string, isPublic: boolean): ProofPassportItem {
    const items = this.getProofPassportItems();
    const item = items.find((i) => i.id === itemId);
    if (!item) throw new Error('Proof Passport record not found');
    if (item.studentId !== user.id && user.role !== 'ADMIN') throw new Error('Unauthorized to modify this portfolio item');
    item.isPublic = isPublic;
    this.set(STORAGE_KEYS.PROOF_PASSPORT_ITEMS, items);
    this.logAudit(user, isPublic ? 'PROOF_PASSPORT_PUBLIC' : 'PROOF_PASSPORT_HIDDEN', 'PROJECT', item.projectId, `Toggled Proof Passport visibility to ${isPublic ? 'Public' : 'Hidden'}`);
    return item;
  }

  public updateProofPassportItem(
    user: User,
    itemId: string,
    updates: { sanitizedSummary?: string; isPublic?: boolean; displayOrder?: number }
  ): ProofPassportItem {
    const items = this.getProofPassportItems();
    const item = items.find((i) => i.id === itemId);
    if (!item) throw new Error('Proof Passport record not found');
    if (item.studentId !== user.id && user.role !== 'ADMIN') throw new Error('Unauthorized');
    if (updates.sanitizedSummary !== undefined) item.sanitizedSummary = updates.sanitizedSummary;
    if (updates.isPublic !== undefined) item.isPublic = updates.isPublic;
    if (updates.displayOrder !== undefined) item.displayOrder = updates.displayOrder;
    this.set(STORAGE_KEYS.PROOF_PASSPORT_ITEMS, items);
    return item;
  }

  public createOrUpdateProofPassportItem(
    project: ProjectListing,
    source: 'BUSINESS_APPROVAL' | 'DISPUTE_RESOLUTION' = 'BUSINESS_APPROVAL',
    rating?: number,
    reviewSnippet?: string
  ): ProofPassportItem | null {
    if (!project.selectedStudentId) return null;
    const items = this.getProofPassportItems();
    let existing = items.find((i) => i.projectId === project.id && i.studentId === project.selectedStudentId);
    if (existing) {
      existing.completionSource = source;
      if (rating) existing.rating = rating;
      if (reviewSnippet) existing.reviewSnippet = reviewSnippet;
      existing.completedAt = new Date().toISOString();
      this.set(STORAGE_KEYS.PROOF_PASSPORT_ITEMS, items);
      return existing;
    }

    const sanitizedSummary = project.deliverables.map((d) => d.title).join(', ') || project.summary;
    const newItem: ProofPassportItem = {
      id: `passport-${project.id}`,
      studentId: project.selectedStudentId,
      projectId: project.id,
      projectTitle: project.title,
      category: project.category,
      completedAt: new Date().toISOString(),
      completionSource: source,
      businessName: project.businessName,
      businessCity: project.businessCity,
      sanitizedSummary: `Delivered verified outcomes: ${sanitizedSummary}`,
      rating: rating !== undefined ? rating : undefined,
      reviewSnippet: reviewSnippet || undefined,
      isPublic: true,
      displayOrder: items.length + 1,
      badgeTitle: source === 'DISPUTE_RESOLUTION' ? 'Dispute Confirmed Outcome' : 'Verified Work Delivery',
      createdAt: new Date().toISOString(),
      skills: project.requiredSkills,
      deliverables: project.deliverables.map((d) => d.title),
      coverImage: project.coverImage,
    };

    this.set(STORAGE_KEYS.PROOF_PASSPORT_ITEMS, [newItem, ...items]);
    return newItem;
  }

  // --- Scope Lock & Change Request Workflow ---
  public getScopeChangeRequests(projectId?: string): ScopeChangeRequest[] {
    const requests = this.get<ScopeChangeRequest[]>(STORAGE_KEYS.SCOPE_CHANGE_REQUESTS, INITIAL_SCOPE_CHANGE_REQUESTS);
    if (projectId) {
      return requests.filter((r) => r.projectId === projectId);
    }
    return requests;
  }

  public createScopeChangeRequest(
    user: User,
    data: {
      projectId: string;
      reason: string;
      proposedBudgetINR: number;
      proposedDeadline: string;
      proposedRevisions: number;
      proposedDeliverables: DeliverableItem[];
      proposedScopeSummary: string;
    }
  ): ScopeChangeRequest {
    const proj = this.getProject(data.projectId);
    if (!proj) throw new Error('Project not found');
    if (proj.status !== 'IN_PROGRESS' && proj.status !== 'REVISION_REQUESTED') {
      throw new Error('Scope modifications can only be requested for active projects');
    }
    if (user.id !== proj.businessId && user.id !== proj.selectedStudentId && user.role !== 'ADMIN') {
      throw new Error('Unauthorized to modify this project scope');
    }

    const offers = this.getOffers();
    const offer = offers.find((o) => o.projectId === data.projectId && o.status === 'ACCEPTED');
    if (!offer) throw new Error('No active accepted offer found for this project');

    const existingPending = this.getScopeChangeRequests(data.projectId).find((r) => r.status === 'PENDING');
    if (existingPending) {
      throw new Error('A scope change request is already pending review for this project');
    }

    const newRequest: ScopeChangeRequest = {
      id: `scr-${Date.now()}`,
      projectId: data.projectId,
      offerId: offer.id,
      requestedByUserId: user.id,
      requestedByName: user.name,
      requestedByRole: user.role as 'BUSINESS' | 'STUDENT',
      reason: data.reason.trim(),
      proposedBudgetINR: data.proposedBudgetINR,
      proposedDeadline: data.proposedDeadline,
      proposedRevisions: data.proposedRevisions,
      proposedDeliverables: data.proposedDeliverables,
      proposedScopeSummary: data.proposedScopeSummary.trim(),
      previousTermsSnapshot: {
        budgetINR: proj.budgetINR,
        deadline: proj.expectedDeliveryDate,
        revisions: proj.permittedRevisions,
        scopeSummary: offer.scopeSummary,
        deliverables: proj.deliverables,
      },
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    const requests = this.getScopeChangeRequests();
    this.set(STORAGE_KEYS.SCOPE_CHANGE_REQUESTS, [newRequest, ...requests]);

    this.logAudit(
      user,
      'SCOPE_CHANGE_REQUESTED',
      'PROJECT',
      data.projectId,
      `Proposed scope change: Budget ₹${data.proposedBudgetINR} INR, Deadline: ${data.proposedDeadline}. Reason: "${data.reason.substring(0, 60)}..."`
    );
    return newRequest;
  }

  public respondToScopeChangeRequest(
    user: User,
    requestId: string,
    accept: boolean,
    rejectionReason?: string
  ): ScopeChangeRequest {
    const requests = this.getScopeChangeRequests();
    const req = requests.find((r) => r.id === requestId);
    if (!req) throw new Error('Scope change request not found');
    if (req.status !== 'PENDING') throw new Error(`Scope change request is already ${req.status}`);

    const proj = this.getProject(req.projectId);
    if (!proj) throw new Error('Project not found');

    // Only counterparty or admin can respond
    if (req.requestedByUserId === user.id && user.role !== 'ADMIN') {
      throw new Error('Cannot respond to your own scope change proposal');
    }
    if (user.id !== proj.businessId && user.id !== proj.selectedStudentId && user.role !== 'ADMIN') {
      throw new Error('Unauthorized');
    }

    req.status = accept ? 'ACCEPTED' : 'REJECTED';
    req.respondedAt = new Date().toISOString();
    req.respondedByUserId = user.id;
    if (!accept && rejectionReason) {
      req.rejectionReason = rejectionReason;
    }

    this.set(STORAGE_KEYS.SCOPE_CHANGE_REQUESTS, requests);

    if (accept) {
      // Atomic update of project terms
      const projects = this.getProjects();
      const targetProj = projects.find((p) => p.id === req.projectId);
      if (targetProj) {
        targetProj.budgetINR = req.proposedBudgetINR;
        targetProj.expectedDeliveryDate = req.proposedDeadline;
        targetProj.permittedRevisions = req.proposedRevisions;
        targetProj.deliverables = req.proposedDeliverables;
        targetProj.summary = req.proposedScopeSummary;
        targetProj.updatedAt = new Date().toISOString();
        this.set(STORAGE_KEYS.PROJECTS, projects);
      }

      // Update offer snapshot
      const offers = this.getOffers();
      const targetOffer = offers.find((o) => o.id === req.offerId);
      const config = this.getMonetizationConfig();
      const ratePct = targetOffer?.commissionRatePercent || config.defaultCommissionRatePercent;
      const budgetPaise = Math.round(req.proposedBudgetINR * 100);
      const feePaise = Math.round((budgetPaise * ratePct) / 100);
      const newPlatformFeeINR = feePaise / 100;

      if (targetOffer) {
        targetOffer.agreedBudgetINR = req.proposedBudgetINR;
        targetOffer.agreedDeadline = req.proposedDeadline;
        targetOffer.agreedRevisions = req.proposedRevisions;
        targetOffer.deliverablesSnapshot = req.proposedDeliverables;
        targetOffer.scopeSummary = req.proposedScopeSummary;
        targetOffer.platformFeeINR = newPlatformFeeINR;
        targetOffer.creatorReceivesINR = req.proposedBudgetINR;
        targetOffer.commissionTermsSnapshot = `Agreed budget: ₹${req.proposedBudgetINR.toLocaleString('en-IN')} INR (Updated via Scope Change Request ${req.id}). Platform fee: ₹${newPlatformFeeINR.toLocaleString('en-IN')} INR (${ratePct}%) payable separately by ${proj.businessName}. Creator receives full ₹${req.proposedBudgetINR.toLocaleString('en-IN')} INR.`;
        this.set(STORAGE_KEYS.OFFERS, offers);
      }

      // Update payment record amount
      const payments = this.getPayments();
      const pay = payments.find((p) => p.projectId === req.projectId);
      if (pay && pay.status === 'NOT_REPORTED') {
        pay.amountINR = req.proposedBudgetINR;
        this.set(STORAGE_KEYS.PAYMENTS, payments);
      }

      // Update platform commission record amount
      const commissions = this.getPlatformCommissions();
      const comm = commissions.find((c) => c.projectId === req.projectId);
      if (comm && (comm.status === 'NOT_DUE' || comm.status === 'DUE')) {
        comm.projectBudgetINR = req.proposedBudgetINR;
        comm.platformFeeINR = newPlatformFeeINR;
        comm.dueDate = req.proposedDeadline;
        comm.updatedAt = new Date().toISOString();
        this.set(STORAGE_KEYS.PLATFORM_COMMISSIONS, commissions);
      }

      this.logAudit(
        user,
        'SCOPE_CHANGE_ACCEPTED',
        'PROJECT',
        req.projectId,
        `Accepted scope change: New budget ₹${req.proposedBudgetINR} INR, Deadline ${req.proposedDeadline}.`
      );
    } else {
      this.logAudit(
        user,
        'SCOPE_CHANGE_REJECTED',
        'PROJECT',
        req.projectId,
        `Rejected scope change proposal. Reason: "${rejectionReason || 'Declined by counterparty'}"`
      );
    }

    return req;
  }

  // --- Work Trail: Chronological Milestone & Financial Trail ---
  public getWorkTrail(projectId: string): WorkTrailEvent[] {
    const events: WorkTrailEvent[] = [];
    const proj = this.getProject(projectId);
    if (!proj) return [];

    // 1. Project Creation
    events.push({
      id: `trail-proj-create-${proj.id}`,
      projectId,
      eventType: 'PROJECT_CREATED',
      title: 'Project Listing Created & Scoped',
      description: `Created by ${proj.businessName} with ₹${proj.budgetINR.toLocaleString('en-IN')} INR budget and ${proj.deliverables.length} concrete deliverables.`,
      timestamp: proj.createdAt,
      actorName: proj.businessName,
      actorRole: 'BUSINESS',
      isVerified: proj.businessVerified,
      verificationNote: proj.businessVerified ? 'Business identity and legal entity verified' : 'Unverified entity',
    });

    // 2. Applications
    const apps = this.getApplications().filter((a) => a.projectId === projectId);
    apps.forEach((app) => {
      events.push({
        id: `trail-app-${app.id}`,
        projectId,
        eventType: 'APPLICATION_SUBMITTED',
        title: `Application Submitted by ${app.studentName}`,
        description: `Proposed delivery in ${app.proposedDeliveryDays} days with ${app.portfolioSamples.length} work samples. Status: ${app.status}.`,
        timestamp: app.createdAt,
        actorName: app.studentName,
        actorRole: 'STUDENT',
        isVerified: true,
        verificationNote: '18+ adult age verified creator',
      });
    });

    // 3. Offers & Scope Lock
    const offers = this.getOffers().filter((o) => o.projectId === projectId);
    offers.forEach((offer) => {
      events.push({
        id: `trail-offer-${offer.id}`,
        projectId,
        eventType: 'OFFER_EXTENDED',
        title: 'Binding Project Offer Extended',
        description: `Budget: ₹${offer.agreedBudgetINR.toLocaleString('en-IN')} INR | Deadline: ${offer.agreedDeadline} | Permitted Revisions: ${offer.agreedRevisions} cycles. Platform fee: ₹${offer.platformFeeINR.toLocaleString('en-IN')} INR (${offer.commissionRatePercent}%) paid separately by business.`,
        timestamp: offer.createdAt,
        actorName: offer.businessName,
        actorRole: 'BUSINESS',
        isVerified: true,
        verificationNote: 'Snapshot locked with immutable fee terms',
      });

      if (offer.status === 'ACCEPTED' && offer.respondedAt) {
        events.push({
          id: `trail-offer-accept-${offer.id}`,
          projectId,
          eventType: 'SCOPE_LOCKED_ACCEPTED',
          title: 'Scope Locked & Offer Explicitly Accepted',
          description: `Creator ${offer.studentName} reviewed and explicitly accepted all terms: deliverables, deadline, permitted revisions, 100% net compensation guarantee, and cancellation policy.`,
          timestamp: offer.respondedAt,
          actorName: offer.studentName,
          actorRole: 'STUDENT',
          isVerified: true,
          verificationNote: 'Mutual binding agreement executed under Proof-to-Pay rules',
        });
      }
    });

    // 4. Scope Change Requests
    const scopeChanges = this.getScopeChangeRequests(projectId);
    scopeChanges.forEach((sc) => {
      events.push({
        id: `trail-sc-req-${sc.id}`,
        projectId,
        eventType: 'SCOPE_CHANGE_REQUESTED',
        title: `Scope Change Requested by ${sc.requestedByName}`,
        description: `Proposed: Budget ₹${sc.proposedBudgetINR.toLocaleString('en-IN')} INR, Deadline: ${sc.proposedDeadline}. Reason: "${sc.reason}"`,
        timestamp: sc.createdAt,
        actorName: sc.requestedByName,
        actorRole: sc.requestedByRole,
        isVerified: false,
        verificationNote: 'Pending mutual agreement',
      });

      if (sc.status === 'ACCEPTED' && sc.respondedAt) {
        events.push({
          id: `trail-sc-acc-${sc.id}`,
          projectId,
          eventType: 'SCOPE_CHANGE_ACCEPTED',
          title: 'Scope Change Mutual Acceptance',
          description: `Counterparty accepted proposed modifications. Terms updated to ₹${sc.proposedBudgetINR.toLocaleString('en-IN')} INR and deadline ${sc.proposedDeadline}.`,
          timestamp: sc.respondedAt,
          actorName: 'Counterparty',
          actorRole: sc.requestedByRole === 'BUSINESS' ? 'STUDENT' : 'BUSINESS',
          isVerified: true,
          verificationNote: 'Scope Lock updated and financial records recalculated',
        });
      } else if (sc.status === 'REJECTED' && sc.respondedAt) {
        events.push({
          id: `trail-sc-rej-${sc.id}`,
          projectId,
          eventType: 'SCOPE_CHANGE_REJECTED',
          title: 'Scope Change Proposal Declined',
          description: `Original agreed terms preserved. Rejection rationale: "${sc.rejectionReason || 'Declined'}"`,
          timestamp: sc.respondedAt,
          actorName: 'Counterparty',
          actorRole: sc.requestedByRole === 'BUSINESS' ? 'STUDENT' : 'BUSINESS',
          isVerified: true,
          verificationNote: 'Previous scope lock remains binding',
        });
      }
    });

    // 5. Deliverable Submissions
    const subs = this.getSubmissions().filter((s) => s.projectId === projectId);
    subs.forEach((sub) => {
      events.push({
        id: `trail-sub-${sub.id}`,
        projectId,
        eventType: 'DELIVERABLE_SUBMITTED',
        title: `Deliverables Submitted (Version ${sub.version})`,
        description: sub.notes + (sub.liveLink ? ` | Live link: ${sub.liveLink}` : ''),
        timestamp: sub.submittedAt,
        actorName: proj.selectedStudentName || 'Student Creator',
        actorRole: 'STUDENT',
        isVerified: false,
        verificationNote: 'Private submission pending business review',
      });

      if (sub.revisionFeedback && sub.revisionRequestedAt) {
        events.push({
          id: `trail-rev-${sub.id}`,
          projectId,
          eventType: 'REVISION_REQUESTED',
          title: `Revision Requested on Version ${sub.version}`,
          description: `Feedback within agreed scope: "${sub.revisionFeedback}"`,
          timestamp: sub.revisionRequestedAt,
          actorName: proj.businessName,
          actorRole: 'BUSINESS',
          isVerified: true,
          verificationNote: 'Counted against permitted revision limit',
        });
      }
    });

    // 6. Deliverable Approval / Project Completion
    if (proj.status === 'COMPLETED') {
      events.push({
        id: `trail-comp-${proj.id}`,
        projectId,
        eventType: 'DELIVERABLES_APPROVED',
        title: 'Deliverables Approved & Project Completed',
        description: `Business confirmed all deliverables meet acceptance criteria. Creator is cleared for payout. (Note: Project Completion is separate from Payment Confirmation).`,
        timestamp: proj.updatedAt,
        actorName: proj.businessName,
        actorRole: 'BUSINESS',
        isVerified: true,
        verificationNote: 'Deliverables sign-off confirmed by client',
      });
    }

    // 7. Business-to-Creator Project Payment Lifecycle
    const pay = this.getPayments().find((p) => p.projectId === projectId);
    if (pay) {
      if (pay.status === 'REPORTED_BY_BUSINESS' || pay.status === 'RECEIPT_CONFIRMED_BY_CREATOR' || pay.status === 'PAID') {
        events.push({
          id: `trail-pay-rep-${pay.id}`,
          projectId,
          eventType: 'PROJECT_PAYMENT_REPORTED',
          title: 'Direct Project Payment Reported by Business',
          description: `Business reported transfer of ₹${pay.amountINR.toLocaleString('en-IN')} INR via ${pay.paymentMethod}. Reference UTR: ${pay.transactionReferenceUTR || 'None'}. (Evidence under review, not verified receipt).`,
          timestamp: pay.recordedAt || pay.createdAt || proj.updatedAt,
          actorName: proj.businessName,
          actorRole: 'BUSINESS',
          isVerified: false,
          verificationNote: 'UTR submitted as evidence — NOT verified payment until confirmed by creator',
        });
      }

      if (pay.status === 'RECEIPT_CONFIRMED_BY_CREATOR' || pay.status === 'PAID') {
        events.push({
          id: `trail-pay-conf-${pay.id}`,
          projectId,
          eventType: 'PROJECT_PAYMENT_CONFIRMED',
          title: 'Payment Receipt Confirmed by Creator',
          description: `Creator confirmed actual credit of ₹${pay.amountINR.toLocaleString('en-IN')} INR in their bank / UPI account.`,
          timestamp: pay.confirmedAt || pay.recordedAt || pay.createdAt || proj.updatedAt,
          actorName: proj.selectedStudentName || 'Student Creator',
          actorRole: 'STUDENT',
          isVerified: true,
          verificationNote: 'Confirmed settled payment by recipient',
        });
      } else if (pay.status === 'DISPUTED') {
        events.push({
          id: `trail-pay-disp-${pay.id}`,
          projectId,
          eventType: 'PROJECT_PAYMENT_DISPUTED',
          title: 'Project Payment Receipt Disputed',
          description: `Creator reported funds not credited despite business UTR submission. Reason: ${pay.disputeReason || 'Unreceived funds'}.`,
          timestamp: pay.recordedAt || pay.createdAt || proj.updatedAt,
          actorName: proj.selectedStudentName || 'Student Creator',
          actorRole: 'STUDENT',
          isVerified: true,
          verificationNote: 'Flagged for platform moderation audit',
        });
      }
    }

    // 8. Platform Commission Lifecycle
    const comm = this.getPlatformCommissions().find((c) => c.projectId === projectId);
    if (comm) {
      if (comm.status !== 'NOT_DUE') {
        events.push({
          id: `trail-comm-due-${comm.id}`,
          projectId,
          eventType: 'PLATFORM_FEE_DUE',
          title: 'Platform Commission Due from Business',
          description: `Commission invoice of ₹${comm.platformFeeINR.toLocaleString('en-IN')} INR (${comm.commissionRatePercent}%) due by ${comm.dueDate}. Business pays Proof-to-Pay directly.`,
          timestamp: comm.createdAt,
          actorName: 'System',
          actorRole: 'SYSTEM',
          isVerified: true,
          verificationNote: 'Calculated separately from creator compensation',
        });
      }

      if (comm.status === 'REPORTED_PAID' || comm.status === 'VERIFIED_COLLECTED') {
        events.push({
          id: `trail-comm-rep-${comm.id}`,
          projectId,
          eventType: 'PLATFORM_FEE_REPORTED',
          title: 'Platform Fee Payment Reported',
          description: `Business reported fee transfer with UTR: ${comm.reportedUTR}. Pending admin reconciliation.`,
          timestamp: comm.reportedAt || comm.updatedAt,
          actorName: proj.businessName,
          actorRole: 'BUSINESS',
          isVerified: false,
          verificationNote: 'Submitted reference under administrative bank review',
        });
      }

      if (comm.status === 'VERIFIED_COLLECTED') {
        events.push({
          id: `trail-comm-ver-${comm.id}`,
          projectId,
          eventType: 'PLATFORM_FEE_VERIFIED',
          title: 'Platform Commission Verified Collected (Admin)',
          description: `Platform Administrator verified ₹${comm.platformFeeINR.toLocaleString('en-IN')} INR received in Proof-to-Pay bank account. Verified by: ${comm.verifiedByName}. Evidence: "${comm.evidenceReviewedNotes}".`,
          timestamp: comm.verifiedAt || comm.updatedAt,
          actorName: comm.verifiedByName || 'Platform Admin',
          actorRole: 'ADMIN',
          isVerified: true,
          verificationNote: 'Bank statement reconciled & verified by authorized administrator',
        });
      }
    }

    // Sort all events chronologically (oldest to newest)
    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  // --- User Administration ---
  public adminSetUserSuspension(adminUser: User, targetUserId: string, suspend: boolean, reason?: string): void {
    if (adminUser.role !== 'ADMIN') throw new Error('Admin authorization required');
    const users = this.getUsers();
    const target = users.find((u) => u.id === targetUserId);
    if (!target) throw new Error('User not found');

    target.isSuspended = suspend;
    target.suspensionReason = suspend ? reason : undefined;
    this.set(STORAGE_KEYS.USERS, users);

    this.logAudit(adminUser, suspend ? 'SUSPENDED_USER' : 'REACTIVATED_USER', 'USER', targetUserId, reason || 'Status updated');
  }

  // --- Account Deletion ---
  public requestAccountDeletion(user: User): void {
    const users = this.getUsers().filter((u) => u.id !== user.id);
    this.set(STORAGE_KEYS.USERS, users);
    this.logAudit(user, 'ACCOUNT_DELETED', 'USER', user.id, 'User self-requested account deletion under data privacy policy.');
    this.setCurrentUserId(null);
  }

  // --- Beta Feedback & Launch Tracking ---
  public getBetaFeedbacks(): BetaFeedback[] {
    return this.get<BetaFeedback[]>(STORAGE_KEYS.BETA_FEEDBACK, [
      {
        id: 'fb-init-1',
        userId: 'student-1',
        userName: 'Aarav Sharma',
        userRole: 'STUDENT',
        category: 'USABILITY',
        rating: 5,
        message: 'The scope lockdown and milestone deliverable submission works great. Super clear in INR!',
        screenOrFeature: 'Deliverables Submission',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      }
    ]);
  }

  public submitBetaFeedback(feedback: Omit<BetaFeedback, 'id' | 'createdAt'>): BetaFeedback {
    const list = this.getBetaFeedbacks();
    const newFeedback: BetaFeedback = {
      ...feedback,
      id: `fb-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.set(STORAGE_KEYS.BETA_FEEDBACK, [newFeedback, ...list]);
    return newFeedback;
  }

  // --- Abuse & Moderation Reporting ---
  public getAbuseReports(): AbuseReport[] {
    return this.get<AbuseReport[]>(STORAGE_KEYS.ABUSE_REPORTS, [
      {
        id: 'rep-init-1',
        reporterId: 'student-2',
        reporterName: 'Ananya Iyer',
        targetProjectId: 'proj-3',
        targetTitle: 'Content Writing & SEO Blogs for Ayurvedic Brand',
        reason: 'OFF_PLATFORM_PAYMENT',
        description: 'Test report: Ensuring report tracking and investigation queue functions properly before launch.',
        status: 'PENDING',
        createdAt: new Date(Date.now() - 43200000).toISOString(),
      }
    ]);
  }

  public submitAbuseReport(reporter: User, report: Omit<AbuseReport, 'id' | 'reporterId' | 'reporterName' | 'status' | 'createdAt'>): AbuseReport {
    const reports = this.getAbuseReports();
    const newReport: AbuseReport = {
      ...report,
      id: `rep-${Date.now()}`,
      reporterId: reporter.id,
      reporterName: reporter.name,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    this.set(STORAGE_KEYS.ABUSE_REPORTS, [newReport, ...reports]);
    this.logAudit(reporter, 'FILED_ABUSE_REPORT', 'PROJECT', newReport.targetProjectId || newReport.targetUserId || newReport.id, `Reported ${report.reason}: ${report.description}`);
    return newReport;
  }

  public adminResolveAbuseReport(adminUser: User, reportId: string, resolution: AbuseReport['status'], notes: string, suspendTarget?: boolean): void {
    if (adminUser.role !== 'ADMIN') throw new Error('Admin authorization required');
    const reports = this.getAbuseReports();
    const rep = reports.find((r) => r.id === reportId);
    if (!rep) throw new Error('Report not found');

    rep.status = resolution;
    rep.adminNotes = notes;
    rep.resolvedAt = new Date().toISOString();
    this.set(STORAGE_KEYS.ABUSE_REPORTS, reports);

    if (suspendTarget && rep.targetUserId) {
      this.adminSetUserSuspension(adminUser, rep.targetUserId, true, `Suspended following abuse report ${reportId}: ${notes}`);
    }

    this.logAudit(adminUser, 'RESOLVED_ABUSE_REPORT', 'USER', reportId, `Resolved as ${resolution}: ${notes}`);
  }

  // --- Real Beta Metrics Aggregator ---
  public getBetaMetricsReport(): BetaMetricsReport {
    const users = this.getUsers();
    const projects = this.getProjects();
    const applications = this.getApplications();
    const payments = this.getPayments();
    const disputes = this.getDisputes();
    const abuseReports = this.getAbuseReports();
    const feedback = this.getBetaFeedbacks();

    const auditedInr = payments
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amountINR, 0);

    return {
      totalSignups: users.length,
      creatorsCount: users.filter((u) => u.role === 'STUDENT').length,
      businessesCount: users.filter((u) => u.role === 'BUSINESS').length,
      adminsCount: users.filter((u) => u.role === 'ADMIN').length,
      totalProjects: projects.length,
      approvedProjectsCount: projects.filter((p) => p.status === 'APPROVED' || p.status === 'IN_PROGRESS' || p.status === 'COMPLETED').length,
      draftOrPendingCount: projects.filter((p) => p.status === 'DRAFT' || p.status === 'PENDING_REVIEW').length,
      totalApplications: applications.length,
      activeAssignmentsCount: projects.filter((p) => p.status === 'IN_PROGRESS' || p.status === 'SUBMITTED' || p.status === 'REVISION_REQUESTED').length,
      completedAssignmentsCount: projects.filter((p) => p.status === 'COMPLETED').length,
      totalAuditedINR: auditedInr,
      openDisputesCount: disputes.filter((d) => d.status === 'OPEN').length,
      openAbuseReportsCount: abuseReports.filter((r) => r.status === 'PENDING').length,
      feedbackCount: feedback.length,
    };
  }
}

export const marketplaceStore = new MarketplaceStore();
marketplaceStore.init();
