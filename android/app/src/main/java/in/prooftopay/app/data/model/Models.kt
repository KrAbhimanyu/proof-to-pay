package in.prooftopay.app.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class UserRole {
    @SerialName("STUDENT") STUDENT,
    @SerialName("BUSINESS") BUSINESS,
    @SerialName("ADMIN") ADMIN,
    @SerialName("RECRUITER") RECRUITER
}

@Serializable
enum class VerificationStatus {
    @SerialName("UNVERIFIED") UNVERIFIED,
    @SerialName("PENDING") PENDING,
    @SerialName("VERIFIED") VERIFIED,
    @SerialName("REJECTED") REJECTED
}

@Serializable
enum class ProjectStatus {
    @SerialName("DRAFT") DRAFT,
    @SerialName("PENDING_REVIEW") PENDING_REVIEW,
    @SerialName("APPROVED") APPROVED,
    @SerialName("IN_PROGRESS") IN_PROGRESS,
    @SerialName("SUBMITTED") SUBMITTED,
    @SerialName("REVISION_REQUESTED") REVISION_REQUESTED,
    @SerialName("COMPLETED") COMPLETED,
    @SerialName("DISPUTED") DISPUTED,
    @SerialName("CANCELLED") CANCELLED
}

@Serializable
enum class ApplicationStatus {
    @SerialName("PENDING") PENDING,
    @SerialName("SHORTLISTED") SHORTLISTED,
    @SerialName("OFFER_EXTENDED") OFFER_EXTENDED,
    @SerialName("ACCEPTED") ACCEPTED,
    @SerialName("REJECTED") REJECTED,
    @SerialName("WITHDRAWN") WITHDRAWN
}

@Serializable
enum class PaymentStatus {
    @SerialName("NOT_INITIATED") NOT_INITIATED,
    @SerialName("PENDING") PENDING,
    @SerialName("PAID") PAID,
    @SerialName("FAILED") FAILED,
    @SerialName("REFUNDED") REFUNDED
}

@Serializable
data class UserProfile(
    val id: String,
    val email: String,
    val name: String,
    val role: UserRole,
    @SerialName("avatar_url") val avatarUrl: String? = null,
    val city: String? = null,
    val state: String? = null,
    @SerialName("is_suspended") val isSuspended: Boolean = false,
    @SerialName("suspension_reason") val suspensionReason: String? = null,
    @SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class PortfolioSample(
    val title: String,
    val url: String
)

@Serializable
data class DeliverableItem(
    val id: String,
    val title: String,
    val description: String,
    val format: String
)

@Serializable
data class Project(
    val id: String,
    @SerialName("business_id") val businessId: String,
    @SerialName("business_name") val businessName: String,
    @SerialName("business_city") val businessCity: String,
    @SerialName("business_verified") val businessVerified: Boolean = false,
    val title: String,
    val summary: String,
    val description: String,
    val category: String,
    @SerialName("required_skills") val requiredSkills: List<String> = emptyList(),
    @SerialName("budget_inr") val budgetInr: Double,
    @SerialName("deadline_days") val deadlineDays: Int,
    @SerialName("expected_delivery_date") val expectedDeliveryDate: String,
    @SerialName("permitted_revisions") val permittedRevisions: Int = 2,
    @SerialName("payment_terms") val paymentTerms: String,
    val status: ProjectStatus = ProjectStatus.DRAFT,
    @SerialName("cover_image") val coverImage: String? = null,
    @SerialName("moderation_notes") val moderationNotes: String? = null,
    @SerialName("selected_student_id") val selectedStudentId: String? = null,
    @SerialName("selected_student_name") val selectedStudentName: String? = null,
    @SerialName("active_offer_id") val activeOfferId: String? = null,
    @SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class Application(
    val id: String,
    @SerialName("project_id") val projectId: String,
    @SerialName("project_title") val projectTitle: String,
    @SerialName("student_id") val studentId: String,
    @SerialName("student_name") val studentName: String,
    @SerialName("pitch_message") val pitchMessage: String,
    @SerialName("portfolio_samples") val portfolioSamples: List<PortfolioSample> = emptyList(),
    @SerialName("proposed_delivery_days") val proposedDeliveryDays: Int = 7,
    val status: ApplicationStatus = ApplicationStatus.PENDING,
    @SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class ProjectOffer(
    val id: String,
    @SerialName("project_id") val projectId: String,
    @SerialName("project_title") val projectTitle: String,
    @SerialName("business_id") val businessId: String,
    @SerialName("business_name") val businessName: String,
    @SerialName("student_id") val studentId: String,
    @SerialName("student_name") val studentName: String,
    @SerialName("agreed_budget_inr") val agreedBudgetInr: Double,
    @SerialName("agreed_deadline") val agreedDeadline: String,
    @SerialName("agreed_revisions") val agreedRevisions: Int = 2,
    @SerialName("scope_summary") val scopeSummary: String,
    val status: String = "PENDING",
    @SerialName("commission_rate_percent") val commissionRatePercent: Double = 5.0,
    @SerialName("platform_fee_inr") val platformFeeInr: Double = 0.0,
    @SerialName("creator_receives_inr") val creatorReceivesInr: Double = 0.0,
    @SerialName("fee_payer") val feePayer: String = "BUSINESS",
    @SerialName("commission_terms_snapshot") val commissionTermsSnapshot: String? = null,
    @SerialName("cancellation_terms") val cancellationTerms: String? = null,
    @SerialName("deliverables_snapshot") val deliverablesSnapshot: List<DeliverableItem> = emptyList(),
    @SerialName("scope_locked") val scopeLocked: Boolean = false,
    @SerialName("locked_at") val lockedAt: String? = null,
    @SerialName("explicit_accepted_at") val explicitAcceptedAt: String? = null,
    @SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class PlatformCommission(
    val id: String,
    @SerialName("project_id") val projectId: String,
    @SerialName("project_title") val projectTitle: String,
    @SerialName("business_id") val businessId: String,
    @SerialName("business_name") val businessName: String,
    @SerialName("project_budget_inr") val projectBudgetInr: Double,
    @SerialName("commission_rate_percent") val commissionRatePercent: Double = 5.0,
    @SerialName("platform_fee_inr") val platformFeeInr: Double,
    val status: String = "DUE",
    @SerialName("due_date") val dueDate: String? = null,
    @SerialName("reported_utr") val reportedUtr: String? = null,
    @SerialName("evidence_reviewed_notes") val evidenceReviewedNotes: String? = null,
    @SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class Submission(
    val id: String,
    @SerialName("project_id") val projectId: String,
    @SerialName("student_id") val studentId: String,
    val version: Int = 1,
    val notes: String,
    @SerialName("live_link") val liveLink: String? = null,
    val status: String = "PENDING_REVIEW",
    @SerialName("revision_feedback") val revisionFeedback: String? = null,
    @SerialName("submitted_at") val submittedAt: String? = null
)

@Serializable
data class PaymentRecord(
    val id: String,
    @SerialName("project_id") val projectId: String,
    @SerialName("project_title") val projectTitle: String,
    @SerialName("business_id") val businessId: String,
    @SerialName("student_id") val studentId: String,
    @SerialName("amount_inr") val amountInr: Double,
    val status: PaymentStatus = PaymentStatus.NOT_INITIATED,
    @SerialName("payment_method") val paymentMethod: String = "UPI",
    @SerialName("transaction_reference_utr") val transactionReferenceUtr: String? = null,
    val notes: String? = null,
    @SerialName("recorded_at") val recordedAt: String? = null
)

@Serializable
data class VerifiedReview(
    val id: String,
    @SerialName("project_id") val projectId: String,
    @SerialName("project_title") val projectTitle: String,
    @SerialName("reviewer_name") val reviewerName: String,
    val rating: Int,
    val comment: String,
    @SerialName("verified_deliverable_summary") val verifiedDeliverableSummary: String,
    @SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class InAppNotification(
    val id: String,
    @SerialName("user_id") val userId: String,
    val title: String,
    val body: String,
    val type: String,
    @SerialName("project_id") val projectId: String? = null,
    @SerialName("is_read") val isRead: Boolean = false,
    @SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class StudentProfile(
    @SerialName("user_id") val userId: String,
    val headline: String,
    val bio: String,
    val age: Int,
    val college: String,
    val degree: String,
    @SerialName("graduation_year") val graduationYear: Int = 2026,
    val skills: List<String> = emptyList(),
    @SerialName("experience_level") val experienceLevel: String = "INTERMEDIATE",
    @SerialName("portfolio_links") val portfolioLinks: List<PortfolioSample> = emptyList(),
    @SerialName("upi_id") val upiId: String? = null,
    @SerialName("total_earned_inr") val totalEarnedInr: Double = 0.0,
    @SerialName("completed_projects_count") val completedProjectsCount: Int = 0,
    @SerialName("average_rating") val averageRating: Double = 5.0,
    @SerialName("verified_portfolio_slug") val verifiedPortfolioSlug: String? = null
)

@Serializable
data class BusinessProfile(
    @SerialName("user_id") val userId: String,
    @SerialName("company_name") val companyName: String,
    val tagline: String? = null,
    val website: String? = null,
    val industry: String,
    val city: String,
    @SerialName("verification_status") val verificationStatus: VerificationStatus = VerificationStatus.UNVERIFIED,
    @SerialName("verification_legal_entity") val verificationLegalEntity: String? = null,
    @SerialName("verification_doc_type") val verificationDocType: String? = null,
    @SerialName("verification_doc_number") val verificationDocNumber: String? = null,
    @SerialName("total_spent_inr") val totalSpentInr: Double = 0.0,
    @SerialName("projects_posted_count") val projectsPostedCount: Int = 0
)

@Serializable
data class DisputeRecord(
    val id: String,
    @SerialName("project_id") val projectId: String,
    @SerialName("project_title") val projectTitle: String,
    @SerialName("raised_by_id") val raisedById: String,
    @SerialName("raised_by_name") val raisedByName: String,
    val reason: String,
    val status: String = "OPEN",
    val resolution: String? = null,
    @SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class AuditLog(
    val id: String,
    @SerialName("user_id") val userId: String,
    @SerialName("user_email") val userEmail: String,
    val action: String,
    val details: String,
    val timestamp: String
)

@Serializable
data class ProofPassportItem(
    val id: String,
    @SerialName("student_id") val studentId: String,
    @SerialName("project_id") val projectId: String,
    @SerialName("project_title") val projectTitle: String,
    val category: String,
    @SerialName("completed_at") val completedAt: String,
    @SerialName("completion_source") val completionSource: String = "BUSINESS_APPROVAL",
    @SerialName("business_name") val businessName: String,
    @SerialName("business_city") val businessCity: String? = null,
    @SerialName("sanitized_summary") val sanitizedSummary: String,
    val rating: Int = 5,
    @SerialName("review_snippet") val reviewSnippet: String? = null,
    @SerialName("is_public") val isPublic: Boolean = true,
    @SerialName("display_order") val displayOrder: Int = 0,
    @SerialName("badge_title") val badgeTitle: String = "Verified Work Delivery",
    @SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class ScopeChangeRequest(
    val id: String,
    @SerialName("project_id") val projectId: String,
    @SerialName("offer_id") val offerId: String,
    @SerialName("requested_by_user_id") val requestedByUserId: String,
    @SerialName("requested_by_name") val requestedByName: String,
    @SerialName("requested_by_role") val requestedByRole: String,
    val reason: String,
    @SerialName("proposed_budget_inr") val proposedBudgetInr: Double,
    @SerialName("proposed_deadline") val proposedDeadline: String,
    @SerialName("proposed_revisions") val proposedRevisions: Int,
    @SerialName("proposed_scope_summary") val proposedScopeSummary: String,
    @SerialName("proposed_deliverables") val proposedDeliverables: List<DeliverableItem> = emptyList(),
    val status: String = "PENDING",
    @SerialName("rejection_reason") val rejectionReason: String? = null,
    @SerialName("created_at") val createdAt: String,
    @SerialName("responded_at") val respondedAt: String? = null,
    @SerialName("responded_by_user_id") val respondedByUserId: String? = null
)

@Serializable
data class WorkTrailEvent(
    val id: String,
    @SerialName("project_id") val projectId: String,
    @SerialName("event_type") val eventType: String,
    val title: String,
    val description: String,
    val timestamp: String,
    @SerialName("actor_name") val actorName: String,
    @SerialName("actor_role") val actorRole: String,
    @SerialName("is_verified") val isVerified: Boolean = false,
    @SerialName("verification_note") val verificationNote: String? = null
)

@Serializable
data class RecruiterProfile(
    @SerialName("user_id") val userId: String,
    @SerialName("company_name") val companyName: String,
    val designation: String,
    val industry: String,
    @SerialName("verification_status") val verificationStatus: VerificationStatus = VerificationStatus.UNVERIFIED,
    val website: String? = null,
    @SerialName("hiring_domains") val hiringDomains: List<String> = emptyList(),
    @SerialName("total_hires_count") val totalHiresCount: Int = 0,
    @SerialName("active_collections_count") val activeCollectionsCount: Int = 0,
    @SerialName("referral_code") val referralCode: String? = null
)

@Serializable
data class TalentCollectionItem(
    val id: String,
    @SerialName("collection_id") val collectionId: String,
    @SerialName("creator_id") val creatorId: String,
    @SerialName("private_notes") val privateNotes: String? = null,
    @SerialName("added_at") val addedAt: String,
    val tags: List<String> = emptyList(),
    val endorsement: String? = null
)

@Serializable
data class TalentCollection(
    val id: String,
    @SerialName("owner_id") val ownerId: String,
    val name: String,
    val description: String,
    val color: String = "indigo",
    @SerialName("created_at") val createdAt: String,
    @SerialName("updated_at") val updatedAt: String,
    val items: List<TalentCollectionItem> = emptyList(),
    @SerialName("is_curated") val isCurated: Boolean = false,
    @SerialName("is_featured") val isFeatured: Boolean = false,
    val badge: String? = null,
    @SerialName("curator_name") val curatorName: String? = null,
    val category: String? = null,
    @SerialName("views_count") val viewsCount: Int = 0,
    @SerialName("clones_count") val clonesCount: Int = 0
)

@Serializable
data class ReferralRecord(
    val id: String,
    @SerialName("referrer_id") val referrerId: String,
    @SerialName("referrer_role") val referrerRole: UserRole,
    @SerialName("referee_id") val refereeId: String? = null,
    @SerialName("referee_name") val refereeName: String,
    @SerialName("referee_email") val refereeEmail: String,
    @SerialName("referee_role") val refereeRole: UserRole,
    val status: String = "SIGNED_UP",
    @SerialName("reward_amount_inr") val rewardAmountInr: Double,
    @SerialName("reward_type") val rewardType: String = "CASH_INR",
    @SerialName("referral_code") val referralCode: String,
    @SerialName("created_at") val createdAt: String,
    @SerialName("activated_at") val activatedAt: String? = null,
    @SerialName("milestone_title") val milestoneTitle: String? = null
)

@Serializable
data class ReferralStats(
    @SerialName("referral_code") val referralCode: String,
    @SerialName("total_invited") val totalInvited: Int = 0,
    @SerialName("total_joined") val totalJoined: Int = 0,
    @SerialName("total_activated") val totalActivated: Int = 0,
    @SerialName("total_earned_inr") val totalEarnedInr: Double = 0.0,
    @SerialName("pending_reward_inr") val pendingRewardInr: Double = 0.0,
    @SerialName("commission_discount_percent") val commissionDiscountPercent: Int = 0
)


