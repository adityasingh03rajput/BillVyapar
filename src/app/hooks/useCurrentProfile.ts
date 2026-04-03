import { useState, useEffect } from 'react';

export function useCurrentProfile() {
  const [profile, setProfile] = useState<any>(() => {
    try {
      const raw = localStorage.getItem('currentProfile');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
    } catch {
      return null;
    }
  });

  // Listen for profile changes from AppLayout
  useEffect(() => {
    const onProfileRefreshed = (e: Event) => {
      const fresh = (e as CustomEvent)?.detail;
      if (fresh) setProfile(fresh);
    };
    window.addEventListener('profileRefreshed', onProfileRefreshed);
    return () => window.removeEventListener('profileRefreshed', onProfileRefreshed);
  }, []);

  const profileId = profile?.id ?? '';

  return { profile, profileId };
}
