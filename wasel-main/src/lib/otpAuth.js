const STORAGE_KEY = 'wasel_otp_session';

const normalizeExpiry = (exp) => {
  if (!exp) return null;
  if (typeof exp === 'number') return exp;

  if (exp instanceof Date) {
    return exp.getTime();
  }

  if (typeof exp === 'string') {
    const parsed = Date.parse(exp);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

export const getOtpSession = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const session = JSON.parse(raw);
    const expMs = normalizeExpiry(session?.exp);

    if (!expMs || Date.now() > expMs) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return { ...session, exp: expMs };
  } catch (err) {
    return null;
  }
};

export const setOtpSession = (session) => {
  const expMs = normalizeExpiry(session?.exp);
  if (!expMs) return;

  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...session,
    exp: expMs,
  }));
};

export const clearOtpSession = () => {
  localStorage.removeItem(STORAGE_KEY);
};