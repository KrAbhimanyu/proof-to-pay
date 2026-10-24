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
  Conversation,
  Message,
  MessageAttachment,
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

  public async updateStudentProfile(userId: string, data: Partial<StudentProfile>): Promise<void> {
    const sb = this.getClient();
    if (!sb) throw new Error('Supabase client not configured');
    const updatePayload: Record<string, any> = {};
    if (data.headline !== undefined) updatePayload.headline = data.headline;
    if (data.bio !== undefined) updatePayload.bio = data.bio;
    if (data.age !== undefined) updatePayload.age = data.age;
    if (data.college !== undefined) updatePayload.college = data.college;
    if (data.degree !== undefined) updatePayload.degree = data.degree;
    if (data.graduationYear !== undefined) updatePayload.graduation_year = data.graduationYear;
    if (data.skills !== undefined) updatePayload.skills = data.skills;
    if (data.experienceLevel !== undefined) updatePayload.experience_level = data.experienceLevel;
    if (data.portfolioLinks !== undefined) updatePayload.portfolio_links = data.portfolioLinks;
    if (data.verifiedPortfolioSlug !== undefined) updatePayload.verified_portfolio_slug = data.verifiedPortfolioSlug;
    if (data.upiId !== undefined) updatePayload.upi_id = data.upiId;
    if (data.githubUrl !== undefined) updatePayload.github_url = data.githubUrl;
    if (data.linkedinUrl !== undefined) updatePayload.linkedin_url = data.linkedinUrl;
    if (data.behanceUrl !== undefined) updatePayload.behance_url = data.behanceUrl;
    if (data.socialLinks !== undefined) updatePayload.social_links = data.socialLinks;

    const { error } = await sb
      .from('student_profiles')
      .update(updatePayload)
      .eq('user_id', userId);
    if (error) throw error;
  }

  public async updateBusinessProfile(userId: string, data: Partial<BusinessProfile>): Promise<void> {
    const sb = this.getClient();
    if (!sb) throw new Error('Supabase client not configured');
    const updatePayload: Record<string, any> = {};
    if (data.companyName !== undefined) updatePayload.company_name = data.companyName;
    if (data.tagline !== undefined) updatePayload.tagline = data.tagline;
    if (data.website !== undefined) updatePayload.website = data.website;
    if (data.industry !== undefined) updatePayload.industry = data.industry;
    if (data.city !== undefined) updatePayload.city = data.city;

    const { error } = await sb
      .from('business_profiles')
      .update(updatePayload)
      .eq('user_id', userId);
    if (error) throw error;
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

  // --- Project Payments & Settlements ---
  public async getProjectPayment(projectId: string): Promise<PaymentRecord | null> {
    const sb = this.getClient();
    if (!sb) throw new Error('Supabase client not configured');
    const { data, error } = await sb
      .from('project_payments')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      projectId: data.project_id,
      projectTitle: data.project_title,
      businessId: data.business_id,
      studentId: data.student_id,
      amountINR: (data.amount_paise || 0) / 100,
      status: data.status,
      paymentMethod: data.payment_method,
      transactionReferenceUTR: data.utr || undefined,
      recordedByUserId: data.business_id,
      recordedAt: data.reported_at || data.created_at,
      confirmedAt: data.confirmed_by_creator_at || undefined,
      confirmedByUserId: data.confirmed_by_creator_at ? data.student_id : undefined,
      notes: data.business_notes || undefined,
    };
  }

  public async confirmPaymentReceipt(paymentId: string, notes?: string): Promise<{
    success: boolean;
    paymentId: string;
    projectId: string;
    status: string;
    confirmedAt: string;
    amountINR: number;
    totalEarnedINR: number;
    completedProjectsCount: number;
  }> {
    const sb = this.getClient();
    if (!sb) throw new Error('Supabase client not configured');

    const { data, error } = await sb.rpc('confirm_payment_receipt', {
      p_payment_id: paymentId,
      p_notes: notes || null,
    });

    if (error) throw error;
    return {
      success: data.success,
      paymentId: data.payment_id,
      projectId: data.project_id,
      status: data.status,
      confirmedAt: data.confirmed_at,
      amountINR: data.amount_inr,
      totalEarnedINR: data.total_earned_inr,
      completedProjectsCount: data.completed_projects_count,
    };
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

  // --- Secure Messaging Subsystem ---
  public async getConversations(userId: string): Promise<Conversation[]> {
    const sb = this.getClient();
    if (!sb) return [];

    try {
      const { data, error } = await sb
        .from('conversations')
        .select(`
          id,
          conversation_type,
          business_id,
          creator_id,
          project_id,
          project_offer_id,
          status,
          created_by,
          last_message_at,
          created_at,
          updated_at,
          participants:conversation_participants(id, user_id, joined_at, last_read_at, is_muted),
          business:profiles!business_id(name, avatar_url),
          creator:profiles!creator_id(name, avatar_url),
          project:projects(title)
        `)
        .or(`business_id.eq.${userId},creator_id.eq.${userId}`)
        .order('last_message_at', { ascending: false });

      if (error || !data) return [];

      return data.map((row: any) => ({
        id: row.id,
        conversationType: row.conversation_type,
        businessId: row.business_id,
        businessName: row.business?.name,
        businessAvatarUrl: row.business?.avatar_url,
        creatorId: row.creator_id,
        creatorName: row.creator?.name,
        creatorAvatarUrl: row.creator?.avatar_url,
        projectId: row.project_id,
        projectTitle: row.project?.title,
        projectOfferId: row.project_offer_id,
        status: row.status,
        createdBy: row.created_by,
        lastMessageAt: row.last_message_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        participants: (row.participants || []).map((p: any) => ({
          id: p.id,
          conversationId: row.id,
          userId: p.user_id,
          joinedAt: p.joined_at,
          lastReadAt: p.last_read_at,
          isMuted: p.is_muted
        }))
      }));
    } catch {
      return [];
    }
  }

  public async getOrCreatePreProjectConversation(
    businessId: string,
    creatorId: string,
    createdById: string,
    projectId?: string
  ): Promise<Conversation | null> {
    const sb = this.getClient();
    if (!sb) return null;

    try {
      let query = sb
        .from('conversations')
        .select(`
          id,
          conversation_type,
          business_id,
          creator_id,
          project_id,
          project_offer_id,
          status,
          created_by,
          last_message_at,
          created_at,
          updated_at,
          business:profiles!business_id(name, avatar_url),
          creator:profiles!creator_id(name, avatar_url),
          project:projects(title)
        `)
        .eq('conversation_type', 'PRE_PROJECT')
        .eq('business_id', businessId)
        .eq('creator_id', creatorId);

      if (projectId) {
        query = query.eq('project_id', projectId);
      } else {
        query = query.is('project_id', null);
      }

      const { data: existing, error: existErr } = await query.maybeSingle();
      if (!existErr && existing) {
        const ex = existing as any;
        return {
          id: ex.id,
          conversationType: ex.conversation_type,
          businessId: ex.business_id,
          businessName: ex.business?.name,
          businessAvatarUrl: ex.business?.avatar_url,
          creatorId: ex.creator_id,
          creatorName: ex.creator?.name,
          creatorAvatarUrl: ex.creator?.avatar_url,
          projectId: ex.project_id,
          projectTitle: ex.project?.title,
          projectOfferId: ex.project_offer_id,
          status: ex.status,
          createdBy: ex.created_by,
          lastMessageAt: ex.last_message_at,
          createdAt: ex.created_at,
          updatedAt: ex.updated_at
        };
      }

      const { data: inserted, error: insertErr } = await sb
        .from('conversations')
        .insert({
          conversation_type: 'PRE_PROJECT',
          business_id: businessId,
          creator_id: creatorId,
          project_id: projectId || null,
          created_by: createdById,
          status: 'ACTIVE'
        })
        .select(`
          id,
          conversation_type,
          business_id,
          creator_id,
          project_id,
          project_offer_id,
          status,
          created_by,
          last_message_at,
          created_at,
          updated_at,
          business:profiles!business_id(name, avatar_url),
          creator:profiles!creator_id(name, avatar_url),
          project:projects(title)
        `)
        .single();

      if (insertErr || !inserted) return null;

      const ins = inserted as any;
      return {
        id: ins.id,
        conversationType: ins.conversation_type,
        businessId: ins.business_id,
        businessName: ins.business?.name,
        businessAvatarUrl: ins.business?.avatar_url,
        creatorId: ins.creator_id,
        creatorName: ins.creator?.name,
        creatorAvatarUrl: ins.creator?.avatar_url,
        projectId: ins.project_id,
        projectTitle: ins.project?.title,
        projectOfferId: ins.project_offer_id,
        status: ins.status,
        createdBy: ins.created_by,
        lastMessageAt: ins.last_message_at,
        createdAt: ins.created_at,
        updatedAt: ins.updated_at
      };
    } catch {
      return null;
    }
  }

  public async getOrCreateProjectConversation(offerId: string): Promise<Conversation | null> {
    const sb = this.getClient();
    if (!sb) return null;

    try {
      const { data: existing } = await sb
        .from('conversations')
        .select(`
          id,
          conversation_type,
          business_id,
          creator_id,
          project_id,
          project_offer_id,
          status,
          created_by,
          last_message_at,
          created_at,
          updated_at,
          business:profiles!business_id(name, avatar_url),
          creator:profiles!creator_id(name, avatar_url),
          project:projects(title)
        `)
        .eq('project_offer_id', offerId)
        .maybeSingle();

      if (existing) {
        const ex = existing as any;
        return {
          id: ex.id,
          conversationType: ex.conversation_type,
          businessId: ex.business_id,
          businessName: ex.business?.name,
          businessAvatarUrl: ex.business?.avatar_url,
          creatorId: ex.creator_id,
          creatorName: ex.creator?.name,
          creatorAvatarUrl: ex.creator?.avatar_url,
          projectId: ex.project_id,
          projectTitle: ex.project?.title,
          projectOfferId: ex.project_offer_id,
          status: ex.status,
          createdBy: ex.created_by,
          lastMessageAt: ex.last_message_at,
          createdAt: ex.created_at,
          updatedAt: ex.updated_at
        };
      }

      const { data: offer, error: offerErr } = await sb
        .from('project_offers')
        .select('id, business_id, student_id, project_id, status')
        .eq('id', offerId)
        .single();

      if (offerErr || !offer || offer.status !== 'ACCEPTED') {
        return null;
      }

      const { data: inserted, error: insertErr } = await sb
        .from('conversations')
        .insert({
          conversation_type: 'PROJECT',
          business_id: offer.business_id,
          creator_id: offer.student_id,
          project_id: offer.project_id,
          project_offer_id: offer.id,
          created_by: offer.business_id,
          status: 'ACTIVE'
        })
        .select(`
          id,
          conversation_type,
          business_id,
          creator_id,
          project_id,
          project_offer_id,
          status,
          created_by,
          last_message_at,
          created_at,
          updated_at,
          business:profiles!business_id(name, avatar_url),
          creator:profiles!creator_id(name, avatar_url),
          project:projects(title)
        `)
        .single();

      if (insertErr || !inserted) return null;

      const ins = inserted as any;
      return {
        id: ins.id,
        conversationType: ins.conversation_type,
        businessId: ins.business_id,
        businessName: ins.business?.name,
        businessAvatarUrl: ins.business?.avatar_url,
        creatorId: ins.creator_id,
        creatorName: ins.creator?.name,
        creatorAvatarUrl: ins.creator?.avatar_url,
        projectId: ins.project_id,
        projectTitle: ins.project?.title,
        projectOfferId: ins.project_offer_id,
        status: ins.status,
        createdBy: ins.created_by,
        lastMessageAt: ins.last_message_at,
        createdAt: ins.created_at,
        updatedAt: ins.updated_at
      };
    } catch {
      return null;
    }
  }

  public async getMessages(conversationId: string): Promise<Message[]> {
    const sb = this.getClient();
    if (!sb) return [];

    try {
      const { data, error } = await sb
        .from('messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          message_type,
          body,
          is_deleted,
          created_at,
          updated_at,
          sender:profiles!sender_id(name, role, avatar_url),
          attachments:message_attachments(*)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error || !data) return [];

      return data.map((row: any) => ({
        id: row.id,
        conversationId: row.conversation_id,
        senderId: row.sender_id,
        senderName: row.sender?.name,
        senderRole: row.sender?.role,
        senderAvatarUrl: row.sender?.avatar_url,
        messageType: row.message_type,
        body: row.body,
        isDeleted: row.is_deleted,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        attachments: (row.attachments || []).map((att: any) => ({
          id: att.id,
          messageId: att.message_id,
          conversationId: att.conversation_id,
          storagePath: att.storage_path,
          fileName: att.file_name,
          fileSizeBytes: Number(att.file_size_bytes),
          mimeType: att.mime_type,
          voiceDurationSeconds: att.voice_duration_seconds,
          createdAt: att.created_at
        }))
      }));
    } catch {
      return [];
    }
  }

  public async sendMessage(params: {
    conversationId: string;
    senderId: string;
    messageType: string;
    body?: string;
    attachments?: any[];
  }): Promise<Message | null> {
    const sb = this.getClient();
    if (!sb) return null;

    try {
      // Format attachment metadata payload for atomic transactional RPC
      const rpcAttachments = (params.attachments || []).map((att: any) => ({
        storage_path: att.storagePath || att.storage_path,
        file_name: att.fileName || att.file_name,
        file_size_bytes: Number(att.fileSizeBytes ?? att.file_size_bytes),
        mime_type: att.mimeType || att.mime_type,
        voice_duration_seconds: att.voiceDurationSeconds ?? att.voice_duration_seconds ?? null
      }));

      // Database-side transactional RPC: inserts message and attachments in single transaction with rollback
      const { data, error } = await sb.rpc('send_chat_message', {
        p_conversation_id: params.conversationId,
        p_message_type: params.messageType,
        p_body: params.body || null,
        p_attachments: rpcAttachments
      });

      if (error || !data) {
        console.error('Transactional send_chat_message RPC failed:', error?.message || 'No data returned');

        // Cleanup pre-uploaded storage objects if database RPC fails or rolls back
        if (params.attachments && params.attachments.length > 0) {
          const pathsToRemove = params.attachments
            .map((att: any) => att.storagePath || att.storage_path)
            .filter(Boolean);
          if (pathsToRemove.length > 0) {
            try {
              await sb.storage.from('chat_attachments').remove(pathsToRemove);
            } catch (storageCleanupErr) {
              console.warn('Storage cleanup warning after RPC rollback:', storageCleanupErr);
            }
          }
        }

        return null;
      }

      const savedAttachments: MessageAttachment[] = ((data.attachments as any[]) || []).map((att: any) => ({
        id: att.id,
        messageId: data.id,
        conversationId: params.conversationId,
        storagePath: att.storage_path,
        fileName: att.file_name,
        fileSizeBytes: Number(att.file_size_bytes),
        mimeType: att.mime_type,
        voiceDurationSeconds: att.voice_duration_seconds,
        createdAt: att.created_at
      }));

      return {
        id: data.id,
        conversationId: data.conversation_id,
        senderId: data.sender_id,
        messageType: data.message_type,
        body: data.body,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        attachments: savedAttachments
      };
    } catch (err) {
      console.error('Unexpected error in sendMessage RPC:', err);
      return null;
    }
  }

  public async uploadChatAttachment(
    conversationId: string,
    file: Blob | File,
    fileName: string,
    mimeType: string,
    voiceDurationSeconds?: number
  ): Promise<MessageAttachment | null> {
    const sb = this.getClient();
    if (!sb) return null;

    try {
      const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `conversations/${conversationId}/${Date.now()}_${cleanName}`;

      const { error: uploadError } = await sb.storage
        .from('chat_attachments')
        .upload(storagePath, file, { contentType: mimeType, upsert: false });

      if (uploadError) {
        console.warn('Chat storage upload warning:', uploadError.message);
        return null;
      }

      // Generate a short-lived signed URL for immediate preview (1 hour expiry)
      let initialSignedUrl: string | undefined = undefined;
      const { data: signedData } = await sb.storage
        .from('chat_attachments')
        .createSignedUrl(storagePath, 3600);
      if (signedData?.signedUrl) {
        initialSignedUrl = signedData.signedUrl;
      }

      return {
        id: `att-${Date.now()}`,
        messageId: '',
        conversationId,
        storagePath,
        fileName,
        fileSizeBytes: file.size,
        mimeType,
        voiceDurationSeconds,
        downloadUrl: initialSignedUrl,
        createdAt: new Date().toISOString()
      };
    } catch {
      return null;
    }
  }

  public async createSignedAttachmentUrl(
    storagePath: string,
    expiresInSeconds: number = 3600
  ): Promise<string | null> {
    const sb = this.getClient();
    if (!sb) return null;

    try {
      const { data, error } = await sb.storage
        .from('chat_attachments')
        .createSignedUrl(storagePath, expiresInSeconds);

      if (error || !data) return null;
      return data.signedUrl;
    } catch {
      return null;
    }
  }


  public async markConversationRead(conversationId: string, userId: string): Promise<void> {
    const sb = this.getClient();
    if (!sb) return;

    try {
      await sb
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);
    } catch {
      // Non-blocking
    }
  }

  public subscribeToConversation(
    conversationId: string,
    onNewMessage: (msg: Message) => void
  ): () => void {
    const sb = this.getClient();
    if (!sb) return () => {};

    try {
      const channel = sb
        .channel(`chat_${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          (payload) => {
            const row = payload.new as any;
            onNewMessage({
              id: row.id,
              conversationId: row.conversation_id,
              senderId: row.sender_id,
              messageType: row.message_type,
              body: row.body,
              createdAt: row.created_at,
              updatedAt: row.updated_at
            });
          }
        )
        .subscribe();

      return () => {
        sb.removeChannel(channel);
      };
    } catch {
      return () => {};
    }
  }

  // --- Background Sync & Offline Mutation Push ---
  public async submitApplication(payload: {
    projectId: string;
    projectTitle: string;
    studentId: string;
    studentName: string;
    studentSkills?: string[];
    pitchMessage: string;
    portfolioSamples?: { title: string; url: string }[];
    proposedDeliveryDays?: number;
    status?: string;
    createdAt?: string;
  }): Promise<void> {
    const sb = this.getClient();
    if (!sb) throw new Error('Live Supabase backend is not configured.');
    const { error } = await sb.from('applications').upsert(
      {
        project_id: payload.projectId,
        project_title: payload.projectTitle,
        student_id: payload.studentId,
        student_name: payload.studentName,
        student_skills: payload.studentSkills || [],
        pitch_message: payload.pitchMessage,
        portfolio_samples: payload.portfolioSamples || [],
        proposed_delivery_days: payload.proposedDeliveryDays || 7,
        status: payload.status || 'PENDING',
        created_at: payload.createdAt || new Date().toISOString(),
      },
      { onConflict: 'project_id,student_id' }
    );
    if (error) throw error;
  }

  public async updateProjectStatus(projectId: string, status: string): Promise<void> {
    const sb = this.getClient();
    if (!sb) throw new Error('Live Supabase backend is not configured.');
    const { error } = await sb
      .from('projects')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', projectId);
    if (error) throw error;
  }

  public async syncPendingMutation(mutation: {
    type: string;
    payload: Record<string, any>;
  }): Promise<void> {
    const sb = this.getClient();
    if (!sb) throw new Error('Live Supabase backend is not configured.');

    switch (mutation.type) {
      case 'APPLICATION_SUBMIT':
        await this.submitApplication(mutation.payload as any);
        break;
      case 'PROJECT_STATUS_UPDATE':
        await this.updateProjectStatus(mutation.payload.projectId, mutation.payload.status);
        break;
      case 'PROFILE_UPDATE':
        if (mutation.payload.role === 'STUDENT') {
          await this.updateStudentProfile(mutation.payload.userId, mutation.payload.data);
        } else if (mutation.payload.role === 'BUSINESS') {
          await this.updateBusinessProfile(mutation.payload.userId, mutation.payload.data);
        }
        break;
      case 'SUBMISSION_CREATE':
        const { error } = await sb.from('project_submissions').upsert({
          id: mutation.payload.id,
          project_id: mutation.payload.projectId,
          student_id: mutation.payload.studentId,
          notes: mutation.payload.notes,
          live_link: mutation.payload.liveLink,
          created_at: mutation.payload.createdAt || new Date().toISOString(),
        });
        if (error) throw error;
        break;
      default:
        console.warn(`[SupabaseService] Unknown mutation type: ${mutation.type}`);
    }
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
