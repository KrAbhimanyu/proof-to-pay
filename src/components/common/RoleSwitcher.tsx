import React, { useState } from 'react';
import { User, UserRole } from '../../types';
import { marketplaceStore } from '../../lib/storage';
import { Users, Shield, Building2, GraduationCap, RotateCcw, Smartphone, Monitor } from 'lucide-react';

interface Props {
  currentUser: User | null;
  onUserChange: (user: User | null) => void;
  isAndroidView: boolean;
  onToggleAndroidView: () => void;
  onOpenAndroidGuide: () => void;
}

export const RoleSwitcher: React.FC<Props> = ({
  currentUser,
  onUserChange,
  isAndroidView,
  onToggleAndroidView,
  onOpenAndroidGuide,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const users = marketplaceStore.getUsers();

  const handleSelect = (user: User | null) => {
    marketplaceStore.setCurrentUserId(user ? user.id : null);
    onUserChange(user);
    setIsOpen(false);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all demo data back to default test state?')) {
      marketplaceStore.resetToDefaults();
      onUserChange(marketplaceStore.getCurrentUser());
      window.location.reload();
    }
  };

  const getRoleBadge = (role?: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'BUSINESS':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'STUDENT':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-xs py-1.5 px-3 select-none z-40 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 flex-wrap">
        {/* Left: Current Active Role status & selector */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium hidden sm:inline">Role Sandbox:</span>
          
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
            >
              {currentUser?.role === 'STUDENT' && <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />}
              {currentUser?.role === 'BUSINESS' && <Building2 className="w-3.5 h-3.5 text-blue-400" />}
              {currentUser?.role === 'ADMIN' && <Shield className="w-3.5 h-3.5 text-purple-400" />}
              {!currentUser && <Users className="w-3.5 h-3.5 text-slate-400" />}
              
              <span>{currentUser ? `${currentUser.name} (${currentUser.role})` : 'Public Visitor (Logged Out)'}</span>
              <span className="text-[10px] text-slate-400 ml-1">▼</span>
            </button>

            {isOpen && (
              <div className="absolute top-full left-0 mt-1 w-72 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 text-slate-200 space-y-1">
                <div className="text-[10px] font-semibold tracking-wider text-slate-400 px-2 py-1 uppercase">
                  Switch Active Role & Account
                </div>

                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleSelect(u)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition ${
                      currentUser?.id === u.id ? 'bg-indigo-600/30 text-white font-semibold' : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="truncate">
                      <div className="font-medium truncate">{u.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{u.email}</div>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border ${getRoleBadge(u.role)}`}>
                      {u.role}
                    </span>
                  </button>
                ))}

                <button
                  onClick={() => handleSelect(null)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition ${
                    !currentUser ? 'bg-indigo-600/30 text-white font-semibold' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="font-medium">Public Visitor (Sign In / Register)</div>
                  <div className="text-[10px] text-slate-400">View landing page as an unregistered visitor</div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Android Mode Viewport Toggle & Reset */}
        <div className="flex items-center gap-2">
          {/* Android device preview toggle */}
          <button
            onClick={onToggleAndroidView}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
              isAndroidView
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Toggle between full responsive desktop view and Android Mobile Shell"
          >
            {isAndroidView ? (
              <>
                <Smartphone className="w-3.5 h-3.5 text-emerald-200" />
                <span className="font-semibold">📱 Android App Mode</span>
              </>
            ) : (
              <>
                <Monitor className="w-3.5 h-3.5 text-slate-400" />
                <span>Switch to Android View</span>
              </>
            )}
          </button>

          {/* Android APK / App guide modal trigger */}
          <button
            onClick={onOpenAndroidGuide}
            className="hidden md:flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 transition"
          >
            <Smartphone className="w-3 h-3" />
            <span>Android APK Guide</span>
          </button>

          {/* Reset test data */}
          <button
            onClick={handleResetData}
            title="Reset sandbox data"
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset Sandbox</span>
          </button>
        </div>
      </div>
    </div>
  );
};
