/**
 * idbCache — IndexedDB-backed key/value cache.
 * Replaces localStorage for API response caching:
 *   - No 5 MB quota limit
 *   - Non-blocking (async reads/writes don't freeze the UI thread)
 *   - Survives app restarts on Android WebView
 */

const DB_NAME = 'billvyapar_cache';
const STORE   = 'entries';
const VERSION = 1;

let _db: IDBDatabase | null = null;

function openDb(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => { _db = req.result; resolve(_db); };
    req.onerror   = () => reject(req.error);
  });
}

export async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx  = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror   = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function idbSet<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx  = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror    = () => resolve();
    });
  } catch {
    // ignore
  }
}

export async function idbDelete(key: string): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx  = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror    = () => resolve();
    });
  } catch {
    // ignore
  }
}

export async function idbClearPrefix(prefix: string): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx    = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      // Empty prefix = clear everything
      if (!prefix) {
        store.clear();
        tx.oncomplete = () => resolve();
        tx.onerror    = () => resolve();
        return;
      }
      const req   = store.getAllKeys();
      req.onsuccess = () => {
        (req.result as string[])
          .filter((k) => k.startsWith(prefix))
          .forEach((k) => store.delete(k));
        resolve();
      };
      req.onerror = () => resolve();
    });
  } catch {
    // ignore
  }
}
