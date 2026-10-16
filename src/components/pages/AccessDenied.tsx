import React from 'react';
import { User } from '../../types';
import { ShieldAlert, ArrowLeft, LogOut, UserCircle } from 'lucide-react';

interface Props {
  currentUser: User | null;
  targetRole: 'STUDENT' | 'BUSINESS' | 'ADMIN';
  onNavigate: (view: string, param?: string) => void;
  onLogout?: () => void;
  onOpenAuth?: (mode?: 'login' | 'register_student' | 'register_business') => void;
}

export const AccessDenied: React.FC<Props> = ({
  currentUser,
  targetRole,
  onNavigate,
  onLogout,
  onOpenAuth,
}) => {
  const getRoleDisplayName = (role: 'STUDENT' | 'BUSINESS' | 'ADMIN') => {
    switch (role) {
      case 'STUDENT':
        return 'Student Creator';
      case 'BUSINESS':
        return 'Business Client';
      case 'ADMIN':
        return 'Platform Administrator';
      default:
        return 'Authorized User';
    }
  };

  const getTargetDashboardView = () => {
    if (!currentUser) return 'landing';
    if (currentUser.role === 'STUDENT') return 'student_dashboard';
    if (currentUser.role === 'BUSINESS') return 'business_dashboard';
    if (currentUser.role === 'ADMIN') return 'admin_dashboard';
    return 'landing';
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Access Restricted
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            This area is designated exclusively for{' '}
            <strong className="text-slate-900 dark:text-white">{getRoleDisplayName(targetRole)}s</strong>.
          </p>
        </div>

        {currentUser ? (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-left space-y-1.5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Your Current Signed-In Identity
            </div>
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <UserCircle className="w-4 h-4 text-slate-500" />
              <span>{currentUser.name}</span>
            </div>
            <div className="text-slate-500 text-[11px]">
              Active Role: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{currentUser.role}</span>
              {' · '}
              Email: <span>{currentUser.email}</span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300">
            You are currently browsing as an unregistered or logged-out visitor. Please sign in to access this workspace.
          </div>
        )}

        <div className="flex flex-col gap-2 pt-2">
          {currentUser ? (
            <>
              <button
                onClick={() => onNavigate(getTargetDashboardView())}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs shadow-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to My {currentUser.role === 'STUDENT' ? 'Creator Workspace' : currentUser.role === 'BUSINESS' ? 'Business Workspace' : 'Admin Portal'}</span>
              </button>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-full py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium transition flex items-center justify-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out to Switch Accounts</span>
                </button>
              )}
            </>
          ) : (
            <button
              onClick={() => onOpenAuth && onOpenAuth('login')}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition"
            >
              Sign In to Your Account
            </button>
          )}

          <button
            onClick={() => onNavigate('landing')}
            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 py-1"
          >
            Go to Platform Homepage
          </button>
        </div>
      </div>
    </div>
  );
};
