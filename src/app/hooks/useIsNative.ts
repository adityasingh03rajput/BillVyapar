/**
 * Returns true when running inside a Capacitor native shell (Android/iOS).
 * Falls back to false on web.
 */
export function useIsNative(): boolean {
  try {
    // Capacitor sets window.Capacitor.isNativePlatform()
    const cap = (window as any)?.Capacitor;
    if (cap && typeof cap.isNativePlatform === 'function') {
      return cap.isNativePlatform();
    }
  } catch {
    // ignore
  }
  return false;
}
