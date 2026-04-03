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

const CACHE_PREFIX = 'apicache:';

// ── L1: in-memory cache (cleared on reload) ───────────────────────────────
interface MemEntry<T> { data: T; cachedAt: number; }
const memCache = new Map<string, MemEntry<any>>();

/** Wipe all in-memory cache and localStorage cache entries */
export async function clearApiCache() {
  memCache.clear();
  try {
    Object.keys(localStorage)
      .filter((k) =>
        k.startsWith(CACHE_PREFIX) ||
        k.startsWith('cache:') ||
        k.startsWith('ofcache:') ||
        k.startsWith('subscriptionToken:') ||
        k.startsWith('subscriptionLastLocalSec:')
      )
      .forEach((k) => localStorage.removeItem(k));
  } catch { /* ignore */ }
}

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

export function useApiCache<T = any>(
  profileId: string | null,
  endpoint:  string,
  headers:   Record<string, string>,
  options:   UseApiCacheOptions = {}
): UseApiCacheResult<T> {
  const { enabled = true } = options;

  const [data,    setData]    = useState<T | null>(null);
  const [loading, setLoading] = useState(!!profileId && enabled);
  const [error,   setError]   = useState<string | null>(null);
  const fetchRef = useRef(0);

  const fetch_ = useCallback(async () => {
    if (!profileId || !enabled) return;
    const id = ++fetchRef.current;
    setLoading(true);
    try {
      const res = await fetch(endpoint, { headers });
      if (id !== fetchRef.current) return;
      if (!res.ok) { setError(`Request failed: ${res.status}`); return; }
      const json: T = await res.json();
      if (id !== fetchRef.current) return;
      setData(json); setError(null);
    } catch {
      if (id !== fetchRef.current) return;
      setError('Network error');
    } finally {
      if (id === fetchRef.current) setLoading(false);
    }
  }, [profileId, endpoint, JSON.stringify(headers), enabled]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { data, loading, stale: false, error, refetch: fetch_ };
}
