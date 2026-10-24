package in.prooftopay.app

import in.prooftopay.app.data.model.*
import in.prooftopay.app.data.repository.*
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test

class ProjectLifecycleTest {

    @Test
    fun testUnder18StudentRegistrationRejected() = runBlocking {
        val result = AuthRepository.register(
            nameInput = "Underage Student",
            emailInput = "underage@example.com",
            passwordInput = "secure123",
            roleInput = UserRole.STUDENT,
            ageInput = 17, // Under 18 policy check
            cityInput = "Mumbai"
        )
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull()?.message?.contains("18") == true)
    }

    @Test
    fun testAdultStudentRegistrationAccepted() = runBlocking {
        val result = AuthRepository.register(
            nameInput = "Adult Student",
            emailInput = "adult@example.com",
            passwordInput = "secure123",
            roleInput = UserRole.STUDENT,
            ageInput = 20,
            cityInput = "Bengaluru"
        )
        assertTrue(result.isSuccess)
        assertEquals(UserRole.STUDENT, result.getOrNull()?.role)
    }

    @Test
    fun testPreventDuplicateProjectApplications() {
        val app1 = Application(
            id = "test-app-1",
            projectId = "proj-1",
            projectTitle = "Figma Mobile App",
            studentId = "student-test-unique",
            studentName = "Test Creator",
            pitchMessage = "Experienced with Figma design systems"
        )
        val res1 = ApplicationRepository.apply(app1)
        assertTrue(res1.isSuccess)

        // Attempt second application from same student to same project
        val app2 = app1.copy(id = "test-app-2", pitchMessage = "Duplicate attempt")
        val res2 = ApplicationRepository.apply(app2)
        assertTrue(res2.isFailure)
        assertTrue(res2.exceptionOrNull()?.message?.contains("already applied") == true)
    }

    @Test
    fun testProjectStatusTransitionLifecycle() {
        val proj = Project(
            id = "test-proj-lifecycle",
            businessId = "biz-1",
            businessName = "HyperFlow",
            businessCity = "Bengaluru",
            title = "Test Lifecycle Project",
            summary = "Summary test",
            description = "Detailed scope",
            category = "UI/UX",
            budgetInr = 15000.0,
            deadlineDays = 7,
            expectedDeliveryDate = "2026-10-25",
            paymentTerms = "100% on completion",
            status = ProjectStatus.DRAFT
        )
        ProjectRepository.addProject(proj)

        // Moderation approve
        ProjectRepository.updateProjectStatus(proj.id, ProjectStatus.APPROVED)
        val updated = ProjectRepository.projects.value.find { it.id == proj.id }
        assertEquals(ProjectStatus.APPROVED, updated?.status)
    }

    @Test
    fun testPermittedRevisionLimitEnforcement() {
        val projectId = "test-proj-revisions"
        val maxRevisions = 2

        // Simulate 2 revisions requested
        SubmissionRepository.submitDeliverable(projectId, "student-1", "V1 initial", null)
        val sub1 = SubmissionRepository.submissions.value.first { it.projectId == projectId }
        val rev1 = SubmissionRepository.requestRevision(sub1.id, projectId, "Fix alignment", maxRevisions)
        assertTrue(rev1.isSuccess)

        val sub2 = SubmissionRepository.submissions.value.first { it.projectId == projectId }
        val rev2 = SubmissionRepository.requestRevision(sub2.id, projectId, "Fix font size", maxRevisions)
        assertTrue(rev2.isSuccess)

        // 3rd revision exceeds max limit
        val sub3 = SubmissionRepository.submissions.value.first { it.projectId == projectId }
        val rev3 = SubmissionRepository.requestRevision(sub3.id, projectId, "Excess revision", maxRevisions)
        assertTrue(rev3.isFailure)
        assertTrue(rev3.exceptionOrNull()?.message?.contains("Maximum agreed revision cycles") == true)
    }

    @Test
    fun testPaymentRecordingRequiresValidUtr() {
        val emptyUtrResult = PaymentRepository.recordPayment(
            projectId = "proj-1",
            projectTitle = "Figma Mobile App",
            businessId = "business-1",
            studentId = "student-1",
            amountInr = 18000.0,
            utr = "" // Empty UTR should fail
        )
        assertTrue(emptyUtrResult.isFailure)

        val validUtrResult = PaymentRepository.recordPayment(
            projectId = "proj-1",
            projectTitle = "Figma Mobile App",
            businessId = "business-1",
            studentId = "student-1",
            amountInr = 18000.0,
            utr = "UTR-HDFC-882194819234"
        )
        assertTrue(validUtrResult.isSuccess)
        // Two-phase workflow: UTR reporting sets status to REPORTED_BY_BUSINESS (not directly PAID)
        assertEquals(PaymentStatus.REPORTED_BY_BUSINESS, validUtrResult.getOrNull()?.status)
    }

    @Test
    fun testPaymentReceiptConfirmedByCreatorReleasesEarnings() {
        val initialProfile = AuthRepository.studentProfile.value
        val initialEarnings = initialProfile.totalEarnedInr
        val initialCompleted = initialProfile.completedProjectsCount

        // 1. Business reports UTR payment
        val payResult = PaymentRepository.recordPayment(
            projectId = "proj-2-lifecycle",
            projectTitle = "Brand Identity Kit",
            businessId = "business-1",
            studentId = initialProfile.userId,
            amountInr = 12000.0,
            utr = "UTR-AXIS-992140192381"
        )
        assertTrue(payResult.isSuccess)
        val paymentRecord = payResult.getOrNull()!!
        assertEquals(PaymentStatus.REPORTED_BY_BUSINESS, paymentRecord.status)

        // 2. Earnings must NOT be released before creator confirmation
        assertEquals(initialEarnings, AuthRepository.studentProfile.value.totalEarnedInr, 0.01)

        // 3. Unauthorized student cannot confirm receipt
        val unauthorizedConfirm = PaymentRepository.confirmReceipt(paymentRecord.id, "unauthorized-student-99")
        assertTrue(unauthorizedConfirm.isFailure)

        // 4. Assigned creator confirms receipt
        val confirmedResult = PaymentRepository.confirmReceipt(paymentRecord.id, initialProfile.userId)
        assertTrue(confirmedResult.isSuccess)
        val updatedPayment = confirmedResult.getOrNull()!!
        assertEquals(PaymentStatus.RECEIPT_CONFIRMED_BY_CREATOR, updatedPayment.status)
        assertEquals(initialProfile.userId, updatedPayment.confirmedById)
        assertNotNull(updatedPayment.confirmedAt)

        // 5. Authoritative balance releases only now
        val updatedProfile = AuthRepository.studentProfile.value
        assertEquals(initialEarnings + 12000.0, updatedProfile.totalEarnedInr, 0.01)
        assertEquals(initialCompleted + 1, updatedProfile.completedProjectsCount)
    }

    @Test
    fun testPaymentDisputeLifecycle() {
        val payResult = PaymentRepository.recordPayment(
            projectId = "proj-dispute-test",
            projectTitle = "Next.js Bug Fix",
            businessId = "business-2",
            studentId = "student-1",
            amountInr = 5000.0,
            utr = "UTR-HDFC-001294819201"
        )
        val payment = payResult.getOrNull()!!

        // Student creator disputes uncredited transaction
        val disputeResult = PaymentRepository.disputePayment(
            paymentId = payment.id,
            studentId = "student-1",
            reason = "UTR was rejected by receiving bank; funds never credited."
        )
        assertTrue(disputeResult.isSuccess)
        val disputedPayment = disputeResult.getOrNull()!!
        assertEquals(PaymentStatus.DISPUTED, disputedPayment.status)
        assertTrue(disputedPayment.disputeReason?.contains("rejected by receiving bank") == true)

        // Verifies dispute record created
        val activeDisputes = DisputeRepository.disputes.value
        val matchingDispute = activeDisputes.find { it.projectId == "proj-dispute-test" }
        assertNotNull(matchingDispute)
        assertEquals("OPEN", matchingDispute?.status)
    }

    @Test
    fun testStudentVerificationSubmissionFlow() {
        val result = AuthRepository.submitStudentVerification(
            docType = "COLLEGE_STUDENT_ID",
            docNumber = "DTU-2024-CS-9912",
            collegeEmail = "creator.test@dtu.ac.in"
        )
        assertTrue(result.isSuccess)
        val profile = AuthRepository.studentProfile.value

        // Submitting verification moves status to PENDING, never automatically VERIFIED
        assertEquals(VerificationStatus.PENDING, profile.verificationStatus)
        assertEquals("COLLEGE_STUDENT_ID", profile.verificationDocType)
        assertEquals("DTU-2024-CS-9912", profile.verificationDocNumber)
        assertEquals("creator.test@dtu.ac.in", profile.collegeEmail)
        assertNotNull(profile.verificationSubmittedAt)
    }

    @Test
    fun testConfirmReceiptRemoteDemoFallbackAndStats() = runBlocking {
        val studentId = AuthRepository.studentProfile.value.userId
        val initialEarnings = AuthRepository.studentProfile.value.totalEarnedInr
        val initialCompleted = AuthRepository.studentProfile.value.completedProjectsCount

        val payResult = PaymentRepository.recordPayment(
            projectId = "proj-remote-test",
            projectTitle = "Telemetry Dashboard",
            businessId = "business-1",
            studentId = studentId,
            amountInr = 14000.0,
            utr = "UTR-HDFC-991122334455"
        )
        val payment = payResult.getOrNull()!!

        // Calling confirmReceiptRemote when Supabase is not configured delegates safely to demo path
        val confirmResult = PaymentRepository.confirmReceiptRemote(payment.id, studentId)
        assertTrue(confirmResult.isSuccess)
        val confirmedPayment = confirmResult.getOrNull()!!
        assertEquals(PaymentStatus.RECEIPT_CONFIRMED_BY_CREATOR, confirmedPayment.status)

        // Verifies stats increment exactly once
        val updatedProfile = AuthRepository.studentProfile.value
        assertEquals(initialEarnings + 14000.0, updatedProfile.totalEarnedInr, 0.01)
        assertEquals(initialCompleted + 1, updatedProfile.completedProjectsCount)
    }

    @Test
    fun testRepeatedConfirmationBlockedAndDoesNotDoubleCredit() = runBlocking {
        val studentId = AuthRepository.studentProfile.value.userId

        val payResult = PaymentRepository.recordPayment(
            projectId = "proj-dup-test",
            projectTitle = "Mobile Redesign",
            businessId = "business-1",
            studentId = studentId,
            amountInr = 8000.0,
            utr = "UTR-SBI-776655443322"
        )
        val payment = payResult.getOrNull()!!

        // First confirmation succeeds
        val res1 = PaymentRepository.confirmReceiptRemote(payment.id, studentId)
        assertTrue(res1.isSuccess)
        val earningsAfterFirst = AuthRepository.studentProfile.value.totalEarnedInr

        // Second confirmation must fail
        val res2 = PaymentRepository.confirmReceiptRemote(payment.id, studentId)
        assertTrue(res2.isFailure)
        assertTrue(res2.exceptionOrNull()?.message?.contains("Payment cannot be confirmed in current status") == true)

        // Ensure earnings did NOT increase twice
        assertEquals(earningsAfterFirst, AuthRepository.studentProfile.value.totalEarnedInr, 0.01)
    }

    @Test
    fun testDisputedPaymentCannotBeConfirmed() = runBlocking {
        val studentId = AuthRepository.studentProfile.value.userId

        val payResult = PaymentRepository.recordPayment(
            projectId = "proj-dispute-block-test",
            projectTitle = "Vector Art",
            businessId = "business-1",
            studentId = studentId,
            amountInr = 6000.0,
            utr = "UTR-ICICI-00112233"
        )
        val payment = payResult.getOrNull()!!

        // Dispute payment
        PaymentRepository.disputePayment(payment.id, studentId, "Transaction bounced")

        // Attempt confirmation on disputed payment
        val confirmAttempt = PaymentRepository.confirmReceiptRemote(payment.id, studentId)
        assertTrue(confirmAttempt.isFailure)
        assertTrue(confirmAttempt.exceptionOrNull()?.message?.contains("current status: DISPUTED") == true)
    }
}

