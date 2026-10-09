package in.prooftopay.app.ui.screens.admin

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import in.prooftopay.app.data.model.Project
import in.prooftopay.app.data.model.ProjectStatus
import in.prooftopay.app.data.model.UserProfile
import in.prooftopay.app.theme.*
import in.prooftopay.app.ui.components.ProofTopBar
import in.prooftopay.app.viewmodel.AdminViewModel

@Composable
fun AdminHomeScreen(
    currentUser: UserProfile,
    adminViewModel: AdminViewModel,
    onLogout: () -> Unit
) {
    val projects by adminViewModel.projects.collectAsState()
    val pendingProjects = projects.filter { it.status == ProjectStatus.PENDING_REVIEW }
    val disputes by adminViewModel.disputes.collectAsState()
    val auditLogs by adminViewModel.auditLogs.collectAsState()

    var selectedTab by remember { mutableStateOf(0) }
    val tabs = listOf("Projects (${pendingProjects.size})", "Disputes (${disputes.size})", "Audit Log (${auditLogs.size})")

    var rejectProjectDialog by remember { mutableStateOf<Project?>(null) }
    var rejectionReason by remember { mutableStateOf("Scope does not clearly specify deliverables or violates Indian student work policy.") }

    Scaffold(
        topBar = {
            ProofTopBar(
                title = "Platform Admin",
                actions = {
                    IconButton(onClick = onLogout) {
                        Icon(Icons.Default.ExitToApp, contentDescription = "Logout")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Admin Banner & Stats
            Surface(
                shape = RoundedCornerShape(bottomStart = 20.dp, bottomEnd = 20.dp),
                color = Navy900,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(
                        text = "Super Admin Console",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color.White
                    )
                    Text(
                        text = "Protected Administrative Controls · ${currentUser.email}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Indigo500
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text("Total Projects", style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                            Text("${projects.size}", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = Color.White)
                        }
                        Column {
                            Text("Pending Review", style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                            Text("${pendingProjects.size}", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = Rose600)
                        }
                        Column {
                            Text("Open Disputes", style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                            Text("${disputes.count { it.status == "OPEN" }}", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = Color.White)
                        }
                        Column {
                            Text("Audited INR", style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                            Text("₹88,000", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = Emerald500)
                        }
                    }
                }
            }

            // Tab Selector
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = MaterialTheme.colorScheme.surface
            ) {
                tabs.forEachIndexed { index, title ->
                    Tab(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        text = { Text(title, fontWeight = if (selectedTab == index) FontWeight.Bold else FontWeight.Normal) }
                    )
                }
            }

            // Tab Content
            when (selectedTab) {
                0 -> {
                    // Project Moderation
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        if (pendingProjects.isEmpty()) {
                            item {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(top = 40.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Emerald600, modifier = Modifier.size(48.dp))
                                    Spacer(modifier = Modifier.height(10.dp))
                                    Text("All listings moderated. No pending reviews.", color = TextSecondary)
                                }
                            }
                        } else {
                            items(pendingProjects) { proj ->
                                Card(
                                    shape = RoundedCornerShape(16.dp),
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Column(modifier = Modifier.padding(16.dp)) {
                                        Text(proj.businessName, style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                                        Text(proj.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(proj.summary, style = MaterialTheme.typography.bodyMedium)
                                        Spacer(modifier = Modifier.height(6.dp))
                                        Text("Budget: ₹${proj.budgetInr.toInt()} INR · Timeline: ${proj.deadlineDays} Days", style = MaterialTheme.typography.bodySmall, color = Emerald600, fontWeight = FontWeight.SemiBold)
                                        Spacer(modifier = Modifier.height(14.dp))

                                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                            Button(
                                                onClick = { adminViewModel.approveProject(proj.id) },
                                                colors = ButtonDefaults.buttonColors(containerColor = Emerald600),
                                                shape = RoundedCornerShape(10.dp)
                                            ) {
                                                Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(16.dp))
                                                Spacer(modifier = Modifier.width(6.dp))
                                                Text("Approve Listing")
                                            }

                                            OutlinedButton(
                                                onClick = { rejectProjectDialog = proj },
                                                shape = RoundedCornerShape(10.dp),
                                                colors = ButtonDefaults.outlinedButtonColors(contentColor = Rose600)
                                            ) {
                                                Icon(Icons.Default.Close, contentDescription = null, modifier = Modifier.size(16.dp))
                                                Spacer(modifier = Modifier.width(6.dp))
                                                Text("Reject")
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                1 -> {
                    // Disputes Center
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        items(disputes) { disp ->
                            Card(
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Text(disp.projectTitle, fontWeight = FontWeight.Bold)
                                        Surface(
                                            color = if (disp.status == "OPEN") Rose100 else Emerald100,
                                            shape = RoundedCornerShape(6.dp)
                                        ) {
                                            Text(disp.status, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = if (disp.status == "OPEN") Rose600 else Emerald700)
                                        }
                                    }
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text("Raised by: ${disp.raisedByName}", style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(disp.reason, style = MaterialTheme.typography.bodyMedium)

                                    if (disp.status == "OPEN") {
                                        Spacer(modifier = Modifier.height(10.dp))
                                        Button(
                                            onClick = {
                                                adminViewModel.resolveDispute(disp.id, "Admin binding decision: project scope restored to signed terms.")
                                            },
                                            shape = RoundedCornerShape(10.dp),
                                            colors = ButtonDefaults.buttonColors(containerColor = Indigo600)
                                        ) {
                                            Text("Resolve Dispute")
                                        }
                                    } else if (disp.resolution != null) {
                                        Spacer(modifier = Modifier.height(6.dp))
                                        Text("Resolution: ${disp.resolution}", style = MaterialTheme.typography.labelSmall, color = Emerald600)
                                    }
                                }
                            }
                        }
                    }
                }
                2 -> {
                    // Audit Logs
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        items(auditLogs) { log ->
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = MaterialTheme.colorScheme.surface,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Text(log.action, fontWeight = FontWeight.Bold, color = Indigo600, style = MaterialTheme.typography.labelSmall)
                                        Text(log.timestamp, style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                                    }
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(log.details, style = MaterialTheme.typography.bodySmall)
                                    Text("Actor: ${log.userEmail}", style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                                }
                            }
                        }
                    }
                }
            }
        }

        // Rejection Reason Dialog
        if (rejectProjectDialog != null) {
            val proj = rejectProjectDialog!!
            AlertDialog(
                onDismissRequest = { rejectProjectDialog = null },
                title = { Text("Reject Project Listing") },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("Listing: ${proj.title}", fontWeight = FontWeight.Bold)
                        OutlinedTextField(
                            value = rejectionReason,
                            onValueChange = { rejectionReason = it },
                            label = { Text("Reason for Rejection") },
                            maxLines = 4
                        )
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            adminViewModel.rejectProject(proj.id, rejectionReason)
                            rejectProjectDialog = null
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Rose600)
                    ) {
                        Text("Confirm Rejection")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { rejectProjectDialog = null }) { Text("Cancel") }
                }
            )
        }
    }
}
