import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';

/**
 * Wraps any page that requires an active subscription.
 * On mount (and whenever subscriptionExpired flips), checks /auth/license-status.
 * If expired → redirects to /subscription.
 */
export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const { accessToken, deviceId, subscriptionExpired, setSubscriptionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [checked, setChecked] = useState(false);

  // Don't gate the subscription page itself
  const isSubscriptionPage = location.pathname === '/subscription';

  useEffect(() => {
    if (isSubscriptionPage || !accessToken) { setChecked(true); return; }

    fetch(`${API_URL}/auth/license-status`, {
      headers: { Authorization: `Bearer ${accessToken}`, 'X-Device-ID': deviceId },
    })
      .then(r => r.json())
      .then(data => {
        if (data.status === 'expired') {
          setSubscriptionExpired(true);
          navigate('/subscription', { replace: true });
        } else {
          setSubscriptionExpired(false);
        }
      })
      .catch(() => { /* offline — allow through */ })
      .finally(() => setChecked(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // If a 402 fires mid-session, redirect immediately
  useEffect(() => {
    if (subscriptionExpired && !isSubscriptionPage) {
      navigate('/subscription', { replace: true });
    }
  }, [subscriptionExpired, isSubscriptionPage, navigate]);

  if (!checked && !isSubscriptionPage) return null;

  return <>{children}</>;
}
