/**
 * PROOF-TO-PAY: Dual-compatible IndexedDB & LocalStorage Offline Sync Store
 * Operates in both Window and ServiceWorkerGlobalScope environments.
 */

export interface PendingMutation {
  id: string;
  type: 'APPLICATION_SUBMIT' | 'PROJECT_STATUS_UPDATE' | 'PROFILE_UPDATE' | 'SUBMISSION_CREATE';
  payload: Record<string, any>;
  timestamp: string;
  retryCount: number;
  status: 'PENDING' | 'SYNCING' | 'FAILED' | 'COMPLETED';
  errorMessage?: string;
}

const DB_NAME = 'ProofToPayOfflineSyncDb';
const DB_VERSION = 1;
const STORE_NAME = 'pending_mutations';
const LOCAL_STORAGE_KEY = 'ptp_pending_sync_queue';

function openIndexedDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null);
      return;
    }

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

/**
 * Fallback to localStorage or in-memory when IndexedDB is unavailable
 */
let inMemoryStore: PendingMutation[] = [];

function getLocalStorageQueue(): PendingMutation[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    }
    return inMemoryStore;
  } catch {
    return inMemoryStore;
  }
}

function setLocalStorageQueue(queue: PendingMutation[]) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(queue));
    }
    inMemoryStore = queue;
  } catch {
    inMemoryStore = queue;
  }
}

export async function addPendingMutation(mutation: PendingMutation): Promise<void> {
  const db = await openIndexedDB();
  if (db) {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(mutation);
        tx.oncomplete = () => {
          // Keep localStorage in sync for window introspection
          const current = getLocalStorageQueue().filter(m => m.id !== mutation.id);
          setLocalStorageQueue([...current, mutation]);
          resolve();
        };
        tx.onerror = () => {
          // Fallback to localStorage
          const current = getLocalStorageQueue().filter(m => m.id !== mutation.id);
          setLocalStorageQueue([...current, mutation]);
          resolve();
        };
      } catch {
        const current = getLocalStorageQueue().filter(m => m.id !== mutation.id);
        setLocalStorageQueue([...current, mutation]);
        resolve();
      }
    });
  } else {
    const current = getLocalStorageQueue().filter(m => m.id !== mutation.id);
    setLocalStorageQueue([...current, mutation]);
  }
}

export async function getAllPendingMutations(): Promise<PendingMutation[]> {
  const db = await openIndexedDB();
  if (db) {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const results = (req.result || []) as PendingMutation[];
          if (results.length > 0) {
            resolve(results);
          } else {
            resolve(getLocalStorageQueue());
          }
        };
        req.onerror = () => {
          resolve(getLocalStorageQueue());
        };
      } catch {
        resolve(getLocalStorageQueue());
      }
    });
  }
  return getLocalStorageQueue();
}

export async function removePendingMutation(id: string): Promise<void> {
  const db = await openIndexedDB();
  if (db) {
    await new Promise<void>((resolve) => {
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
  const current = getLocalStorageQueue().filter(m => m.id !== id);
  setLocalStorageQueue(current);
}

export async function updateMutationStatus(
  id: string,
  status: PendingMutation['status'],
  errorMessage?: string
): Promise<void> {
  const all = await getAllPendingMutations();
  const target = all.find(m => m.id === id);
  if (target) {
    target.status = status;
    if (status === 'FAILED') {
      target.retryCount += 1;
      target.errorMessage = errorMessage;
    }
    await addPendingMutation(target);
  }
}

export async function clearAllPendingMutations(): Promise<void> {
  const db = await openIndexedDB();
  if (db) {
    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }
  setLocalStorageQueue([]);
}
