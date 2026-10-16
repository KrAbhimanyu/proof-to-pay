import React, { useState, useEffect, useRef } from 'react';
import { User, ProjectListing, StudentProfile } from './types';
import { marketplaceStore } from './lib/storage';
import { supabaseService } from './lib/supabaseService';
import { auth } from './lib/firebase';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { RoleSwitcher } from './components/common/RoleSwitcher';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { AndroidShell } from './components/layout/AndroidShell';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { AndroidAppGuideModal } from './components/pages/AndroidAppGuideModal';
import { AuthModal } from './components/pages/AuthModal';
import { BetaBanner } from './components/common/BetaBanner';
import { BetaFeedbackModal } from './components/common/BetaFeedbackModal';
import { ReportAbuseModal } from './components/common/ReportAbuseModal';
import { BackendStatusBanner } from './components/common/BackendStatusBanner';
import { ErrorBoundary } from './components/common/ErrorBoundary';

import { LandingPage } from './components/pages/LandingPage';
import { BrowseProjects } from './components/pages/BrowseProjects';
import { ProjectDetail } from './components/pages/ProjectDetail';
import { StudentDashboard } from './components/pages/StudentDashboard';
import { BusinessDashboard } from './components/pages/BusinessDashboard';
import { AdminDashboard } from './components/pages/AdminDashboard';
import { PublicPortfolio } from './components/pages/PublicPortfolio';
import { HowItWorks } from './components/pages/HowItWorks';
import { PilotChecklist } from './components/pages/PilotChecklist';
import { AccessDenied } from './components/pages/AccessDenied';
import { CreatorWorkspace, CreatorTabId } from './components/layout/CreatorWorkspace';
import { BusinessWorkspace, BusinessTabId } from './components/layout/BusinessWorkspace';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    // In production builds with unconfigured backend, never auto-assume demo accounts
    if (import.meta.env.PROD && !supabaseService.isLiveBackendConfigured()) {
      return null;
    }
    return marketplaceStore.getCurrentUser();
  });
  const [isSessionLoading, setIsSessionLoading] = useState<boolean>(true);
  const isLoggingOutRef = useRef<boolean>(false);

  const [activeView, setActiveView] = useState<string>('landing');
  const [viewParam, setViewParam] = useState<string | undefined>(undefined);
  const [isAndroidView, setIsAndroidView] = useState<boolean>(false);
  const [isAndroidGuideOpen, setIsAndroidGuideOpen] = useState<boolean>(false);
  const [androidGuideTab, setAndroidGuideTab] = useState<'compose' | 'supabase' | 'install' | 'code'>('compose');
  
  // Auth modal
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register_student' | 'register_business'>('login');

  // Beta Feedback & Abuse report modals
  const [isFeedbackOpen, setIsFeedbackOpen] = useState<boolean>(false);
  const [abuseModalState, setAbuseModalState] = useState<{
    isOpen: boolean;
    targetProjectId?: string;
    targetUserId?: string;
    targetTitle: string;
  }>({
    isOpen: false,
    targetTitle: 'Project or User',
  });

  // Load project listings
  const projects = marketplaceStore.getProjects();

  // Active Workspace tab states for Creator and Business
  const [creatorTab, setCreatorTab] = useState<CreatorTabId>('overview');
  const [businessTab, setBusinessTab] = useState<BusinessTabId>('overview');

  // Synchronize session state on initial mount & listen to real auth changes
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      if (supabaseService.isLiveBackendConfigured()) {
        try {
          const session = await supabaseService.getSession();
          if (session?.user) {
            const profile = await supabaseService.getProfile(session.user.id);
            if (isMounted) {
              if (profile && !profile.isSuspended) {
                setCurrentUser(profile);
                marketplaceStore.setCurrentUserId(profile.id);
              } else {
                await supabaseService.signOut();
                setCurrentUser(null);
                marketplaceStore.setCurrentUserId(null);
              }
            }
          } else {
            // Live backend configured but no Supabase session active
            // Clear any stale local user IDs to prevent unauthorized privilege restoration
            if (isMounted) {
              setCurrentUser(null);
              marketplaceStore.setCurrentUserId(null);
            }
          }
        } catch (err) {
          console.warn('Session restoration note:', err);
          if (isMounted) {
            setCurrentUser(null);
            marketplaceStore.setCurrentUserId(null);
          }
        }
      } else {
        // Offline / Sandbox Demo Mode
        if (import.meta.env.PROD) {
          if (isMounted) {
            setCurrentUser(null);
            marketplaceStore.setCurrentUserId(null);
          }
        } else {
          const demoUser = marketplaceStore.getCurrentUser();
          if (isMounted) {
            setCurrentUser(demoUser);
          }
        }
      }

      if (isMounted) {
        setIsSessionLoading(false);
      }
    }

    initSession();

    // Subscribe to Supabase auth events when client is present
    let unsubscribeFn: (() => void) | null = null;
    const sb = supabaseService.getClient();
    if (sb) {
      const { data } = sb.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            const profile = await supabaseService.getProfile(session.user.id);
            if (profile && !profile.isSuspended) {
              setCurrentUser(profile);
              marketplaceStore.setCurrentUserId(profile.id);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          marketplaceStore.setCurrentUserId(null);
          setActiveView('landing');
        }
      });
      unsubscribeFn = () => data.subscription.unsubscribe();
    }

    return () => {
      isMounted = false;
      if (unsubscribeFn) {
        unsubscribeFn();
      }
    };
  }, []);

  // Navigation handler with sub-route support
  const handleNavigate = (view: string, param?: string) => {
    if (view === 'creator_dashboard' || view === 'student_dashboard') {
      setActiveView('student_dashboard');
      if (param) setCreatorTab(param as CreatorTabId);
      else setCreatorTab('overview');
    } else if (view.startsWith('creator_')) {
      const tab = view.replace('creator_', '') as CreatorTabId;
      setCreatorTab(tab);
      setActiveView('student_dashboard');
    } else if (view === 'business_dashboard') {
      setActiveView('business_dashboard');
      if (param) setBusinessTab(param as BusinessTabId);
      else setBusinessTab('overview');
    } else if (view.startsWith('business_')) {
      const tab = view.replace('business_', '') as BusinessTabId;
      setBusinessTab(tab);
      setActiveView('business_dashboard');
    } else {
      setActiveView(view);
      setViewParam(param);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuth = (mode: 'login' | 'register_student' | 'register_business' = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  // Centralized, safe logout handler
  const handleLogout = async () => {
    // 1. Prevent duplicate concurrent logout operations
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    // Immediately reset client application state to prevent protected views from lingering
    setCurrentUser(null);
    marketplaceStore.setCurrentUserId(null);
    setActiveView('landing');
    setViewParam(undefined);

    // 2. Identify active authentication provider and sign out
    const provider = typeof localStorage !== 'undefined' ? localStorage.getItem('ptp_session_provider') : null;

    try {
      if (provider === 'supabase' || supabaseService.isLiveBackendConfigured()) {
        await supabaseService.signOut();
      } else if (provider === 'firebase') {
        await firebaseSignOut(auth);
      }
    } catch (err) {
      console.warn('Provider sign-out notification:', err);
    } finally {
      try {
        localStorage.removeItem('ptp_session_provider');
      } catch {}
      isLoggingOutRef.current = false;
    }
  };

  // Sync current user state
  const handleUserChange = (user: User | null) => {
    setCurrentUser(user);
    if (!user) {
      setActiveView('landing');
    } else if (user.role === 'STUDENT') {
      setActiveView('student_dashboard');
    } else if (user.role === 'BUSINESS') {
      setActiveView('business_dashboard');
    } else if (user.role === 'ADMIN') {
      setActiveView('admin_dashboard');
    }
  };

  // Detect small screens on first load to provide natural mobile view
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsAndroidView(true);
    }
  }, []);

  // Selected project for detail view
  const selectedProject = viewParam ? marketplaceStore.getProject(viewParam) : projects[0];

  // Render view body
  const renderContent = () => {
    switch (activeView) {
      case 'landing':
        return (
          <LandingPage
            projects={projects}
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onOpenAuth={handleOpenAuth}
            onOpenFeedback={() => setIsFeedbackOpen(true)}
          />
        );
      case 'browse':
        return (
          <BrowseProjects
            projects={projects}
            onSelectProject={(id) => handleNavigate('project_detail', id)}
          />
        );
      case 'project_detail':
        return selectedProject ? (
          <ProjectDetail
            project={selectedProject}
            currentUser={currentUser}
            onBack={() => handleNavigate('browse')}
            onOpenAuth={handleOpenAuth}
            onNavigate={handleNavigate}
          />
        ) : (
          <div className="p-12 text-center">Project not found</div>
        );
      case 'student_dashboard':
      case 'creator_dashboard': {
        if (!currentUser) {
          return (
            <AccessDenied
              currentUser={null}
              targetRole="STUDENT"
              onNavigate={handleNavigate}
              onOpenAuth={handleOpenAuth}
            />
          );
        }

        if (currentUser.role !== 'STUDENT' && currentUser.role !== 'ADMIN') {
          return (
            <AccessDenied
              currentUser={currentUser}
              targetRole="STUDENT"
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            />
          );
        }

        const studentProfile: StudentProfile = marketplaceStore.getStudentProfile(currentUser.id) || {
          userId: currentUser.id,
          headline: 'Emerging Creator',
          bio: '',
          age: 20,
          skills: ['UI/UX', 'React'],
          experienceLevel: 'INTERMEDIATE',
          portfolioLinks: [],
          verifiedPortfolioSlug: currentUser.name.toLowerCase().replace(/\s+/g, '-'),
          totalEarnedINR: 0,
          completedProjectsCount: 0,
          averageRating: 5.0,
        };

        const pendingOffersCount = marketplaceStore.getOffers().filter(
          (o) => o.studentId === currentUser.id && o.status === 'PENDING'
        ).length;

        const activeWorkCount = marketplaceStore.getProjects().filter(
          (p) => p.selectedStudentId === currentUser.id && p.status === 'IN_PROGRESS'
        ).length;

        return (
          <CreatorWorkspace
            currentUser={currentUser}
            profile={studentProfile}
            activeTab={creatorTab}
            onTabChange={(tab) => setCreatorTab(tab)}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
            pendingOffersCount={pendingOffersCount}
            activeWorkCount={activeWorkCount}
          >
            <StudentDashboard
              currentUser={currentUser}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
              controlledTab={creatorTab === 'browse' ? 'overview' : creatorTab}
              onTabChange={(tab) => setCreatorTab(tab as any)}
            />
          </CreatorWorkspace>
        );
      }
      case 'business_dashboard': {
        if (!currentUser) {
          return (
            <AccessDenied
              currentUser={null}
              targetRole="BUSINESS"
              onNavigate={handleNavigate}
              onOpenAuth={handleOpenAuth}
            />
          );
        }

        if (currentUser.role !== 'BUSINESS' && currentUser.role !== 'ADMIN') {
          return (
            <AccessDenied
              currentUser={currentUser}
              targetRole="BUSINESS"
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            />
          );
        }

        const businessProfile = marketplaceStore.getBusinessProfile(currentUser.id) || {
          userId: currentUser.id,
          companyName: currentUser.name,
          industry: 'Software & Technology',
          city: currentUser.city || 'Bengaluru',
          verificationStatus: 'UNVERIFIED',
          totalSpentINR: 0,
          projectsPostedCount: 0,
        };

        const businessProjects = marketplaceStore.getProjects().filter(
          (p) => p.businessId === currentUser.id
        );

        const pendingReviewsCount = marketplaceStore.getSubmissions().filter((s) => {
          const p = businessProjects.find((proj) => proj.id === s.projectId);
          return !!p && p.status === 'SUBMITTED';
        }).length;

        const applicantsCount = marketplaceStore.getApplications().filter((a) => {
          const p = businessProjects.find((proj) => proj.id === a.projectId);
          return !!p && a.status === 'PENDING';
        }).length;

        return (
          <BusinessWorkspace
            currentUser={currentUser}
            profile={businessProfile}
            activeTab={businessTab}
            onTabChange={(tab) => setBusinessTab(tab)}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
            pendingReviewsCount={pendingReviewsCount}
            applicantsCount={applicantsCount}
          >
            <BusinessDashboard
              currentUser={currentUser}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
              controlledTab={businessTab}
              onTabChange={(tab) => setBusinessTab(tab as any)}
            />
          </BusinessWorkspace>
        );
      }
      case 'admin_dashboard': {
        if (!currentUser) {
          return (
            <AccessDenied
              currentUser={null}
              targetRole="ADMIN"
              onNavigate={handleNavigate}
              onOpenAuth={handleOpenAuth}
            />
          );
        }

        if (currentUser.role !== 'ADMIN') {
          return (
            <AccessDenied
              currentUser={currentUser}
              targetRole="ADMIN"
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            />
          );
        }

        return (
          <AdminDashboard
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        );
      }
      case 'portfolio':
        return (
          <PublicPortfolio
            slug={viewParam || 'aarav-sharma'}
            currentUser={currentUser}
            onBack={() => handleNavigate('browse')}
            onNavigate={handleNavigate}
            onOpenAuth={handleOpenAuth}
          />
        );
      case 'pilot_checklist':
        return (
          <PilotChecklist
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onOpenAuth={handleOpenAuth}
            onOpenFeedback={() => setIsFeedbackOpen(true)}
          />
        );
      case 'how_it_works':
      case 'about':
      case 'terms':
      case 'privacy':
      case 'security':
        return (
          <HowItWorks
            onNavigate={handleNavigate}
            onOpenAuth={handleOpenAuth}
          />
        );
      default:
        return (
          <LandingPage
            projects={projects}
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onOpenAuth={handleOpenAuth}
          />
        );
    }
  };

  const isWorkspaceView = !isAndroidView && (
    ((activeView === 'student_dashboard' || activeView === 'creator_dashboard') && (currentUser?.role === 'STUDENT' || currentUser?.role === 'ADMIN')) ||
    (activeView === 'business_dashboard' && (currentUser?.role === 'BUSINESS' || currentUser?.role === 'ADMIN'))
  );

  if (isSessionLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-400">Verifying session security...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Role Sandbox Bar (Development & Sandbox Demo Only - Never rendered in Production) */}
      {!import.meta.env.PROD && (
        <RoleSwitcher
          currentUser={currentUser}
          onUserChange={handleUserChange}
          isAndroidView={isAndroidView}
          onToggleAndroidView={() => setIsAndroidView(!isAndroidView)}
          onOpenAndroidGuide={() => {
            setAndroidGuideTab('compose');
            setIsAndroidGuideOpen(true);
          }}
        />
      )}

      {/* Database Connection & Demo Mode Banner */}
      <BackendStatusBanner
        onOpenSetupGuide={() => {
          setAndroidGuideTab('supabase');
          setIsAndroidGuideOpen(true);
        }}
      />

      {/* Beta Launch Community Banner */}
      <BetaBanner
        onOpenFeedback={() => setIsFeedbackOpen(true)}
        onNavigate={handleNavigate}
      />

      {/* Offline Mode Indicator */}
      <OfflineIndicator />

      {/* Main View: Android Frame Mode vs Workspace Layout vs Standard Public Web Mode */}
      {isAndroidView ? (
        <AndroidShell
          currentUser={currentUser}
          activeView={activeView}
          onNavigate={handleNavigate}
          onOpenAuth={handleOpenAuth}
          onLogout={handleLogout}
        >
          <ErrorBoundary fallbackTitle="Mobile View Recovery">
            {renderContent()}
          </ErrorBoundary>
        </AndroidShell>
      ) : isWorkspaceView ? (
        <main className="flex-1 flex flex-col min-w-0">
          <ErrorBoundary fallbackTitle="Workspace Recovery">
            {renderContent()}
          </ErrorBoundary>
        </main>
      ) : (
        <>
          <Navbar
            currentUser={currentUser}
            activeView={activeView}
            onNavigate={handleNavigate}
            onOpenAuth={handleOpenAuth}
            onLogout={handleLogout}
          />

          <main className="flex-1">
            <ErrorBoundary fallbackTitle="Dashboard & View Recovery">
              {renderContent()}
            </ErrorBoundary>
          </main>

          <Footer
            onNavigate={handleNavigate}
            onOpenAndroidGuide={() => setIsAndroidGuideOpen(true)}
          />
        </>
      )}

      {/* Android APK & Install Guide Modal */}
      <AndroidAppGuideModal
        isOpen={isAndroidGuideOpen}
        initialTab={androidGuideTab}
        onClose={() => setIsAndroidGuideOpen(false)}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          if (user.role === 'STUDENT') setActiveView('student_dashboard');
          else if (user.role === 'BUSINESS') setActiveView('business_dashboard');
          else setActiveView('admin_dashboard');
        }}
      />

      {/* Beta Feedback Modal */}
      <BetaFeedbackModal
        isOpen={isFeedbackOpen}
        currentUser={currentUser}
        onClose={() => setIsFeedbackOpen(false)}
      />

      {/* Report Abuse Modal */}
      <ReportAbuseModal
        isOpen={abuseModalState.isOpen}
        currentUser={currentUser}
        targetProjectId={abuseModalState.targetProjectId}
        targetUserId={abuseModalState.targetUserId}
        targetTitle={abuseModalState.targetTitle}
        onClose={() => setAbuseModalState({ isOpen: false, targetTitle: 'Project or User' })}
      />
    </div>
  );
}
