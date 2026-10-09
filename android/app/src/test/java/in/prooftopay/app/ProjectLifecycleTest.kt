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
        assertEquals(PaymentStatus.PAID, validUtrResult.getOrNull()?.status)
    }
}
