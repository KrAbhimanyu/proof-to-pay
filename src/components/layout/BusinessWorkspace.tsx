import React, { useState } from 'react';
import { User, BusinessProfile } from '../../types';
import {
  LayoutDashboard,
  PlusCircle,
  Briefcase,
  Users,
  CheckSquare,
  CreditCard,
  ShieldCheck,
  Building2,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export type BusinessTabId =
  | 'overview'
  | 'projects'
  | 'create_project'
  | 'applications'
  | 'active_work'
  | 'payments'
  | 'verification';

interface Props {
  currentUser: User;
  profile: BusinessProfile;
  activeTab: BusinessTabId;
  onTabChange: (tab: BusinessTabId) => void;
  onNavigate: (view: string, param?: string) => void;
  onLogout?: () => void;
  pendingReviewsCount?: number;
  applicantsCount?: number;
  children: React.ReactNode;
}

export const BusinessWorkspace: React.FC<Props> = ({
  currentUser,
  profile,
  activeTab,
  onTabChange,
  onNavigate,
  onLogout,
  pendingReviewsCount = 0,
  applicantsCount = 0,
  children,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    {
      id: 'overview' as BusinessTabId,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      kicker: 'Spend & hiring telemetry',
    },
    {
      id: 'create_project' as BusinessTabId,
      label: 'Post New Project',
      icon: PlusCircle,
      badge: 'New',
      badgeColor: 'bg-emerald-600 text-white',
      kicker: 'Scope lock & deliverables',
    },
    {
      id: 'projects' as BusinessTabId,
      label: 'My Projects',
      icon: Briefcase,
      badge: null,
      kicker: 'Active & draft listings',
    },
    {
      id: 'applications' as BusinessTabId,
      label: 'Applications & Talent',
      icon: Users,
      badge: applicantsCount > 0 ? `${applicantsCount}` : null,
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
      kicker: 'Review pitches & issue offers',
    },
    {
      id: 'active_work' as BusinessTabId,
      label: 'Deliverables Review',
      icon: CheckSquare,
      badge: pendingReviewsCount > 0 ? `${pendingReviewsCount} Due` : null,
      badgeColor: 'bg-amber-500 text-white',
      kicker: 'Approve or request revisions',
    },
    {
      id: 'payments' as BusinessTabId,
      label: 'Payments & Platform Fees',
      icon: CreditCard,
      badge: null,
      kicker: 'Bank UTR & 5% fee reporting',
    },
    {
      id: 'verification' as BusinessTabId,
      label: 'Company Verification',
      icon: ShieldCheck,
      badge: profile.verificationStatus === 'VERIFIED' ? 'Verified' : 'Pending',
      badgeColor: profile.verificationStatus === 'VERIFIED'
        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
      kicker: 'GSTIN, CIN, PAN, or MSME',
    },
  ];

  const getPageTitle = () => {
    switch (activeTab) {
      case 'overview':
        return 'Business Management Center';
      case 'create_project':
        return 'Post New Project with Scope Lock';
      case 'projects':
        return 'My Project Listings';
      case 'applications':
        return 'Applicant Review & Formal Offers';
      case 'active_work':
        return 'Deliverables Review & Milestone Approvals';
      case 'payments':
        return 'Creator Payouts & Platform Fee Settlement';
      case 'verification':
        return 'Indian Business Entity Verification';
      default:
        return 'Business Portal';
    }
  };

  const handleSelectNav = (tabId: BusinessTabId) => {
    onTabChange(tabId);
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
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="font-extrabold text-sm text-slate-900 dark:text-white">
              Business Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[120px]">
            {profile.companyName || currentUser.name}
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
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 p-0.5 shadow-sm group-hover:scale-105 transition">
                <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-white font-black text-sm">
                  P
                </div>
              </div>
              <div>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                  <span>Proof-to-Pay</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Business Client Portal
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

          {/* Company Quick Identity Card */}
          <div className="p-4 mx-3 my-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                {(profile.companyName || currentUser.name || 'B')[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                  {profile.companyName || currentUser.name}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {profile.industry} · {profile.city || 'India'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700/60 text-[10px]">
              <span className={`inline-flex items-center gap-1 font-bold ${
                profile.verificationStatus === 'VERIFIED'
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-amber-700 dark:text-amber-400'
              }`}>
                <ShieldCheck className="w-3 h-3" />
                <span>{profile.verificationStatus === 'VERIFIED' ? '✓ GSTIN / CIN Verified' : 'Entity Unverified'}</span>
              </span>
              <span className="font-mono text-slate-500">
                ₹{(profile.totalSpentINR || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Navigation Links Scrollable Area */}
          <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Hiring & Project Management
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectNav(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
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

          {/* Bottom Sidebar Action: Post Project CTA & Sign Out */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2 shrink-0">
            <button
              onClick={() => handleSelectNav('create_project')}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post New Project</span>
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
            <span className="font-semibold text-slate-400">Business Client Workspace</span>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="font-bold text-slate-900 dark:text-white">{getPageTitle()}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Binding Scope Lockdown Active</span>
            </div>

            <button
              onClick={() => handleSelectNav('create_project')}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Post Project</span>
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
