package in.prooftopay.app.ui.screens.creator

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
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
import in.prooftopay.app.ui.components.CreatorBottomBar
import in.prooftopay.app.ui.components.ProjectCard
import in.prooftopay.app.ui.components.ProofTopBar
import in.prooftopay.app.ui.components.ThemeSelectorCard
import in.prooftopay.app.viewmodel.AuthViewModel
import in.prooftopay.app.viewmodel.CreatorViewModel

@Composable
fun CreatorHomeScreen(
    currentUser: UserProfile,
    creatorViewModel: CreatorViewModel,
    onNavigateToBrowse: () -> Unit,
    onNavigateToProject: (String) -> Unit,
    onNavigateToActive: () -> Unit,
    onNavigateToEarnings: () -> Unit,
    onNavigateToPortfolio: () -> Unit,
    onNavigateToApplications: () -> Unit,
    onNavigateToSettings: () -> Unit,
    onLogout: () -> Unit
) {
    val projects by creatorViewModel.projects.collectAsState()
    val approvedProjects = projects.filter { it.status == ProjectStatus.APPROVED }
    val myActiveProjects = projects.filter { it.selectedStudentId == currentUser.id }
    val offers by creatorViewModel.offers.collectAsState()
    val pendingOffers = offers.filter { it.studentId == currentUser.id && it.status == "PENDING" }

    Scaffold(
        topBar = {
            ProofTopBar(
                title = "Proof-to-Pay",
                actions = {
                    IconButton(onClick = onNavigateToSettings) {
                        Icon(Icons.Default.Settings, contentDescription = "Settings")
                    }
                    IconButton(onClick = onLogout) {
                        Icon(Icons.Default.ExitToApp, contentDescription = "Logout")
                    }
                }
            )
        },
        bottomBar = {
            CreatorBottomBar(
                currentRoute = "creator_home",
                onNavigate = { route ->
                    when (route) {
                        "browse_projects" -> onNavigateToBrowse()
                        "active_projects" -> onNavigateToActive()
                        "earnings" -> onNavigateToEarnings()
                        "creator_portfolio" -> onNavigateToPortfolio()
                    }
                }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Welcome Header
            item {
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = Navy900,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Text(
                            text = "Hello, ${currentUser.name.split(" ").firstOrNull() ?: "Creator"}",
                            style = MaterialTheme.typography.headlineMedium,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color.White
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "18+ Verified Creator · ${currentUser.city ?: "India"}",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Emerald500
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text("Total Cleared Earnings", style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                                Text("₹43,000 INR", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black, color = Color.White)
                            }
                            Column {
                                Text("Active Assignments", style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                                Text("${myActiveProjects.size}", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black, color = Emerald500)
                            }
                            Column {
                                Text("Verified Rating", style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                                Text("5.0 ★", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black, color = Color.White)
                            }
                        }
                    }
                }
            }

            // Pending Offers Banner if any
            if (pendingOffers.isNotEmpty()) {
                item {
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = Indigo100,
                        modifier = Modifier.fillMaxWidth().clickable { onNavigateToApplications() }
                    ) {
                        Row(
                            modifier = Modifier.padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("🎉 You have ${pendingOffers.size} formal project offer!", fontWeight = FontWeight.Bold, color = Indigo600)
                                Text("Locked budget & milestones ready for review", style = MaterialTheme.typography.bodySmall, color = TextPrimary)
                            }
                            Button(
                                onClick = onNavigateToApplications,
                                colors = ButtonDefaults.buttonColors(containerColor = Indigo600),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Text("View Offer", fontSize = 12.sp)
                            }
                        }
                    }
                }
            }

            // Quick Navigation Row
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = onNavigateToApplications,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(Icons.Default.Send, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Applications", fontSize = 12.sp)
                    }
                    OutlinedButton(
                        onClick = onNavigateToPortfolio,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(Icons.Default.Verified, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("My Proof", fontSize = 12.sp)
                    }
                }
            }

            // Section Header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Approved Paid Projects",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    TextButton(onClick = onNavigateToBrowse) {
                        Text("View all (${approvedProjects.size})", color = Emerald600)
                    }
                }
            }

            // Project Listings
            items(approvedProjects) { project ->
                ProjectCard(project = project, onClick = { onNavigateToProject(project.id) })
            }

            item { Spacer(modifier = Modifier.height(20.dp)) }
        }
    }
}

@Composable
fun BrowseProjectsScreen(
    creatorViewModel: CreatorViewModel,
    onNavigateBack: () -> Unit,
    onNavigateToProject: (String) -> Unit
) {
    val projects by creatorViewModel.projects.collectAsState()
    var searchQuery by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf("ALL") }

    val categories = listOf("ALL", "UI/UX & Product Design", "Brand Identity & Packaging", "Web & Mobile Development", "Engineering & Automation")

    val filteredProjects = projects.filter {
        val matchesCategory = selectedCategory == "ALL" || it.category == selectedCategory
        val matchesSearch = it.title.contains(searchQuery, ignoreCase = true) ||
                it.summary.contains(searchQuery, ignoreCase = true) ||
                it.requiredSkills.any { s -> s.contains(searchQuery, ignoreCase = true) }
        matchesCategory && matchesSearch && it.status == ProjectStatus.APPROVED
    }

    Scaffold(
        topBar = {
            ProofTopBar(title = "Browse Projects", onBackClick = onNavigateBack)
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Search Input
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search by skill (Figma, React, Python)...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                shape = RoundedCornerShape(14.dp),
                singleLine = true
            )

            // Category Filter Chips
            LazyRow(
                modifier = Modifier.fillMaxWidth(),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(categories) { cat ->
                    FilterChip(
                        selected = selectedCategory == cat,
                        onClick = { selectedCategory = cat },
                        label = { Text(if (cat == "ALL") "All Categories" else cat) },
                        shape = RoundedCornerShape(10.dp)
                    )
                }
            }

            // Project List
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
                contentPadding = PaddingValues(vertical = 12.dp)
            ) {
                if (filteredProjects.isEmpty()) {
                    item {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 40.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(Icons.Default.SearchOff, contentDescription = null, modifier = Modifier.size(48.dp), tint = TextSecondary)
                            Spacer(modifier = Modifier.height(12.dp))
                            Text("No projects found matching your search.", style = MaterialTheme.typography.bodyLarge, color = TextSecondary)
                        }
                    }
                } else {
                    items(filteredProjects) { project ->
                        ProjectCard(project = project, onClick = { onNavigateToProject(project.id) })
                    }
                }
            }
        }
    }
}

@Composable
fun ProjectDetailScreen(
    projectId: String,
    creatorViewModel: CreatorViewModel,
    onNavigateBack: () -> Unit,
    onNavigateToApply: (String) -> Unit
) {
    val projects by creatorViewModel.projects.collectAsState()
    val project = projects.find { it.id == projectId }

    Scaffold(
        topBar = {
            ProofTopBar(title = "Project Details", onBackClick = onNavigateBack)
        },
        bottomBar = {
            if (project != null && project.status == ProjectStatus.APPROVED) {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    tonalElevation = 8.dp,
                    color = MaterialTheme.colorScheme.surface
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Fixed Budget", style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                            Text("₹${project.budgetInr.toInt()} INR", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black, color = Emerald600)
                        }
                        Button(
                            onClick = { onNavigateToApply(project.id) },
                            shape = RoundedCornerShape(14.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Emerald600)
                        ) {
                            Text("Apply for Project", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    ) { padding ->
        if (project == null) {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Text("Project not found")
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                contentPadding = PaddingValues(vertical = 16.dp)
            ) {
                item {
                    // Category & Business Badge
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            color = Emerald100,
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(
                                text = project.category,
                                style = MaterialTheme.typography.labelSmall,
                                color = Emerald700,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                fontWeight = FontWeight.Bold
                            )
                        }

                        if (project.businessVerified) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Verified, contentDescription = null, tint = Emerald600, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Verified Business", style = MaterialTheme.typography.labelSmall, color = Emerald600, fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Text(
                        text = project.title,
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.ExtraBold
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = "Posted by ${project.businessName} · ${project.businessCity}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondary
                    )
                }

                // Metadata Stats Card
                item {
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text("Budget", style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                                Text("₹${project.budgetInr.toInt()} INR", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                            }
                            Column {
                                Text("Timeline", style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                                Text("${project.deadlineDays} Days", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                            }
                            Column {
                                Text("Revisions", style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                                Text("Max ${project.permittedRevisions}", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                            }
                            Column {
                                Text("Delivery", style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                                Text(project.expectedDeliveryDate, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }

                // Description
                item {
                    Text("Project Scope & Deliverables", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(project.description, style = MaterialTheme.typography.bodyMedium, lineHeight = 22.sp)
                }

                // Required Skills
                item {
                    Text("Required Skills", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        project.requiredSkills.forEach { skill ->
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = Navy800.copy(alpha = 0.1f)
                            ) {
                                Text(skill, modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp), style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }
                }

                // Payment Terms & Policy
                item {
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Shield, contentDescription = null, tint = Emerald600, modifier = Modifier.size(20.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Proof-to-Pay Payment Guarantee", fontWeight = FontWeight.Bold)
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(project.paymentTerms, style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("No unpaid spec tasks. Revisions are strictly capped at agreed limits to protect your time.", style = MaterialTheme.typography.labelSmall, color = Emerald600)
                        }
                    }
                }

                item { Spacer(modifier = Modifier.height(40.dp)) }
            }
        }
    }
}

@Composable
fun ApplyProjectScreen(
    projectId: String,
    currentUser: UserProfile,
    creatorViewModel: CreatorViewModel,
    onNavigateBack: () -> Unit,
    onApplySuccess: () -> Unit
) {
    val projects by creatorViewModel.projects.collectAsState()
    val project = projects.find { it.id == projectId }

    var pitch by remember { mutableStateOf("") }
    var portfolioUrl by remember { mutableStateOf("https://github.com/aarav-sharma") }
    var proposedDays by remember { mutableStateOf(project?.deadlineDays?.toString() ?: "7") }
    var isSubmitting by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    Scaffold(
        topBar = {
            ProofTopBar(title = "Apply for Project", onBackClick = onNavigateBack)
        }
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
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("Budget: ₹${project.budgetInr.toInt()} INR · Max revisions: ${project.permittedRevisions}", style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                    }
                }
            }

            if (errorMessage != null) {
                Surface(
                    color = Rose100,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(errorMessage!!, color = Rose600, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(12.dp))
                }
            }

            Text("Your Pitch & Approach", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)

            OutlinedTextField(
                value = pitch,
                onValueChange = { pitch = it },
                label = { Text("Pitch message (min 30 characters)") },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(140.dp),
                shape = RoundedCornerShape(14.dp)
            )

            Text("${pitch.length} / 30 characters minimum", style = MaterialTheme.typography.labelSmall, color = if (pitch.length >= 30) Emerald600 else TextSecondary)

            OutlinedTextField(
                value = portfolioUrl,
                onValueChange = { portfolioUrl = it },
                label = { Text("Relevant Work Sample / Portfolio Link") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                singleLine = true
            )

            OutlinedTextField(
                value = proposedDays,
                onValueChange = { proposedDays = it },
                label = { Text("Proposed turnaround in days") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                singleLine = true
            )

            Spacer(modifier = Modifier.height(12.dp))

            Button(
                onClick = {
                    if (project != null) {
                        isSubmitting = true
                        errorMessage = null
                        creatorViewModel.applyToProject(
                            project = project,
                            student = currentUser,
                            pitch = pitch,
                            days = proposedDays.toIntOrNull() ?: 7,
                            sampleUrl = portfolioUrl,
                            onSuccess = {
                                isSubmitting = false
                                onApplySuccess()
                            },
                            onError = { err ->
                                isSubmitting = false
                                errorMessage = err
                            }
                        )
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Emerald600),
                enabled = !isSubmitting && pitch.length >= 30
            ) {
                if (isSubmitting) {
                    CircularProgressIndicator(color = MaterialTheme.colorScheme.onPrimary, modifier = Modifier.size(24.dp))
                } else {
                    Text("Submit Application", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun ActiveAssignmentsScreen(
    currentUser: UserProfile,
    creatorViewModel: CreatorViewModel,
    onNavigateBack: () -> Unit,
    onNavigateToSubmit: (String) -> Unit
) {
    val projects by creatorViewModel.projects.collectAsState()
    val myActive = projects.filter { it.selectedStudentId == currentUser.id }

    Scaffold(
        topBar = { ProofTopBar(title = "Active Assignments", onBackClick = onNavigateBack) }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            if (myActive.isEmpty()) {
                item {
                    Text(
                        text = "No active project assignments. Apply to open listings to get started.",
                        style = MaterialTheme.typography.bodyLarge,
                        color = TextSecondary
                    )
                }
            } else {
                items(myActive) { proj ->
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
                                Text(proj.businessName, style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                                Surface(
                                    color = when (proj.status) {
                                        ProjectStatus.SUBMITTED -> Indigo100
                                        ProjectStatus.REVISION_REQUESTED -> Rose100
                                        ProjectStatus.COMPLETED -> Emerald100
                                        else -> BorderLight
                                    },
                                    shape = RoundedCornerShape(6.dp)
                                ) {
                                    Text(
                                        text = proj.status.name,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = when (proj.status) {
                                            ProjectStatus.SUBMITTED -> Indigo600
                                            ProjectStatus.REVISION_REQUESTED -> Rose600
                                            ProjectStatus.COMPLETED -> Emerald700
                                            else -> TextPrimary
                                        }
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(proj.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("Due: ${proj.expectedDeliveryDate} · Fee: ₹${proj.budgetInr.toInt()} INR", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                            Spacer(modifier = Modifier.height(12.dp))
                            Button(
                                onClick = { onNavigateToSubmit(proj.id) },
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Emerald600)
                            ) {
                                Icon(Icons.Default.UploadFile, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Submit Deliverable", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SubmitDeliverableScreen(
    projectId: String,
    currentUser: UserProfile,
    creatorViewModel: CreatorViewModel,
    onNavigateBack: () -> Unit,
    onSubmitSuccess: () -> Unit
) {
    val projects by creatorViewModel.projects.collectAsState()
    val project = projects.find { it.id == projectId }
    val submissions by creatorViewModel.submissions.collectAsState()
    val projectSubmissions = submissions.filter { it.projectId == projectId }

    var notes by remember { mutableStateOf("") }
    var liveLink by remember { mutableStateOf("") }
    var isSubmitting by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    Scaffold(
        topBar = { ProofTopBar(title = "Submit Deliverables", onBackClick = onNavigateBack) }
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
                        Text("Permitted revisions: ${project.permittedRevisions}", style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                    }
                }
            }

            if (projectSubmissions.isNotEmpty()) {
                Text("Previous Submissions (${projectSubmissions.size})", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                projectSubmissions.forEach { sub ->
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = MaterialTheme.colorScheme.surface,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Version ${sub.version}", fontWeight = FontWeight.Bold)
                                Text(sub.status, color = if (sub.status == "APPROVED") Emerald600 else Indigo600, style = MaterialTheme.typography.labelSmall)
                            }
                            Text(sub.notes, style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                            if (sub.revisionFeedback != null) {
                                Spacer(modifier = Modifier.height(4.dp))
                                Text("Feedback: ${sub.revisionFeedback}", color = Rose600, style = MaterialTheme.typography.labelSmall)
                            }
                        }
                    }
                }
            }

            if (errorMessage != null) {
                Surface(
                    color = Rose100,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(errorMessage!!, color = Rose600, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(12.dp))
                }
            }

            Text("New Deliverable Submission", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)

            OutlinedTextField(
                value = notes,
                onValueChange = { notes = it },
                label = { Text("Notes on deliverables, changelog, or implementation details") },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(130.dp),
                shape = RoundedCornerShape(14.dp)
            )

            OutlinedTextField(
                value = liveLink,
                onValueChange = { liveLink = it },
                label = { Text("Live Demo / GitHub PR / Figma Link") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                singleLine = true
            )

            Button(
                onClick = {
                    isSubmitting = true
                    errorMessage = null
                    creatorViewModel.submitDeliverable(
                        projectId = projectId,
                        studentId = currentUser.id,
                        notes = notes,
                        liveLink = liveLink.ifBlank { null },
                        onSuccess = {
                            isSubmitting = false
                            onSubmitSuccess()
                        },
                        onError = { err ->
                            isSubmitting = false
                            errorMessage = err
                        }
                    )
                },
                enabled = !isSubmitting && notes.isNotBlank(),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Emerald600)
            ) {
                if (isSubmitting) {
                    CircularProgressIndicator(color = MaterialTheme.colorScheme.onPrimary, modifier = Modifier.size(24.dp))
                } else {
                    Text("Submit for Client Review", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun CreatorApplicationsScreen(
    currentUser: UserProfile,
    creatorViewModel: CreatorViewModel,
    onNavigateBack: () -> Unit
) {
    val applications by creatorViewModel.applications.collectAsState()
    val myApplications = applications.filter { it.studentId == currentUser.id }
    val offers by creatorViewModel.offers.collectAsState()
    val myOffers = offers.filter { it.studentId == currentUser.id }

    Scaffold(
        topBar = { ProofTopBar(title = "My Applications & Offers", onBackClick = onNavigateBack) }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Offers section
            if (myOffers.isNotEmpty()) {
                item {
                    Text("Binding Project Offers (${myOffers.size})", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                }
                items(myOffers) { offer ->
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Indigo100.copy(alpha = 0.5f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text(offer.businessName, style = MaterialTheme.typography.labelSmall, color = Indigo600)
                                Text("STATUS: ${offer.status}", fontWeight = FontWeight.Bold, color = Indigo600, style = MaterialTheme.typography.labelSmall)
                            }
                            Text(offer.projectTitle, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("Agreed Budget: ₹${offer.agreedBudgetInr.toInt()} INR · Due: ${offer.agreedDeadline}", style = MaterialTheme.typography.bodySmall)
                            Text("Scope: ${offer.scopeSummary}", style = MaterialTheme.typography.bodySmall, color = TextSecondary)

                            if (offer.status == "PENDING") {
                                Spacer(modifier = Modifier.height(12.dp))
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Button(
                                        onClick = { creatorViewModel.respondToOffer(offer.id, true) },
                                        colors = ButtonDefaults.buttonColors(containerColor = Emerald600),
                                        shape = RoundedCornerShape(10.dp)
                                    ) {
                                        Text("Accept Offer")
                                    }
                                    OutlinedButton(
                                        onClick = { creatorViewModel.respondToOffer(offer.id, false) },
                                        shape = RoundedCornerShape(10.dp)
                                    ) {
                                        Text("Decline")
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Submitted Applications
            item {
                Text("Submitted Applications (${myApplications.size})", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            }

            if (myApplications.isEmpty()) {
                item {
                    Text("No submitted applications yet.", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                }
            } else {
                items(myApplications) { app ->
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text(app.projectTitle, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)
                                Surface(
                                    color = when (app.status) {
                                        ApplicationStatus.SHORTLISTED -> Emerald100
                                        ApplicationStatus.OFFER_EXTENDED -> Indigo100
                                        ApplicationStatus.REJECTED -> Rose100
                                        else -> BorderLight
                                    },
                                    shape = RoundedCornerShape(6.dp)
                                ) {
                                    Text(
                                        text = app.status.name,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(app.pitchMessage, style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun EarningsScreen(
    onNavigateBack: () -> Unit
) {
    Scaffold(
        topBar = { ProofTopBar(title = "Earnings & Payment Status", onBackClick = onNavigateBack) }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Surface(
                shape = RoundedCornerShape(20.dp),
                color = Navy900,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text("Total Cleared Earnings", style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                    Text("₹43,000 INR", style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Black, color = Color.White)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Payments are disbursed directly via bank transfer / UPI with traceable UTR numbers.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Emerald500
                    )
                }
            }

            Text("Payment History", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)

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
                        Text("Marketing Landing Page", fontWeight = FontWeight.Bold)
                        Text("₹15,000 INR", fontWeight = FontWeight.Black, color = Emerald600)
                    }
                    Text("Status: RECEIPT CONFIRMED · UTR: UTR-HDFC-992182049182", style = MaterialTheme.typography.labelSmall, color = Emerald600)
                }
            }

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
                        Text("Herbal Tea Brand Identity", fontWeight = FontWeight.Bold)
                        Text("₹25,000 INR", fontWeight = FontWeight.Black, color = Emerald600)
                    }
                    Text("Status: RECEIPT CONFIRMED · UTR: UTR-ICICI-884719203810", style = MaterialTheme.typography.labelSmall, color = Emerald600)
                }
            }
        }
    }
}

@Composable
fun CreatorPortfolioScreen(
    currentUser: UserProfile,
    creatorViewModel: CreatorViewModel,
    onNavigateBack: () -> Unit
) {
    val reviews by creatorViewModel.reviews.collectAsState()

    Scaffold(
        topBar = { ProofTopBar(title = "Verified Portfolio", onBackClick = onNavigateBack) }
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
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(currentUser.name, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.ExtraBold, color = Color.White)
                            Spacer(modifier = Modifier.width(6.dp))
                            Icon(Icons.Default.Verified, contentDescription = null, tint = Emerald500, modifier = Modifier.size(20.dp))
                        }
                        Text("Verified Emerging Creator · Delhi Technological University", style = MaterialTheme.typography.bodySmall, color = Emerald500)
                        Spacer(modifier = Modifier.height(10.dp))
                        Text("Public URL: prooftopay.in/portfolio/aarav-sharma", style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                    }
                }
            }

            item {
                Text("Verified Reviews & Client Feedback", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            }

            items(reviews) { rev ->
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(rev.reviewerName, fontWeight = FontWeight.Bold)
                            Text("★ ${rev.rating}.0 / 5.0", color = Emerald600, fontWeight = FontWeight.Black)
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("\"${rev.comment}\"", style = MaterialTheme.typography.bodyMedium)
                        Spacer(modifier = Modifier.height(8.dp))
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = Navy800.copy(alpha = 0.06f)
                        ) {
                            Text(
                                text = "Verified Deliverable: ${rev.verifiedDeliverableSummary}",
                                style = MaterialTheme.typography.labelSmall,
                                color = TextSecondary,
                                modifier = Modifier.padding(8.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun CreatorSettingsScreen(
    currentUser: UserProfile,
    authViewModel: AuthViewModel,
    onNavigateBack: () -> Unit,
    onAccountDeleted: () -> Unit
) {
    val studentProfile by authViewModel.studentProfile.collectAsState()
    var upiId by remember { mutableStateOf(studentProfile.upiId ?: "aarav.sharma@okhdfcbank") }
    var showDeleteConfirm by remember { mutableStateOf(false) }

    Scaffold(
        topBar = { ProofTopBar(title = "Account & Settings", onBackClick = onNavigateBack) }
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

            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Personal Details", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Name: ${currentUser.name}", style = MaterialTheme.typography.bodyMedium)
                    Text("Email: ${currentUser.email}", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                    Text("Age Policy: 18+ Adult Verified", style = MaterialTheme.typography.bodyMedium, color = Emerald600)
                    Text("College: ${studentProfile.college}", style = MaterialTheme.typography.bodyMedium)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = when (studentProfile.verificationStatus) {
                            VerificationStatus.VERIFIED -> "Verification Status: Verified Creator (${studentProfile.verificationDocType ?: "Student ID"})"
                            VerificationStatus.PENDING -> "Verification Status: Under Review"
                            VerificationStatus.REJECTED -> "Verification Status: Verification Rejected"
                            VerificationStatus.UNVERIFIED -> "Verification Status: Unverified"
                        },
                        style = MaterialTheme.typography.bodyMedium,
                        color = when (studentProfile.verificationStatus) {
                            VerificationStatus.VERIFIED -> Emerald600
                            VerificationStatus.PENDING -> Amber500
                            VerificationStatus.REJECTED -> Rose600
                            VerificationStatus.UNVERIFIED -> TextSecondary
                        }
                    )
                }
            }

            Text("Payout Configuration (UPI / VPA)", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)

            OutlinedTextField(
                value = upiId,
                onValueChange = { upiId = it },
                label = { Text("UPI ID for instant payouts") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                singleLine = true
            )

            Button(
                onClick = {
                    authViewModel.updateStudentProfile(studentProfile.copy(upiId = upiId))
                },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = Emerald600),
                shape = RoundedCornerShape(14.dp)
            ) {
                Text("Save UPI ID")
            }

            Spacer(modifier = Modifier.height(20.dp))

            Text("Danger Zone", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = Rose600)

            OutlinedButton(
                onClick = { showDeleteConfirm = true },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = Rose600),
                shape = RoundedCornerShape(14.dp)
            ) {
                Icon(Icons.Default.DeleteForever, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("Request Account Deletion")
            }

            if (showDeleteConfirm) {
                AlertDialog(
                    onDismissRequest = { showDeleteConfirm = false },
                    title = { Text("Delete Account?") },
                    text = { Text("This will permanently remove your account, active applications, and public verified portfolio. This action cannot be undone.") },
                    confirmButton = {
                        Button(
                            onClick = {
                                authViewModel.deleteAccount {
                                    showDeleteConfirm = false
                                    onAccountDeleted()
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Rose600)
                        ) {
                            Text("Permanently Delete")
                        }
                    },
                    dismissButton = {
                        TextButton(onClick = { showDeleteConfirm = false }) {
                            Text("Cancel")
                        }
                    }
                )
            }
        }
    }
}
