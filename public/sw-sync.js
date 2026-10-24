/**
 * PROOF-TO-PAY: Service Worker Background Sync Companion
 * File: public/sw-sync.js
 * Imported by Workbox into sw.js via workbox.importScripts
 */

const SYNC_TAG = 'ptp-sync-pending-changes';
const DB_NAME = 'ProofToPayOfflineSyncDb';
const DB_VERSION = 1;
const STORE_NAME = 'pending_mutations';

// Helper to open IndexedDB inside Service Worker
function openSyncDatabase() {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null);
      return;
    }
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

// Retrieve pending mutations directly in Service Worker
async function getPendingMutationsFromDb() {
  const db = await openSyncDatabase();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

// Delete successfully processed mutation
async function removeMutationFromDb(id) {
  const db = await openSyncDatabase();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

// Broadcast event to all controlled client windows
async function broadcastToClients(message) {
  if (self.clients) {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      client.postMessage(message);
    }
  }
}

// Core background sync processing
async function executeBackgroundSync(source) {
  console.log(`[SW BackgroundSync] Triggered by ${source} at ${new Date().toISOString()}`);

  const pendingList = await getPendingMutationsFromDb();
  const uncompleted = pendingList.filter((m) => m.status === 'PENDING' || m.status === 'FAILED');

  if (uncompleted.length === 0) {
    console.log('[SW BackgroundSync] No pending mutations in queue.');
    return;
  }

  console.log(`[SW BackgroundSync] Found ${uncompleted.length} pending mutations to push to Supabase.`);

  // 1. Alert open windows to execute authenticated Supabase push
  await broadcastToClients({
    type: 'PTP_EXECUTE_BACKGROUND_SYNC',
    source,
    pendingCount: uncompleted.length,
    timestamp: Date.now(),
  });
}

// 1. Listen for browser Background Sync event
self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG || event.tag === 'sync-pending-mutations') {
    console.log(`[SW BackgroundSync] Native sync event caught for tag: ${event.tag}`);
    event.waitUntil(executeBackgroundSync('native-sync-event'));
  }
});

// 2. Listen for connectivity restoration within ServiceWorker context
self.addEventListener('online', () => {
  console.log('[SW BackgroundSync] Service worker detected network connectivity restored.');
  executeBackgroundSync('sw-online-event');
});

// 3. Handle messages from client windows
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'TRIGGER_SYNC_CHECK') {
    executeBackgroundSync('client-message-trigger');
  }

  if (event.data.type === 'PTP_MUTATION_SYNCED') {
    if (event.data.id) {
      removeMutationFromDb(event.data.id);
    }
  }
});
