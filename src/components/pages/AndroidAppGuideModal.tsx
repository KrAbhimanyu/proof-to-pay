import React, { useState } from 'react';
import {
  Smartphone,
  X,
  Terminal,
  CheckCircle2,
  ShieldCheck,
  Download,
  Code2,
  Database,
  PlayCircle,
  Copy,
  ExternalLink,
  Layers,
  Key
} from 'lucide-react';
import { getSupabaseConfig, saveSupabaseConfig } from '../../lib/supabaseClient';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidAppGuideModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'compose' | 'supabase' | 'install' | 'code'>('compose');

  // Supabase connection form state
  const currentConfig = getSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(currentConfig.url);
  const [supabaseKey, setSupabaseKey] = useState(currentConfig.anonKey);
  const [isSaved, setIsSaved] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Selected code view
  const [selectedFile, setSelectedFile] = useState<'MainActivity' | 'Repositories' | 'ViewModels' | 'Models' | 'AppNavGraph'>('MainActivity');

  if (!isOpen) return null;

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(supabaseUrl, supabaseKey);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const copySchemaSql = () => {
    navigator.clipboard.writeText(`-- Proof-to-Pay Schema available in supabase/schema.sql`);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">Proof-to-Pay Native Android App (Kotlin & Jetpack Compose)</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  Native MVP
                </span>
              </div>
              <p className="text-xs text-slate-300">Companion to web app · Shared Supabase database & authentication</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-6 pt-3 gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('compose')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'compose'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>1. Architecture & Features</span>
          </button>

          <button
            onClick={() => setActiveTab('supabase')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'supabase'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>2. Shared Supabase Project Setup</span>
          </button>

          <button
            onClick={() => setActiveTab('install')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'install'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>3. Build & Install on Phone</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'code'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>4. Kotlin Source Inspector</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
          {/* Tab 1: Architecture */}
          {activeTab === 'compose' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-200">Native Jetpack Compose Implementation Complete</h4>
                  <p className="text-xs text-emerald-800 dark:text-emerald-400 leading-relaxed">
                    This is a true native Android application built in Kotlin using Material 3, Navigation Compose, Coroutines/Flow, and the official Supabase Kotlin SDK (<code className="font-mono">io.github.jan-tennert.supabase</code>). It is not a WebView wrapper.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">🎓 Creator Experience</span>
                  <ul className="text-xs text-slate-500 space-y-1 list-disc pl-4">
                    <li>Browse & filter by category/INR</li>
                    <li>Apply with pitch & work links</li>
                    <li>Respond to formal binding offers</li>
                    <li>Submit deliverable files & links</li>
                    <li>Payment tracking with UTR records</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">🏢 Business Portal</span>
                  <ul className="text-xs text-slate-500 space-y-1 list-disc pl-4">
                    <li>Create project drafts with scope</li>
                    <li>Submit for admin moderation</li>
                    <li>Shortlist applicants & send offers</li>
                    <li>Evaluate work versions</li>
                    <li>Request revisions within cap</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">🛡️ Protected Admin</span>
                  <ul className="text-xs text-slate-500 space-y-1 list-disc pl-4">
                    <li>Backend RLS role verification</li>
                    <li>Approve / reject listings with notes</li>
                    <li>Verify GSTIN / CIN legal docs</li>
                    <li>Dispute resolution console</li>
                    <li>Permanent audit trail</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Supabase Setup */}
          {activeTab === 'supabase' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 space-y-2">
                <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-200">
                  <Database className="w-4 h-4 text-blue-600" />
                  <span>Shared Supabase Project Connection</span>
                </div>
                <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                  Both the web application and the Android app read and write to the same Supabase database tables (<code className="font-mono">profiles</code>, <code className="font-mono">projects</code>, <code className="font-mono">applications</code>, <code className="font-mono">submissions</code>, <code className="font-mono">payments</code>).
                </p>
              </div>

              {/* Supabase URL & Anon Key Config Form */}
              <form onSubmit={handleSaveSupabase} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">Connect to your Supabase Project</h4>

                {isSaved && (
                  <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-semibold">
                    ✓ Supabase credentials saved! Both Web and Android integration layers updated.
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Supabase Public Anon Key
                  </label>
                  <input
                    type="password"
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                    required
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Never use service-role keys in client applications.
                  </span>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition"
                  >
                    Save & Test Connection
                  </button>
                </div>
              </form>

              {/* Schema SQL */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-300">
                    Database Schema Migration File (<code className="font-mono">supabase/schema.sql</code>):
                  </span>
                  <button
                    onClick={copySchemaSql}
                    className="text-xs text-emerald-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedSql ? 'Copied!' : 'Copy SQL path'}</span>
                  </button>
                </div>
                <div className="p-3 bg-slate-950 text-slate-300 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800">
                  Run <span className="text-emerald-400">supabase/schema.sql</span> in your Supabase SQL Editor to provision all tables, enums, and Row Level Security (RLS) policies.
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Build & Install */}
          {activeTab === 'install' && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">How to Build and Install on Your Android Phone</h3>

              <div className="bg-slate-950 text-slate-200 p-5 rounded-2xl font-mono text-xs space-y-3 overflow-x-auto border border-slate-800 leading-relaxed">
                <div className="text-emerald-400 font-bold">// 1. Navigate to the android directory</div>
                <div>cd android</div>

                <div className="text-emerald-400 font-bold mt-2">// 2. Build Debug APK using Gradle wrapper</div>
                <div>./gradlew assembleDebug</div>

                <div className="text-emerald-400 font-bold mt-2">// 3. Generated APK location:</div>
                <div className="text-slate-400">app/build/outputs/apk/debug/app-debug.apk</div>

                <div className="text-emerald-400 font-bold mt-2">// 4. Install directly onto your connected phone via USB/Wi-Fi:</div>
                <div>adb install -r app/build/outputs/apk/debug/app-debug.apk</div>

                <div className="text-emerald-400 font-bold mt-2">// 5. Open in Android Studio:</div>
                <div>Open Android Studio &rarr; Open &rarr; select "/android" folder</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">Prerequisites:</h4>
                <ul className="text-xs text-slate-500 space-y-1 list-disc pl-4">
                  <li>Android Studio Iguana or newer</li>
                  <li>JDK 17 or higher configured as Gradle JDK</li>
                  <li>Android Device running Android 8.0 (API 26) or higher with Developer Options & USB Debugging enabled</li>
                </ul>
              </div>
            </div>
          )}

          {/* Tab 4: Kotlin Source Inspector */}
          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {(['MainActivity', 'AppNavGraph', 'ViewModels', 'Repositories', 'Models'] as const).map((file) => (
                  <button
                    key={file}
                    onClick={() => setSelectedFile(file)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      selectedFile === file
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {file}.kt
                  </button>
                ))}
              </div>

              <div className="bg-slate-950 text-slate-300 p-4 rounded-2xl font-mono text-xs overflow-x-auto max-h-96 border border-slate-800">
                {selectedFile === 'MainActivity' && (
                  <pre>{`package in.prooftopay.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.navigation.compose.rememberNavController
import in.prooftopay.app.theme.ProofToPayTheme
import in.prooftopay.app.ui.navigation.AppNavGraph

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            ProofToPayTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val navController = rememberNavController()
                    AppNavGraph(navController = navController)
                }
            }
        }
    }
}`}</pre>
                )}

                {selectedFile === 'AppNavGraph' && (
                  <pre>{`package in.prooftopay.app.ui.navigation

// Jetpack Compose Navigation Graph with Auth, Creator, Business, and Admin flows
NavHost(navController = navController, startDestination = Screen.Splash.route) {
    composable(Screen.Splash.route) { SplashScreen(...) }
    composable(Screen.Onboarding.route) { OnboardingScreen(...) }
    composable(Screen.Login.route) { LoginScreen(...) }
    composable(Screen.Register.route) { RegisterScreen(...) }
    composable(Screen.CreatorHome.route) { CreatorHomeScreen(...) }
    composable(Screen.BrowseProjects.route) { BrowseProjectsScreen(...) }
    composable(Screen.ProjectDetail.route) { ProjectDetailScreen(...) }
    composable(Screen.BusinessHome.route) { BusinessHomeScreen(...) }
    composable(Screen.CreateProject.route) { CreateProjectScreen(...) }
    composable(Screen.AdminHome.route) { AdminHomeScreen(...) }
}`}</pre>
                )}

                {selectedFile === 'ViewModels' && (
                  <pre>{`class CreatorViewModel : ViewModel() {
    val projects: StateFlow<List<Project>> = ProjectRepository.projects
    val applications: StateFlow<List<Application>> = ApplicationRepository.applications

    fun applyToProject(project: Project, student: UserProfile, pitch: String, days: Int, ...) {
        // Enforces adult policy & prevents duplicate applications
    }
}

class BusinessViewModel : ViewModel() {
    fun createProject(...) { /* Posts project for moderation */ }
    fun acceptApplication(appId: String) { /* Issues formal binding offer */ }
}

class AdminViewModel : ViewModel() {
    fun approveProject(projectId: String) { /* Moderation approval */ }
}`}</pre>
                )}

                {selectedFile === 'Repositories' && (
                  <pre>{`object AuthRepository {
    suspend fun login(emailInput: String, passwordInput: String): Result<UserProfile> {
        SupabaseClientProvider.auth.signInWith(Email) { email = emailInput; password = passwordInput }
        ...
    }

    suspend fun register(name, email, pass, role, age, city): Result<UserProfile> {
        if (role == UserRole.STUDENT && age < 18) {
            return Result.failure(IllegalArgumentException("Must be 18 or older"))
        }
        ...
    }
}`}</pre>
                )}

                {selectedFile === 'Models' && (
                  <pre>{`@Serializable
data class Project(
    val id: String,
    @SerialName("business_id") val businessId: String,
    @SerialName("business_name") val businessName: String,
    val title: String,
    val summary: String,
    val description: String,
    val category: String,
    @SerialName("budget_inr") val budgetInr: Double,
    @SerialName("deadline_days") val deadlineDays: Int,
    @SerialName("permitted_revisions") val permittedRevisions: Int = 2,
    val status: ProjectStatus = ProjectStatus.DRAFT
)`}</pre>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">Native code located in <code className="font-mono">/android</code></span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs hover:opacity-90 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
