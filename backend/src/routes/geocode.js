import { Router } from 'express';

export const geocodeRouter = Router();

// ── LRU cache — keyed at ~10m precision for high hit-rate ────────────────────
// 4 decimal places ≈ 11m grid — good balance between cache hits and accuracy.
const locationCache = new Map();
const CACHE_LIMIT   = 10_000;
const CACHE_TTL_MS  = 24 * 60 * 60 * 1000; // 24h — addresses don't change often

function cacheKey(lat, lng) {
  return `${Number(lat).toFixed(4)},${Number(lng).toFixed(4)}`;
}

function cleanCache() {
  if (locationCache.size <= CACHE_LIMIT) return;
  // Evict oldest 20% of entries
  const evict = Math.floor(CACHE_LIMIT * 0.2);
  const keys = Array.from(locationCache.keys()).slice(0, evict);
  keys.forEach(k => locationCache.delete(k));
}

/**
 * GET /geocode?lat=XX&lng=YY
 *
 * Reverse geocoding with two-tier strategy:
 *   1. Google Maps Geocoding API (accurate, structured) — if key is configured
 *   2. Nominatim / OpenStreetMap (free fallback)
 *
 * Results are cached for 24h at ~11m grid precision.
 */
geocodeRouter.get('/', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (isNaN(latNum) || isNaN(lngNum)) return res.status(400).json({ error: 'Invalid coordinates' });

    const key = cacheKey(latNum, lngNum);

    // ── Cache hit ─────────────────────────────────────────────────────────
    const cached = locationCache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return res.json({ address: cached.address, fromCache: true });
    }

    cleanCache();

    const googleKey = process.env.GOOGLE_MAPS_API_KEY;

    // ── Primary: Google Maps Geocoding API ────────────────────────────────
    if (googleKey) {
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latNum},${lngNum}&key=${googleKey}&language=en&result_type=street_address|route|sublocality|locality`;
        const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
        if (r.ok) {
          const data = await r.json();
          if (data.status === 'OK' && data.results?.length > 0) {
            // Use the most specific result — first result is always most precise
            const result = data.results[0];
            // Build a short readable address from components
            const comps = result.address_components || [];
            const get = (type) => comps.find(c => c.types.includes(type))?.long_name ?? '';
            const parts = [
              get('subpremise') || get('premise'),
              get('street_number') ? `${get('street_number')} ${get('route')}`.trim() : get('route'),
              get('sublocality_level_1') || get('sublocality') || get('neighborhood'),
              get('locality') || get('administrative_area_level_2'),
            ].filter(Boolean);

            const address = parts.length >= 2
              ? parts.join(', ')
              : result.formatted_address?.split(',').slice(0, 3).join(',') ?? 'Unknown';

            locationCache.set(key, { address, ts: Date.now() });
            return res.json({ address, fromCache: false, source: 'google' });
          }
        }
      } catch { /* fall through to Nominatim */ }
    }

    // ── Fallback: Nominatim (OpenStreetMap) ───────────────────────────────
    const nomUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latNum}&lon=${lngNum}&format=json&zoom=18&addressdetails=1`;
    const nomRes = await fetch(nomUrl, {
      headers: { 'User-Agent': 'BillVyapar-Tracking/2.0' },
      signal: AbortSignal.timeout(5000),
    });

    if (nomRes.ok) {
      const data = await nomRes.json();
      const a = data.address || {};
      const parts = [
        a.house_number ? `${a.house_number} ${a.road || a.pedestrian || ''}`.trim() : (a.road || a.pedestrian || a.footway),
        a.suburb || a.neighbourhood || a.village || a.town,
        a.city || a.county,
        a.state,
      ].filter(Boolean);

      const address = parts.length
        ? parts.join(', ')
        : data.display_name?.split(',').slice(0, 3).join(', ') ?? 'Unknown Area';

      locationCache.set(key, { address, ts: Date.now() });
      return res.json({ address, fromCache: false, source: 'nominatim' });
    }

    return res.json({ address: 'Unknown Location', fromCache: false });
  } catch (err) {
    res.json({ address: 'Unknown Location', fromCache: false, error: err.message });
  }
});
