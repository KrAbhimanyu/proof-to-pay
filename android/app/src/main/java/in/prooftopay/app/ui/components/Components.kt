package in.prooftopay.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import in.prooftopay.app.data.model.Project
import in.prooftopay.app.data.model.UserRole
import in.prooftopay.app.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProofTopBar(
    title: String,
    onBackClick: (() -> Unit)? = null,
    actions: @Composable RowScope.() -> Unit = {}
) {
    TopAppBar(
        title = {
            Text(
                text = title,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
        },
        navigationIcon = {
            if (onBackClick != null) {
                IconButton(onClick = onBackClick) {
                    Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Back")
                }
            }
        },
        actions = actions,
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    )
}

@Composable
fun CreatorBottomBar(
    currentRoute: String,
    onNavigate: (String) -> Unit
) {
    NavigationBar(
        containerColor = MaterialTheme.colorScheme.surface,
        tonalElevation = 8.dp
    ) {
        NavigationBarItem(
            selected = currentRoute == "creator_home",
            onClick = { onNavigate("creator_home") },
            icon = { Icon(Icons.Default.Dashboard, contentDescription = "Home") },
            label = { Text("Home", fontSize = 10.sp) }
        )
        NavigationBarItem(
            selected = currentRoute == "browse_projects",
            onClick = { onNavigate("browse_projects") },
            icon = { Icon(Icons.Default.Search, contentDescription = "Browse") },
            label = { Text("Projects", fontSize = 10.sp) }
        )
        NavigationBarItem(
            selected = currentRoute == "active_projects",
            onClick = { onNavigate("active_projects") },
            icon = { Icon(Icons.Default.Assignment, contentDescription = "Active") },
            label = { Text("Active", fontSize = 10.sp) }
        )
        NavigationBarItem(
            selected = currentRoute == "earnings",
            onClick = { onNavigate("earnings") },
            icon = { Icon(Icons.Default.AccountBalanceWallet, contentDescription = "Earnings") },
            label = { Text("Earnings", fontSize = 10.sp) }
        )
        NavigationBarItem(
            selected = currentRoute == "creator_portfolio",
            onClick = { onNavigate("creator_portfolio") },
            icon = { Icon(Icons.Default.Person, contentDescription = "Portfolio") },
            label = { Text("Proof", fontSize = 10.sp) }
        )
    }
}

@Composable
fun BusinessBottomBar(
    currentRoute: String,
    onNavigate: (String) -> Unit
) {
    NavigationBar(
        containerColor = MaterialTheme.colorScheme.surface,
        tonalElevation = 8.dp
    ) {
        NavigationBarItem(
            selected = currentRoute == "business_home",
            onClick = { onNavigate("business_home") },
            icon = { Icon(Icons.Default.Dashboard, contentDescription = "Home") },
            label = { Text("Dashboard", fontSize = 10.sp) }
        )
        NavigationBarItem(
            selected = currentRoute == "create_project",
            onClick = { onNavigate("create_project") },
            icon = { Icon(Icons.Default.AddCircle, contentDescription = "Post") },
            label = { Text("Post Project", fontSize = 10.sp) }
        )
        NavigationBarItem(
            selected = currentRoute == "manage_applicants",
            onClick = { onNavigate("manage_applicants") },
            icon = { Icon(Icons.Default.People, contentDescription = "Applicants") },
            label = { Text("Applicants", fontSize = 10.sp) }
        )
        NavigationBarItem(
            selected = currentRoute == "business_settings",
            onClick = { onNavigate("business_settings") },
            icon = { Icon(Icons.Default.VerifiedUser, contentDescription = "Verify") },
            label = { Text("Verification", fontSize = 10.sp) }
        )
    }
}

@Composable
fun ProjectCard(
    project: Project,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = project.businessName,
                    style = MaterialTheme.typography.labelSmall,
                    color = TextSecondary
                )
                Text(
                    text = "₹${project.budgetInr.toInt()} INR",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Black,
                    color = Emerald600
                )
            }

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = project.title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = project.summary,
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary,
                maxLines = 2
            )

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = project.category,
                    style = MaterialTheme.typography.labelSmall,
                    color = Indigo600
                )
                Text(
                    text = "${project.deadlineDays} Days · ${project.permittedRevisions} Revisions",
                    style = MaterialTheme.typography.labelSmall,
                    color = TextSecondary
                )
            }
        }
    }
}
