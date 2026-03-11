import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'wasel_usd_syp_rate_v1';
const LAST_FETCH_KEY = 'wasel_usd_syp_rate_last_fetch_v1';
const RATE_UPDATED_EVENT = 'wasel:exchange-rate-updated';
const REFRESH_MS = 15 * 60 * 1000;
const DEFAULT_RATE = 150;

function normalizeRate(rawRate) {
  const numeric = Number(rawRate);
  if (!Number.isFinite(numeric) || numeric <= 0) return DEFAULT_RATE;

  // User requirement: if source returns 11800, app should use 118.
  const normalized = numeric >= 1000 ? numeric / 100 : numeric;
  if (!Number.isFinite(normalized) || normalized <= 0) return DEFAULT_RATE;

  // Keep decimal precision from supervisor input (e.g. 118.7).
  return Number(normalized.toFixed(4));
}

function writeRateToCache(normalizedRate) {
  try {
    localStorage.setItem(STORAGE_KEY, String(normalizedRate));
    localStorage.setItem(LAST_FETCH_KEY, String(Date.now()));
  } catch (e) {
    /* ignore */
  }
}

export function updateUsdToSypRateCache(nextRate) {
  const normalized = normalizeRate(nextRate);
  writeRateToCache(normalized);

  try {
    window.dispatchEvent(new CustomEvent(RATE_UPDATED_EVENT, { detail: { rate: normalized } }));
  } catch (e) {
    /* ignore */
  }

  return normalized;
}

function getCachedRate() {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    const parsed = Number(cached);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  } catch (error) {
    /* ignore */
  }

  return DEFAULT_RATE;
}

let _fetchInProgress = null;

async function fetchUsdToSypRate() {
  // Deduplicate concurrent calls
  if (_fetchInProgress) return _fetchInProgress;

  _fetchInProgress = (async () => {
    let sourceRate = null;

    // Primary source: project-managed rate from Supabase.
    // Priority rule: latest supervisor_manual should override automatic feed rows.
    try {
      const { data: manualRow } = await supabase
        .from('app_exchange_rates')
        .select('rate')
        .eq('pair', 'USD_SYP')
        .eq('source', 'supervisor_manual')
        .order('fetched_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (manualRow?.rate) {
        sourceRate = manualRow.rate;
      }

      if (!sourceRate) {
        const { data, error } = await supabase
        .from('app_exchange_rates')
          .select('rate')
        .eq('pair', 'USD_SYP')
        .order('fetched_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data?.rate) {
          sourceRate = data.rate;
        }
      }
    } catch (e) {
      /* ignore */
    }

    // Secondary source: public API fallback when DB rate is unavailable.
    if (!sourceRate) {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        if (res.ok) {
          const payload = await res.json();
          sourceRate = payload?.rates?.SYP;
        }
      } catch (e) {
        /* ignore */
      }
    }

    const normalized = normalizeRate(sourceRate);

    writeRateToCache(normalized);

    return normalized;
  })();

  try {
    return await _fetchInProgress;
  } finally {
    _fetchInProgress = null;
  }
}

export function getUsdToSypRateSync() {
  return getCachedRate();
}

export function useUsdToSypRate() {
  const [rate, setRate] = useState(() => getCachedRate());

  useEffect(() => {
    let cancelled = false;

    const onRateUpdated = (event) => {
      if (cancelled) return;
      const fromEvent = Number(event?.detail?.rate);
      setRate(Number.isFinite(fromEvent) && fromEvent > 0 ? fromEvent : getCachedRate());
    };

    const onStorage = (event) => {
      if (cancelled || event?.key !== STORAGE_KEY) return;
      setRate(getCachedRate());
    };

    const refresh = async (force = false) => {
      try {
        const lastFetch = Number(localStorage.getItem(LAST_FETCH_KEY) || 0);
        const shouldFetch = force || !lastFetch || (Date.now() - lastFetch) >= REFRESH_MS;
        if (!shouldFetch) {
          setRate(getCachedRate());
          return;
        }

        const nextRate = await fetchUsdToSypRate();
        if (!cancelled) setRate(nextRate);
      } catch (error) {
        console.error('Exchange rate refresh failed:', error);
        if (!cancelled) setRate(getCachedRate());
      }
    };

    refresh();
    const intervalId = setInterval(() => refresh(true), REFRESH_MS);
    window.addEventListener(RATE_UPDATED_EVENT, onRateUpdated);
    window.addEventListener('storage', onStorage);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      window.removeEventListener(RATE_UPDATED_EVENT, onRateUpdated);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return rate;
}
