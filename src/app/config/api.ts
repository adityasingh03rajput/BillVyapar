const DEFAULT_API_URL = 'http://localhost:4000';

const raw = import.meta.env.VITE_API_URL;

const normalizeApiUrl = (value?: string) => {
  if (!value) return DEFAULT_API_URL;

  const trimmed = value.trim();
  if (!trimmed) return DEFAULT_API_URL;

  // Prevent accidental relative values like "/" or "/api" which would hit the Vite origin.
  if (trimmed.startsWith('/')) return DEFAULT_API_URL;

  // Accept only absolute http(s) URLs.
  try {
    const u = new URL(trimmed);
    if (u.protocol === 'http:' || u.protocol === 'https:') return u.origin;
    return DEFAULT_API_URL;
  } catch {
    return DEFAULT_API_URL;
  }
};

export const API_URL = normalizeApiUrl(raw);
