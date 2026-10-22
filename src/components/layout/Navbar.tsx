import React, { useState, useRef, useEffect } from 'react';
import { User } from '../../types';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { ThemeToggle } from '../common/ThemeToggle';
import {
  Shield,
  Sparkles,
  UserCircle,
  LogOut,
  MessageSquare,
  ChevronDown,
  Menu,
  X,
  Compass,
  FileCheck2,
  Users,
  Award,
  Share2,
  CheckSquare,
  Info
} from 'lucide-react';

interface Props {
  currentUser: User | null;
  activeView: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: (mode?: 'login' | 'register_student' | 'register_business') => void;
  onLogout?: () => void;
  onOpenChat?: () => void;
  unreadChatCount?: number;
}

export const Navbar: React.FC<Props> = ({
  currentUser,
  activeView,
  onNavigate,
  onOpenAuth,
  onLogout,
  onOpenChat,
  unreadChatCount = 0,
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close "More" dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    if (isMoreOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMoreOpen]);

  const handleNav = (view: string, param?: string) => {
    onNavigate(view, param);
    setIsMoreOpen(false);
    setIsMobileMenuOpen(false);
  };

  const isMoreActive =
    activeView === 'referrals' ||
    activeView === 'pilot_checklist' ||
    activeView === 'about' ||
    activeView === 'portfolio' ||
    activeView === 'talent_discovery' ||
    activeView === 'recruiter_dashboard';

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-2.5 sm:py-3.5">
        
        {/* Left Side: Mobile Menu Button + Wordmark */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <button
            onClick={() => handleNav('landing')}
            className="flex items-center gap-2 sm:gap-2.5 text-left group shrink-0"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-emerald-500 p-0.5 shadow-sm group-hover:scale-105 transition">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-white font-black text-sm">
                P
              </div>
            </div>
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              Proof<span className="text-emerald-600 dark:text-emerald-400">-to-</span>Pay
            </span>
          </button>
        </div>

        {/* Center: Desktop Navigation Links (Responsive priority) */}
        <nav className="hidden md:flex items-center gap-2 lg:gap-4 xl:gap-5 text-sm font-medium text-slate-600 dark:text-slate-300">
          {/* Always visible on md+ */}
          <button
            onClick={() => handleNav('browse')}
            className={`px-2 py-1 rounded-lg transition hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0 ${
              activeView === 'browse'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50/60 dark:bg-indigo-950/40'
                : ''
            }`}
          >
            Find Projects
          </button>
          <button
            onClick={() => handleNav('how_it_works')}
            className={`px-2 py-1 rounded-lg transition hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0 ${
              activeView === 'how_it_works'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50/60 dark:bg-indigo-950/40'
                : ''
            }`}
          >
            How It Works
          </button>

          {/* Visible on lg+ */}
          <button
            onClick={() => handleNav('talent_discovery')}
            className={`hidden lg:block px-2 py-1 rounded-lg transition hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0 ${
              activeView === 'talent_discovery' || activeView === 'recruiter_dashboard'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50/60 dark:bg-indigo-950/40'
                : ''
            }`}
          >
            Find Talent
          </button>

          {/* Visible on xl+ */}
          <button
            onClick={() => handleNav('portfolio', 'aarav-sharma')}
            className={`hidden xl:block px-2 py-1 rounded-lg transition hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0 ${
              activeView === 'portfolio'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50/60 dark:bg-indigo-950/40'
                : ''
            }`}
          >
            Verified Portfolios
          </button>

          {/* Visible on 2xl+ */}
          <button
            onClick={() => handleNav('referrals')}
            className={`hidden 2xl:block px-2 py-1 rounded-lg transition hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0 ${
              activeView === 'referrals'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50/60 dark:bg-indigo-950/40'
                : ''
            }`}
          >
            Referral Network
          </button>
          <button
            onClick={() => handleNav('pilot_checklist')}
            className={`hidden 2xl:flex items-center gap-1.5 px-2 py-1 rounded-lg transition hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0 ${
              activeView === 'pilot_checklist'
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50/60 dark:bg-emerald-950/40'
                : ''
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>Pilot Checklist</span>
          </button>
          <button
            onClick={() => handleNav('about')}
            className={`hidden 2xl:block px-2 py-1 rounded-lg transition hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0 ${
              activeView === 'about'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50/60 dark:bg-indigo-950/40'
                : ''
            }`}
          >
            About Proof
          </button>

          {/* More Dropdown (Visible on md up to 2xl) */}
          <div className="relative 2xl:hidden" ref={moreRef}>
            <button
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-medium transition hover:text-slate-900 dark:hover:text-white whitespace-nowrap ${
                isMoreActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50/60 dark:bg-indigo-950/40'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <span>More</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMoreOpen ? 'rotate-180' : ''}`} />
            </button>

            {isMoreOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 text-xs">
                {/* Find Talent (if hidden on md) */}
                <button
                  onClick={() => handleNav('talent_discovery')}
                  className="lg:hidden w-full text-left px-3.5 py-2 flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
                >
                  <Users className="w-4 h-4 text-indigo-500" />
                  <span>Find Talent</span>
                </button>

                {/* Verified Portfolios (if hidden on md/lg) */}
                <button
                  onClick={() => handleNav('portfolio', 'aarav-sharma')}
                  className="xl:hidden w-full text-left px-3.5 py-2 flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
                >
                  <Award className="w-4 h-4 text-purple-500" />
                  <span>Verified Portfolios</span>
                </button>

                <button
                  onClick={() => handleNav('referrals')}
                  className="w-full text-left px-3.5 py-2 flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
                >
                  <Share2 className="w-4 h-4 text-blue-500" />
                  <span>Referral Network</span>
                </button>

                <button
                  onClick={() => handleNav('pilot_checklist')}
                  className="w-full text-left px-3.5 py-2 flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
                >
                  <CheckSquare className="w-4 h-4 text-emerald-500" />
                  <span>Pilot Checklist</span>
                </button>

                <button
                  onClick={() => handleNav('market_trends')}
                  className="w-full text-left px-3.5 py-2 flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Live Market Trends</span>
                </button>

                <button
                  onClick={() => handleNav('about')}
                  className="w-full text-left px-3.5 py-2 flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium border-t border-slate-100 dark:border-slate-800 mt-1"
                >
                  <Info className="w-4 h-4 text-slate-500" />
                  <span>About Proof</span>
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Right Side: Primary Actions (Guaranteed visible, anchored right) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-auto md:ml-0">
          <div className="hidden 2xl:block">
            <PWAInstallButton variant="compact" />
          </div>

          <ThemeToggle variant="dropdown" />

          {currentUser ? (
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {onOpenChat && (
                <button
                  onClick={onOpenChat}
                  title="Open Secure Messages"
                  className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-xs transition whitespace-nowrap"
                >
                  <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="hidden sm:inline">Messages</span>
                  {unreadChatCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-indigo-600 text-white font-black text-[10px] rounded-full animate-pulse">
                      {unreadChatCount}
                    </span>
                  )}
                </button>
              )}

              <button
                onClick={() => {
                  if (currentUser.role === 'STUDENT') handleNav('student_dashboard');
                  else if (currentUser.role === 'BUSINESS') handleNav('business_dashboard');
                  else if (currentUser.role === 'RECRUITER') handleNav('recruiter_dashboard');
                  else if (currentUser.role === 'ADMIN') handleNav('admin_dashboard');
                }}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-bold rounded-xl shadow-xs transition whitespace-nowrap ${
                  currentUser.role === 'STUDENT'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : currentUser.role === 'BUSINESS'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : currentUser.role === 'RECRUITER'
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                <UserCircle className="w-4 h-4" />
                <span className="hidden xs:inline sm:inline">
                  {currentUser.role === 'STUDENT'
                    ? 'Workspace'
                    : currentUser.role === 'BUSINESS'
                    ? 'Business'
                    : currentUser.role === 'RECRUITER'
                    ? 'Recruiter'
                    : 'Admin'}
                </span>
              </button>

              <button
                onClick={onLogout}
                title="Log out of account"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-900/50 shadow-xs transition whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition whitespace-nowrap rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('register_student')}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition whitespace-nowrap active:scale-95"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer (Visible when hamburger button is clicked) */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-2 animate-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-1 gap-1 text-sm font-medium">
            <button
              onClick={() => handleNav('browse')}
              className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 ${
                activeView === 'browse'
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Compass className="w-4 h-4 text-indigo-500" />
              <span>Find Projects</span>
            </button>
            <button
              onClick={() => handleNav('how_it_works')}
              className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 ${
                activeView === 'how_it_works'
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <FileCheck2 className="w-4 h-4 text-emerald-500" />
              <span>How It Works</span>
            </button>
            <button
              onClick={() => handleNav('talent_discovery')}
              className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 ${
                activeView === 'talent_discovery'
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4 text-blue-500" />
              <span>Find Talent</span>
            </button>
            <button
              onClick={() => handleNav('portfolio', 'aarav-sharma')}
              className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 ${
                activeView === 'portfolio'
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Award className="w-4 h-4 text-purple-500" />
              <span>Verified Portfolios</span>
            </button>
            <button
              onClick={() => handleNav('referrals')}
              className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 ${
                activeView === 'referrals'
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Share2 className="w-4 h-4 text-cyan-500" />
              <span>Referral Network</span>
            </button>
            <button
              onClick={() => handleNav('pilot_checklist')}
              className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 ${
                activeView === 'pilot_checklist'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Pilot Checklist</span>
            </button>
            <button
              onClick={() => handleNav('market_trends')}
              className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 ${
                activeView === 'market_trends'
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Live Market Trends</span>
            </button>
            <button
              onClick={() => handleNav('about')}
              className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 ${
                activeView === 'about'
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Info className="w-4 h-4 text-slate-500" />
              <span>About Proof</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <PWAInstallButton variant="banner" />
          </div>
        </div>
      )}
    </header>
  );
};
