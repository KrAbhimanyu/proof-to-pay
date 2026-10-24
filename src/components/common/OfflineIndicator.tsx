import React, { useState, useEffect } from 'react';
import { useOnlineStatus } from '../../hooks/usePWAInstall';
import { useBackgroundSync } from '../../hooks/useBackgroundSync';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { isSyncing, pendingCount, syncNow } = useBackgroundSync();
  const [showRecentSyncToast, setShowRecentSyncToast] = useState(false);

  useEffect(() => {
    const handleSyncEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.state === 'SUCCESS' && customEvent.detail?.syncedCount > 0) {
        setShowRecentSyncToast(true);
        const timer = setTimeout(() => setShowRecentSyncToast(false), 3500);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('ptp_sync_event', handleSyncEvent);
    return () => window.removeEventListener('ptp_sync_event', handleSyncEvent);
  }, []);

  // When online, fully idle, and no recent sync toast, don't show floating badge
  if (isOnline && pendingCount === 0 && !isSyncing && !showRecentSyncToast) {
    return null;
  }

  // 1. Offline Mode with pending mutation count
  if (!isOnline) {
    return (
      <div className="fixed bottom-16 md:bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-600 text-white px-3.5 py-2 text-xs font-medium shadow-xl">
        <WifiOff className="w-4 h-4 flex-shrink-0" />
        <span>
          Offline Mode — {pendingCount > 0 ? `${pendingCount} change${pendingCount > 1 ? 's' : ''} saved locally. Will sync automatically.` : 'Changes saved locally.'}
        </span>
      </div>
    );
  }

  // 2. Actively syncing changes to Supabase
  if (isSyncing) {
    return (
      <div className="fixed bottom-16 md:bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-sky-600 text-white px-3.5 py-2 text-xs font-medium shadow-xl">
        <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />
        <span>Syncing changes to Supabase backend...</span>
      </div>
    );
  }

  // 3. Online with pending changes (e.g., waiting for background flush)
  if (pendingCount > 0) {
    return (
      <div className="fixed bottom-16 md:bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-indigo-600 text-white px-3.5 py-2 text-xs font-medium shadow-xl">
        <RefreshCw className="w-4 h-4 flex-shrink-0" />
        <span>{pendingCount} change{pendingCount > 1 ? 's' : ''} queued.</span>
        <button
          onClick={() => syncNow()}
          className="ml-1 rounded bg-white/20 px-2 py-0.5 text-[11px] font-bold hover:bg-white/30 transition"
        >
          Sync Now
        </button>
      </div>
    );
  }

  // 4. Just synchronized notification
  if (showRecentSyncToast) {
    return (
      <div className="fixed bottom-16 md:bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-emerald-600 text-white px-3.5 py-2 text-xs font-medium shadow-xl">
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
        <span>Changes successfully synced with Supabase backend!</span>
      </div>
    );
  }

  return null;
};
