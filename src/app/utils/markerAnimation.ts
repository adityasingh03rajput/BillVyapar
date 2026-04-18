/**
 * markerAnimation.ts — Google-level smooth marker movement
 *
 * animateMarker  : smooth cubic-bezier interpolation between two lat/lng points
 * bearing        : compass heading between two points (degrees 0-360)
 * haversineM     : distance in metres between two points
 * encodeDigiPin  : Indian national digital address (DigiPin)
 */

export interface LatLng { lat: number; lng: number }

/** Cubic ease-out — fast start, smooth deceleration (feels like real movement) */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Smoothly moves a Google Maps marker from start to end over durationMs.
 * Uses cubic ease-out for natural deceleration.
 * Returns a cancel function — call it to abort mid-animation.
 */
export function animateMarker(
  marker: any,
  start: LatLng,
  end: LatLng,
  durationMs = 1500,
): () => void {
  let rafId: number | null = null;
  let cancelled = false;
  const startTime = performance.now();

  // Skip animation if distance is negligible — avoids jitter on stationary pings
  const dist = haversineM(start, end);
  if (dist < 1) {
    marker.setPosition(end);
    return () => {};
  }

  function frame(now: number) {
    if (cancelled) return;
    const progress = Math.min((now - startTime) / durationMs, 1);
    const ease = easeOutCubic(progress);
    marker.setPosition({
      lat: start.lat + (end.lat - start.lat) * ease,
      lng: start.lng + (end.lng - start.lng) * ease,
    });
    if (progress < 1) {
      rafId = requestAnimationFrame(frame);
    }
  }

  rafId = requestAnimationFrame(frame);
  return () => {
    cancelled = true;
    if (rafId !== null) cancelAnimationFrame(rafId);
    marker.setPosition(end);
  };
}

/**
 * Compute compass bearing in degrees (0=North, 90=East, clockwise)
 */
export function bearing(from: LatLng, to: LatLng): number {
  const phi1 = (from.lat * Math.PI) / 180;
  const phi2 = (to.lat * Math.PI) / 180;
  const dl = ((to.lng - from.lng) * Math.PI) / 180;
  const y = Math.sin(dl) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dl);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/**
 * Haversine distance in metres between two lat/lng points.
 */
export function haversineM(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/**
 * encodeDigiPin — Indian national digital address system (10 chars, ~4x4m grid)
 */
const DIGIPIN_CHARS = "23456789CJKLMPFT";

export function encodeDigiPin(lat: number, lng: number): string {
  const MIN_LAT = 2.5, MAX_LAT = 38.5;
  const MIN_LNG = 63.5, MAX_LNG = 99.5;

  if (lat < MIN_LAT || lat > MAX_LAT || lng < MIN_LNG || lng > MAX_LNG) {
    return "GLOBAL";
  }

  let code = "";
  let curMinLat = MIN_LAT, curMaxLat = MAX_LAT;
  let curMinLng = MIN_LNG, curMaxLng = MAX_LNG;

  for (let i = 0; i < 10; i++) {
    const latStep = (curMaxLat - curMinLat) / 4;
    const lngStep = (curMaxLng - curMinLng) / 4;

    let row = Math.floor((curMaxLat - lat) / latStep);
    if (row < 0) row = 0; if (row > 3) row = 3;
    let col = Math.floor((lng - curMinLng) / lngStep);
    if (col < 0) col = 0; if (col > 3) col = 3;

    code += DIGIPIN_CHARS[row * 4 + col];

    curMaxLat = curMaxLat - row * latStep;
    curMinLat = curMaxLat - latStep;
    curMinLng = curMinLng + col * lngStep;
    curMaxLng = curMinLng + lngStep;

    if (i === 4) code += "-";
  }

  return code;
}
