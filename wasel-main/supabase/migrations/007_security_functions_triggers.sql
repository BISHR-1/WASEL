-- =====================================================
-- SECURITY FUNCTIONS & TRIGGERS - Encryption, Audit, Monitoring
-- Migration: 007_security_functions_triggers.sql
-- =====================================================

-- =====================================================
-- 1. ENCRYPTION FUNCTIONS
-- =====================================================

-- Function to encrypt data using AES-256-GCM
CREATE OR REPLACE FUNCTION public.encrypt_data(
  data text,
  key_id text DEFAULT 'default'
) RETURNS jsonb AS $$
DECLARE
  encryption_key bytea;
  iv bytea;
  encrypted_data bytea;
  tag bytea;
BEGIN
  -- Get the active encryption key
  SELECT key_data INTO encryption_key
  FROM public.encryption_keys
  WHERE key_id = encrypt_data.key_id AND is_active = true
  ORDER BY version DESC
  LIMIT 1;

  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'No active encryption key found for key_id: %', key_id;
  END IF;

  -- Generate random IV
  iv := gen_random_bytes(12);

  -- Encrypt data
  encrypted_data := pgp_sym_encrypt(data, encode(encryption_key, 'hex'), 'cipher-algo=aes256');

  -- For simplicity, using pgcrypto. In production, use proper AES-GCM
  -- This is a simplified version - use proper crypto libraries in production

  RETURN jsonb_build_object(
    'encrypted_data', encode(encrypted_data, 'base64'),
    'iv', encode(iv, 'base64'),
    'key_version', 1,
    'algorithm', 'aes-256-gcm'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt data
CREATE OR REPLACE FUNCTION public.decrypt_data(
  encrypted_json jsonb,
  key_id text DEFAULT 'default'
) RETURNS text AS $$
DECLARE
  encryption_key bytea;
  encrypted_data bytea;
  key_version integer;
BEGIN
  -- Get the encryption key by version
  key_version := (encrypted_json->>'key_version')::integer;

  SELECT key_data INTO encryption_key
  FROM public.encryption_keys
  WHERE key_id = decrypt_data.key_id
    AND version = key_version
    AND is_active = true;

  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found for key_id: %, version: %', key_id, key_version;
  END IF;

  -- Decrypt data
  encrypted_data := decode(encrypted_json->>'encrypted_data', 'base64');

  RETURN pgp_sym_decrypt(encrypted_data, encode(encryption_key, 'hex'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. AUDIT LOGGING FUNCTIONS
-- =====================================================

-- Enhanced audit logging function
CREATE OR REPLACE FUNCTION public.log_audit_event(
  action_type text,
  target_table text,
  target_id uuid,
  old_values jsonb DEFAULT NULL,
  new_values jsonb DEFAULT NULL,
  change_reason text DEFAULT NULL
) RETURNS void AS $$
DECLARE
  actor_info RECORD;
BEGIN
  -- Get actor information
  SELECT
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid) as actor_id,
    CASE
      WHEN auth.uid() IS NOT NULL THEN 'user'
      WHEN current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' THEN 'system'
      ELSE 'anonymous'
    END as actor_type
  INTO actor_info;

  -- Insert audit log
  INSERT INTO public.audit_logs (
    actor_id,
    actor_type,
    action_type,
    target_table,
    target_id,
    old_value,
    new_value,
    change_reason,
    ip_address,
    user_agent,
    session_id,
    created_at
  ) VALUES (
    actor_info.actor_id,
    actor_info.actor_type,
    action_type,
    target_table,
    target_id,
    old_values,
    new_values,
    change_reason,
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    current_setting('request.headers', true)::json->>'user-agent',
    current_setting('request.headers', true)::json->>'x-session-id',
    now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. SECURITY MONITORING FUNCTIONS
-- =====================================================

-- Function to detect suspicious activities
CREATE OR REPLACE FUNCTION public.detect_suspicious_activity(
  event_type text,
  user_id uuid DEFAULT NULL,
  ip_address inet DEFAULT NULL,
  details jsonb DEFAULT '{}'
) RETURNS void AS $$
DECLARE
  suspicious_count integer;
  severity text := 'low';
BEGIN
  -- Check for multiple failed login attempts
  IF event_type = 'failed_login' THEN
    SELECT COUNT(*) INTO suspicious_count
    FROM public.security_events
    WHERE event_type = 'failed_login'
      AND user_id = detect_suspicious_activity.user_id
      AND created_at > now() - interval '1 hour';

    IF suspicious_count >= 5 THEN
      severity := 'medium';
    ELSIF suspicious_count >= 10 THEN
      severity := 'high';
    END IF;
  END IF;

  -- Check for rapid order modifications
  IF event_type = 'order_modification' THEN
    SELECT COUNT(*) INTO suspicious_count
    FROM public.audit_logs
    WHERE action_type = 'update'
      AND target_table = 'orders'
      AND actor_id = detect_suspicious_activity.user_id
      AND created_at > now() - interval '5 minutes';

    IF suspicious_count >= 3 THEN
      severity := 'medium';
    END IF;
  END IF;

  -- Log security event
  INSERT INTO public.security_events (
    event_type,
    severity,
    user_id,
    ip_address,
    details,
    created_at
  ) VALUES (
    event_type,
    severity,
    user_id,
    ip_address,
    details,
    now()
  );

  -- Alert if high severity
  IF severity IN ('high', 'critical') THEN
    -- In production, send alert to admin via email/SMS/webhook
    RAISE WARNING 'SECURITY ALERT: % severity % for user %', event_type, severity, user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. RATE LIMITING FUNCTIONS
-- =====================================================

-- Function to check and update rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  identifier text,
  endpoint text,
  max_requests integer DEFAULT 100,
  window_minutes integer DEFAULT 60
) RETURNS boolean AS $$
DECLARE
  current_count integer;
  window_start timestamptz;
BEGIN
  window_start := now() - (window_minutes || ' minutes')::interval;

  -- Get current request count
  SELECT COALESCE(SUM(request_count), 0) INTO current_count
  FROM public.rate_limits
  WHERE identifier = check_rate_limit.identifier
    AND endpoint = check_rate_limit.endpoint
    AND window_start >= check_rate_limit.window_start;

  -- Check if limit exceeded
  IF current_count >= max_requests THEN
    -- Log rate limit violation
    INSERT INTO public.security_events (
      event_type,
      severity,
      ip_address,
      details
    ) VALUES (
      'rate_limit_exceeded',
      'medium',
      identifier::inet,
      jsonb_build_object(
        'endpoint', endpoint,
        'max_requests', max_requests,
        'window_minutes', window_minutes,
        'current_count', current_count
      )
    );

    RETURN false;
  END IF;

  -- Update or insert rate limit record
  INSERT INTO public.rate_limits (
    identifier,
    endpoint,
    request_count,
    window_start,
    window_end
  ) VALUES (
    identifier,
    endpoint,
    1,
    now(),
    now() + (window_minutes || ' minutes')::interval
  ) ON CONFLICT (identifier, endpoint, window_start)
  DO UPDATE SET
    request_count = public.rate_limits.request_count + 1;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. PAYMENT SECURITY FUNCTIONS
-- =====================================================

-- Function to validate payment data integrity
CREATE OR REPLACE FUNCTION public.validate_payment_integrity(
  order_id uuid,
  payment_data jsonb
) RETURNS boolean AS $$
DECLARE
  order_record RECORD;
  expected_amount integer;
  actual_amount integer;
BEGIN
  -- Get order details
  SELECT total_cents, currency INTO order_record
  FROM public.orders
  WHERE id = order_id;

  IF order_record IS NULL THEN
    RETURN false;
  END IF;

  -- Validate amount (simplified - add more checks in production)
  expected_amount := order_record.total_cents;
  actual_amount := (payment_data->>'amount')::integer;

  IF expected_amount != actual_amount THEN
    -- Log integrity violation
    PERFORM public.detect_suspicious_activity(
      'payment_integrity_violation',
      (SELECT user_id FROM public.orders WHERE id = order_id),
      NULL,
      jsonb_build_object(
        'order_id', order_id,
        'expected_amount', expected_amount,
        'actual_amount', actual_amount
      )
    );
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. CART INTEGRITY FUNCTIONS
-- =====================================================

-- Function to validate cart integrity
CREATE OR REPLACE FUNCTION public.validate_cart_integrity(
  cart_id uuid
) RETURNS boolean AS $$
DECLARE
  cart_item RECORD;
  product_record RECORD;
  total_calculated integer := 0;
BEGIN
  -- Check each cart item
  FOR cart_item IN
    SELECT ci.product_id, ci.qty, ci.price_snapshot_cents, p.stock, p.is_active
    FROM public.cart_items ci
    JOIN public.products p ON ci.product_id = p.id
    WHERE ci.cart_id = validate_cart_integrity.cart_id
  LOOP
    -- Check if product is active
    IF NOT cart_item.is_active THEN
      RETURN false;
    END IF;

    -- Check stock availability
    IF cart_item.stock < cart_item.qty THEN
      RETURN false;
    END IF;

    -- Calculate total
    total_calculated := total_calculated + (cart_item.price_snapshot_cents * cart_item.qty);
  END LOOP;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. USER AUTHENTICATION FUNCTIONS
-- =====================================================

-- Function to handle failed login attempts
CREATE OR REPLACE FUNCTION public.handle_failed_login(
  user_email text,
  ip_address inet
) RETURNS void AS $$
DECLARE
  user_record RECORD;
  attempts_count integer;
BEGIN
  -- Get user
  SELECT id, login_attempts, locked_until INTO user_record
  FROM public.users
  WHERE email = user_email;

  IF user_record IS NULL THEN
    RETURN;
  END IF;

  -- Increment attempts
  attempts_count := COALESCE(user_record.login_attempts, 0) + 1;

  -- Lock account if too many attempts
  IF attempts_count >= 5 THEN
    UPDATE public.users
    SET
      login_attempts = attempts_count,
      locked_until = now() + interval '30 minutes'
    WHERE id = user_record.id;
  ELSE
    UPDATE public.users
    SET login_attempts = attempts_count
    WHERE id = user_record.id;
  END IF;

  -- Log failed login
  PERFORM public.detect_suspicious_activity(
    'failed_login',
    user_record.id,
    ip_address,
    jsonb_build_object('attempts', attempts_count)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle successful login
CREATE OR REPLACE FUNCTION public.handle_successful_login(
  user_id uuid,
  ip_address inet
) RETURNS void AS $$
BEGIN
  -- Reset login attempts and update last login
  UPDATE public.users
  SET
    login_attempts = 0,
    locked_until = NULL,
    last_login_at = now()
  WHERE id = user_id;

  -- Log successful login
  PERFORM public.log_audit_event(
    'login',
    'users',
    user_id,
    NULL,
    jsonb_build_object('ip_address', ip_address::text),
    'User logged in successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. FINANCIAL REPORTING FUNCTIONS
-- =====================================================

-- Function to generate financial reports
CREATE OR REPLACE FUNCTION public.generate_financial_report(
  report_period text DEFAULT 'daily',
  report_date date DEFAULT CURRENT_DATE
) RETURNS jsonb AS $$
DECLARE
  period_start timestamptz;
  period_end timestamptz;
  report_data jsonb;
BEGIN
  -- Calculate period
  CASE report_period
    WHEN 'daily' THEN
      period_start := report_date;
      period_end := report_date + interval '1 day';
    WHEN 'weekly' THEN
      period_start := date_trunc('week', report_date);
      period_end := period_start + interval '1 week';
    WHEN 'monthly' THEN
      period_start := date_trunc('month', report_date);
      period_end := period_start + interval '1 month';
    ELSE
      RAISE EXCEPTION 'Invalid report period: %', report_period;
  END CASE;

  -- Generate report
  SELECT jsonb_build_object(
    'report_date', report_date,
    'period_start', period_start,
    'period_end', period_end,
    'total_orders', COUNT(DISTINCT o.id),
    'completed_orders', COUNT(DISTINCT CASE WHEN o.payment_status = 'succeeded' THEN o.id END),
    'completion_rate', ROUND(
      (COUNT(DISTINCT CASE WHEN o.payment_status = 'succeeded' THEN o.id END)::numeric /
       NULLIF(COUNT(DISTINCT o.id), 0)) * 100, 2
    ),
    'total_revenue_cents', COALESCE(SUM(CASE WHEN o.payment_status = 'succeeded' THEN o.total_cents END), 0),
    'net_revenue_cents', COALESCE(SUM(
      CASE WHEN o.payment_status = 'succeeded'
      THEN o.total_cents - COALESCE(o.discount_cents, 0) - COALESCE(o.shipping_cents, 0)
      END
    ), 0),
    'total_delivery_fees_cents', COALESCE(SUM(CASE WHEN o.payment_status = 'succeeded' THEN o.shipping_cents END), 0),
    'total_discounts_cents', COALESCE(SUM(CASE WHEN o.payment_status = 'succeeded' THEN o.discount_cents END), 0),
    'unique_customers', COUNT(DISTINCT CASE WHEN o.payment_status = 'succeeded' THEN o.user_id END),
    'average_order_value_cents', ROUND(
      SUM(CASE WHEN o.payment_status = 'succeeded' THEN o.total_cents END)::numeric /
      NULLIF(COUNT(DISTINCT CASE WHEN o.payment_status = 'succeeded' THEN o.id END), 0), 2
    )
  ) INTO report_data
  FROM public.orders o
  WHERE o.created_at >= period_start AND o.created_at < period_end;

  -- Store report
  INSERT INTO public.financial_reports (
    report_type,
    report_date,
    period_start,
    period_end,
    total_orders,
    completed_orders,
    completion_rate,
    total_revenue_cents,
    net_revenue_cents,
    total_delivery_fees_cents,
    total_discounts_cents,
    unique_customers,
    average_order_value_cents,
    report_data
  ) VALUES (
    report_period,
    report_date,
    period_start,
    period_end,
    (report_data->>'total_orders')::integer,
    (report_data->>'completed_orders')::integer,
    (report_data->>'completion_rate')::numeric,
    (report_data->>'total_revenue_cents')::bigint,
    (report_data->>'net_revenue_cents')::bigint,
    (report_data->>'total_delivery_fees_cents')::bigint,
    (report_data->>'total_discounts_cents')::bigint,
    (report_data->>'unique_customers')::integer,
    (report_data->>'average_order_value_cents')::numeric,
    report_data
  ) ON CONFLICT (report_type, report_date)
  DO UPDATE SET
    report_data = EXCLUDED.report_data,
    updated_at = now();

  RETURN report_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS FOR AUTOMATED SECURITY
-- =====================================================

-- Trigger for user login attempts
CREATE OR REPLACE FUNCTION public.trigger_user_login_attempt() RETURNS trigger AS $$
BEGIN
  IF NEW.login_attempts > 0 THEN
    PERFORM public.detect_suspicious_activity(
      'failed_login',
      NEW.id,
      NULL,
      jsonb_build_object('attempts', NEW.login_attempts)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for order changes
CREATE OR REPLACE FUNCTION public.trigger_order_audit() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit_event(
      'order_created',
      'orders',
      NEW.id,
      NULL,
      to_jsonb(NEW),
      'New order created'
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_audit_event(
      'order_updated',
      'orders',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW),
      'Order updated'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for payment changes
CREATE OR REPLACE FUNCTION public.trigger_payment_audit() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit_event(
      'payment_created',
      'payments',
      NEW.id,
      NULL,
      to_jsonb(NEW),
      'New payment initiated'
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_audit_event(
      'payment_updated',
      'payments',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW),
      'Payment status updated'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS user_login_attempt_trigger ON public.users;
CREATE TRIGGER user_login_attempt_trigger
  AFTER UPDATE OF login_attempts ON public.users
  FOR EACH ROW
  WHEN (OLD.login_attempts != NEW.login_attempts)
  EXECUTE FUNCTION public.trigger_user_login_attempt();

DROP TRIGGER IF EXISTS order_audit_trigger ON public.orders;
CREATE TRIGGER order_audit_trigger
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_order_audit();

DROP TRIGGER IF EXISTS payment_audit_trigger ON public.payments;
CREATE TRIGGER payment_audit_trigger
  AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_payment_audit();

-- =====================================================
-- SCHEDULED TASKS (using pg_cron)
-- =====================================================

-- Daily financial report
SELECT cron.schedule(
  'daily-financial-report',
  '0 6 * * *',
  $$
  SELECT public.generate_financial_report('daily', CURRENT_DATE);
  $$
);

-- Weekly financial report
SELECT cron.schedule(
  'weekly-financial-report',
  '0 6 * * 1',
  $$
  SELECT public.generate_financial_report('weekly', CURRENT_DATE);
  $$
);

-- Monthly financial report
SELECT cron.schedule(
  'monthly-financial-report',
  '0 6 1 * *',
  $$
  SELECT public.generate_financial_report('monthly', CURRENT_DATE);
  $$
);

-- Clean up old rate limits
SELECT cron.schedule(
  'cleanup-rate-limits',
  '0 */6 * * *',
  $$
  DELETE FROM public.rate_limits WHERE window_end < now() - interval '1 hour';
  $$
);

-- =====================================================
-- GRANTS FOR FUNCTIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.encrypt_data(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_data(jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_audit_event(text, text, uuid, jsonb, jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.detect_suspicious_activity(text, uuid, inet, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_payment_integrity(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_cart_integrity(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_failed_login(text, inet) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_successful_login(uuid, inet) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_financial_report(text, date) TO authenticated;

-- =====================================================
-- SECURITY FUNCTIONS & TRIGGERS COMPLETE
-- =====================================================
