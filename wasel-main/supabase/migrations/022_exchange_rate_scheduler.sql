-- =====================================================
-- USD/SYP Exchange Rate Scheduler
-- Migration: 022_exchange_rate_scheduler.sql
-- Purpose:
-- 1) Store latest USD->SYP rate in Supabase
-- 2) Refresh every 15 minutes (if pg_cron + http extension are available)
-- 3) Expose helper function for app reads
-- =====================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.app_exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pair text NOT NULL DEFAULT 'USD_SYP',
  rate numeric(12,4) NOT NULL CHECK (rate > 0),
  source text NOT NULL DEFAULT 'manual',
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_exchange_rates_pair_fetched
ON public.app_exchange_rates(pair, fetched_at DESC);

-- Latest-known value helper.
CREATE OR REPLACE FUNCTION public.get_current_usd_syp_rate()
RETURNS numeric
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (
      SELECT r.rate
      FROM public.app_exchange_rates r
      WHERE r.pair = 'USD_SYP'
      ORDER BY r.fetched_at DESC
      LIMIT 1
    ),
    150
  );
$$;

-- Manual setter (safe fallback when external HTTP extensions are unavailable).
CREATE OR REPLACE FUNCTION public.set_current_usd_syp_rate(
  p_rate numeric,
  p_source text DEFAULT 'manual'
)
RETURNS public.app_exchange_rates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.app_exchange_rates;
BEGIN
  IF p_rate IS NULL OR p_rate <= 0 THEN
    RAISE EXCEPTION 'Rate must be > 0';
  END IF;

  INSERT INTO public.app_exchange_rates (pair, rate, source, fetched_at)
  VALUES ('USD_SYP', p_rate, COALESCE(NULLIF(p_source, ''), 'manual'), now())
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

-- Auto-fetch function. Requires HTTP extension support.
-- Tested against extensions.http_get(text) style APIs available in many Postgres setups.
CREATE OR REPLACE FUNCTION public.refresh_usd_syp_rate()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_resp jsonb;
  v_payload jsonb;
  v_rate numeric;
  v_source text := 'open.er-api.com';
  v_message text;
BEGIN
  -- Try common extension namespace first.
  BEGIN
    EXECUTE 'SELECT content::jsonb FROM extensions.http_get(''https://open.er-api.com/v6/latest/USD'')' INTO v_payload;
  EXCEPTION WHEN undefined_function THEN
    BEGIN
      -- Fallback for installations where http_get is on public schema.
      EXECUTE 'SELECT content::jsonb FROM http_get(''https://open.er-api.com/v6/latest/USD'')' INTO v_payload;
    EXCEPTION WHEN undefined_function THEN
      v_message := 'http_get extension is not available; use set_current_usd_syp_rate() manually.';
      RETURN jsonb_build_object('ok', false, 'message', v_message);
    END;
  END;

  v_rate := NULLIF((v_payload->'rates'->>'SYP')::numeric, 0);

  IF v_rate IS NULL OR v_rate <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Could not parse SYP rate from provider payload');
  END IF;

  -- Keep same normalization logic as app (e.g. 11800 -> 118)
  IF v_rate >= 1000 THEN
    v_rate := round(v_rate / 100.0, 4);
  END IF;

  INSERT INTO public.app_exchange_rates (pair, rate, source, fetched_at)
  VALUES ('USD_SYP', v_rate, v_source, now());

  v_resp := jsonb_build_object(
    'ok', true,
    'pair', 'USD_SYP',
    'rate', v_rate,
    'source', v_source,
    'fetched_at', now()
  );

  RETURN v_resp;
END;
$$;

-- Seed default rate if table is empty.
INSERT INTO public.app_exchange_rates (pair, rate, source, fetched_at)
SELECT 'USD_SYP', 150, 'seed', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.app_exchange_rates WHERE pair = 'USD_SYP'
);

-- Optional scheduler (every 15 minutes) if pg_cron exists.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      PERFORM cron.unschedule('refresh_usd_syp_rate_every_15m');
    EXCEPTION WHEN OTHERS THEN
      -- ignore if not scheduled yet
      NULL;
    END;

    PERFORM cron.schedule(
      'refresh_usd_syp_rate_every_15m',
      '*/15 * * * *',
      'SELECT public.refresh_usd_syp_rate();'
    );
  END IF;
END $$;

GRANT EXECUTE ON FUNCTION public.get_current_usd_syp_rate() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_usd_syp_rate() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_current_usd_syp_rate(numeric, text) TO authenticated;

COMMIT;
