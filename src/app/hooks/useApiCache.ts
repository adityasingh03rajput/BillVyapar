/**
 * useApiCache — two-layer stale-while-revalidate cache.
 *
 * Layer 1: in-memory Map  — instant reads, cleared on page reload
 * Layer 2: IndexedDB      — persists across reloads, no 5 MB limit, non-blocking
 *
 * Flow on mount:
 *   1. Check memory → serve immediately if fresh
 *   2. Check IDB    → serve immediately if found (stale or fresh)
 *   3. Fetch network in background → update both layers
 *
 * Keyed per profile so switching profiles never leaks data.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { idbGet, idbSet, idbClearPrefix } from '../lib/idbCache';

const CACHE_PREFIX  = 'apicache:';
const DEFAULT_TTL   = 5 * 60 * 1000; // 5 min

// ── L1: in-memory cache (survives re-renders, cleared on reload) ──────────
interface MemEntry<T> { data: T; cachedAt: number; }
const memCache = new Map<string, MemEntry<any>>();

function memKey(profileId: string, endpoint: string) {
  return `${CACHE_PREFIX}${profileId}:${endpoint}`;
}

// ── Public helpers ────────────────────────────────────────────────────────

/** Wipe all cached API data (call on sign-out) */
export async function clearApiCache() {
  memCache.clear();
  await idbClearPrefix(CACHE_PREFIX);
  // also clear old localStorage entries from previous version
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(CACHE_PREFIX) || k.startsWith('cache:'))
      .forEach((k) => localStorage.removeItem(k));
  } catch { /* ignore */ }
}

// ── Types ─────────────────────────────────────────────────────────────────

export interface UseApiCacheOptions {
  ttlMs?:   number;
  enabled?: boolean;
}

export interface UseApiCacheResult<T> {
  data:    T | null;
  loading: boolean;
  stale:   boolean;
  error:   string | null;
  refetch: () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useApiCache<T = any>(
  profileId: string | null,
  endpoint:  string,
  headers:   Record<string, string>,
  options:   UseApiCacheOptions = {}
): UseApiCacheResult<T> {
  const { ttlMs = DEFAULT_TTL, enabled = true } = options;

  // Seed initial state from L1 synchronously so there's zero flicker on revisit
  const key = profileId ? memKey(profileId, endpoint) : '';
  const memHit = key ? memCache.get(key) : undefined;

  const [data,    setData]    = useState<T | null>(memHit?.data ?? null);
  const [loading, setLoading] = useState(!memHit && !!profileId && enabled);
  const [stale,   setStale]   = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const fetchRef = useRef(0);

  const fetch_ = useCallback(async () => {
    if (!profileId || !enabled) return;

    const id  = ++fetchRef.current;
    const now = Date.now();

    // ── L1 check ──
    const mem = memCache.get(key);
    if (mem && now - mem.cachedAt < ttlMs) {
      setData(mem.data); setLoading(false); setStale(false);
      return;
    }

    // ── L2 check (IDB) ──
    type IdbEntry = { data: T; cachedAt: number };
    const idb = await idbGet<IdbEntry>(key);
    if (idb) {
      setData(idb.data); setLoading(false);
      memCache.set(key, { data: idb.data, cachedAt: idb.cachedAt });
      if (now - idb.cachedAt < ttlMs) { setStale(false); return; }
      setStale(true); // stale — revalidate below
    } else {
      setLoading(true);
    }

    // ── Network fetch ──
    try {
      const res = await fetch(endpoint, { headers });
      if (id !== fetchRef.current) return;
      if (!res.ok) {
        if (idb) { setStale(true); setError(null); }
        else      { setError(`Request failed: ${res.status}`); }
        return;
      }
      const json: T = await res.json();
      if (id !== fetchRef.current) return;

      const entry: IdbEntry = { data: json, cachedAt: Date.now() };
      memCache.set(key, { data: json, cachedAt: entry.cachedAt });
      await idbSet(key, entry);

      setData(json); setStale(false); setError(null);
    } catch {
      if (id !== fetchRef.current) return;
      if (idb) { setStale(true); setError(null); }
      else      { setError('Network error'); }
    } finally {
      if (id === fetchRef.current) setLoading(false);
    }
  }, [profileId, endpoint, JSON.stringify(headers), ttlMs, enabled]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { data, loading, stale, error, refetch: fetch_ };
}
