-- =====================================================
-- LEGAL & SECURITY TRIGGERS - Database Functions & Triggers
-- Migration: 004_legal_security_triggers.sql
-- =====================================================

-- =====================================================
-- FUNCTION: Send Payment Success Notification
-- =====================================================
CREATE OR REPLACE FUNCTION public.send_payment_success_notification()
RETURNS TRIGGER AS $$
DECLARE
  order_data RECORD;
  user_device RECORD;
BEGIN
  -- Get order details
  SELECT o.user_id, o.total_cents, o.id INTO order_data
  FROM public.orders o
  WHERE o.id = NEW.order_id;

  IF order_data IS NULL THEN
    RETURN NEW;
  END IF;

  -- Insert in-app notification
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    link
  ) VALUES (
    order_data.user_id,
    'تم الدفع بنجاح ✅',
    format('تم تأكيد دفع طلبك بمبلغ %s USD', (order_data.total_cents::decimal / 100)::text),
    'order',
    format('/orders/%s', order_data.id)
  );

  -- Call Supabase Edge Function for push notification
  PERFORM
    net.http_post(
      url := (SELECT 'https://' || split_part(current_setting('app.settings.supabase_url'), 'https://', 2) || '/functions/v1/send-payment-notification'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'user_id', order_data.user_id,
        'title', 'تم الدفع بنجاح ✅',
        'body', format('تم تأكيد دفع طلبك بمبلغ %s USD', (order_data.total_cents::decimal / 100)::text),
        'data', jsonb_build_object(
          'type', 'payment_success',
          'order_id', order_data.id,
          'amount', order_data.total_cents
        )
      )
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Send Payment Failure Notification
-- =====================================================
CREATE OR REPLACE FUNCTION public.send_payment_failure_notification()
RETURNS TRIGGER AS $$
DECLARE
  order_data RECORD;
BEGIN
  -- Get order details
  SELECT o.user_id, o.id INTO order_data
  FROM public.orders o
  WHERE o.id = NEW.order_id;

  IF order_data IS NULL THEN
    RETURN NEW;
  END IF;

  -- Insert in-app notification
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    link
  ) VALUES (
    order_data.user_id,
    'فشل في الدفع ❌',
    'لم نتمكن من معالجة دفعتك. يرجى المحاولة مرة أخرى أو استخدام طريقة دفع مختلفة.',
    'order',
    format('/orders/%s', order_data.id)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Enhanced Audit Logging
-- =====================================================
CREATE OR REPLACE FUNCTION public.enhanced_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  actor_info RECORD;
  change_details JSONB := '{}'::jsonb;
BEGIN
  -- Get actor information
  SELECT
    CASE
      WHEN auth.uid() IS NOT NULL THEN 'user'
      WHEN current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' THEN 'system'
      ELSE 'admin'
    END as actor_type,
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid) as actor_id
  INTO actor_info;

  -- Build change details
  IF TG_OP = 'INSERT' THEN
    change_details := jsonb_build_object(
      'operation', 'CREATE',
      'new_values', to_jsonb(NEW),
      'table', TG_TABLE_NAME
    );
  ELSIF TG_OP = 'UPDATE' THEN
    change_details := jsonb_build_object(
      'operation', 'UPDATE',
      'old_values', to_jsonb(OLD),
      'new_values', to_jsonb(NEW),
      'changed_fields', (
        SELECT jsonb_object_agg(key, value)
        FROM jsonb_object_keys(to_jsonb(NEW)) AS key
        WHERE to_jsonb(NEW)->key <> to_jsonb(OLD)->key
      ),
      'table', TG_TABLE_NAME
    );
  ELSIF TG_OP = 'DELETE' THEN
    change_details := jsonb_build_object(
      'operation', 'DELETE',
      'old_values', to_jsonb(OLD),
      'table', TG_TABLE_NAME
    );
  END IF;

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
    created_at
  ) VALUES (
    actor_info.actor_id,
    actor_info.actor_type,
    CASE
      WHEN TG_OP = 'INSERT' THEN 'create'
      WHEN TG_OP = 'UPDATE' THEN 'update'
      WHEN TG_OP = 'DELETE' THEN 'delete'
    END,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
    format('Automated %s on %s table', TG_OP, TG_TABLE_NAME),
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    current_setting('request.headers', true)::json->>'user-agent',
    now()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Financial Report Generator
-- =====================================================
CREATE OR REPLACE FUNCTION public.generate_financial_report(report_period TEXT DEFAULT 'daily')
RETURNS TABLE (
  report_date DATE,
  total_orders BIGINT,
  completed_orders BIGINT,
  completion_rate TEXT,
  total_revenue NUMERIC,
  net_revenue NUMERIC,
  total_delivery_fees NUMERIC,
  total_discounts NUMERIC,
  unique_customers BIGINT,
  average_order_value NUMERIC
) AS $$
DECLARE
  days_back INTEGER := CASE
    WHEN report_period = 'weekly' THEN 7
    WHEN report_period = 'monthly' THEN 30
    ELSE 1
  END;
  start_date TIMESTAMP := CURRENT_DATE - INTERVAL '1 day' * days_back;
  end_date TIMESTAMP := CURRENT_DATE;
BEGIN
  RETURN QUERY
  SELECT
    DATE(o.created_at) as report_date,
    COUNT(DISTINCT o.id) as total_orders,
    COUNT(DISTINCT CASE WHEN o.payment_status = 'succeeded' THEN o.id END) as completed_orders,
    CASE
      WHEN COUNT(DISTINCT o.id) > 0
      THEN ROUND(
        (COUNT(DISTINCT CASE WHEN o.payment_status = 'succeeded' THEN o.id END)::NUMERIC /
         COUNT(DISTINCT o.id)::NUMERIC) * 100, 2
      )::TEXT || '%'
      ELSE '0%'
    END as completion_rate,
    COALESCE(SUM(CASE WHEN o.payment_status = 'succeeded' THEN o.total_amount ELSE 0 END), 0) as total_revenue,
    COALESCE(SUM(CASE WHEN o.payment_status = 'succeeded' THEN o.total_amount - o.delivery_fee - o.discount ELSE 0 END), 0) as net_revenue,
    COALESCE(SUM(CASE WHEN o.payment_status = 'succeeded' THEN o.delivery_fee ELSE 0 END), 0) as total_delivery_fees,
    COALESCE(SUM(CASE WHEN o.payment_status = 'succeeded' THEN o.discount ELSE 0 END), 0) as total_discounts,
    COUNT(DISTINCT CASE WHEN o.payment_status = 'succeeded' THEN o.user_id END) as unique_customers,
    CASE
      WHEN COUNT(DISTINCT CASE WHEN o.payment_status = 'succeeded' THEN o.id END) > 0
      THEN ROUND(
        SUM(CASE WHEN o.payment_status = 'succeeded' THEN o.total_amount ELSE 0 END) /
        COUNT(DISTINCT CASE WHEN o.payment_status = 'succeeded' THEN o.id END), 2
      )
      ELSE 0
    END as average_order_value
  FROM public.orders o
  WHERE o.created_at >= start_date AND o.created_at < end_date
  GROUP BY DATE(o.created_at)
  ORDER BY report_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Security Monitoring
-- =====================================================
CREATE OR REPLACE FUNCTION public.monitor_security_events()
RETURNS TRIGGER AS $$
DECLARE
  suspicious_activity BOOLEAN := FALSE;
  activity_reason TEXT := '';
BEGIN
  -- Check for suspicious payment patterns
  IF TG_TABLE_NAME = 'payments' AND TG_OP = 'INSERT' THEN
    -- Check for multiple failed payments from same user in short time
    IF NEW.status = 'failed' THEN
      SELECT COUNT(*) > 3 INTO suspicious_activity
      FROM public.payments
      WHERE user_id = NEW.user_id
        AND status = 'failed'
        AND created_at > NOW() - INTERVAL '1 hour';

      IF suspicious_activity THEN
        activity_reason := 'Multiple failed payments in short time period';
      END IF;
    END IF;
  END IF;

  -- Check for unusual order modifications
  IF TG_TABLE_NAME = 'orders' AND TG_OP = 'UPDATE' THEN
    IF OLD.payment_status = 'succeeded' AND NEW.payment_status != 'succeeded' THEN
      suspicious_activity := TRUE;
      activity_reason := 'Attempt to modify paid order status';
    END IF;

    -- Check for large price changes
    IF ABS((NEW.total_amount - OLD.total_amount) / NULLIF(OLD.total_amount, 0)) > 0.5 THEN
      suspicious_activity := TRUE;
      activity_reason := 'Large order amount modification';
    END IF;
  END IF;

  -- Log suspicious activity
  IF suspicious_activity THEN
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
      user_agent
    ) VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      'system',
      'security_alert',
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
      CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
      'SECURITY ALERT: ' || activity_reason,
      current_setting('request.headers', true)::json->>'x-forwarded-for',
      current_setting('request.headers', true)::json->>'user-agent'
    );

    -- Send alert to admin (you can implement email/SMS here)
    RAISE WARNING 'SECURITY ALERT: % on table %', activity_reason, TG_TABLE_NAME;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS: Payment Success Notifications
-- =====================================================
DROP TRIGGER IF EXISTS payment_success_notification_trigger ON public.payments;
CREATE TRIGGER payment_success_notification_trigger
  AFTER UPDATE ON public.payments
  FOR EACH ROW
  WHEN (OLD.status != 'succeeded' AND NEW.status = 'succeeded')
  EXECUTE FUNCTION public.send_payment_success_notification();

-- =====================================================
-- TRIGGERS: Payment Failure Notifications
-- =====================================================
DROP TRIGGER IF EXISTS payment_failure_notification_trigger ON public.payments;
CREATE TRIGGER payment_failure_notification_trigger
  AFTER UPDATE ON public.payments
  FOR EACH ROW
  WHEN (OLD.status != 'failed' AND NEW.status = 'failed')
  EXECUTE FUNCTION public.send_payment_failure_notification();

-- =====================================================
-- TRIGGERS: Enhanced Audit Logging
-- =====================================================
DROP TRIGGER IF EXISTS orders_enhanced_audit_trigger ON public.orders;
CREATE TRIGGER orders_enhanced_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.enhanced_audit_log();

DROP TRIGGER IF EXISTS payments_enhanced_audit_trigger ON public.payments;
CREATE TRIGGER payments_enhanced_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.enhanced_audit_log();

-- =====================================================
-- TRIGGERS: Security Monitoring
-- =====================================================
DROP TRIGGER IF EXISTS security_monitoring_trigger ON public.orders;
CREATE TRIGGER security_monitoring_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.monitor_security_events();

DROP TRIGGER IF EXISTS payments_security_monitoring_trigger ON public.payments;
CREATE TRIGGER payments_security_monitoring_trigger
  AFTER INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.monitor_security_events();

-- =====================================================
-- SCHEDULED FUNCTIONS: Automated Reports (using pg_cron)
-- =====================================================

-- Daily Financial Report
SELECT cron.schedule(
  'daily-financial-report',
  '0 6 * * *', -- Every day at 6 AM
  $$
  SELECT net.http_post(
    url := (SELECT 'https://' || split_part(current_setting('app.settings.supabase_url'), 'https://', 2) || '/functions/v1/financial-reports?period=daily'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('automated', true)
  );
  $$
);

-- Weekly Financial Report
SELECT cron.schedule(
  'weekly-financial-report',
  '0 6 * * 1', -- Every Monday at 6 AM
  $$
  SELECT net.http_post(
    url := (SELECT 'https://' || split_part(current_setting('app.settings.supabase_url'), 'https://', 2) || '/functions/v1/financial-reports?period=weekly'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('automated', true)
  );
  $$
);

-- Monthly Financial Report
SELECT cron.schedule(
  'monthly-financial-report',
  '0 6 1 * *', -- First day of every month at 6 AM
  $$
  SELECT net.http_post(
    url := (SELECT 'https://' || split_part(current_setting('app.settings.supabase_url'), 'https://', 2) || '/functions/v1/financial-reports?period=monthly'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('automated', true)
  );
  $$
);

-- =====================================================
-- GRANTS: Function Permissions
-- =====================================================
GRANT EXECUTE ON FUNCTION public.send_payment_success_notification() TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_payment_failure_notification() TO authenticated;
GRANT EXECUTE ON FUNCTION public.enhanced_audit_log() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_financial_report(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.monitor_security_events() TO authenticated;

-- =====================================================
-- INDEXES: Performance Optimization
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_actor ON public.audit_logs(created_at DESC, actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_security_alerts ON public.audit_logs(action_type) WHERE action_type = 'security_alert';
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
