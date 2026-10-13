import { createClient, SupabaseClient } from '@supabase/supabase-js';
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
  PlatformCommissionRecord,
  ProofPassportItem,
  ScopeChangeRequest,
  WorkTrailEvent,
} from '../types';
import { getSupabaseConfig } from './supabaseClient';

class SupabaseService {
  private client: SupabaseClient | null = null;
  private isConnected = false;

  constructor() {
    this.initClient();
  }

  public initClient(): boolean {
    const config = getSupabaseConfig();
    if (config.isConfigured && config.url && (config.publishableKey || config.anonKey)) {
      try {
        const key = config.publishableKey || config.anonKey;
        this.client = createClient(config.url, key, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
          },
        });
        this.isConnected = true;
        return true;
      } catch (err) {
        console.error('Failed to initialize Supabase client:', err);
        this.client = null;
        this.isConnected = false;
        return false;
      }
    }
    this.client = null;
    this.isConnected = false;
    return false;
  }

  public getClient(): SupabaseClient | null {
    if (!this.client) {
      this.initClient();
    }
    return this.client;
  }

  public isLiveBackendConfigured(): boolean {
    return this.isConnected && this.client !== null;
  }

  // --- Auth & Session ---
  public async getSession() {
    const sb = this.getClient();
    if (!sb) throw new Error('Live Supabase backend is not configured.');
    const { data, error } = await sb.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  public async signInWithEmail(email: string, password: string) {
    const sb = this.getClient();
    if (!sb) throw new Error('Live Supabase backend is not configured.');
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  public async signUpWithEmail(email: string, password: string, metadata: { name: string; role: string }) {
    const sb = this.getClient();
    if (!sb) throw new Error('Live Supabase backend is not configured.');
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    if (error) throw error;
    return data;
  }

  public async signOut() {
    const sb = this.getClient();
    if (!sb) return;
    await sb.auth.signOut();
  }

  // --- Profiles ---
  public async getProfile(userId: string): Promise<User | null> {
    const sb = this.getClient();
    if (!sb) throw new Error('Supabase client not configured');
    const { data, error } = await sb
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      avatarUrl: data.avatar_url,
      city: data.city,
      state: data.state,
      phone: data.phone,
      isSuspended: data.is_suspended,
      suspensionReason: data.suspension_reason,
      createdAt: data.created_at,
      githubUrl: data.github_url || null,
      linkedinUrl: data.linkedin_url || null,
      behanceUrl: data.behance_url || null,
    };
  }

  public async getStudentProfile(userId: string): Promise<StudentProfile | null> {
    const sb = this.getClient();
    if (!sb) throw new Error('Supabase client not configured');
    const { data, error } = await sb
      .from('student_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    const githubUrl = data.github_url || null;
    const linkedinUrl = data.linkedin_url || null;
    const behanceUrl = data.behance_url || null;
    const socialLinks = data.social_links || (
      [
        githubUrl ? { platform: 'github', url: githubUrl } : null,
        linkedinUrl ? { platform: 'linkedin', url: linkedinUrl } : null,
        behanceUrl ? { platform: 'behance', url: behanceUrl } : null,
      ].filter(Boolean) as { platform: string; url: string }[]
    );

    return {
      userId: data.user_id,
      headline: data.headline || '',
      bio: data.bio || '',
      age: data.age,
      college: data.college,
      degree: data.degree,
      graduationYear: data.graduation_year,
      skills: data.skills || [],
      experienceLevel: data.experience_level || 'INTERMEDIATE',
      portfolioLinks: data.portfolio_links || [],
      upiId: data.upi_id,
      totalEarnedINR: (data.total_earned_paise || 0) / 100,
      completedProjectsCount: data.completed_projects_count || 0,
      averageRating: data.average_rating ? Number(data.average_rating) : 0,
      verifiedPortfolioSlug: data.verified_portfolio_slug || '',
      githubUrl,
      linkedinUrl,
      behanceUrl,
      socialLinks,
    };
  }

  /**
   * Retrieves non-null social media links (GitHub, LinkedIn, Behance) from profile tables
   */
  public async getProfileSocialLinks(userId: string): Promise<{
    github: string | null;
    linkedin: string | null;
    behance: string | null;
  }> {
    const sb = this.getClient();
    if (!sb) return { github: null, linkedin: null, behance: null };
    try {
      const { data: prof } = await sb
        .from('profiles')
        .select('github_url, linkedin_url, behance_url')
        .eq('id', userId)
        .maybeSingle();

      const { data: sProf } = await sb
        .from('student_profiles')
        .select('github_url, linkedin_url, behance_url, social_links')
        .eq('user_id', userId)
        .maybeSingle();

      const github =
        prof?.github_url ||
        sProf?.github_url ||
        (Array.isArray(sProf?.social_links)
          ? sProf.social_links.find((s: any) => s?.platform?.toLowerCase() === 'github')?.url
          : null) ||
        null;

      const linkedin =
        prof?.linkedin_url ||
        sProf?.linkedin_url ||
        (Array.isArray(sProf?.social_links)
          ? sProf.social_links.find((s: any) => s?.platform?.toLowerCase() === 'linkedin')?.url
          : null) ||
        null;

      const behance =
        prof?.behance_url ||
        sProf?.behance_url ||
        (Array.isArray(sProf?.social_links)
          ? sProf.social_links.find((s: any) => s?.platform?.toLowerCase() === 'behance')?.url
          : null) ||
        null;

      return { github, linkedin, behance };
    } catch {
      return { github: null, linkedin: null, behance: null };
    }
  }

  public async getBusinessProfile(userId: string): Promise<BusinessProfile | null> {
    const sb = this.getClient();
    if (!sb) throw new Error('Supabase client not configured');
    const { data, error } = await sb
      .from('business_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return {
      userId: data.user_id,
      companyName: data.company_name,
      tagline: data.tagline,
      website: data.website,
      industry: data.industry,
      city: data.city,
      verificationStatus: data.verification_status,
      verificationDetails: data.verification_legal_entity
        ? {
            legalEntityName: data.verification_legal_entity,
            documentType: data.verification_doc_type as any,
            documentNumber: data.verification_doc_number,
            submittedAt: data.verification_submitted_at,
            adminNotes: data.verification_admin_notes,
            verifiedAt: data.verification_verified_at,
          }
        : undefined,
      totalSpentINR: (data.total_spent_paise || 0) / 100,
      projectsPostedCount: data.projects_posted_count || 0,
    };
  }

  // --- Projects ---
  public async getProjects(): Promise<ProjectListing[]> {
    const sb = this.getClient();
    if (!sb) throw new Error('Supabase client not configured');
    const { data, error } = await sb
      .from('projects')
      .select('*, deliverables(*)');
    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      businessId: row.business_id,
      businessName: row.business_name,
      businessCity: row.business_city,
      businessVerified: row.business_verified,
      title: row.title,
      summary: row.summary,
      description: row.description,
      category: row.category,
      requiredSkills: row.required_skills || [],
      budgetINR: (row.budget_paise || 0) / 100,
      deadlineDays: row.deadline_days,
      expectedDeliveryDate: row.expected_delivery_date,
      permittedRevisions: row.permitted_revisions,
      applicationClosingDate: row.application_closing_date,
      paymentTerms: row.payment_terms,
      status: row.status,
      coverImage: row.cover_image,
      moderationNotes: row.moderation_notes,
      selectedStudentId: row.selected_student_id,
      selectedStudentName: row.selected_student_name,
      activeOfferId: row.active_offer_id,
      deliverables: (row.deliverables || []).map((d: any) => ({
        id: d.id,
        title: d.title,
        description: d.description,
        format: d.format,
      })),
      acceptanceCriteria: [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  // --- Proof Passport ---
  public async getProofPassportItems(studentId?: string): Promise<ProofPassportItem[]> {
    const sb = this.getClient();
    if (!sb) throw new Error('Supabase client not configured');
    let query = sb.from('proof_passport_items').select('*').order('display_order', { ascending: true });
    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      studentId: row.student_id,
      projectId: row.project_id,
      projectTitle: row.project_title,
      category: row.category,
      completedAt: row.completed_at,
      completionSource: row.completion_source,
      businessName: row.business_name,
      businessCity: row.business_city,
      sanitizedSummary: row.sanitized_summary,
      rating: row.rating,
      reviewSnippet: row.review_snippet,
      isPublic: row.is_public,
      displayOrder: row.display_order,
      badgeTitle: row.badge_title,
      createdAt: row.created_at,
    }));
  }

  // --- Platform Commissions ---
  public async getPlatformCommissions(): Promise<PlatformCommissionRecord[]> {
    const sb = this.getClient();
    if (!sb) throw new Error('Supabase client not configured');
    const { data, error } = await sb.from('platform_commissions').select('*');
    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      projectId: row.project_id,
      projectTitle: row.project_title,
      businessId: row.business_id,
      businessName: row.business_name,
      studentId: row.student_id,
      studentName: row.student_name,
      projectBudgetINR: (row.project_budget_paise || 0) / 100,
      commissionRatePercent: (row.commission_rate_bps || 500) / 100,
      platformFeeINR: (row.platform_fee_paise || 0) / 100,
      status: row.status,
      dueDate: row.due_date,
      paymentMethod: row.payment_method,
      reportedUTR: row.reported_utr,
      reportedAt: row.reported_at,
      reportedNotes: row.reported_notes,
      verifiedByUserId: row.verified_by_user_id,
      verifiedByName: row.verified_by_name,
      verifiedAt: row.verified_at,
      evidenceReviewedNotes: row.evidence_reviewed_notes,
      waiverReason: row.waiver_reason,
      waivedByUserId: row.waived_by_user_id,
      waivedAt: row.waived_at,
      adjustmentAmountINR: (row.adjustment_amount_paise || 0) / 100,
      adjustmentReason: row.adjustment_reason,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  // --- Scope Change Requests ---
  public async getScopeChangeRequests(projectId?: string): Promise<ScopeChangeRequest[]> {
    const sb = this.getClient();
    if (!sb) throw new Error('Supabase client not configured');
    let query = sb.from('scope_change_requests').select('*');
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      projectId: row.project_id,
      offerId: row.offer_id,
      requestedByUserId: row.requested_by_user_id,
      requestedByName: row.requested_by_name,
      requestedByRole: row.requested_by_role,
      reason: row.reason,
      proposedBudgetINR: (row.proposed_budget_paise || 0) / 100,
      proposedDeadline: row.proposed_deadline,
      proposedRevisions: row.proposed_revisions,
      proposedDeliverables: row.proposed_deliverables || [],
      proposedScopeSummary: row.proposed_scope_summary,
      previousTermsSnapshot: row.previous_terms_snapshot,
      status: row.status,
      rejectionReason: row.rejection_reason,
      createdAt: row.created_at,
      respondedAt: row.responded_at,
      respondedByUserId: row.responded_by_user_id,
    }));
  }

  // --- Test connection ---
  public async testConnection(): Promise<{ success: boolean; latencyMs: number; error?: string }> {
    const sb = this.getClient();
    if (!sb) {
      const config = getSupabaseConfig();
      return {
        success: false,
        latencyMs: 0,
        error: config.error || 'Supabase client is not configured. Define VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local.',
      };
    }
    const start = performance.now();
    try {
      const { data, error } = await sb.from('profiles').select('id').limit(1);
      const latencyMs = Math.round(performance.now() - start);
      if (error) {
        return { success: false, latencyMs, error: error.message };
      }
      return { success: true, latencyMs };
    } catch (err: any) {
      return { success: false, latencyMs: Math.round(performance.now() - start), error: err.message || 'Network error' };
    }
  }
}

export const supabaseService = new SupabaseService();
