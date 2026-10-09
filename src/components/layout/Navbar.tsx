import React from 'react';
import { User } from '../../types';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { Shield, Sparkles, UserCircle } from 'lucide-react';

interface Props {
  currentUser: User | null;
  activeView: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: (mode?: 'login' | 'register_student' | 'register_business') => void;
}

export const Navbar: React.FC<Props> = ({
  currentUser,
  activeView,
  onNavigate,
  onOpenAuth,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2.5 text-left group shrink-0"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-emerald-500 p-0.5 shadow-sm group-hover:scale-105 transition">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-white font-black text-sm">
              P
            </div>
          </div>
          <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
            Proof<span className="text-emerald-600 dark:text-emerald-400">-to-</span>Pay
          </span>
        </button>

        {/* Zone 2: 4-5 clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => onNavigate('browse')}
            className={`transition hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0 ${
              activeView === 'browse' ? 'text-indigo-600 dark:text-indigo-400 font-semibold underline underline-offset-8 decoration-2' : ''
            }`}
          >
            Find Projects
          </button>
          <button
            onClick={() => onNavigate('how_it_works')}
            className={`transition hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0 ${
              activeView === 'how_it_works' ? 'text-indigo-600 dark:text-indigo-400 font-semibold underline underline-offset-8 decoration-2' : ''
            }`}
          >
            How It Works
          </button>
          <button
            onClick={() => onNavigate('portfolio', 'aarav-sharma')}
            className={`transition hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0 ${
              activeView === 'portfolio' ? 'text-indigo-600 dark:text-indigo-400 font-semibold underline underline-offset-8 decoration-2' : ''
            }`}
          >
            Verified Portfolios
          </button>
          <button
            onClick={() => onNavigate('about')}
            className={`transition hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0 ${
              activeView === 'about' ? 'text-indigo-600 dark:text-indigo-400 font-semibold underline underline-offset-8 decoration-2' : ''
            }`}
          >
            About Proof
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden lg:block">
            <PWAInstallButton variant="compact" />
          </div>

          {currentUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (currentUser.role === 'STUDENT') onNavigate('student_dashboard');
                  else if (currentUser.role === 'BUSINESS') onNavigate('business_dashboard');
                  else if (currentUser.role === 'ADMIN') onNavigate('admin_dashboard');
                }}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-sm transition whitespace-nowrap"
              >
                <UserCircle className="w-4 h-4" />
                <span className="capitalize">{currentUser.role.toLowerCase()} Dashboard</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition whitespace-nowrap"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('register_student')}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition whitespace-nowrap"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
