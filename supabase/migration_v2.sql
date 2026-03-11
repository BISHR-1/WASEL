-- 1. Create audit_logs table (Immutable Audit Trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    actor_id uuid, -- Who performed the action (user_id or system)
    action_type text NOT NULL, -- e.g., 'ORDER_UPDATE', 'PAYMENT_ATTEMPT'
    target_table text NOT NULL, -- e.g., 'orders', 'users'
    target_id uuid NOT NULL, -- The ID of the record being modified
    old_value jsonb, -- Snapshot before change
    new_value jsonb, -- Snapshot after change
    timestamp timestamp with time zone DEFAULT now(),
    CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);

-- Protect audit_logs from deletion/updates (Append Only)
-- Note: Supabase Admin can still override, but this prevents app-level tampering
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs cannot be modified or deleted.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_protect_audit_logs
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();


-- 2. Create payments table (Unified Financial Record)
-- Checks against 'paypal' or other providers
CREATE TABLE IF NOT EXISTS public.payments (
    payment_id uuid NOT NULL DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES public.orders(id),
    user_id uuid REFERENCES public.users(id),
    provider text NOT NULL, -- 'paypal', 'stripe', etc.
    provider_transaction_id text, -- PayPal Order ID or Capture ID
    amount numeric NOT NULL,
    currency text NOT NULL DEFAULT 'USD',
    status text NOT NULL CHECK (status IN ('initiated', 'succeeded', 'failed', 'refunded')),
    raw_provider_response jsonb, -- Encrypted or full JSON dump for debugging
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT payments_pkey PRIMARY KEY (payment_id)
);

-- 3. Update orders table (Enhancements)
-- Ensure 'delivery_address' is treated as the snapshot (it is type jsonb in your schema, which is perfect)
-- We just need to ensure strict status types if not already enforced (Your schema uses text default 'pending')

-- Create an index on order_number for faster lookups if not exists
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

-- 4. Create Financial Reporting Views (Automated Reporting)
CREATE OR REPLACE VIEW public.view_daily_financials AS
SELECT
    DATE_TRUNC('day', created_at) AS report_date,
    COUNT(id) AS total_orders,
    SUM(CASE WHEN payment_status = 'succeeded' THEN 1 ELSE 0 END) AS paid_orders,
    SUM(CASE WHEN payment_status = 'succeeded' THEN total_amount ELSE 0 END) AS gross_revenue
FROM public.orders
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY report_date DESC;

-- 5. Helper Function for Audit Logging (Optional: can be called from backend)
-- But usually better to have backend control the 'actor' logic explicitly.
