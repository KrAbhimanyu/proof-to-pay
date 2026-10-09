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
  ProjectStatus
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
  INITIAL_AUDIT_LOGS
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
};

class MarketplaceStore {
  private get<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return fallback;
      return JSON.parse(data) as T;
    } catch {
      return fallback;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // localStorage may fail in edge cases
    }
  }

  public init(): void {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.resetToDefaults();
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
      averageRating: 5.0,
      verifiedPortfolioSlug: userId,
    };
    const updated = { ...current, ...data };
    profiles[userId] = updated;
    this.set(STORAGE_KEYS.STUDENT_PROFILES, profiles);
    return updated;
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

  // --- Offers ---
  public getOffers(): ProjectOffer[] {
    return this.get<ProjectOffer[]>(STORAGE_KEYS.OFFERS, INITIAL_OFFERS);
  }

  public issueOffer(businessUser: User, projectId: string, studentId: string, agreedBudgetINR: number, agreedDeadline: string, agreedRevisions: number, scopeSummary: string): ProjectOffer {
    if (businessUser.role !== 'BUSINESS') throw new Error('Unauthorized');
    const project = this.getProject(projectId);
    if (!project || project.businessId !== businessUser.id) throw new Error('Project not found or unauthorized');

    const student = this.getUsers().find((u) => u.id === studentId);
    if (!student) throw new Error('Student not found');

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

    this.logAudit(businessUser, 'ISSUED_OFFER', 'PROJECT', projectId, `Offered ₹${agreedBudgetINR} to ${student.name}`);
    return newOffer;
  }

  public respondToOffer(studentUser: User, offerId: string, accept: boolean): ProjectOffer {
    if (studentUser.role !== 'STUDENT') throw new Error('Unauthorized');
    const offers = this.getOffers();
    const offer = offers.find((o) => o.id === offerId && o.studentId === studentUser.id);
    if (!offer) throw new Error('Offer not found');

    offer.status = accept ? 'ACCEPTED' : 'DECLINED';
    offer.respondedAt = new Date().toISOString();
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
      proj.updatedAt = new Date().toISOString();
      this.set(STORAGE_KEYS.PROJECTS, projects);

      // Initialize payment record as NOT_DUE
      const payments = this.getPayments();
      const newPayment: PaymentRecord = {
        id: `pay-${offer.projectId}`,
        projectId: offer.projectId,
        projectTitle: proj.title,
        businessId: offer.businessId,
        studentId: studentUser.id,
        amountINR: offer.agreedBudgetINR,
        status: 'NOT_DUE',
        paymentMethod: 'UPI',
        recordedByUserId: offer.businessId,
        notes: `Agreed terms: ₹${offer.agreedBudgetINR} INR upon client sign-off.`,
      };
      this.set(STORAGE_KEYS.PAYMENTS, [newPayment, ...payments]);
    }

    this.logAudit(studentUser, accept ? 'ACCEPTED_OFFER' : 'DECLINED_OFFER', 'PROJECT', offer.projectId, `Offer ${accept ? 'accepted' : 'declined'}`);
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

    this.logAudit(businessUser, 'APPROVED_DELIVERABLE_COMPLETED', 'PROJECT', projectId, `Approved deliverable for "${proj.title}"`);
  }

  // --- Payments ---
  public getPayments(): PaymentRecord[] {
    return this.get<PaymentRecord[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
  }

  public recordPayment(businessUser: User, projectId: string, utrReference: string, paymentMethod: PaymentRecord['paymentMethod'] = 'UPI', notes?: string): PaymentRecord {
    if (businessUser.role !== 'BUSINESS' && businessUser.role !== 'ADMIN') throw new Error('Unauthorized');
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
        status: 'PAID',
        paymentMethod,
        transactionReferenceUTR: utrReference,
        recordedByUserId: businessUser.id,
        recordedAt: new Date().toISOString(),
        notes,
      };
      payments.unshift(pay);
    } else {
      pay.status = 'PAID';
      pay.transactionReferenceUTR = utrReference;
      pay.paymentMethod = paymentMethod;
      pay.recordedByUserId = businessUser.id;
      pay.recordedAt = new Date().toISOString();
      if (notes) pay.notes = notes;
    }

    this.set(STORAGE_KEYS.PAYMENTS, payments);

    // Update student earnings & stats
    if (proj.selectedStudentId) {
      const studentProfile = this.getStudentProfile(proj.selectedStudentId);
      if (studentProfile) {
        studentProfile.totalEarnedINR += proj.budgetINR;
        studentProfile.completedProjectsCount += 1;
        this.updateStudentProfile(proj.selectedStudentId, studentProfile);
      }
    }

    this.logAudit(businessUser, 'RECORDED_PAYMENT_UTR', 'PAYMENT', pay.id, `Recorded ₹${proj.budgetINR} INR with reference ${utrReference}`);
    return pay;
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

    this.logAudit(adminUser, 'RESOLVED_DISPUTE', 'DISPUTE', disputeId, `Decision: ${decision} — ${decisionNotes}`);
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
