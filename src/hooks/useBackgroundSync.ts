import { useState, useEffect, useCallback } from 'react';
import { syncManager, SyncStatusEvent } from '../lib/syncManager';

export function useBackgroundSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatusEvent>({
    state: 'IDLE',
    pendingCount: 0,
    syncedCount: 0,
    lastSyncedAt: null,
  });

  useEffect(() => {
    const unsubscribe = syncManager.subscribe((event) => {
      setSyncStatus(event);
    });

    // Initial check
    syncManager.getPendingCount().then((count) => {
      setSyncStatus((prev) => ({ ...prev, pendingCount: count }));
    });

    return unsubscribe;
  }, []);

  const syncNow = useCallback(async () => {
    return await syncManager.flushPendingQueue('user-manual-action');
  }, []);

  return {
    syncStatus,
    isSyncing: syncStatus.state === 'SYNCING',
    pendingCount: syncStatus.pendingCount,
    lastSyncedAt: syncStatus.lastSyncedAt,
    syncNow,
  };
}
