/**
 * PROOF-TO-PAY: Background Synchronization Manager
 * Coordinates offline mutation queuing, Service Worker BackgroundSync API,
 * online connectivity detection, and Supabase backend synchronization.
 */

import {
  PendingMutation,
  addPendingMutation,
  getAllPendingMutations,
  removePendingMutation,
  updateMutationStatus,
} from './offlineSyncDb';
import { supabaseService } from './supabaseService';

export type SyncState = 'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR';

export interface SyncStatusEvent {
  state: SyncState;
  pendingCount: number;
  syncedCount: number;
  lastSyncedAt: string | null;
  errorMessage?: string;
}

type SyncListener = (event: SyncStatusEvent) => void;

class SyncManager {
  private isSyncing = false;
  private lastSyncedAt: string | null = null;
  private listeners: Set<SyncListener> = new Set();
  private isInitialized = false;

  constructor() {
    // Defer initialization to client window
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  public init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // 1. Listen for standard window 'online' event
    window.addEventListener('online', () => {
      console.log('[SyncManager] Window online event detected. Initiating background flush.');
      this.flushPendingQueue('window-online');
    });

    // 2. Listen for Service Worker background sync wake-up messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'PTP_EXECUTE_BACKGROUND_SYNC') {
          console.log('[SyncManager] Received PTP_EXECUTE_BACKGROUND_SYNC from Service Worker.');
          this.flushPendingQueue('service-worker-message');
        }
      });
    }

    // 3. Initial check if already online
    if (navigator.onLine) {
      setTimeout(() => {
        this.flushPendingQueue('init-online-check');
      }, 1500);
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    this.emitStatus('IDLE', 0);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private async emitStatus(state: SyncState, syncedCount = 0, errorMessage?: string) {
    const pending = await this.getPendingCount();
    const event: SyncStatusEvent = {
      state,
      pendingCount: pending,
      syncedCount,
      lastSyncedAt: this.lastSyncedAt,
      errorMessage,
    };
    for (const listener of this.listeners) {
      listener(event);
    }
    // Also dispatch DOM event for components not using React Context
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ptp_sync_event', { detail: event }));
    }
  }

  public async getPendingCount(): Promise<number> {
    const list = await getAllPendingMutations();
    return list.filter((m) => m.status === 'PENDING' || m.status === 'FAILED').length;
  }

  /**
   * Request Service Worker Background Sync registration
   */
  private async requestServiceWorkerSync(): Promise<void> {
    if (typeof window === 'undefined') return;

    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        // Native BackgroundSync API
        await (registration as any).sync.register('ptp-sync-pending-changes');
        console.log('[SyncManager] Native ServiceWorker sync registration successful.');
        return;
      } catch (err) {
        console.warn('[SyncManager] BackgroundSync registration failed, using message fallback:', err);
      }
    }

    // Fallback: Notify active ServiceWorker via postMessage
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'TRIGGER_SYNC_CHECK',
      });
    }
  }

  /**
   * Enqueue a mutation for offline persistence and background sync
   */
  public async queueMutation(
    type: PendingMutation['type'],
    payload: Record<string, any>
  ): Promise<PendingMutation> {
    const mutation: PendingMutation = {
      id: `sync_${type.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      payload,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: 'PENDING',
    };

    await addPendingMutation(mutation);
    await this.emitStatus('IDLE');

    // Register Background Sync with Service Worker
    await this.requestServiceWorkerSync();

    // If online, trigger immediate flush
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      this.flushPendingQueue('immediate-online-enqueue');
    }

    return mutation;
  }

  /**
   * Flushes all pending mutations to the Supabase backend
   */
  public async flushPendingQueue(triggerReason = 'manual'): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing) {
      console.log('[SyncManager] Flush already in progress, skipping duplicate dispatch.');
      return { synced: 0, failed: 0 };
    }

    // Require connectivity
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('[SyncManager] Device is currently offline; mutations will remain queued.');
      await this.emitStatus('IDLE');
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    await this.emitStatus('SYNCING');

    const all = await getAllPendingMutations();
    const pendingList = all.filter((m) => m.status === 'PENDING' || m.status === 'FAILED');

    if (pendingList.length === 0) {
      this.isSyncing = false;
      await this.emitStatus('IDLE');
      return { synced: 0, failed: 0 };
    }

    console.log(`[SyncManager] Flushing ${pendingList.length} mutations triggered by ${triggerReason}`);

    let syncedCount = 0;
    let failedCount = 0;

    for (const mutation of pendingList) {
      try {
        await updateMutationStatus(mutation.id, 'SYNCING');

        // Only attempt Supabase push if backend is live / configured
        if (supabaseService.isLiveBackendConfigured()) {
          await supabaseService.syncPendingMutation(mutation);
        } else {
          // In offline sandbox demo mode, simulate successful synchronization with local DB
          console.log(`[SyncManager] Sandbox mode: Synced mutation ${mutation.id} locally.`);
        }

        // Successfully synced
        await removePendingMutation(mutation.id);
        syncedCount += 1;

        // Notify Service Worker that mutation was successfully pushed
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'PTP_MUTATION_SYNCED',
            id: mutation.id,
          });
        }
      } catch (err: any) {
        console.error(`[SyncManager] Failed to sync mutation ${mutation.id}:`, err);
        failedCount += 1;
        await updateMutationStatus(mutation.id, 'FAILED', err?.message || 'Sync failed');
      }
    }

    this.isSyncing = false;
    this.lastSyncedAt = new Date().toISOString();

    if (failedCount > 0) {
      await this.emitStatus('ERROR', syncedCount, `Synced ${syncedCount}, ${failedCount} failed.`);
    } else {
      await this.emitStatus('SUCCESS', syncedCount);
    }

    return { synced: syncedCount, failed: failedCount };
  }
}

export const syncManager = new SyncManager();
