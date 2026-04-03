/**
 * offlineFetch — plain fetch with a 15s timeout.
 * Caching removed; always fetches fresh from the network.
 */

export async function offlineFetch(
  url: string,
  options?: RequestInit,
): Promise<any> {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 15000);

  try {
    const res = await fetch(url, {
      ...options,
      signal: options?.signal ?? ctrl.signal,
    });
    clearTimeout(timeout);

    const data = await res.clone().json().catch(() => ({}));
    return data;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

/** No-op — kept for call-site compatibility */
export function clearOfflineCache() {}
