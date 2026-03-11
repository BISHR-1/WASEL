const DEFAULT_PUBLIC_APP_URL = 'https://waselstore.com';

function normalizeBaseUrl(url) {
  const trimmed = String(url || '').trim();
  if (!trimmed) return '';
  return trimmed.replace(/\/+$/, '');
}

export function getPublicAppBaseUrl() {
  const configured = normalizeBaseUrl(import.meta.env.VITE_WASEL_OFFICIAL_SITE_URL);
  if (configured) return configured;

  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = normalizeBaseUrl(window.location.origin);
    if (/localhost|127\.0\.0\.1/i.test(origin)) return DEFAULT_PUBLIC_APP_URL;
    return origin;
  }

  return DEFAULT_PUBLIC_APP_URL;
}

export function buildPublicAppUrl(path = '/') {
  const base = getPublicAppBaseUrl();
  const normalizedPath = String(path || '/').startsWith('/') ? String(path || '/') : `/${path}`;
  return `${base}${normalizedPath}`;
}
