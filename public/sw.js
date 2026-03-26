const CACHE = 'bv-v4';
const API_CACHE = 'bv-api-v4';

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['/'])));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE && k !== API_CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.hostname.includes('mongodb')) return;
  if (url.hostname.includes('nominatim')) return;
  if (url.hostname.includes('googleapis')) return;

  // ── Hashed assets — cache first forever ──────────────────────────────────
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          if (res.ok) {
            // Clone BEFORE consuming — fixes "body already used" error
            caches.open(CACHE).then(c => c.put(request, res.clone()));
          }
          return res;
        });
      })
    );
    return;
  }

  // ── API calls — stale-while-revalidate ────────────────────────────────────
  const isApiCall = url.pathname.startsWith('/customers') ||
    url.pathname.startsWith('/suppliers') ||
    url.pathname.startsWith('/items') ||
    url.pathname.startsWith('/documents') ||
    url.pathname.startsWith('/analytics') ||
    url.pathname.startsWith('/employees') ||
    url.pathname.startsWith('/attendance');

  if (isApiCall) {
    e.respondWith(
      caches.open(API_CACHE).then(async cache => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request).then(res => {
          if (res.ok) {
            // Clone BEFORE consuming — fixes "body already used" error
            cache.put(request, res.clone());
          }
          return res;
        }).catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // ── HTML navigation — network first ──────────────────────────────────────
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then(res => {
          if (res.ok) {
            // Clone BEFORE consuming
            caches.open(CACHE).then(c => c.put(request, res.clone()));
          }
          return res;
        })
        .catch(() => caches.match(request).then(c => c || caches.match('/')))
    );
    return;
  }
});
