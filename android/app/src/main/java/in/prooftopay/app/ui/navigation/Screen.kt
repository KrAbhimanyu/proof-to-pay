package in.prooftopay.app.ui.navigation

sealed class Screen(val route: String) {
    object Splash : Screen("splash")
    object Onboarding : Screen("onboarding")
    object Login : Screen("login")
    object Register : Screen("register")
    object ForgotPassword : Screen("forgot_password")

    // Creator screens
    object CreatorHome : Screen("creator_home")
    object BrowseProjects : Screen("browse_projects")
    object ProjectDetail : Screen("project_detail/{projectId}") {
        fun createRoute(projectId: String) = "project_detail/$projectId"
    }
    object ApplyProject : Screen("apply_project/{projectId}") {
        fun createRoute(projectId: String) = "apply_project/$projectId"
    }
    object ActiveProjects : Screen("active_projects")
    object SubmitDeliverable : Screen("submit_deliverable/{projectId}") {
        fun createRoute(projectId: String) = "submit_deliverable/$projectId"
    }
    object CreatorApplications : Screen("creator_applications")
    object Earnings : Screen("earnings")
    object CreatorPortfolio : Screen("creator_portfolio")
    object CreatorSettings : Screen("creator_settings")

    // Business screens
    object BusinessHome : Screen("business_home")
    object CreateProject : Screen("create_project")
    object ManageApplicants : Screen("manage_applicants")
    object BusinessDeliverableReview : Screen("business_review/{projectId}") {
        fun createRoute(projectId: String) = "business_review/$projectId"
    }
    object BusinessSettings : Screen("business_settings")

    // Admin screens
    object AdminHome : Screen("admin_home")
    object ProjectModeration : Screen("project_moderation")

    // Recruiter & Referral screens
    object RecruiterHome : Screen("recruiter_home")
    object TalentCollections : Screen("talent_collections")
    object ReferralNetwork : Screen("referral_network")

    // Secure Chat & Messaging screens
    object ChatInbox : Screen("chat_inbox")
    object ChatConversation : Screen("chat_conversation/{conversationId}") {
        fun createRoute(conversationId: String) = "chat_conversation/$conversationId"
    }
}
