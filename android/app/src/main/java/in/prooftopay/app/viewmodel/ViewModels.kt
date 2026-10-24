package in.prooftopay.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import in.prooftopay.app.data.model.*
import in.prooftopay.app.data.repository.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class AuthViewModel : ViewModel() {
    val currentUser: StateFlow<UserProfile?> = AuthRepository.currentUser
    val studentProfile: StateFlow<StudentProfile> = AuthRepository.studentProfile
    val businessProfile: StateFlow<BusinessProfile> = AuthRepository.businessProfile

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    fun login(email: String, pass: String, onSuccess: (UserProfile) -> Unit) {
        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null
            val result = AuthRepository.login(email, pass)
            _isLoading.value = false
            result.onSuccess { user ->
                onSuccess(user)
            }.onFailure { err ->
                _errorMessage.value = err.message ?: "Authentication failed"
            }
        }
    }

    fun register(
        name: String,
        email: String,
        pass: String,
        role: UserRole,
        age: Int,
        city: String,
        onSuccess: (UserProfile) -> Unit
    ) {
        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null
            val result = AuthRepository.register(name, email, pass, role, age, city)
            _isLoading.value = false
            result.onSuccess { user ->
                onSuccess(user)
            }.onFailure { err ->
                _errorMessage.value = err.message ?: "Registration failed"
            }
        }
    }

    fun resetPassword(email: String, onSuccess: () -> Unit, onError: (String) -> Unit) {
        viewModelScope.launch {
            _isLoading.value = true
            val result = AuthRepository.resetPassword(email)
            _isLoading.value = false
            result.onSuccess { onSuccess() }.onFailure { onError(it.message ?: "Error sending reset email") }
        }
    }

    fun updateStudentProfile(updated: StudentProfile) {
        AuthRepository.updateStudentProfile(updated)
    }

    fun submitBusinessVerification(legalEntity: String, docType: String, docNumber: String) {
        AuthRepository.submitBusinessVerification(legalEntity, docType, docNumber)
    }

    fun submitStudentVerification(
        docType: String,
        docNumber: String,
        collegeEmail: String? = null,
        onSuccess: () -> Unit = {},
        onError: (String) -> Unit = {}
    ) {
        val result = AuthRepository.submitStudentVerification(docType, docNumber, collegeEmail)
        result.onSuccess { onSuccess() }.onFailure { onError(it.message ?: "Failed to submit verification") }
    }

    fun switchRoleDemo(user: UserProfile) {
        AuthRepository.switchUser(user)
    }

    fun deleteAccount(onSuccess: () -> Unit) {
        val result = AuthRepository.deleteAccount()
        result.onSuccess { onSuccess() }
    }

    fun logout() {
        AuthRepository.logout()
    }
}

class CreatorViewModel : ViewModel() {
    val projects: StateFlow<List<Project>> = ProjectRepository.projects
    val applications: StateFlow<List<Application>> = ApplicationRepository.applications
    val offers: StateFlow<List<ProjectOffer>> = OfferRepository.offers
    val submissions: StateFlow<List<Submission>> = SubmissionRepository.submissions
    val payments: StateFlow<List<PaymentRecord>> = PaymentRepository.payments
    val reviews: StateFlow<List<VerifiedReview>> = ReviewRepository.reviews

    private val _selectedCategory = MutableStateFlow("ALL")
    val selectedCategory: StateFlow<String> = _selectedCategory.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    fun setCategory(cat: String) {
        _selectedCategory.value = cat
    }

    fun setSearchQuery(query: String) {
        _searchQuery.value = query
    }

    fun applyToProject(
        project: Project,
        student: UserProfile,
        pitch: String,
        days: Int,
        sampleUrl: String,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        val app = Application(
            id = "app-${System.currentTimeMillis()}",
            projectId = project.id,
            projectTitle = project.title,
            studentId = student.id,
            studentName = student.name,
            pitchMessage = pitch,
            portfolioSamples = listOf(PortfolioSample("Sample Work", sampleUrl)),
            proposedDeliveryDays = days,
            status = ApplicationStatus.PENDING
        )
        val result = ApplicationRepository.apply(app)
        result.onSuccess {
            onSuccess()
        }.onFailure { err ->
            onError(err.message ?: "Could not apply")
        }
    }

    fun submitDeliverable(
        projectId: String,
        studentId: String,
        notes: String,
        liveLink: String?,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        val result = SubmissionRepository.submitDeliverable(projectId, studentId, notes, liveLink)
        result.onSuccess { onSuccess() }.onFailure { onError(it.message ?: "Failed to submit deliverable") }
    }

    fun respondToOffer(offerId: String, accept: Boolean) {
        OfferRepository.respondToOffer(offerId, accept)
    }

    private val _confirmingPaymentIds = MutableStateFlow<Set<String>>(emptySet())
    val confirmingPaymentIds: StateFlow<Set<String>> = _confirmingPaymentIds.asStateFlow()

    fun confirmPaymentReceipt(
        paymentId: String,
        studentId: String,
        onSuccess: () -> Unit = {},
        onError: (String) -> Unit = {}
    ) {
        if (_confirmingPaymentIds.value.contains(paymentId)) return
        _confirmingPaymentIds.value = _confirmingPaymentIds.value + paymentId
        viewModelScope.launch {
            try {
                val result = PaymentRepository.confirmReceiptRemote(paymentId, studentId)
                result.onSuccess { onSuccess() }.onFailure { onError(it.message ?: "Failed to confirm payment receipt") }
            } finally {
                _confirmingPaymentIds.value = _confirmingPaymentIds.value - paymentId
            }
        }
    }

    fun disputePayment(
        paymentId: String,
        studentId: String,
        reason: String,
        onSuccess: () -> Unit = {},
        onError: (String) -> Unit = {}
    ) {
        val result = PaymentRepository.disputePayment(paymentId, studentId, reason)
        result.onSuccess { onSuccess() }.onFailure { onError(it.message ?: "Failed to dispute payment") }
    }
}

class BusinessViewModel : ViewModel() {
    val projects: StateFlow<List<Project>> = ProjectRepository.projects
    val applications: StateFlow<List<Application>> = ApplicationRepository.applications
    val offers: StateFlow<List<ProjectOffer>> = OfferRepository.offers
    val submissions: StateFlow<List<Submission>> = SubmissionRepository.submissions
    val payments: StateFlow<List<PaymentRecord>> = PaymentRepository.payments
    val reviews: StateFlow<List<VerifiedReview>> = ReviewRepository.reviews

    fun createProject(
        business: UserProfile,
        title: String,
        summary: String,
        desc: String,
        category: String,
        skills: List<String>,
        budgetInr: Double,
        days: Int,
        revisions: Int,
        paymentTerms: String,
        onSuccess: () -> Unit
    ) {
        val newProj = Project(
            id = "proj-${System.currentTimeMillis()}",
            businessId = business.id,
            businessName = business.name,
            businessCity = business.city ?: "India",
            title = title,
            summary = summary,
            description = desc,
            category = category,
            requiredSkills = skills,
            budgetInr = budgetInr,
            deadlineDays = days,
            expectedDeliveryDate = "2026-10-31",
            permittedRevisions = revisions,
            paymentTerms = paymentTerms,
            status = ProjectStatus.PENDING_REVIEW
        )
        ProjectRepository.addProject(newProj)
        onSuccess()
    }

    fun shortlistApplication(appId: String) {
        ApplicationRepository.updateStatus(appId, ApplicationStatus.SHORTLISTED)
    }

    fun extendOffer(
        projectId: String,
        projectTitle: String,
        businessId: String,
        businessName: String,
        studentId: String,
        studentName: String,
        agreedBudget: Double,
        agreedDeadline: String,
        agreedRevisions: Int,
        scopeSummary: String
    ) {
        val offer = ProjectOffer(
            id = "offer-${System.currentTimeMillis()}",
            projectId = projectId,
            projectTitle = projectTitle,
            businessId = businessId,
            businessName = businessName,
            studentId = studentId,
            studentName = studentName,
            agreedBudgetInr = agreedBudget,
            agreedDeadline = agreedDeadline,
            agreedRevisions = agreedRevisions,
            scopeSummary = scopeSummary,
            status = "PENDING"
        )
        OfferRepository.createOffer(offer)
    }

    fun approveSubmission(submissionId: String, projectId: String) {
        SubmissionRepository.approveSubmission(submissionId, projectId)
    }

    fun requestRevision(
        submissionId: String,
        projectId: String,
        feedback: String,
        maxAllowed: Int,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        val result = SubmissionRepository.requestRevision(submissionId, projectId, feedback, maxAllowed)
        result.onSuccess { onSuccess() }.onFailure { onError(it.message ?: "Failed to request revision") }
    }

    fun recordPayment(
        projectId: String,
        projectTitle: String,
        businessId: String,
        studentId: String,
        amountInr: Double,
        utr: String,
        method: String,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        val result = PaymentRepository.recordPayment(projectId, projectTitle, businessId, studentId, amountInr, utr, method)
        result.onSuccess { onSuccess() }.onFailure { onError(it.message ?: "Failed to record payment") }
    }

    fun submitReview(review: VerifiedReview) {
        ReviewRepository.addReview(review)
    }
}

class AdminViewModel : ViewModel() {
    val projects: StateFlow<List<Project>> = ProjectRepository.projects
    val applications: StateFlow<List<Application>> = ApplicationRepository.applications
    val disputes: StateFlow<List<DisputeRecord>> = DisputeRepository.disputes
    val auditLogs: StateFlow<List<AuditLog>> = AuditRepository.logs

    fun approveProject(projectId: String) {
        ProjectRepository.updateProjectStatus(projectId, ProjectStatus.APPROVED)
    }

    fun rejectProject(projectId: String, reason: String) {
        ProjectRepository.updateProjectStatus(projectId, ProjectStatus.CANCELLED, reason)
    }

    fun resolveDispute(disputeId: String, resolutionNotes: String) {
        DisputeRepository.resolveDispute(disputeId, resolutionNotes)
    }
}

class ChatViewModel : ViewModel() {
    val conversations: StateFlow<List<Conversation>> = ChatRepository.conversations

    private val _activeConversation = MutableStateFlow<Conversation?>(null)
    val activeConversation: StateFlow<Conversation?> = _activeConversation.asStateFlow()

    private val _messages = MutableStateFlow<List<Message>>(emptyList())
    val messages: StateFlow<List<Message>> = _messages.asStateFlow()

    private val _isLoadingMessages = MutableStateFlow(false)
    val isLoadingMessages: StateFlow<Boolean> = _isLoadingMessages.asStateFlow()

    private val _isSending = MutableStateFlow(false)
    val isSending: StateFlow<Boolean> = _isSending.asStateFlow()

    private val _isUploading = MutableStateFlow(false)
    val isUploading: StateFlow<Boolean> = _isUploading.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    private var activeSubscriptionCleanup: (() -> Unit)? = null

    fun clearError() {
        _errorMessage.value = null
    }

    fun selectConversation(conversationId: String, currentUserId: String? = null) {
        val conv = conversations.value.find { it.id == conversationId }
        _activeConversation.value = conv
        _messages.value = ChatRepository.getMessages(conversationId)
        if (currentUserId != null) {
            ChatRepository.markConversationRead(conversationId, currentUserId)
        }

        activeSubscriptionCleanup?.invoke()
        activeSubscriptionCleanup = null

        viewModelScope.launch {
            _isLoadingMessages.value = true
            val fetchRes = ChatRepository.fetchMessages(conversationId)
            _isLoadingMessages.value = false
            fetchRes.onSuccess { msgs ->
                _messages.value = msgs
            }.onFailure { err ->
                if (SupabaseClientProvider.isConfigured) {
                    _errorMessage.value = "Failed to sync messages: ${err.message}"
                }
            }

            activeSubscriptionCleanup = ChatRepository.subscribeToConversation(
                conversationId = conversationId,
                scope = viewModelScope,
                onNewMessage = {
                    _messages.value = ChatRepository.getMessages(conversationId)
                }
            )
        }
    }

    fun leaveConversation(conversationId: String) {
        activeSubscriptionCleanup?.invoke()
        activeSubscriptionCleanup = null
    }

    override fun onCleared() {
        activeSubscriptionCleanup?.invoke()
        activeSubscriptionCleanup = null
        super.onCleared()
    }

    fun sendMessage(conversationId: String, sender: UserProfile, text: String) {
        if (text.isBlank()) return
        if (sender.isSuspended) {
            _errorMessage.value = "Your account is currently suspended. Messaging is disabled."
            return
        }

        viewModelScope.launch {
            _isSending.value = true
            _errorMessage.value = null
            val res = ChatRepository.sendMessage(
                conversationId = conversationId,
                senderId = sender.id,
                senderName = sender.name,
                senderRole = sender.role,
                messageType = MessageType.TEXT,
                body = text.trim()
            )
            _isSending.value = false
            if (res.isSuccess) {
                _messages.value = ChatRepository.getMessages(conversationId)
            } else {
                _errorMessage.value = res.exceptionOrNull()?.message ?: "Failed to send message."
            }
        }
    }

    fun sendRealVoiceNote(
        conversationId: String,
        sender: UserProfile,
        audioBytes: ByteArray,
        durationSeconds: Int,
        fileName: String = "VoiceNote_${System.currentTimeMillis()}.m4a"
    ) {
        if (sender.isSuspended) {
            _errorMessage.value = "Your account is currently suspended. Voice messaging is disabled."
            return
        }
        if (durationSeconds <= 0 || durationSeconds > 180) {
            _errorMessage.value = "Voice note duration must be between 1 and 180 seconds."
            return
        }

        viewModelScope.launch {
            _isUploading.value = true
            _errorMessage.value = null
            val uploadRes = ChatRepository.uploadAttachment(
                conversationId = conversationId,
                fileBytes = audioBytes,
                fileName = fileName,
                mimeType = "audio/mp4",
                voiceDurationSeconds = durationSeconds
            )
            _isUploading.value = false

            uploadRes.onSuccess { attachment ->
                val sendRes = ChatRepository.sendMessage(
                    conversationId = conversationId,
                    senderId = sender.id,
                    senderName = sender.name,
                    senderRole = sender.role,
                    messageType = MessageType.VOICE,
                    body = "Voice note (${durationSeconds}s)",
                    attachments = listOf(attachment)
                )
                if (sendRes.isSuccess) {
                    _messages.value = ChatRepository.getMessages(conversationId)
                } else {
                    _errorMessage.value = sendRes.exceptionOrNull()?.message ?: "Failed to record voice message."
                }
            }.onFailure { err ->
                _errorMessage.value = err.message ?: "Failed to upload voice note."
            }
        }
    }

    fun sendAttachment(
        conversationId: String,
        sender: UserProfile,
        fileBytes: ByteArray,
        fileName: String,
        mimeType: String
    ) {
        if (sender.isSuspended) {
            _errorMessage.value = "Your account is currently suspended. File uploads are disabled."
            return
        }
        if (fileBytes.size > 20 * 1024 * 1024) {
            _errorMessage.value = "File size exceeds 20 MB limit."
            return
        }

        viewModelScope.launch {
            _isUploading.value = true
            _errorMessage.value = null
            val isImage = mimeType.startsWith("image/")
            val messageType = if (isImage) MessageType.IMAGE else MessageType.FILE

            val uploadRes = ChatRepository.uploadAttachment(
                conversationId = conversationId,
                fileBytes = fileBytes,
                fileName = fileName,
                mimeType = mimeType
            )
            _isUploading.value = false

            uploadRes.onSuccess { attachment ->
                val sendRes = ChatRepository.sendMessage(
                    conversationId = conversationId,
                    senderId = sender.id,
                    senderName = sender.name,
                    senderRole = sender.role,
                    messageType = messageType,
                    body = if (isImage) null else fileName,
                    attachments = listOf(attachment)
                )
                if (sendRes.isSuccess) {
                    _messages.value = ChatRepository.getMessages(conversationId)
                } else {
                    _errorMessage.value = sendRes.exceptionOrNull()?.message ?: "Failed to deliver attachment."
                }
            }.onFailure { err ->
                _errorMessage.value = err.message ?: "Failed to upload attachment."
            }
        }
    }

    fun startPreProjectChat(
        businessId: String,
        businessName: String,
        creatorId: String,
        creatorName: String,
        projectId: String?,
        projectTitle: String?
    ): String {
        val conv = ChatRepository.getOrCreatePreProjectConversation(
            businessId = businessId,
            businessName = businessName,
            creatorId = creatorId,
            creatorName = creatorName,
            projectId = projectId,
            projectTitle = projectTitle
        )
        selectConversation(conv.id)
        return conv.id
    }
}
