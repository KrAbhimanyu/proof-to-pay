package in.prooftopay.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import in.prooftopay.app.data.model.UserRole
import in.prooftopay.app.ui.screens.admin.AdminHomeScreen
import in.prooftopay.app.ui.screens.auth.ForgotPasswordScreen
import in.prooftopay.app.ui.screens.auth.LoginScreen
import in.prooftopay.app.ui.screens.auth.RegisterScreen
import in.prooftopay.app.ui.screens.business.BusinessDeliverableReviewScreen
import in.prooftopay.app.ui.screens.business.BusinessHomeScreen
import in.prooftopay.app.ui.screens.business.BusinessSettingsScreen
import in.prooftopay.app.ui.screens.business.CreateProjectScreen
import in.prooftopay.app.ui.screens.business.ManageApplicantsScreen
import in.prooftopay.app.ui.screens.creator.*
import in.prooftopay.app.ui.screens.onboarding.OnboardingScreen
import in.prooftopay.app.ui.screens.splash.SplashScreen
import in.prooftopay.app.ui.screens.chat.ChatConversationScreen
import in.prooftopay.app.ui.screens.chat.ChatInboxScreen
import in.prooftopay.app.viewmodel.AdminViewModel
import in.prooftopay.app.viewmodel.AuthViewModel
import in.prooftopay.app.viewmodel.BusinessViewModel
import in.prooftopay.app.viewmodel.ChatViewModel
import in.prooftopay.app.viewmodel.CreatorViewModel

@Composable
fun AppNavGraph(
    navController: NavHostController,
    authViewModel: AuthViewModel = viewModel(),
    creatorViewModel: CreatorViewModel = viewModel(),
    businessViewModel: BusinessViewModel = viewModel(),
    adminViewModel: AdminViewModel = viewModel(),
    chatViewModel: ChatViewModel = viewModel()
) {
    val currentUser by authViewModel.currentUser.collectAsState()

    NavHost(
        navController = navController,
        startDestination = Screen.Splash.route
    ) {
        // Splash
        composable(Screen.Splash.route) {
            SplashScreen(
                onSplashComplete = {
                    if (currentUser != null) {
                        when (currentUser?.role) {
                            UserRole.STUDENT -> navController.navigate(Screen.CreatorHome.route) { popUpTo(0) }
                            UserRole.BUSINESS -> navController.navigate(Screen.BusinessHome.route) { popUpTo(0) }
                            UserRole.RECRUITER -> navController.navigate(Screen.RecruiterHome.route) { popUpTo(0) }
                            UserRole.ADMIN -> navController.navigate(Screen.AdminHome.route) { popUpTo(0) }
                            else -> navController.navigate(Screen.Onboarding.route) { popUpTo(0) }
                        }
                    } else {
                        navController.navigate(Screen.Onboarding.route) { popUpTo(0) }
                    }
                }
            )
        }

        // Onboarding
        composable(Screen.Onboarding.route) {
            OnboardingScreen(
                onFinishOnboarding = {
                    navController.navigate(Screen.Login.route) { popUpTo(Screen.Onboarding.route) { inclusive = true } }
                }
            )
        }

        // Auth
        composable(Screen.Login.route) {
            LoginScreen(
                authViewModel = authViewModel,
                onLoginSuccess = {
                    when (currentUser?.role) {
                        UserRole.STUDENT -> navController.navigate(Screen.CreatorHome.route) { popUpTo(0) }
                        UserRole.BUSINESS -> navController.navigate(Screen.BusinessHome.route) { popUpTo(0) }
                        UserRole.ADMIN -> navController.navigate(Screen.AdminHome.route) { popUpTo(0) }
                        UserRole.RECRUITER -> navController.navigate(Screen.RecruiterHome.route) { popUpTo(0) }
                        else -> navController.navigate(Screen.CreatorHome.route) { popUpTo(0) }
                    }
                },
                onNavigateToRegister = { navController.navigate(Screen.Register.route) },
                onNavigateToForgot = { navController.navigate(Screen.ForgotPassword.route) }
            )
        }

        composable(Screen.Register.route) {
            RegisterScreen(
                authViewModel = authViewModel,
                onRegisterSuccess = {
                    when (currentUser?.role) {
                        UserRole.STUDENT -> navController.navigate(Screen.CreatorHome.route) { popUpTo(0) }
                        UserRole.BUSINESS -> navController.navigate(Screen.BusinessHome.route) { popUpTo(0) }
                        UserRole.ADMIN -> navController.navigate(Screen.AdminHome.route) { popUpTo(0) }
                        UserRole.RECRUITER -> navController.navigate(Screen.RecruiterHome.route) { popUpTo(0) }
                        else -> navController.navigate(Screen.CreatorHome.route) { popUpTo(0) }
                    }
                },
                onNavigateToLogin = { navController.popBackStack() }
            )
        }

        composable(Screen.ForgotPassword.route) {
            ForgotPasswordScreen(
                authViewModel = authViewModel,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        // Creator Destination Flow
        composable(Screen.CreatorHome.route) {
            if (currentUser != null) {
                CreatorHomeScreen(
                    currentUser = currentUser!!,
                    creatorViewModel = creatorViewModel,
                    onNavigateToBrowse = { navController.navigate(Screen.BrowseProjects.route) },
                    onNavigateToProject = { id -> navController.navigate(Screen.ProjectDetail.createRoute(id)) },
                    onNavigateToActive = { navController.navigate(Screen.ActiveProjects.route) },
                    onNavigateToEarnings = { navController.navigate(Screen.Earnings.route) },
                    onNavigateToPortfolio = { navController.navigate(Screen.CreatorPortfolio.route) },
                    onNavigateToApplications = { navController.navigate(Screen.CreatorApplications.route) },
                    onNavigateToSettings = { navController.navigate(Screen.CreatorSettings.route) },
                    onLogout = {
                        authViewModel.logout()
                        navController.navigate(Screen.Login.route) { popUpTo(0) }
                    }
                )
            }
        }

        composable(Screen.BrowseProjects.route) {
            BrowseProjectsScreen(
                creatorViewModel = creatorViewModel,
                onNavigateBack = { navController.popBackStack() },
                onNavigateToProject = { id -> navController.navigate(Screen.ProjectDetail.createRoute(id)) }
            )
        }

        composable(Screen.ProjectDetail.route) { backStackEntry ->
            val projectId = backStackEntry.arguments?.getString("projectId") ?: ""
            ProjectDetailScreen(
                projectId = projectId,
                creatorViewModel = creatorViewModel,
                onNavigateBack = { navController.popBackStack() },
                onNavigateToApply = { id ->
                    navController.navigate(Screen.ApplyProject.createRoute(id))
                }
            )
        }

        composable(Screen.ApplyProject.route) { backStackEntry ->
            val projectId = backStackEntry.arguments?.getString("projectId") ?: ""
            if (currentUser != null) {
                ApplyProjectScreen(
                    projectId = projectId,
                    currentUser = currentUser!!,
                    creatorViewModel = creatorViewModel,
                    onNavigateBack = { navController.popBackStack() },
                    onApplySuccess = {
                        navController.popBackStack(Screen.CreatorHome.route, false)
                    }
                )
            }
        }

        composable(Screen.ActiveProjects.route) {
            if (currentUser != null) {
                ActiveAssignmentsScreen(
                    currentUser = currentUser!!,
                    creatorViewModel = creatorViewModel,
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateToSubmit = { id ->
                        navController.navigate(Screen.SubmitDeliverable.createRoute(id))
                    }
                )
            }
        }

        composable(Screen.SubmitDeliverable.route) { backStackEntry ->
            val projectId = backStackEntry.arguments?.getString("projectId") ?: ""
            if (currentUser != null) {
                SubmitDeliverableScreen(
                    projectId = projectId,
                    currentUser = currentUser!!,
                    creatorViewModel = creatorViewModel,
                    onNavigateBack = { navController.popBackStack() },
                    onSubmitSuccess = {
                        navController.popBackStack(Screen.ActiveProjects.route, false)
                    }
                )
            }
        }

        composable(Screen.CreatorApplications.route) {
            if (currentUser != null) {
                CreatorApplicationsScreen(
                    currentUser = currentUser!!,
                    creatorViewModel = creatorViewModel,
                    onNavigateBack = { navController.popBackStack() }
                )
            }
        }

        composable(Screen.Earnings.route) {
            EarningsScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Screen.CreatorPortfolio.route) {
            if (currentUser != null) {
                CreatorPortfolioScreen(
                    currentUser = currentUser!!,
                    creatorViewModel = creatorViewModel,
                    onNavigateBack = { navController.popBackStack() }
                )
            }
        }

        composable(Screen.CreatorSettings.route) {
            if (currentUser != null) {
                CreatorSettingsScreen(
                    currentUser = currentUser!!,
                    authViewModel = authViewModel,
                    onNavigateBack = { navController.popBackStack() },
                    onAccountDeleted = {
                        navController.navigate(Screen.Login.route) { popUpTo(0) }
                    }
                )
            }
        }

        // Business Destination Flow
        composable(Screen.BusinessHome.route) {
            if (currentUser != null) {
                BusinessHomeScreen(
                    currentUser = currentUser!!,
                    businessViewModel = businessViewModel,
                    onNavigateToCreate = { navController.navigate(Screen.CreateProject.route) },
                    onNavigateToApplicants = { navController.navigate(Screen.ManageApplicants.route) },
                    onNavigateToReview = { id -> navController.navigate(Screen.BusinessDeliverableReview.createRoute(id)) },
                    onNavigateToSettings = { navController.navigate(Screen.BusinessSettings.route) },
                    onLogout = {
                        authViewModel.logout()
                        navController.navigate(Screen.Login.route) { popUpTo(0) }
                    }
                )
            }
        }

        composable(Screen.ManageApplicants.route) {
            ManageApplicantsScreen(
                businessViewModel = businessViewModel,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Screen.CreateProject.route) {
            if (currentUser != null) {
                CreateProjectScreen(
                    currentUser = currentUser!!,
                    businessViewModel = businessViewModel,
                    onNavigateBack = { navController.popBackStack() },
                    onProjectCreated = { navController.popBackStack() }
                )
            }
        }

        composable(Screen.BusinessDeliverableReview.route) { backStackEntry ->
            val projectId = backStackEntry.arguments?.getString("projectId") ?: ""
            BusinessDeliverableReviewScreen(
                projectId = projectId,
                businessViewModel = businessViewModel,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Screen.BusinessSettings.route) {
            BusinessSettingsScreen(
                authViewModel = authViewModel,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        // Admin Destination Flow
        composable(Screen.AdminHome.route) {
            if (currentUser != null) {
                AdminHomeScreen(
                    currentUser = currentUser!!,
                    adminViewModel = adminViewModel,
                    onLogout = {
                        authViewModel.logout()
                        navController.navigate(Screen.Login.route) { popUpTo(0) }
                    }
                )
            }
        }

        // Recruiter Destination Flow
        composable(Screen.RecruiterHome.route) {
            if (currentUser != null) {
                in.prooftopay.app.ui.screens.recruiter.RecruiterHomeScreen(
                    currentUser = currentUser!!,
                    onLogout = {
                        authViewModel.logout()
                        navController.navigate(Screen.Login.route) { popUpTo(0) }
                    }
                )
            }
        }

        // Secure Chat & Messaging Subsystem Flow
        composable(Screen.ChatInbox.route) {
            if (currentUser != null) {
                ChatInboxScreen(
                    currentUser = currentUser!!,
                    chatViewModel = chatViewModel,
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateToConversation = { convId ->
                        navController.navigate(Screen.ChatConversation.createRoute(convId))
                    }
                )
            }
        }

        composable(Screen.ChatConversation.route) { backStackEntry ->
            val convId = backStackEntry.arguments?.getString("conversationId") ?: ""
            if (currentUser != null) {
                ChatConversationScreen(
                    conversationId = convId,
                    currentUser = currentUser!!,
                    chatViewModel = chatViewModel,
                    onNavigateBack = { navController.popBackStack() }
                )
            }
        }
    }
}

