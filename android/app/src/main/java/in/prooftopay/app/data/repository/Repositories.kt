package in.prooftopay.app.data.repository

import in.prooftopay.app.data.model.*
import in.prooftopay.app.data.supabase.SupabaseClientProvider
import io.github.jan.supabase.gotrue.providers.builtin.Email
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.rpc
import io.github.jan.supabase.postgrest.query.Columns
import io.github.jan.supabase.postgrest.query.Order
import io.github.jan.supabase.realtime.RealtimeChannel
import io.github.jan.supabase.realtime.channel
import io.github.jan.supabase.realtime.postgresChangeFlow
import io.github.jan.supabase.realtime.PostgresAction
import io.github.jan.supabase.storage.storage
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

object AuthRepository {
    private val _currentUser = MutableStateFlow<UserProfile?>(
        UserProfile(
            id = "student-1",
            email = "aarav.sharma@dtu.ac.in",
            name = "Aarav Sharma",
            role = UserRole.STUDENT,
            city = "New Delhi",
            state = "Delhi",
            isSuspended = false,
            createdAt = "2026-08-15T10:00:00Z"
        )
    )
    val currentUser: StateFlow<UserProfile?> = _currentUser.asStateFlow()

    private val _studentProfile = MutableStateFlow(
        StudentProfile(
            userId = "student-1",
            headline = "Full-Stack React & Node Engineer · DTU B.Tech CS",
            bio = "Third-year CS student at Delhi Technological University. Building fast, responsive web products with TypeScript.",
            age = 20,
            college = "Delhi Technological University (DTU)",
            degree = "B.Tech Computer Science & Engineering",
            graduationYear = 2027,
            skills = listOf("React", "TypeScript", "Tailwind CSS", "Node.js", "Figma"),
            experienceLevel = "INTERMEDIATE",
            portfolioLinks = listOf(
                PortfolioSample("DevFlow Telemetry App", "https://github.com/aarav-sharma/devflow"),
                PortfolioSample("Live Portfolio Site", "https://aaravsharma.dev")
            ),
            upiId = "aarav.sharma@okhdfcbank",
            totalEarnedInr = 43000.0,
            completedProjectsCount = 3,
            averageRating = 5.0,
            verifiedPortfolioSlug = "aarav-sharma"
        )
    )
    val studentProfile: StateFlow<StudentProfile> = _studentProfile.asStateFlow()

    private val _businessProfile = MutableStateFlow(
        BusinessProfile(
            userId = "business-1",
            companyName = "HyperFlow Labs",
            tagline = "Developer tooling and workflow automations",
            website = "https://hyperflow.ai",
            industry = "Software & AI Tech",
            city = "Bengaluru",
            verificationStatus = VerificationStatus.VERIFIED,
            verificationLegalEntity = "HyperFlow Cloud Solutions Pvt Ltd",
            verificationDocType = "GSTIN",
            verificationDocNumber = "29AABCU9603R1ZM",
            totalSpentInr = 30000.0,
            projectsPostedCount = 2
        )
    )
    val businessProfile: StateFlow<BusinessProfile> = _businessProfile.asStateFlow()

    suspend fun login(emailInput: String, passwordInput: String): Result<UserProfile> {
        return try {
            if (SupabaseClientProvider.isConfigured) {
                SupabaseClientProvider.auth.signInWith(Email) {
                    email = emailInput
                    password = passwordInput
                }
                val sessionUser = SupabaseClientProvider.auth.currentUserOrNull()
                val profile = SupabaseClientProvider.postgrest["profiles"]
                    .select(columns = Columns.ALL) {
                        filter { eq("id", sessionUser?.id ?: "") }
                    }.decodeSingle<UserProfile>()
                _currentUser.value = profile
                AuditRepository.log(profile.id, profile.email, "USER_LOGIN", "User logged in via Supabase Auth")
                Result.success(profile)
            } else {
                val mockUser = when {
                    emailInput.contains("hyperflow") || emailInput.contains("business") -> {
                        UserProfile(
                            id = "business-1",
                            email = emailInput,
                            name = "Siddharth Menon",
                            role = UserRole.BUSINESS,
                            city = "Bengaluru",
                            state = "Karnataka"
                        )
                    }
                    emailInput.contains("admin") -> {
                        UserProfile(
                            id = "admin-1",
                            email = emailInput,
                            name = "Vikramaditya Roy",
                            role = UserRole.ADMIN,
                            city = "Bengaluru",
                            state = "Karnataka"
                        )
                    }
                    else -> {
                        UserProfile(
                            id = "student-1",
                            email = emailInput,
                            name = "Aarav Sharma",
                            role = UserRole.STUDENT,
                            city = "New Delhi",
                            state = "Delhi"
                        )
                    }
                }
                _currentUser.value = mockUser
                AuditRepository.log(mockUser.id, mockUser.email, "USER_LOGIN", "Logged into companion app session")
                Result.success(mockUser)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun register(
        nameInput: String,
        emailInput: String,
        passwordInput: String,
        roleInput: UserRole,
        ageInput: Int,
        cityInput: String
    ): Result<UserProfile> {
        if (roleInput == UserRole.ADMIN) {
            return Result.failure(IllegalArgumentException("Direct registration as ADMIN is strictly prohibited."))
        }
        if (roleInput == UserRole.STUDENT && ageInput < 18) {
            return Result.failure(IllegalArgumentException("You must be 18 or older to join Proof-to-Pay"))
        }

        val validatedRole = when (roleInput) {
            UserRole.STUDENT -> UserRole.STUDENT
            UserRole.BUSINESS -> UserRole.BUSINESS
            else -> UserRole.STUDENT
        }

        return try {
            if (SupabaseClientProvider.isConfigured) {
                // Pass validated name and role in GoTrue user metadata so handle_new_user() trigger provisions profiles
                SupabaseClientProvider.auth.signUpWith(Email) {
                    email = emailInput.trim()
                    password = passwordInput
                    data = buildJsonObject {
                        put("name", nameInput.trim())
                        put("role", validatedRole.name)
                    }
                }
                val sessionUser = SupabaseClientProvider.auth.currentUserOrNull()
                val session = SupabaseClientProvider.auth.currentSessionOrNull()
                val profile = UserProfile(
                    id = sessionUser?.id ?: "usr-${System.currentTimeMillis()}",
                    email = emailInput.trim(),
                    name = nameInput.trim(),
                    role = validatedRole,
                    city = cityInput.trim()
                )

                // The database trigger 'on_auth_user_created' authoritatively provisions the row in 'public.profiles'
                // and role-specific profile record ('public.student_profiles' or 'public.business_profiles').
                // Client-side manual insert into 'profiles' is intentionally removed to avoid RLS policy rejection.

                if (session != null) {
                    _currentUser.value = profile
                    AuditRepository.log(profile.id, profile.email, "USER_REGISTER", "Registered role: ${validatedRole.name}")
                } else {
                    AuditRepository.log(profile.id, profile.email, "USER_REGISTER_PENDING_CONFIRMATION", "Registered role: ${validatedRole.name} - verification email dispatched")
                }
                Result.success(profile)
            } else {
                val profile = UserProfile(
                    id = "usr-${System.currentTimeMillis()}",
                    email = emailInput.trim(),
                    name = nameInput.trim(),
                    role = validatedRole,
                    city = cityInput.trim()
                )
                _currentUser.value = profile
                AuditRepository.log(profile.id, profile.email, "USER_REGISTER", "Registered role: ${validatedRole.name}")
                Result.success(profile)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun resetPassword(emailInput: String): Result<Unit> {
        return try {
            if (SupabaseClientProvider.isConfigured) {
                SupabaseClientProvider.auth.resetPasswordForEmail(emailInput)
            }
            AuditRepository.log("system", emailInput, "PASSWORD_RESET_REQUESTED", "Reset email triggered")
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun updateStudentProfile(updated: StudentProfile) {
        _studentProfile.value = updated
    }

    fun submitBusinessVerification(legalEntity: String, docType: String, docNumber: String) {
        _businessProfile.value = _businessProfile.value.copy(
            verificationStatus = VerificationStatus.PENDING,
            verificationLegalEntity = legalEntity,
            verificationDocType = docType,
            verificationDocNumber = docNumber
        )
        AuditRepository.log(_businessProfile.value.userId, _businessProfile.value.companyName, "VERIFICATION_SUBMITTED", "Submitted $docType $docNumber")
    }

    fun switchUser(user: UserProfile) {
        _currentUser.value = user
    }

    fun logout() {
        _currentUser.value = null
    }

    fun deleteAccount(): Result<Unit> {
        val user = _currentUser.value ?: return Result.failure(IllegalStateException("No active session"))
        AuditRepository.log(user.id, user.email, "ACCOUNT_DELETED", "User deleted account permanently")
        _currentUser.value = null
        return Result.success(Unit)
    }
}

object ProjectRepository {
    private val _projects = MutableStateFlow<List<Project>>(listOf(
        Project(
            id = "proj-1",
            businessId = "business-2",
            businessName = "Kavita Botanicals",
            businessCity = "Mumbai",
            businessVerified = true,
            title = "Mobile Micro-Savings App UI Prototype (Figma)",
            summary = "Design a high-fidelity 12-screen mobile interface for our upcoming recurring wellness wallet.",
            description = "We are launching an Indian wellness micro-savings program where customers earn points and invest in recurring bundles. We need an emerging UI designer who understands mobile-first touch ergonomics, clean Indian payment cues (UPI icons, rupee figures), and high-contrast accessibility.",
            category = "UI/UX & Product Design",
            requiredSkills = listOf("Figma", "UI/UX Design", "Design Systems", "Mobile App UI"),
            budgetInr = 18000.0,
            deadlineDays = 10,
            expectedDeliveryDate = "2026-10-25",
            permittedRevisions = 2,
            paymentTerms = "100% (₹18,000 INR) paid via direct bank transfer / UPI within 24h of acceptance.",
            status = ProjectStatus.APPROVED,
            coverImage = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800"
        ),
        Project(
            id = "proj-2",
            businessId = "business-2",
            businessName = "Kavita Botanicals",
            businessCity = "Mumbai",
            businessVerified = true,
            title = "Artisanal Herbal Tea Brand Identity & Packaging Suite",
            summary = "Create premium visual identity, logo variations, and 4 retail pouch packaging labels.",
            description = "We are introducing a high-altitude artisanal tea collection for youth and wellness enthusiasts. We love modern Indian heritage motifs paired with clean editorial typography.",
            category = "Brand Identity & Packaging",
            requiredSkills = listOf("Brand Identity", "Packaging Design", "Illustrator", "Typography"),
            budgetInr = 25000.0,
            deadlineDays = 14,
            expectedDeliveryDate = "2026-10-28",
            permittedRevisions = 3,
            paymentTerms = "Fixed ₹25,000 INR upon delivery and pre-print sign-off. Audited UTR recorded on platform.",
            status = ProjectStatus.IN_PROGRESS,
            selectedStudentId = "student-1",
            selectedStudentName = "Aarav Sharma"
        ),
        Project(
            id = "proj-3",
            businessId = "business-1",
            businessName = "HyperFlow Labs",
            businessCity = "Bengaluru",
            businessVerified = true,
            title = "Next.js + Tailwind Marketing Landing Page & Component Library",
            summary = "Develop a responsive, ultra-fast landing page with interactive syntax highlighter.",
            description = "We need an ambitious frontend student to turn our Figma designs into production-ready Next.js App Router code using TypeScript and Tailwind CSS.",
            category = "Web & Mobile Development",
            requiredSkills = listOf("Next.js", "React", "TypeScript", "Tailwind CSS"),
            budgetInr = 15000.0,
            deadlineDays = 7,
            expectedDeliveryDate = "2026-09-18",
            permittedRevisions = 2,
            paymentTerms = "100% (₹15,000 INR) paid immediately upon GitHub PR merge and verified Lighthouse benchmark.",
            status = ProjectStatus.COMPLETED,
            selectedStudentId = "student-1",
            selectedStudentName = "Aarav Sharma"
        ),
        Project(
            id = "proj-4",
            businessId = "business-1",
            businessName = "HyperFlow Labs",
            businessCity = "Bengaluru",
            businessVerified = true,
            title = "Python Automation Script for Developer SDK Documentation",
            summary = "Write clean script parsing markdown schemas and generating SDK code samples in TypeScript and Python.",
            description = "Need a computer science student comfortable with AST parsing or regex to automate sample code block generation for our API portal.",
            category = "Engineering & Automation",
            requiredSkills = listOf("Python", "TypeScript", "CLI", "Git"),
            budgetInr = 12000.0,
            deadlineDays = 5,
            expectedDeliveryDate = "2026-10-30",
            permittedRevisions = 2,
            paymentTerms = "Fixed ₹12,000 INR paid via UPI upon green automated test suite.",
            status = ProjectStatus.PENDING_REVIEW
        )
    ))

    val projects: StateFlow<List<Project>> = _projects.asStateFlow()

    suspend fun getProjects(): Result<List<Project>> {
        return try {
            if (SupabaseClientProvider.isConfigured) {
                val remoteProjects = SupabaseClientProvider.postgrest["projects"]
                    .select(columns = Columns.ALL)
                    .decodeList<Project>()
                _projects.value = remoteProjects
                Result.success(remoteProjects)
            } else {
                Result.success(_projects.value)
            }
        } catch (e: Exception) {
            Result.success(_projects.value)
        }
    }

    fun addProject(project: Project) {
        _projects.value = listOf(project) + _projects.value
        AuditRepository.log(project.businessId, project.businessName, "PROJECT_POSTED", "Posted '${project.title}' (₹${project.budgetInr} INR)")
    }

    fun updateProjectStatus(projectId: String, newStatus: ProjectStatus, notes: String? = null) {
        _projects.value = _projects.value.map {
            if (it.id == projectId) it.copy(status = newStatus, moderationNotes = notes) else it
        }
        AuditRepository.log("admin", "Admin System", "PROJECT_STATUS_UPDATED", "Project $projectId changed to $newStatus")
    }
}

object ApplicationRepository {
    private val _applications = MutableStateFlow<List<Application>>(listOf(
        Application(
            id = "app-1",
            projectId = "proj-1",
            projectTitle = "Mobile Micro-Savings App UI Prototype (Figma)",
            studentId = "student-2",
            studentName = "Ananya Iyer",
            pitchMessage = "Designed 4 financial flows during my 3rd year at NID. I specialize in thumb-zone ergonomics for Indian payment apps.",
            portfolioSamples = listOf(PortfolioSample("Fintech Case Study", "https://behance.net/sample")),
            proposedDeliveryDays = 7,
            status = ApplicationStatus.SHORTLISTED
        ),
        Application(
            id = "app-2",
            projectId = "proj-1",
            projectTitle = "Mobile Micro-Savings App UI Prototype (Figma)",
            studentId = "student-1",
            studentName = "Aarav Sharma",
            pitchMessage = "Frontend engineer with strong Figma prototyping skills. Excited to build responsive screens for this.",
            portfolioSamples = listOf(PortfolioSample("DevFlow UI", "https://aaravsharma.dev")),
            proposedDeliveryDays = 9,
            status = ApplicationStatus.PENDING
        )
    ))

    val applications: StateFlow<List<Application>> = _applications.asStateFlow()

    fun apply(application: Application): Result<Unit> {
        val existing = _applications.value.find { it.projectId == application.projectId && it.studentId == application.studentId }
        if (existing != null) {
            return Result.failure(IllegalStateException("You have already applied to this project"))
        }
        _applications.value = listOf(application) + _applications.value
        AuditRepository.log(application.studentId, application.studentName, "APPLICATION_SUBMITTED", "Applied to '${application.projectTitle}'")
        return Result.success(Unit)
    }

    fun updateStatus(appId: String, status: ApplicationStatus) {
        _applications.value = _applications.value.map {
            if (it.id == appId) it.copy(status = status) else it
        }
        AuditRepository.log("system", "Application", "APPLICATION_STATUS_UPDATED", "App $appId marked as $status")
    }
}

object OfferRepository {
    private val _offers = MutableStateFlow<List<ProjectOffer>>(listOf(
        ProjectOffer(
            id = "offer-1",
            projectId = "proj-1",
            projectTitle = "Mobile Micro-Savings App UI Prototype (Figma)",
            businessId = "business-2",
            businessName = "Kavita Botanicals",
            studentId = "student-1",
            studentName = "Aarav Sharma",
            agreedBudgetInr = 18000.0,
            agreedDeadline = "2026-10-25",
            agreedRevisions = 2,
            scopeSummary = "12 screens in Figma with interactive prototype, dark/light theme, UPI flows.",
            status = "PENDING"
        )
    ))

    val offers: StateFlow<List<ProjectOffer>> = _offers.asStateFlow()

    fun createOffer(offer: ProjectOffer) {
        _offers.value = listOf(offer) + _offers.value
        ApplicationRepository.updateStatus(offer.projectId, ApplicationStatus.OFFER_EXTENDED)
        AuditRepository.log(offer.businessId, offer.businessName, "OFFER_EXTENDED", "Extended binding offer of ₹${offer.agreedBudgetInr} INR to ${offer.studentName}")
    }

    fun respondToOffer(offerId: String, accept: Boolean) {
        _offers.value = _offers.value.map {
            if (it.id == offerId) {
                val newStatus = if (accept) "ACCEPTED" else "DECLINED"
                if (accept) {
                    ProjectRepository.updateProjectStatus(it.projectId, ProjectStatus.IN_PROGRESS)
                }
                it.copy(status = newStatus)
            } else it
        }
    }
}

object SubmissionRepository {
    private val _submissions = MutableStateFlow<List<Submission>>(listOf(
        Submission(
            id = "sub-1",
            projectId = "proj-2",
            studentId = "student-1",
            version = 1,
            notes = "Initial delivery of the 4 tea pouch labels in vector PDF and AI formats, including print CMYK specs.",
            liveLink = "https://figma.com/file/sample-herbal-tea-packaging",
            status = "PENDING_REVIEW"
        )
    ))

    val submissions: StateFlow<List<Submission>> = _submissions.asStateFlow()

    fun submitDeliverable(projectId: String, studentId: String, notes: String, liveLink: String?): Result<Submission> {
        val currentVersions = _submissions.value.filter { it.projectId == projectId }.size
        val newSub = Submission(
            id = "sub-${System.currentTimeMillis()}",
            projectId = projectId,
            studentId = studentId,
            version = currentVersions + 1,
            notes = notes,
            liveLink = liveLink,
            status = "PENDING_REVIEW"
        )
        _submissions.value = listOf(newSub) + _submissions.value
        ProjectRepository.updateProjectStatus(projectId, ProjectStatus.SUBMITTED)
        AuditRepository.log(studentId, "Student", "DELIVERABLE_SUBMITTED", "Submitted version ${newSub.version} for project $projectId")
        return Result.success(newSub)
    }

    fun approveSubmission(submissionId: String, projectId: String): Result<Unit> {
        _submissions.value = _submissions.value.map {
            if (it.id == submissionId) it.copy(status = "APPROVED") else it
        }
        ProjectRepository.updateProjectStatus(projectId, ProjectStatus.COMPLETED)
        AuditRepository.log("business", "Business Client", "DELIVERABLE_APPROVED", "Approved submission $submissionId for project $projectId")
        return Result.success(Unit)
    }

    fun requestRevision(submissionId: String, projectId: String, feedback: String, maxAllowed: Int): Result<Unit> {
        val count = _submissions.value.count { it.projectId == projectId && it.status == "REVISION_REQUESTED" }
        if (count >= maxAllowed) {
            return Result.failure(IllegalStateException("Maximum agreed revision cycles ($maxAllowed) reached. Further modifications require a formal scope addendum."))
        }
        _submissions.value = _submissions.value.map {
            if (it.id == submissionId) it.copy(status = "REVISION_REQUESTED", revisionFeedback = feedback) else it
        }
        ProjectRepository.updateProjectStatus(projectId, ProjectStatus.REVISION_REQUESTED)
        AuditRepository.log("business", "Business Client", "REVISION_REQUESTED", "Requested revision with feedback: $feedback")
        return Result.success(Unit)
    }
}

object PaymentRepository {
    private val _payments = MutableStateFlow<List<PaymentRecord>>(listOf(
        PaymentRecord(
            id = "pay-1",
            projectId = "proj-3",
            projectTitle = "Next.js + Tailwind Marketing Landing Page",
            businessId = "business-1",
            studentId = "student-1",
            amountInr = 15000.0,
            status = PaymentStatus.PAID,
            paymentMethod = "UPI",
            transactionReferenceUtr = "UTR-HDFC-992182049182",
            notes = "Cleared immediately on GitHub PR approval"
        )
    ))

    val payments: StateFlow<List<PaymentRecord>> = _payments.asStateFlow()

    fun recordPayment(
        projectId: String,
        projectTitle: String,
        businessId: String,
        studentId: String,
        amountInr: Double,
        utr: String,
        method: String = "UPI"
    ): Result<PaymentRecord> {
        if (utr.isBlank()) {
            return Result.failure(IllegalArgumentException("Valid bank transaction reference (UTR) is required for audit traceability"))
        }
        val record = PaymentRecord(
            id = "pay-${System.currentTimeMillis()}",
            projectId = projectId,
            projectTitle = projectTitle,
            businessId = businessId,
            studentId = studentId,
            amountInr = amountInr,
            status = PaymentStatus.PAID,
            paymentMethod = method,
            transactionReferenceUtr = utr
        )
        _payments.value = listOf(record) + _payments.value
        AuditRepository.log(businessId, "Business", "PAYMENT_RECORDED", "Recorded ₹$amountInr INR paid to $studentId (UTR: $utr)")
        return Result.success(record)
    }
}

object ReviewRepository {
    private val _reviews = MutableStateFlow<List<VerifiedReview>>(listOf(
        VerifiedReview(
            id = "rev-1",
            projectId = "proj-3",
            projectTitle = "Next.js + Tailwind Marketing Landing Page",
            reviewerName = "Siddharth Menon (HyperFlow Labs)",
            rating = 5,
            comment = "Outstanding work by Aarav! Delivered ahead of schedule, fully responsive with perfect Lighthouse scores. Highly recommended.",
            verifiedDeliverableSummary = "Next.js 15 App Router landing page, Tailwind CSS components, GitHub PR merged."
        )
    ))

    val reviews: StateFlow<List<VerifiedReview>> = _reviews.asStateFlow()

    fun addReview(review: VerifiedReview) {
        _reviews.value = listOf(review) + _reviews.value
        AuditRepository.log("business", review.reviewerName, "REVIEW_SUBMITTED", "Submitted ${review.rating}-star review for project ${review.projectId}")
    }
}

object DisputeRepository {
    private val _disputes = MutableStateFlow<List<DisputeRecord>>(listOf(
        DisputeRecord(
            id = "disp-1",
            projectId = "proj-4",
            projectTitle = "Python Automation Script",
            raisedById = "student-1",
            raisedByName = "Aarav Sharma",
            reason = "Client requested additional uncontracted API mocks after scope freeze without budget adjustment.",
            status = "OPEN"
        )
    ))

    val disputes: StateFlow<List<DisputeRecord>> = _disputes.asStateFlow()

    fun resolveDispute(disputeId: String, resolutionNotes: String) {
        _disputes.value = _disputes.value.map {
            if (it.id == disputeId) it.copy(status = "RESOLVED", resolution = resolutionNotes) else it
        }
        AuditRepository.log("admin", "Platform Admin", "DISPUTE_RESOLVED", "Dispute $disputeId resolved: $resolutionNotes")
    }
}

object AuditRepository {
    private val _logs = MutableStateFlow<List<AuditLog>>(listOf(
        AuditLog("log-1", "admin-1", "admin@prooftopay.in", "PLATFORM_INIT", "Platform security policies active", "2026-10-09 10:00:00"),
        AuditLog("log-2", "business-1", "siddharth@hyperflow.ai", "BUSINESS_VERIFIED", "GSTIN 29AABCU9603R1ZM approved by admin", "2026-10-09 10:15:00"),
        AuditLog("log-3", "student-1", "aarav.sharma@dtu.ac.in", "PORTFOLIO_MINTED", "Completed Next.js project proof minted", "2026-10-09 11:00:00")
    ))

    val logs: StateFlow<List<AuditLog>> = _logs.asStateFlow()

    fun log(userId: String, email: String, action: String, details: String) {
        val entry = AuditLog(
            id = "log-${System.currentTimeMillis()}",
            userId = userId,
            userEmail = email,
            action = action,
            details = details,
            timestamp = java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss", java.util.Locale.getDefault()).format(java.util.Date())
        )
        _logs.value = listOf(entry) + _logs.value
    }
}

object ChatRepository {
    private val _conversations = MutableStateFlow<List<Conversation>>(listOf(
        Conversation(
            id = "conv-pre-1",
            conversationType = ConversationType.PRE_PROJECT,
            businessId = "business-1",
            businessName = "Siddharth Menon (HyperFlow Labs)",
            businessAvatarUrl = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&auto=format&fit=crop&q=80",
            creatorId = "student-1",
            creatorName = "Aarav Sharma",
            creatorAvatarUrl = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=240&auto=format&fit=crop&q=80",
            projectId = "proj-1",
            projectTitle = "Real-Time Telemetry Dashboard with React & Tailwind",
            status = "ACTIVE",
            createdBy = "business-1",
            lastMessageAt = "2026-09-02 11:45:00",
            lastMessageSnippet = "Sounds great! Looking forward to reviewing the milestone breakdown.",
            unreadCount = 0,
            createdAt = "2026-09-01 10:00:00",
            updatedAt = "2026-09-02 11:45:00"
        ),
        Conversation(
            id = "conv-proj-1",
            conversationType = ConversationType.PROJECT,
            businessId = "business-1",
            businessName = "Siddharth Menon (HyperFlow Labs)",
            businessAvatarUrl = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&auto=format&fit=crop&q=80",
            creatorId = "student-1",
            creatorName = "Aarav Sharma",
            creatorAvatarUrl = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=240&auto=format&fit=crop&q=80",
            projectId = "proj-1",
            projectTitle = "Real-Time Telemetry Dashboard with React & Tailwind",
            projectOfferId = "offer-1",
            status = "ACTIVE",
            createdBy = "business-1",
            lastMessageAt = "2026-09-03 15:30:00",
            lastMessageSnippet = "I have uploaded the initial wireframe specs. Please take a look.",
            unreadCount = 1,
            createdAt = "2026-09-03 09:00:00",
            updatedAt = "2026-09-03 15:30:00"
        )
    ))

    private val _messages = MutableStateFlow<Map<String, List<Message>>>(mapOf(
        "conv-pre-1" to listOf(
            Message(
                id = "msg-1",
                conversationId = "conv-pre-1",
                senderId = "business-1",
                senderName = "Siddharth Menon",
                senderRole = UserRole.BUSINESS,
                messageType = MessageType.TEXT,
                body = "Hi Aarav, loved your DTU telemetry portfolio project. Would you be open to building our live dashboard next week?",
                createdAt = "2026-09-01 10:05:00",
                updatedAt = "2026-09-01 10:05:00"
            ),
            Message(
                id = "msg-2",
                conversationId = "conv-pre-1",
                senderId = "student-1",
                senderName = "Aarav Sharma",
                senderRole = UserRole.STUDENT,
                messageType = MessageType.TEXT,
                body = "Hello Siddharth! Absolutely, I have experience with WebSockets and Chart.js. I can deliver the core milestone within 10 days.",
                createdAt = "2026-09-01 11:20:00",
                updatedAt = "2026-09-01 11:20:00"
            )
        ),
        "conv-proj-1" to listOf(
            Message(
                id = "msg-4",
                conversationId = "conv-proj-1",
                senderId = "business-1",
                senderName = "Siddharth Menon",
                senderRole = UserRole.BUSINESS,
                messageType = MessageType.TEXT,
                body = "Offer accepted! Welcome to the DevFlow Telemetry Dashboard project.",
                createdAt = "2026-09-03 09:05:00",
                updatedAt = "2026-09-03 09:05:00"
            ),
            Message(
                id = "msg-5",
                conversationId = "conv-proj-1",
                senderId = "student-1",
                senderName = "Aarav Sharma",
                senderRole = UserRole.STUDENT,
                messageType = MessageType.VOICE,
                body = "Voice update on API integration and chart component architecture.",
                attachments = listOf(
                    MessageAttachment(
                        id = "att-voice-1",
                        messageId = "msg-5",
                        conversationId = "conv-proj-1",
                        storagePath = "conv-proj-1/msg-5/voice_note.mp3",
                        fileName = "Voice_Note_Architecture.mp3",
                        fileSizeBytes = 184320L,
                        mimeType = "audio/mp3",
                        voiceDurationSeconds = 24,
                        createdAt = "2026-09-03 11:30:00"
                    )
                ),
                createdAt = "2026-09-03 11:30:00",
                updatedAt = "2026-09-03 11:30:00"
            )
        )
    ))

    val conversations: StateFlow<List<Conversation>> = _conversations.asStateFlow()

    fun getMessages(conversationId: String): List<Message> {
        return _messages.value[conversationId] ?: emptyList()
    }

    suspend fun fetchMessages(conversationId: String, limit: Int = 50): Result<List<Message>> {
        if (!SupabaseClientProvider.isConfigured) {
            val list = _messages.value[conversationId] ?: emptyList()
            return Result.success(list)
        }
        return try {
            val msgRows = SupabaseClientProvider.postgrest["messages"]
                .select(columns = Columns.ALL) {
                    filter {
                        eq("conversation_id", conversationId)
                    }
                    order("created_at", Order.ASCENDING)
                    limit(limit.toLong())
                }.decodeList<DbMessageRow>()

            val attRows = try {
                SupabaseClientProvider.postgrest["message_attachments"]
                    .select(columns = Columns.ALL) {
                        filter {
                            eq("conversation_id", conversationId)
                        }
                    }.decodeList<DbAttachmentRow>()
            } catch (_: Exception) {
                emptyList()
            }

            val attachmentsByMsgId = attRows.groupBy { it.messageId }
            val conv = _conversations.value.find { it.id == conversationId }

            val mappedMessages = msgRows.map { row ->
                val attachments = (attachmentsByMsgId[row.id] ?: emptyList()).map { att ->
                    val signedUrl = try {
                        SupabaseClientProvider.storage["chat_attachments"]
                            .createSignedUrl(att.storagePath, expiresIn = kotlin.time.Duration.parse("1h"))
                    } catch (_: Exception) {
                        null
                    }

                    MessageAttachment(
                        id = att.id,
                        messageId = att.messageId,
                        conversationId = att.conversationId,
                        storagePath = att.storagePath,
                        fileName = att.fileName,
                        fileSizeBytes = att.fileSizeBytes,
                        mimeType = att.mimeType,
                        voiceDurationSeconds = att.voiceDurationSeconds,
                        createdAt = att.createdAt,
                        downloadUrl = signedUrl
                    )
                }

                val msgType = try {
                    MessageType.valueOf(row.messageType)
                } catch (_: Exception) {
                    MessageType.TEXT
                }

                val (senderName, senderRole, senderAvatar) = when {
                    conv != null && row.senderId == conv.businessId -> Triple(conv.businessName, UserRole.BUSINESS, conv.businessAvatarUrl)
                    conv != null && row.senderId == conv.creatorId -> Triple(conv.creatorName, UserRole.STUDENT, conv.creatorAvatarUrl)
                    else -> Triple("Participant", null, null)
                }

                Message(
                    id = row.id,
                    conversationId = row.conversationId,
                    senderId = row.senderId,
                    senderName = senderName,
                    senderRole = senderRole,
                    senderAvatarUrl = senderAvatar,
                    messageType = msgType,
                    body = row.body,
                    attachments = attachments,
                    isDeleted = row.isDeleted,
                    createdAt = row.createdAt,
                    updatedAt = row.updatedAt
                )
            }

            val updatedMap = _messages.value.toMutableMap()
            updatedMap[conversationId] = mappedMessages
            _messages.value = updatedMap

            Result.success(mappedMessages)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun markConversationRead(conversationId: String, userId: String) {
        _conversations.value = _conversations.value.map {
            if (it.id == conversationId) it.copy(unreadCount = 0) else it
        }
    }

    fun subscribeToConversation(
        conversationId: String,
        scope: CoroutineScope,
        onNewMessage: (suspend () -> Unit)? = null
    ): () -> Unit {
        if (!SupabaseClientProvider.isConfigured) {
            return {}
        }
        val channel = SupabaseClientProvider.realtime.channel("chat:$conversationId")
        val changeFlow = channel.postgresChangeFlow<PostgresAction>(schema = "public") {
            table = "messages"
            filter = "conversation_id=eq.$conversationId"
        }
        val job = scope.launch(Dispatchers.IO) {
            changeFlow.collect {
                fetchMessages(conversationId)
                onNewMessage?.invoke()
            }
        }
        scope.launch(Dispatchers.IO) {
            try {
                channel.subscribe()
            } catch (_: Exception) {}
        }
        return {
            job.cancel()
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    channel.unsubscribe()
                    SupabaseClientProvider.realtime.removeChannel(channel)
                } catch (_: Exception) {}
            }
        }
    }

    suspend fun uploadAttachment(
        conversationId: String,
        fileBytes: ByteArray,
        fileName: String,
        mimeType: String,
        voiceDurationSeconds: Int? = null
    ): Result<MessageAttachment> {
        return try {
            val cleanName = fileName.replace(Regex("[^a-zA-Z0-9._-]"), "_")
            val storagePath = "conversations/$conversationId/${System.currentTimeMillis()}_$cleanName"
            val now = java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss", java.util.Locale.getDefault()).format(java.util.Date())

            val downloadUrl = if (SupabaseClientProvider.isConfigured) {
                val bucket = SupabaseClientProvider.client.storage["chat_attachments"]
                bucket.upload(storagePath, fileBytes) {
                    upsert = false
                }
                // Generate a short-lived signed URL for authenticated participant viewing
                bucket.createSignedUrl(storagePath, expiresIn = kotlin.time.Duration.parse("1h"))
            } else {
                null
            }

            val attachment = MessageAttachment(
                id = "att-${System.currentTimeMillis()}",
                messageId = "",
                conversationId = conversationId,
                storagePath = storagePath,
                fileName = fileName,
                fileSizeBytes = fileBytes.size.toLong(),
                mimeType = mimeType,
                voiceDurationSeconds = voiceDurationSeconds,
                createdAt = now,
                downloadUrl = downloadUrl
            )
            Result.success(attachment)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun sendMessage(
        conversationId: String,
        senderId: String,
        senderName: String,
        senderRole: UserRole,
        messageType: MessageType,
        body: String?,
        attachments: List<MessageAttachment> = emptyList()
    ): Result<Message> {
        val conv = _conversations.value.find { it.id == conversationId }
            ?: return Result.failure(IllegalArgumentException("Conversation not found"))
        if (conv.status != "ACTIVE") {
            return Result.failure(IllegalStateException("Conversation is not active"))
        }

        if (SupabaseClientProvider.isConfigured) {
            return try {
                val rpcParams = DbSendChatMessageParams(
                    conversationId = conversationId,
                    messageType = messageType.name,
                    body = body,
                    attachments = attachments.map {
                        DbRpcAttachmentInput(
                            storagePath = it.storagePath,
                            fileName = it.fileName,
                            fileSizeBytes = it.fileSizeBytes,
                            mimeType = it.mimeType,
                            voiceDurationSeconds = it.voiceDurationSeconds
                        )
                    }
                )

                val rpcResult = SupabaseClientProvider.postgrest.rpc(
                    function = "send_chat_message",
                    parameters = rpcParams
                ).decodeAs<DbSendChatMessageResult>()

                val savedAttachments = rpcResult.attachments.map { att ->
                    val originalAtt = attachments.find { it.storagePath == att.storagePath }
                    MessageAttachment(
                        id = att.id,
                        messageId = att.messageId,
                        conversationId = att.conversationId,
                        storagePath = att.storagePath,
                        fileName = att.fileName,
                        fileSizeBytes = att.fileSizeBytes,
                        mimeType = att.mimeType,
                        voiceDurationSeconds = att.voiceDurationSeconds,
                        createdAt = att.createdAt,
                        downloadUrl = originalAtt?.downloadUrl
                    )
                }

                val domainMsg = Message(
                    id = rpcResult.id,
                    conversationId = conversationId,
                    senderId = rpcResult.senderId,
                    senderName = senderName,
                    senderRole = senderRole,
                    senderAvatarUrl = if (senderRole == UserRole.BUSINESS) conv.businessAvatarUrl else conv.creatorAvatarUrl,
                    messageType = messageType,
                    body = rpcResult.body,
                    attachments = savedAttachments,
                    createdAt = rpcResult.createdAt,
                    updatedAt = rpcResult.updatedAt
                )

                val currentList = _messages.value[conversationId] ?: emptyList()
                val updatedMap = _messages.value.toMutableMap()
                updatedMap[conversationId] = currentList + domainMsg
                _messages.value = updatedMap

                _conversations.value = _conversations.value.map {
                    if (it.id == conversationId) {
                        it.copy(
                            lastMessageAt = rpcResult.createdAt,
                            lastMessageSnippet = if (messageType == MessageType.TEXT) (body ?: "") else if (messageType == MessageType.VOICE) "Voice Note" else "Attachment"
                        )
                    } else it
                }

                Result.success(domainMsg)
            } catch (e: Exception) {
                // If transactional RPC fails or rolls back, clean up any storage objects that were pre-uploaded
                for (att in attachments) {
                    if (att.storagePath.isNotBlank()) {
                        try {
                            SupabaseClientProvider.client.storage["chat_attachments"].delete(att.storagePath)
                        } catch (_: Exception) {}
                    }
                }
                Result.failure(e)
            }
        } else {
            val now = java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss", java.util.Locale.getDefault()).format(java.util.Date())
            val newMsg = Message(
                id = "msg-${System.currentTimeMillis()}",
                conversationId = conversationId,
                senderId = senderId,
                senderName = senderName,
                senderRole = senderRole,
                messageType = messageType,
                body = body,
                attachments = attachments,
                createdAt = now,
                updatedAt = now
            )

            val currentList = _messages.value[conversationId] ?: emptyList()
            val updatedMap = _messages.value.toMutableMap()
            updatedMap[conversationId] = currentList + newMsg
            _messages.value = updatedMap

            _conversations.value = _conversations.value.map {
                if (it.id == conversationId) {
                    it.copy(
                        lastMessageAt = now,
                        lastMessageSnippet = if (messageType == MessageType.TEXT) (body ?: "") else if (messageType == MessageType.VOICE) "Voice Note" else "Attachment"
                    )
                } else it
            }

            return Result.success(newMsg)
        }
    }

    fun getOrCreatePreProjectConversation(
        businessId: String,
        businessName: String,
        creatorId: String,
        creatorName: String,
        projectId: String?,
        projectTitle: String?
    ): Conversation {
        val existing = _conversations.value.find {
            it.conversationType == ConversationType.PRE_PROJECT && it.businessId == businessId && it.creatorId == creatorId && (projectId == null || it.projectId == projectId)
        }
        if (existing != null) return existing

        val now = java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss", java.util.Locale.getDefault()).format(java.util.Date())
        val newConv = Conversation(
            id = "conv-pre-${System.currentTimeMillis()}",
            conversationType = ConversationType.PRE_PROJECT,
            businessId = businessId,
            businessName = businessName,
            creatorId = creatorId,
            creatorName = creatorName,
            projectId = projectId,
            projectTitle = projectTitle,
            status = "ACTIVE",
            createdBy = businessId,
            lastMessageAt = now,
            lastMessageSnippet = "Inquiry thread started",
            unreadCount = 0,
            createdAt = now,
            updatedAt = now
        )
        _conversations.value = listOf(newConv) + _conversations.value
        return newConv
    }
}
