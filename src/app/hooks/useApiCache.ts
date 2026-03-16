/**
 * useApiCache — stale-while-revalidate cache for API calls.
 *
 * - Serves cached data immediately (no loading flash on revisit)
 * - Revalidates in the background and updates state
 * - Falls back to stale data when offline
 * - TTL-based expiry (default 5 min)
 * - Keyed per profile so switching profiles never leaks data
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const CACHE_PREFIX = 'apicache:';
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  profileId: string;
}

function cacheKey(profileId: string, endpoint: string) {
  return `${CACHE_PREFIX}${profileId}:${endpoint}`;
}

function readCache<T>(profileId: string, endpoint: string): CacheEntry<T> | null {
  try {
    const raw = localStorage.getItem(cacheKey(profileId, endpoint));
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry<T>;
  } catch {
    return null;
  }
}

function writeCache<T>(profileId: string, endpoint: string, data: T) {
  try {
    const entry: CacheEntry<T> = { data, cachedAt: Date.now(), profileId };
    localStorage.setItem(cacheKey(profileId, endpoint), JSON.stringify(entry));
  } catch {
    // storage full — ignore
  }
}

/** Call on sign-out to wipe all cached API data */
export function clearApiCache() {
  try {
    const keys = Object.keys(localStorage).filter(
      (k) => k.startsWith(CACHE_PREFIX) || k.startsWith('cache:')
    );
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

export interface UseApiCacheOptions {
  ttlMs?: number;
  /** Set false to skip fetching (e.g. missing profileId) */
  enabled?: boolean;
}

export interface UseApiCacheResult<T> {
  data: T | null;
  loading: boolean;
  /** true when serving stale data while revalidating */
  stale: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * @param profileId  Current profile id — used as cache namespace
 * @param endpoint   Full URL to fetch
 * @param headers    Request headers (Authorization, etc.)
 * @param options    TTL and enabled flag
 */
export function useApiCache<T = any>(
  profileId: string | null,
  endpoint: string,
  headers: Record<string, string>,
  options: UseApiCacheOptions = {}
): UseApiCacheResult<T> {
  const { ttlMs = DEFAULT_TTL_MS, enabled = true } = options;

  const [data, setData] = useState<T | null>(() => {
    if (!profileId) return null;
    const cached = readCache<T>(profileId, endpoint);
    return cached ? cached.data : null;
  });
  const [loading, setLoading] = useState<boolean>(() => {
    if (!profileId || !enabled) return false;
    const cached = readCache<T>(profileId, endpoint);
    return !cached; // only show loading spinner on first load
  });
  const [stale, setStale] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchRef = useRef(0);

  const fetch_ = useCallback(async () => {
    if (!profileId || !enabled) return;

    const id = ++fetchRef.current;
    const cached = readCache<T>(profileId, endpoint);
    const isExpired = !cached || Date.now() - cached.cachedAt > ttlMs;

    if (cached && !isExpired) {
      // Fresh cache — no need to revalidate
      setData(cached.data);
      setLoading(false);
      setStale(false);
      return;
    }

    if (cached) {
      // Stale — serve immediately, revalidate in background
      setData(cached.data);
      setStale(true);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const res = await fetch(endpoint, { headers });
      if (id !== fetchRef.current) return; // stale request
      if (!res.ok) {
        if (cached) {
          // Serve stale on error
          setStale(true);
          setError(null);
        } else {
          setError(`Request failed: ${res.status}`);
        }
        return;
      }
      const json: T = await res.json();
      if (id !== fetchRef.current) return;
      writeCache(profileId, endpoint, json);
      setData(json);
      setStale(false);
      setError(null);
    } catch {
      if (id !== fetchRef.current) return;
      if (cached) {
        setStale(true); // offline — serve stale
        setError(null);
      } else {
        setError('Network error');
      }
    } finally {
      if (id === fetchRef.current) setLoading(false);
    }
  }, [profileId, endpoint, JSON.stringify(headers), ttlMs, enabled]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  return { data, loading, stale, error, refetch: fetch_ };
}
