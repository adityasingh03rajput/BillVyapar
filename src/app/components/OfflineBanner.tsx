import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

/**
 * OfflineBanner — shows a slim top banner on web when the device goes offline.
 * On native (Capacitor) the MobileLayout header already shows the wifi indicator,
 * so this component is only rendered on web.
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [visible, setVisible] = useState(!navigator.onLine);

  useEffect(() => {
    const goOnline  = () => { setOffline(false); setTimeout(() => setVisible(false), 2000); };
    const goOffline = () => { setOffline(true); setVisible(true); };
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed top-0 inset-x-0 z-[9999] flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors duration-500 ${
        offline ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
      }`}
    >
      <WifiOff className="h-4 w-4" />
      {offline ? 'No internet connection — working offline' : 'Back online'}
    </div>
  );
}
