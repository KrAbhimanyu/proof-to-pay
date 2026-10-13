import React, { useState, useEffect } from 'react';
import { User, ProjectListing } from './types';
import { marketplaceStore } from './lib/storage';
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

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(marketplaceStore.getCurrentUser());
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

  // Navigation handler
  const handleNavigate = (view: string, param?: string) => {
    setActiveView(view);
    setViewParam(param);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuth = (mode: 'login' | 'register_student' | 'register_business' = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  // Handle Logout
  const handleLogout = () => {
    marketplaceStore.setCurrentUserId(null);
    setCurrentUser(null);
    setActiveView('landing');
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
      case 'student_dashboard': {
        const studentUser = (currentUser && currentUser.role === 'STUDENT')
          ? currentUser
          : (marketplaceStore.getUsers().find((u) => u.role === 'STUDENT') || currentUser);

        return studentUser ? (
          <StudentDashboard
            currentUser={studentUser}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        ) : (
          <LandingPage
            projects={projects}
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onOpenAuth={handleOpenAuth}
          />
        );
      }
      case 'business_dashboard':
        return currentUser ? (
          <BusinessDashboard
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        ) : (
          <LandingPage
            projects={projects}
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onOpenAuth={handleOpenAuth}
          />
        );
      case 'admin_dashboard':
        return currentUser ? (
          <AdminDashboard
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        ) : (
          <LandingPage
            projects={projects}
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onOpenAuth={handleOpenAuth}
          />
        );
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Role Sandbox Bar */}
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

      {/* Main View: Android Frame Mode vs Standard Desktop Web Mode */}
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
