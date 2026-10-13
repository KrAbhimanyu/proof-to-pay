import React from 'react';
import { User } from '../../types';
import {
  Compass,
  FileCheck2,
  Clock,
  Wallet,
  User as UserIcon,
  ChevronLeft,
  Wifi,
  Battery,
  Shield,
  Smartphone,
  Sparkles,
  LogOut
} from 'lucide-react';

interface Props {
  currentUser: User | null;
  activeView: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: (mode?: 'login' | 'register_student' | 'register_business') => void;
  onLogout?: () => void;
  children: React.ReactNode;
}

export const AndroidShell: React.FC<Props> = ({
  currentUser,
  activeView,
  onNavigate,
  onOpenAuth,
  onLogout,
  children,
}) => {
  // Mobile bottom tab active selection
  const getActiveTab = () => {
    if (activeView === 'browse' || activeView === 'landing' || activeView === 'project_detail') return 'explore';
    if (activeView === 'student_dashboard' || activeView === 'business_dashboard' || activeView === 'admin_dashboard') return 'dashboard';
    if (activeView === 'how_it_works' || activeView === 'about') return 'info';
    if (activeView === 'portfolio') return 'portfolio';
    return 'explore';
  };

  const activeTab = getActiveTab();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-start p-0 md:p-6 overflow-x-hidden">
      {/* Android Device Mockup Frame on desktop viewports */}
      <div className="w-full md:max-w-[430px] md:h-[880px] md:max-h-[92vh] bg-slate-50 dark:bg-slate-900 md:rounded-[44px] shadow-2xl md:ring-1 md:ring-slate-700 md:border-4 md:border-slate-800 flex flex-col relative overflow-hidden">
        
        {/* Android Hardware Camera Punch-Hole & Status Bar */}
        <div className="bg-slate-900 text-slate-200 text-[11px] font-semibold px-6 pt-2 pb-1.5 flex items-center justify-between select-none shrink-0 z-50">
          <span>11:15</span>
          {/* Centered camera punch-hole */}
          <div className="w-4 h-4 rounded-full bg-black border border-slate-700/60 shadow-inner hidden md:block" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-emerald-400">5G</span>
            <Wifi className="w-3 h-3" />
            <div className="flex items-center gap-0.5">
              <span className="text-[10px]">92%</span>
              <Battery className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Android Native App Header Bar */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between shrink-0 z-40">
          <div className="flex items-center gap-2">
            {activeView !== 'landing' && activeView !== 'browse' && (
              <button
                onClick={() => onNavigate('browse')}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => onNavigate('landing')}
              className="flex items-center gap-1.5 font-extrabold text-sm text-slate-900 dark:text-white"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-xs font-black">
                P
              </div>
              <span>Proof-to-Pay</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {currentUser ? (
              <>
                <button
                  onClick={() => {
                    if (currentUser.role === 'STUDENT') onNavigate('student_dashboard');
                    else if (currentUser.role === 'BUSINESS') onNavigate('business_dashboard');
                    else if (currentUser.role === 'ADMIN') onNavigate('admin_dashboard');
                  }}
                  className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-800 dark:text-slate-200"
                >
                  {currentUser.name.split(' ')[0]} ({currentUser.role[0]})
                </button>

                <button
                  onClick={onLogout}
                  title="Sign Out / Log Out"
                  className="p-1 rounded-full text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => onOpenAuth('login')}
                className="px-2.5 py-1 rounded-full bg-emerald-600 text-[11px] font-bold text-white shadow-sm"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Main Scrollable Screen Body */}
        <div className="flex-1 overflow-y-auto pb-20 select-text">
          {children}
        </div>

        {/* Android Fixed Bottom Navigation Bar (Thumb Zone) */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-50">
          <div className="grid grid-cols-4 items-center h-14 px-2">
            <button
              onClick={() => onNavigate('browse')}
              className={`flex flex-col items-center justify-center py-1 transition ${
                activeTab === 'explore'
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Compass className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Projects</span>
            </button>

            <button
              onClick={() => {
                if (!currentUser) onOpenAuth('login');
                else if (currentUser.role === 'STUDENT') onNavigate('student_dashboard');
                else if (currentUser.role === 'BUSINESS') onNavigate('business_dashboard');
                else onNavigate('admin_dashboard');
              }}
              className={`flex flex-col items-center justify-center py-1 transition ${
                activeTab === 'dashboard'
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Clock className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Workflows</span>
            </button>

            <button
              onClick={() => onNavigate('portfolio', 'aarav-sharma')}
              className={`flex flex-col items-center justify-center py-1 transition ${
                activeTab === 'portfolio'
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <FileCheck2 className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Verified</span>
            </button>

            <button
              onClick={() => {
                if (currentUser) {
                  if (currentUser.role === 'STUDENT') onNavigate('student_dashboard');
                  else if (currentUser.role === 'BUSINESS') onNavigate('business_dashboard');
                  else onNavigate('admin_dashboard');
                } else {
                  onOpenAuth('login');
                }
              }}
              className={`flex flex-col items-center justify-center py-1 transition ${
                currentUser && activeTab === 'dashboard'
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <UserIcon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{currentUser ? 'Account' : 'Join'}</span>
            </button>
          </div>

          {/* Android Home Navigation Gesture Pill */}
          <div className="w-full flex justify-center pb-1">
            <div className="w-32 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
          </div>
        </div>

      </div>
    </div>
  );
};
