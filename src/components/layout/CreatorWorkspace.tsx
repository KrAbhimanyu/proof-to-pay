import React, { useState } from 'react';
import { User, StudentProfile } from '../../types';
import {
  LayoutDashboard,
  Search,
  FileText,
  Lock,
  Clock,
  Award,
  Wallet,
  Sparkles,
  ExternalLink,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  GraduationCap
} from 'lucide-react';

export type CreatorTabId =
  | 'overview'
  | 'browse'
  | 'applications'
  | 'offers'
  | 'active_projects'
  | 'skills'
  | 'payments'
  | 'badges'
  | 'portfolio'
  | 'profile'
  | 'settings';

interface Props {
  currentUser: User;
  profile: StudentProfile;
  activeTab: CreatorTabId;
  onTabChange: (tab: CreatorTabId) => void;
  onNavigate: (view: string, param?: string) => void;
  onLogout?: () => void;
  pendingOffersCount?: number;
  activeWorkCount?: number;
  children: React.ReactNode;
}

export const CreatorWorkspace: React.FC<Props> = ({
  currentUser,
  profile,
  activeTab,
  onTabChange,
  onNavigate,
  onLogout,
  pendingOffersCount = 0,
  activeWorkCount = 0,
  children,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    {
      id: 'overview' as CreatorTabId,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      kicker: 'Overview & telemetry',
    },
    {
      id: 'browse' as CreatorTabId,
      label: 'Browse Projects',
      icon: Search,
      badge: 'Open',
      kicker: 'Live client listings',
      action: () => onNavigate('browse'),
    },
    {
      id: 'applications' as CreatorTabId,
      label: 'My Applications',
      icon: FileText,
      badge: null,
      kicker: 'Pitches & status',
    },
    {
      id: 'offers' as CreatorTabId,
      label: 'Offers & Scope Lock',
      icon: Lock,
      badge: pendingOffersCount > 0 ? `${pendingOffersCount} New` : null,
      badgeColor: 'bg-emerald-500 text-white',
      kicker: 'Agreed budgets & terms',
    },
    {
      id: 'active_projects' as CreatorTabId,
      label: 'Active Work & Delivery',
      icon: Clock,
      badge: activeWorkCount > 0 ? `${activeWorkCount}` : null,
      badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
      kicker: 'Deliverables & WorkTrail',
    },
    {
      id: 'skills' as CreatorTabId,
      label: 'Verified Skills',
      icon: Award,
      badge: null,
      kicker: 'Client-endorsed proof',
    },
    {
      id: 'payments' as CreatorTabId,
      label: 'Earnings & Payments',
      icon: Wallet,
      badge: null,
      kicker: 'Bank UTR & UPI tracking',
    },
    {
      id: 'badges' as CreatorTabId,
      label: 'Milestones & Badges',
      icon: Sparkles,
      badge: null,
      kicker: 'Creator level progress',
    },
    {
      id: 'portfolio' as CreatorTabId,
      label: 'Proof Passport',
      icon: ExternalLink,
      badge: 'Public',
      kicker: 'Verifiable credentials',
    },
    {
      id: 'settings' as CreatorTabId,
      label: 'Profile & Settings',
      icon: Settings,
      badge: null,
      kicker: '18+ policy & session',
    },
  ];

  const getPageTitle = () => {
    switch (activeTab) {
      case 'overview':
        return 'Creator Command Center';
      case 'browse':
        return 'Find Verified Paid Projects';
      case 'applications':
        return 'My Applications & Pitches';
      case 'offers':
        return 'Formal Offers & Scope Lock';
      case 'active_projects':
        return 'Active Deliverables & Milestones';
      case 'skills':
        return 'Verified Skills & Endorsements';
      case 'payments':
        return 'Payment Tracking & Bank UTR History';
      case 'badges':
        return 'Milestones, Badges & Creator Level';
      case 'portfolio':
        return 'Public Proof Passport';
      case 'settings':
      case 'profile':
        return 'Profile, 18+ Verification & Settings';
      default:
        return 'Creator Workspace';
    }
  };

  const handleSelectNav = (item: typeof navItems[0]) => {
    if (item.action) {
      item.action();
    } else {
      onTabChange(item.id);
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Mobile Top Header */}
      <div className="md:hidden sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-extrabold text-sm text-slate-900 dark:text-white">
              Creator Workspace
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            {currentUser.name.split(' ')[0]}
          </span>
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-1 text-slate-400 hover:text-rose-500"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Desktop / Collapsible Mobile Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-40 flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Workspace Brand Zone */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
            <button
              onClick={() => onNavigate('landing')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 p-0.5 shadow-sm group-hover:scale-105 transition">
                <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-white font-black text-sm">
                  P
                </div>
              </div>
              <div>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                  <span>Proof-to-Pay</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Creator Workspace
                </div>
              </div>
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Quick Identity Pill */}
          <div className="p-4 mx-3 my-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                {(currentUser.name || 'C')[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                  {currentUser.name}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {profile.college || 'University Creator'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700/60 text-[10px]">
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="w-3 h-3" />
                <span>18+ Verified Creator</span>
              </span>
              <span className="font-mono text-slate-500">
                ₹{(profile.totalEarnedINR || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Navigation Links Scrollable Area */}
          <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Creator Workflow
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectNav(item)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition group ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 transition ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                    }`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ml-1.5 ${
                      item.badgeColor || (isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300')
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom Sidebar Footer / Action */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2 shrink-0">
            <button
              onClick={() => onNavigate('portfolio', profile.verifiedPortfolioSlug || currentUser.name.toLowerCase().replace(/\s+/g, '-'))}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition group"
            >
              <div className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>View Public Passport</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out of Account</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Workspace Workspace Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Workspace Top Bar (Breadcrumb & Live Status) */}
        <header className="hidden md:flex sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-3.5 items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-400">Creator Workspace</span>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="font-bold text-slate-900 dark:text-white">{getPageTitle()}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>100% Net Creator Pay Guaranteed</span>
            </div>

            <button
              onClick={() => onNavigate('browse')}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Browse Open Projects</span>
            </button>
          </div>
        </header>

        {/* Child Screen View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-30 md:hidden"
        />
      )}
    </div>
  );
};
