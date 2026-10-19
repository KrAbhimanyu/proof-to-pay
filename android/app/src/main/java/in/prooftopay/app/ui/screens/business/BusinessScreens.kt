package in.prooftopay.app.ui.screens.business

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import in.prooftopay.app.data.model.*
import in.prooftopay.app.theme.*
import in.prooftopay.app.ui.components.BusinessBottomBar
import in.prooftopay.app.ui.components.ProofTopBar
import in.prooftopay.app.ui.components.ThemeSelectorCard
import in.prooftopay.app.viewmodel.AuthViewModel
import in.prooftopay.app.viewmodel.BusinessViewModel

@Composable
fun BusinessHomeScreen(
    currentUser: UserProfile,
    businessViewModel: BusinessViewModel,
    onNavigateToCreate: () -> Unit,
    onNavigateToApplicants: () -> Unit,
    onNavigateToReview: (String) -> Unit,
    onNavigateToSettings: () -> Unit,
    onLogout: () -> Unit
) {
    val projects by businessViewModel.projects.collectAsState()
    val myProjects = projects.filter { it.businessId == currentUser.id }
    val applications by businessViewModel.applications.collectAsState()
    val myApplicantsCount = applications.count { app -> myProjects.any { p -> p.id == app.projectId } }

    Scaffold(
        topBar = {
            ProofTopBar(
                title = "Business Portal",
                actions = {
                    IconButton(onClick = onNavigateToSettings) {
                        Icon(Icons.Default.VerifiedUser, contentDescription = "Verification")
                    }
                    IconButton(onClick = onLogout) {
                        Icon(Icons.Default.ExitToApp, contentDescription = "Logout")
                    }
                }
            )
        },
        bottomBar = {
            BusinessBottomBar(
                currentRoute = "business_home",
                onNavigate = { route ->
                    when (route) {
                        "create_project" -> onNavigateToCreate()
                        "manage_applicants" -> onNavigateToApplicants()
                        "business_settings" -> onNavigateToSettings()
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = onNavigateToCreate,
                containerColor = Emerald600,
                contentColor = Color.White
            ) {
                Icon(Icons.Default.Add, contentDescription = "Post Project")
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = Navy900,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Text(
                            text = currentUser.name,
                            style = MaterialTheme.typography.headlineMedium,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color.White
                        )
                        Text(
                            text = "GSTIN/CIN Verified Business · ${currentUser.city ?: "Bengaluru"}",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Emerald500
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text("Total Spent", style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                                Text("₹30,000 INR", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black, color = Color.White)
                            }
                            Column {
                                Text("Projects Posted", style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                                Text("${myProjects.size}", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black, color = Color.White)
                            }
                            Column {
                                Text("Total Applicants", style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                                Text("$myApplicantsCount", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black, color = Emerald500)
                            }
                        }
                    }
                }
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "My Project Listings (${myProjects.size})",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    TextButton(onClick = onNavigateToApplicants) {
                        Text("View Proposals ($myApplicantsCount)", color = Indigo600)
                    }
                }
            }

            if (myProjects.isEmpty()) {
                item {
                    Text("No projects posted yet. Tap the '+' button to post your first project.", color = TextSecondary)
                }
            } else {
                items(myProjects) { proj ->
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Surface(
                                    color = when (proj.status) {
                                        ProjectStatus.APPROVED -> Emerald100
                                        ProjectStatus.IN_PROGRESS -> Indigo100
                                        ProjectStatus.SUBMITTED -> Rose100
                                        ProjectStatus.COMPLETED -> Emerald100
                                        else -> BorderLight
                                    },
                                    shape = RoundedCornerShape(6.dp)
                                ) {
                                    Text(
                                        text = proj.status.name,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = when (proj.status) {
                                            ProjectStatus.APPROVED -> Emerald700
                                            ProjectStatus.IN_PROGRESS -> Indigo600
                                            ProjectStatus.SUBMITTED -> Rose600
                                            ProjectStatus.COMPLETED -> Emerald700
                                            else -> TextPrimary
                                        }
                                    )
                                }
                                Text("₹${proj.budgetInr.toInt()} INR", fontWeight = FontWeight.Black, color = Emerald600)
                            }

                            Spacer(modifier = Modifier.height(8.dp))
                            Text(proj.title, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                            Text(proj.summary, style = MaterialTheme.typography.bodySmall, color = TextSecondary, maxLines = 2)

                            if (proj.status == ProjectStatus.SUBMITTED || proj.status == ProjectStatus.IN_PROGRESS) {
                                Spacer(modifier = Modifier.height(10.dp))
                                Button(
                                    onClick = { onNavigateToReview(proj.id) },
                                    shape = RoundedCornerShape(10.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = Indigo600)
                                ) {
                                    Icon(Icons.Default.RateReview, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Review Deliverables & Payout", fontSize = 12.sp)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun CreateProjectScreen(
    currentUser: UserProfile,
    businessViewModel: BusinessViewModel,
    onNavigateBack: () -> Unit,
    onProjectCreated: () -> Unit
) {
    var title by remember { mutableStateOf("") }
    var summary by remember { mutableStateOf("") }
    var desc by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("UI/UX & Product Design") }
    var skills by remember { mutableStateOf("Figma, UI/UX Design, Mobile App") }
    var budget by remember { mutableStateOf("15000") }
    var days by remember { mutableStateOf("7") }
    var revisions by remember { mutableStateOf("2") }
    var paymentTerms by remember { mutableStateOf("100% paid upon verified delivery and sign-off.") }
    var validationError by remember { mutableStateOf<String?>(null) }

    val categories = listOf("UI/UX & Product Design", "Brand Identity & Packaging", "Web & Mobile Development", "Engineering & Automation")

    Scaffold(
        topBar = { ProofTopBar(title = "Post Project Listing", onBackClick = onNavigateBack) }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Text("Clear scope protects both you and emerging talent.", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)

            if (validationError != null) {
                Surface(
                    color = Rose100,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(validationError!!, color = Rose600, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(12.dp))
                }
            }

            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                label = { Text("Project Title") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                singleLine = true
            )

            OutlinedTextField(
                value = summary,
                onValueChange = { summary = it },
                label = { Text("One-line Summary") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                singleLine = true
            )

            OutlinedTextField(
                value = desc,
                onValueChange = { desc = it },
                label = { Text("Detailed Scope & Acceptance Criteria") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                minLines = 4
            )

            // Category selector
            Text("Category", style = MaterialTheme.typography.labelSmall, color = TextSecondary)
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                categories.forEach { cat ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { category = cat }
                            .padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(selected = category == cat, onClick = { category = cat })
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(cat, style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }

            OutlinedTextField(
                value = skills,
                onValueChange = { skills = it },
                label = { Text("Required Skills (comma separated)") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp)
            )

            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = budget,
                    onValueChange = { budget = it },
                    label = { Text("Budget (₹ INR >= 1000)") },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(14.dp),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                )

                OutlinedTextField(
                    value = days,
                    onValueChange = { days = it },
                    label = { Text("Timeline (Days >= 2)") },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(14.dp),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                )
            }

            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = revisions,
                    onValueChange = { revisions = it },
                    label = { Text("Permitted Revisions (1-5)") },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(14.dp),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                )

                OutlinedTextField(
                    value = paymentTerms,
                    onValueChange = { paymentTerms = it },
                    label = { Text("Payment Terms") },
                    modifier = Modifier.weight(2f),
                    shape = RoundedCornerShape(14.dp)
                )
            }

            Button(
                onClick = {
                    val parsedBudget = budget.toDoubleOrNull() ?: 0.0
                    val parsedDays = days.toIntOrNull() ?: 0
                    val parsedRevisions = revisions.toIntOrNull() ?: 0

                    if (parsedBudget < 1000) {
                        validationError = "Minimum project budget is ₹1,000 INR"
                        return@Button
                    }
                    if (parsedDays < 2) {
                        validationError = "Minimum project duration is 2 days"
                        return@Button
                    }
                    if (parsedRevisions !in 1..5) {
                        validationError = "Permitted revisions must be between 1 and 5"
                        return@Button
                    }

                    businessViewModel.createProject(
                        business = currentUser,
                        title = title,
                        summary = summary,
                        desc = desc,
                        category = category,
                        skills = skills.split(",").map { it.trim() },
                        budgetInr = parsedBudget,
                        days = parsedDays,
                        revisions = parsedRevisions,
                        paymentTerms = paymentTerms,
                        onSuccess = onProjectCreated
                    )
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Emerald600),
                enabled = title.isNotBlank() && desc.isNotBlank()
            ) {
                Text("Submit Project for Moderation", fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun ManageApplicantsScreen(
    businessViewModel: BusinessViewModel,
    onNavigateBack: () -> Unit
) {
    val applications by businessViewModel.applications.collectAsState()
    var selectedApplicantForOffer by remember { mutableStateOf<Application?>(null) }
    var offerBudget by remember { mutableStateOf("18000") }
    var offerDeadline by remember { mutableStateOf("2026-10-25") }
    var offerScope by remember { mutableStateOf("All project deliverables as scoped in project listing.") }

    Scaffold(
        topBar = { ProofTopBar(title = "Applicant Proposals", onBackClick = onNavigateBack) }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            if (applications.isEmpty()) {
                item {
                    Text(
                        text = "No applications received yet.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondary
                    )
                }
            } else {
                items(applications) { app ->
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(app.studentName, fontWeight = FontWeight.Bold)
                                Surface(
                                    color = when (app.status) {
                                        ApplicationStatus.SHORTLISTED -> Emerald100
                                        ApplicationStatus.OFFER_EXTENDED -> Indigo100
                                        else -> BorderLight
                                    },
                                    shape = RoundedCornerShape(6.dp)
                                ) {
                                    Text(
                                        text = app.status.name,
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("Project: ${app.projectTitle}", style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(app.pitchMessage, style = MaterialTheme.typography.bodyMedium)

                            if (app.portfolioSamples.isNotEmpty()) {
                                Spacer(modifier = Modifier.height(6.dp))
                                Text("Portfolio link: ${app.portfolioSamples.first().url}", style = MaterialTheme.typography.labelSmall, color = Indigo600)
                            }

                            Spacer(modifier = Modifier.height(12.dp))

                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                if (app.status == ApplicationStatus.PENDING) {
                                    OutlinedButton(
                                        onClick = { businessViewModel.shortlistApplication(app.id) },
                                        shape = RoundedCornerShape(10.dp)
                                    ) {
                                        Text("Shortlist")
                                    }
                                }

                                Button(
                                    onClick = {
                                        selectedApplicantForOffer = app
                                    },
                                    shape = RoundedCornerShape(10.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = Indigo600)
                                ) {
                                    Text("Extend Binding Offer", fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }

        // Offer Dialog
        if (selectedApplicantForOffer != null) {
            val app = selectedApplicantForOffer!!
            AlertDialog(
                onDismissRequest = { selectedApplicantForOffer = null },
                title = { Text("Extend Binding Project Offer") },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text("Candidate: ${app.studentName}", fontWeight = FontWeight.Bold)
                        Text("Project: ${app.projectTitle}", style = MaterialTheme.typography.bodySmall)

                        OutlinedTextField(
                            value = offerBudget,
                            onValueChange = { offerBudget = it },
                            label = { Text("Agreed Budget (₹ INR)") },
                            singleLine = true
                        )

                        OutlinedTextField(
                            value = offerDeadline,
                            onValueChange = { offerDeadline = it },
                            label = { Text("Agreed Deadline (YYYY-MM-DD)") },
                            singleLine = true
                        )

                        OutlinedTextField(
                            value = offerScope,
                            onValueChange = { offerScope = it },
                            label = { Text("Scope Summary") },
                            maxLines = 3
                        )
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            businessViewModel.extendOffer(
                                projectId = app.projectId,
                                projectTitle = app.projectTitle,
                                businessId = "business-1",
                                businessName = "HyperFlow Labs",
                                studentId = app.studentId,
                                studentName = app.studentName,
                                agreedBudget = offerBudget.toDoubleOrNull() ?: 18000.0,
                                agreedDeadline = offerDeadline,
                                agreedRevisions = 2,
                                scopeSummary = offerScope
                            )
                            selectedApplicantForOffer = null
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Emerald600)
                    ) {
                        Text("Send Binding Offer")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { selectedApplicantForOffer = null }) {
                        Text("Cancel")
                    }
                }
            )
        }
    }
}

@Composable
fun BusinessDeliverableReviewScreen(
    projectId: String,
    businessViewModel: BusinessViewModel,
    onNavigateBack: () -> Unit
) {
    val projects by businessViewModel.projects.collectAsState()
    val project = projects.find { it.id == projectId }
    val submissions by businessViewModel.submissions.collectAsState()
    val projectSubmissions = submissions.filter { it.projectId == projectId }

    var feedback by remember { mutableStateOf("") }
    var utrInput by remember { mutableStateOf("UTR-HDFC-99120481923") }
    var reviewComment by remember { mutableStateOf("Delivered exceptional work on schedule!") }
    var starRating by remember { mutableStateOf("5") }
    var showRevisionDialog by remember { mutableStateOf(false) }
    var showApproveDialog by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var successMessage by remember { mutableStateOf<String?>(null) }

    Scaffold(
        topBar = { ProofTopBar(title = "Review Deliverables", onBackClick = onNavigateBack) }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            if (project != null) {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(project.title, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                        Text("Assigned to: ${project.selectedStudentName ?: "Student Creator"}", style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                        Text("Fee: ₹${project.budgetInr.toInt()} INR · Permitted revisions: ${project.permittedRevisions}", style = MaterialTheme.typography.labelSmall, color = Emerald600)
                    }
                }
            }

            if (errorMessage != null) {
                Surface(color = Rose100, shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth()) {
                    Text(errorMessage!!, color = Rose600, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(12.dp))
                }
            }

            if (successMessage != null) {
                Surface(color = Emerald100, shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth()) {
                    Text(successMessage!!, color = Emerald700, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(12.dp))
                }
            }

            Text("Submissions History (${projectSubmissions.size})", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)

            if (projectSubmissions.isEmpty()) {
                Text("No deliverable submission yet from the assigned creator.", color = TextSecondary)
            } else {
                projectSubmissions.forEach { sub ->
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Submission v${sub.version}", fontWeight = FontWeight.Bold)
                                Text("Status: ${sub.status}", color = if (sub.status == "APPROVED") Emerald600 else Indigo600, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.labelSmall)
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(sub.notes, style = MaterialTheme.typography.bodyMedium)
                            if (sub.liveLink != null) {
                                Spacer(modifier = Modifier.height(4.dp))
                                Text("Live Preview: ${sub.liveLink}", color = Indigo600, style = MaterialTheme.typography.labelSmall)
                            }

                            if (sub.status == "PENDING_REVIEW") {
                                Spacer(modifier = Modifier.height(14.dp))
                                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                    Button(
                                        onClick = { showApproveDialog = true },
                                        colors = ButtonDefaults.buttonColors(containerColor = Emerald600),
                                        shape = RoundedCornerShape(10.dp)
                                    ) {
                                        Text("Approve & Pay")
                                    }

                                    OutlinedButton(
                                        onClick = { showRevisionDialog = true },
                                        shape = RoundedCornerShape(10.dp)
                                    ) {
                                        Text("Request Revision")
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Revision Request Dialog
        if (showRevisionDialog) {
            AlertDialog(
                onDismissRequest = { showRevisionDialog = false },
                title = { Text("Request Targeted Revision") },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("Describe specific requested adjustments within the agreed project scope.", style = MaterialTheme.typography.bodySmall)
                        OutlinedTextField(
                            value = feedback,
                            onValueChange = { feedback = it },
                            label = { Text("Revision Feedback") },
                            maxLines = 4
                        )
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            val sub = projectSubmissions.firstOrNull()
                            if (sub != null && project != null) {
                                businessViewModel.requestRevision(
                                    submissionId = sub.id,
                                    projectId = project.id,
                                    feedback = feedback,
                                    maxAllowed = project.permittedRevisions,
                                    onSuccess = {
                                        showRevisionDialog = false
                                        successMessage = "Revision request sent to creator."
                                    },
                                    onError = { err ->
                                        errorMessage = err
                                        showRevisionDialog = false
                                    }
                                )
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Indigo600)
                    ) {
                        Text("Send Revision Request")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showRevisionDialog = false }) { Text("Cancel") }
                }
            )
        }

        // Approve and Record Payment Dialog
        if (showApproveDialog) {
            val sub = projectSubmissions.firstOrNull()
            AlertDialog(
                onDismissRequest = { showApproveDialog = false },
                title = { Text("Approve Work & Record Payment") },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text("Amount: ₹${project?.budgetInr?.toInt()} INR", fontWeight = FontWeight.Bold, color = Emerald600)
                        OutlinedTextField(
                            value = utrInput,
                            onValueChange = { utrInput = it },
                            label = { Text("Bank Transfer / UPI UTR Reference") },
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = reviewComment,
                            onValueChange = { reviewComment = it },
                            label = { Text("Verified Testimonial") }
                        )
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            if (sub != null && project != null) {
                                businessViewModel.approveSubmission(sub.id, project.id)
                                businessViewModel.recordPayment(
                                    projectId = project.id,
                                    projectTitle = project.title,
                                    businessId = project.businessId,
                                    studentId = project.selectedStudentId ?: "student-1",
                                    amountInr = project.budgetInr,
                                    utr = utrInput,
                                    method = "UPI",
                                    onSuccess = {
                                        businessViewModel.submitReview(
                                            VerifiedReview(
                                                id = "rev-${System.currentTimeMillis()}",
                                                projectId = project.id,
                                                projectTitle = project.title,
                                                reviewerName = project.businessName,
                                                rating = starRating.toIntOrNull() ?: 5,
                                                comment = reviewComment,
                                                verifiedDeliverableSummary = sub.notes
                                            )
                                        )
                                        showApproveDialog = false
                                        successMessage = "Project completed! UTR recorded and verified review published."
                                    },
                                    onError = { err ->
                                        errorMessage = err
                                        showApproveDialog = false
                                    }
                                )
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Emerald600)
                    ) {
                        Text("Approve & Mint Proof")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showApproveDialog = false }) { Text("Cancel") }
                }
            )
        }
    }
}

@Composable
fun BusinessSettingsScreen(
    authViewModel: AuthViewModel,
    onNavigateBack: () -> Unit
) {
    val businessProfile by authViewModel.businessProfile.collectAsState()
    var legalEntity by remember { mutableStateOf(businessProfile.verificationLegalEntity ?: "") }
    var docType by remember { mutableStateOf(businessProfile.verificationDocType ?: "GSTIN") }
    var docNumber by remember { mutableStateOf(businessProfile.verificationDocNumber ?: "") }
    var isSubmitted by remember { mutableStateOf(false) }

    Scaffold(
        topBar = { ProofTopBar(title = "Business Verification", onBackClick = onNavigateBack) }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            ThemeSelectorCard()

            Surface(
                shape = RoundedCornerShape(16.dp),
                color = when (businessProfile.verificationStatus) {
                    VerificationStatus.VERIFIED -> Emerald100
                    VerificationStatus.PENDING -> Indigo100
                    else -> BorderLight
                },
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = if (businessProfile.verificationStatus == VerificationStatus.VERIFIED) Icons.Default.Verified else Icons.Default.HourglassTop,
                        contentDescription = null,
                        tint = if (businessProfile.verificationStatus == VerificationStatus.VERIFIED) Emerald600 else Indigo600
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text("Status: ${businessProfile.verificationStatus.name}", fontWeight = FontWeight.Bold)
                        Text(
                            if (businessProfile.verificationStatus == VerificationStatus.VERIFIED)
                                "Your business is verified. Listings display a verified checkmark."
                            else "Submit your registered Indian legal entity details for moderation.",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSecondary
                        )
                    }
                }
            }

            if (isSubmitted) {
                Surface(color = Emerald100, shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth()) {
                    Text("Verification documents submitted to platform admin queue.", color = Emerald700, modifier = Modifier.padding(12.dp))
                }
            }

            Text("Indian Legal Entity Verification", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)

            OutlinedTextField(
                value = legalEntity,
                onValueChange = { legalEntity = it },
                label = { Text("Registered Company Legal Name") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp)
            )

            OutlinedTextField(
                value = docType,
                onValueChange = { docType = it },
                label = { Text("Document Type (GSTIN / CIN / PAN / MSME Udyam)") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp)
            )

            OutlinedTextField(
                value = docNumber,
                onValueChange = { docNumber = it },
                label = { Text("Registration Document Number") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp)
            )

            Button(
                onClick = {
                    authViewModel.submitBusinessVerification(legalEntity, docType, docNumber)
                    isSubmitted = true
                },
                enabled = legalEntity.isNotBlank() && docNumber.isNotBlank(),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Emerald600)
            ) {
                Text("Submit for Verification", fontWeight = FontWeight.Bold)
            }
        }
    }
}
