-- =====================================================
-- PAYMENTS TABLE - Detailed Payment Tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id),
  provider text NOT NULL CHECK (provider IN ('paypal', 'stripe', 'cash', 'bank_transfer')),
  provider_transaction_id text UNIQUE,
  amount numeric NOT NULL CHECK (amount > 0),
  currency text DEFAULT 'USD',
  status text DEFAULT 'initiated' CHECK (status IN ('initiated', 'pending', 'succeeded', 'failed', 'cancelled', 'refunded')),
  raw_provider_response jsonb,
  payment_method_details jsonb,
  failure_reason text,
  refunded_amount numeric DEFAULT 0,
  refund_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  succeeded_at timestamp with time zone,
  failed_at timestamp with time zone,
  refunded_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_id = auth.uid()
      AND users.role IN ('admin', 'operator')
    )
  );

CREATE POLICY "System can insert payments" ON public.payments
  FOR INSERT WITH CHECK (true);

-- Indexes
CREATE INDEX idx_payments_order_id ON public.payments(order_id);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_provider_transaction_id ON public.payments(provider_transaction_id);

-- =====================================================
-- AUDIT LOGS TABLE - Legal Audit Trail
-- =====================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id uuid REFERENCES auth.users(id), -- Who did the action
  actor_type text DEFAULT 'user' CHECK (actor_type IN ('user', 'admin', 'system')),
  action_type text NOT NULL CHECK (action_type IN (
    'create', 'update', 'delete', 'login', 'logout',
    'payment_initiated', 'payment_succeeded', 'payment_failed',
    'order_created', 'order_updated', 'order_cancelled',
    'refund_initiated', 'refund_completed'
  )),
  target_table text NOT NULL,
  target_id uuid NOT NULL,
  old_value jsonb,
  new_value jsonb,
  change_reason text,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies - Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_id = auth.uid()
      AND users.role IN ('admin', 'operator')
    )
  );

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- Indexes
CREATE INDEX idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_action_type ON public.audit_logs(action_type);
CREATE INDEX idx_audit_logs_target_table ON public.audit_logs(target_table);
CREATE INDEX idx_audit_logs_target_id ON public.audit_logs(target_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- =====================================================
-- FINANCIAL REPORTS VIEW
-- =====================================================
CREATE OR REPLACE VIEW public.financial_reports AS
SELECT
  DATE_TRUNC('day', o.created_at) as report_date,
  COUNT(DISTINCT o.id) as total_orders,
  COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id END) as completed_orders,
  COUNT(DISTINCT CASE WHEN o.status = 'cancelled' THEN o.id END) as cancelled_orders,
  SUM(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE 0 END) as total_revenue,
  SUM(CASE WHEN o.status = 'completed' THEN o.delivery_fee ELSE 0 END) as delivery_revenue,
  SUM(CASE WHEN o.status = 'completed' THEN o.discount ELSE 0 END) as total_discounts,
  AVG(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE NULL END) as avg_order_value,
  COUNT(DISTINCT o.user_id) as unique_customers
FROM public.orders o
WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', o.created_at)
ORDER BY report_date DESC;

-- Grant access to authenticated users (you can restrict this further)
GRANT SELECT ON public.financial_reports TO authenticated;

-- =====================================================
-- PAYMENT SUCCESS TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_payment_success()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert audit log
  INSERT INTO public.audit_logs (
    actor_id,
    actor_type,
    action_type,
    target_table,
    target_id,
    old_value,
    new_value,
    change_reason
  ) VALUES (
    NEW.user_id,
    'system',
    'payment_succeeded',
    'payments',
    NEW.id,
    jsonb_build_object('status', 'pending'),
    jsonb_build_object('status', 'succeeded', 'succeeded_at', NEW.succeeded_at),
    'Payment completed successfully'
  );

  -- Update order status if payment succeeded
  IF NEW.status = 'succeeded' AND NEW.order_id IS NOT NULL THEN
    UPDATE public.orders
    SET
      payment_status = 'paid',
      status = CASE
        WHEN status = 'pending' THEN 'processing'
        ELSE status
      END,
      updated_at = now()
    WHERE id = NEW.order_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS payment_success_trigger ON public.payments;
CREATE TRIGGER payment_success_trigger
  AFTER UPDATE ON public.payments
  FOR EACH ROW
  WHEN (OLD.status != 'succeeded' AND NEW.status = 'succeeded')
  EXECUTE FUNCTION public.handle_payment_success();

-- =====================================================
-- ORDER AUDIT TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.audit_order_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert audit log for order changes
  INSERT INTO public.audit_logs (
    actor_id,
    actor_type,
    action_type,
    target_table,
    target_id,
    old_value,
    new_value,
    change_reason
  ) VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    CASE
      WHEN EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role IN ('admin', 'operator')) THEN 'admin'
      ELSE 'user'
    END,
    CASE
      WHEN TG_OP = 'INSERT' THEN 'order_created'
      WHEN TG_OP = 'UPDATE' THEN 'order_updated'
      WHEN TG_OP = 'DELETE' THEN 'order_cancelled'
    END,
    'orders',
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
    'Order status/management change'
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS order_audit_trigger ON public.orders;
CREATE TRIGGER order_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_order_changes();
