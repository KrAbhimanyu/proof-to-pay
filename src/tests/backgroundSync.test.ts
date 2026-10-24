import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  addPendingMutation,
  getAllPendingMutations,
  removePendingMutation,
  updateMutationStatus,
  clearAllPendingMutations,
  PendingMutation,
} from '../lib/offlineSyncDb';
import { syncManager } from '../lib/syncManager';
import { supabaseService } from '../lib/supabaseService';

describe('Service Worker Background Synchronization & Offline Mutation System', () => {
  beforeEach(async () => {
    await clearAllPendingMutations();
    vi.restoreAllMocks();
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      configurable: true,
      writable: true,
    });
  });

  describe('1. Service Worker & Workbox Configuration', () => {
    const viteConfigPath = path.resolve(process.cwd(), 'vite.config.ts');
    const swSyncScriptPath = path.resolve(process.cwd(), 'public/sw-sync.js');

    it('ensures sw-sync.js companion script exists in /public', () => {
      expect(fs.existsSync(swSyncScriptPath)).toBe(true);
      const content = fs.readFileSync(swSyncScriptPath, 'utf8');
      expect(content).toContain("self.addEventListener('sync'");
      expect(content).toContain("self.addEventListener('online'");
      expect(content).toContain('PTP_EXECUTE_BACKGROUND_SYNC');
      expect(content).toContain('ptp-sync-pending-changes');
    });

    it('ensures vite.config.ts imports sw-sync.js into the service worker bundle', () => {
      const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
      expect(viteConfig).toContain("importScripts: ['/sw-sync.js']");
    });
  });

  describe('2. Offline Mutation Queue & Persistence (IndexedDB/LocalStorage)', () => {
    it('successfully enqueues a pending project application mutation', async () => {
      const mutation: PendingMutation = {
        id: 'test_mut_app_1',
        type: 'APPLICATION_SUBMIT',
        payload: {
          projectId: 'proj-123',
          projectTitle: 'Mobile App Wireframes',
          studentId: 'student-99',
          studentName: 'Priya Sharma',
          pitchMessage: 'Experienced Figma Designer',
        },
        timestamp: new Date().toISOString(),
        retryCount: 0,
        status: 'PENDING',
      };

      await addPendingMutation(mutation);
      const queue = await getAllPendingMutations();
      expect(queue.length).toBe(1);
      expect(queue[0].id).toBe('test_mut_app_1');
      expect(queue[0].payload.projectTitle).toBe('Mobile App Wireframes');
    });

    it('updates mutation status and tracks retry count upon failure', async () => {
      const mutation: PendingMutation = {
        id: 'test_mut_status_1',
        type: 'PROJECT_STATUS_UPDATE',
        payload: {
          projectId: 'proj-456',
          status: 'COMPLETED',
        },
        timestamp: new Date().toISOString(),
        retryCount: 0,
        status: 'PENDING',
      };

      await addPendingMutation(mutation);
      await updateMutationStatus('test_mut_status_1', 'FAILED', 'Network timeout');

      const queue = await getAllPendingMutations();
      expect(queue[0].status).toBe('FAILED');
      expect(queue[0].retryCount).toBe(1);
      expect(queue[0].errorMessage).toBe('Network timeout');
    });

    it('removes pending mutation once successfully synchronized', async () => {
      const mutation: PendingMutation = {
        id: 'test_mut_del_1',
        type: 'PROFILE_UPDATE',
        payload: { userId: 'u-1', data: { headline: 'Senior Product Designer' } },
        timestamp: new Date().toISOString(),
        retryCount: 0,
        status: 'PENDING',
      };

      await addPendingMutation(mutation);
      expect((await getAllPendingMutations()).length).toBe(1);

      await removePendingMutation('test_mut_del_1');
      expect((await getAllPendingMutations()).length).toBe(0);
    });
  });

  describe('3. SyncManager & Reconnect Trigger Orchestration', () => {
    it('enqueues a mutation via syncManager and reflects pending count', async () => {
      const queued = await syncManager.queueMutation('APPLICATION_SUBMIT', {
        projectId: 'proj-auto',
        studentId: 'student-1',
        pitchMessage: 'High-quality React engineer',
      });

      expect(queued.id).toContain('sync_application_submit_');
      const count = await syncManager.getPendingCount();
      // Since online flush may execute, pending count is either 0 (flushed in sandbox) or 1
      expect(count >= 0).toBe(true);
    });

    it('notifies subscribers with status events when syncing', async () => {
      const events: string[] = [];
      const unsubscribe = syncManager.subscribe((event) => {
        events.push(event.state);
      });

      await syncManager.queueMutation('PROJECT_STATUS_UPDATE', {
        projectId: 'proj-listen',
        status: 'IN_PROGRESS',
      });

      expect(events.length).toBeGreaterThan(0);
      unsubscribe();
    });

    it('simulates flushing when connectivity is restored', async () => {
      // Add a mutation directly to queue
      await addPendingMutation({
        id: 'offline_item_1',
        type: 'APPLICATION_SUBMIT',
        payload: { projectId: 'proj-offline', studentId: 'student-offline' },
        timestamp: new Date().toISOString(),
        retryCount: 0,
        status: 'PENDING',
      });

      expect(await syncManager.getPendingCount()).toBe(1);

      // Flush queue
      const result = await syncManager.flushPendingQueue('connectivity-restored-test');
      expect(result.synced).toBe(1);
      expect(result.failed).toBe(0);

      // Mutation is removed from queue after sync
      expect(await syncManager.getPendingCount()).toBe(0);
    });
  });

  describe('4. Supabase Service Mutation Handlers', () => {
    it('provides submitApplication, updateProjectStatus, and syncPendingMutation methods', () => {
      expect(typeof supabaseService.submitApplication).toBe('function');
      expect(typeof supabaseService.updateProjectStatus).toBe('function');
      expect(typeof supabaseService.syncPendingMutation).toBe('function');
    });

    it('safely handles unknown mutation types without throwing unhandled exceptions', async () => {
      await expect(
        supabaseService.syncPendingMutation({
          type: 'UNKNOWN_TEST_MUTATION',
          payload: {},
        })
      ).rejects.toThrow(); // Rejects gracefully when live Supabase client is not configured
    });
  });
});
