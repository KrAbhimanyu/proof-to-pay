import React, { useState, useEffect } from 'react';
import { useOnlineStatus } from '../../hooks/usePWAInstall';
import { useBackgroundSync } from '../../hooks/useBackgroundSync';

export const OfflineSyncBanner: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { isSyncing, pendingCount, syncNow } = useBackgroundSync();
  const [showRecentSyncToast, setShowRecentSyncToast] = useState(false);

  useEffect(() => {
    const handleSyncEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.state === 'SUCCESS' && customEvent.detail?.syncedCount > 0) {
        setShowRecentSyncToast(true);
        const timer = setTimeout(() => setShowRecentSyncToast(false), 4000);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('ptp_sync_event', handleSyncEvent);
    return () => window.removeEventListener('ptp_sync_event', handleSyncEvent);
  }, []);

  if (isOnline && pendingCount === 0 && !isSyncing && !showRecentSyncToast) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-auto">
      {/* Offline Status with Pending Count */}
      {!isOnline && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-slate-900/95 px-4 py-2.5 text-xs font-medium text-amber-200 shadow-xl backdrop-blur-md">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <div className="flex-1">
            <p className="font-semibold text-amber-300">Offline Mode Active</p>
            <p className="text-[11px] text-amber-200/80">
              {pendingCount > 0
                ? `${pendingCount} change${pendingCount > 1 ? 's' : ''} queued locally. Will sync to Supabase once online.`
                : 'Changes will be saved locally and pushed when connectivity returns.'}
            </p>
          </div>
        </div>
      )}

      {/* Actively Syncing Indicator */}
      {isOnline && isSyncing && (
        <div className="flex items-center gap-3 rounded-xl border border-sky-500/30 bg-slate-900/95 px-4 py-2.5 text-xs font-medium text-sky-200 shadow-xl backdrop-blur-md">
          <svg className="animate-spin h-4 w-4 text-sky-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <div className="flex-1">
            <p className="font-semibold text-sky-300">Background Syncing</p>
            <p className="text-[11px] text-sky-200/80">Pushing pending changes to Supabase backend...</p>
          </div>
        </div>
      )}

      {/* Online but has pending items (e.g., retrying or waiting for flush) */}
      {isOnline && !isSyncing && pendingCount > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-indigo-500/30 bg-slate-900/95 px-4 py-2.5 text-xs font-medium text-indigo-200 shadow-xl backdrop-blur-md">
          <div>
            <p className="font-semibold text-indigo-300">Pending Local Changes</p>
            <p className="text-[11px] text-indigo-200/80">{pendingCount} item{pendingCount > 1 ? 's' : ''} ready to sync.</p>
          </div>
          <button
            onClick={() => syncNow()}
            className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-indigo-500 transition"
          >
            Sync Now
          </button>
        </div>
      )}

      {/* Recent Sync Success Toast */}
      {showRecentSyncToast && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-slate-900/95 px-4 py-2 text-xs font-medium text-emerald-200 shadow-xl backdrop-blur-md">
          <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>All local changes synchronized with Supabase!</span>
        </div>
      )}
    </div>
  );
};
