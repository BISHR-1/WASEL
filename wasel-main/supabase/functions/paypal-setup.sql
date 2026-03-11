-- ========================================
-- PayPal Supabase Functions Setup SQL
-- ========================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create environment variables for PayPal
-- Run these commands in Supabase Dashboard → Settings → Functions

-- Environment Variables to set:
-- PAYPAL_CLIENT_ID=your_paypal_client_id_here
-- PAYPAL_CLIENT_SECRET=your_paypal_client_secret_here
-- PAYPAL_API_BASE=https://api-m.sandbox.paypal.com

-- For production, change PAYPAL_API_BASE to:
-- PAYPAL_API_BASE=https://api-m.paypal.com

-- ========================================
-- 3. Create orders table to track PayPal orders
-- ========================================

CREATE TABLE IF NOT EXISTS paypal_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    paypal_order_id VARCHAR(255) UNIQUE NOT NULL,
    user_email VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'created',
    items JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payment_completed_at TIMESTAMP WITH TIME ZONE,
    paypal_response JSONB
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_paypal_orders_user_email ON paypal_orders(user_email);
CREATE INDEX IF NOT EXISTS idx_paypal_orders_status ON paypal_orders(status);
CREATE INDEX IF NOT EXISTS idx_paypal_orders_paypal_id ON paypal_orders(paypal_order_id);

-- ========================================
-- 4. Create function to update updated_at timestamp
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for paypal_orders
CREATE TRIGGER update_paypal_orders_updated_at 
    BEFORE UPDATE ON paypal_orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 5. Create function to log PayPal transactions
-- ========================================

CREATE OR REPLACE FUNCTION log_paypal_transaction(
    p_paypal_order_id VARCHAR(255),
    p_user_email VARCHAR(255),
    p_amount DECIMAL(10, 2),
    p_currency VARCHAR(3) DEFAULT 'USD',
    p_status VARCHAR(50) DEFAULT 'created',
    p_items JSONB DEFAULT '[]'::jsonb,
    p_paypal_response JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
BEGIN
    INSERT INTO paypal_orders (
        paypal_order_id,
        user_email,
        amount,
        currency,
        status,
        items,
        paypal_response
    ) VALUES (
        p_paypal_order_id,
        p_user_email,
        p_amount,
        p_currency,
        p_status,
        p_items,
        p_paypal_response
    ) RETURNING id INTO v_order_id;
    
    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 6. Create function to update PayPal order status
-- ========================================

CREATE OR REPLACE FUNCTION update_paypal_order_status(
    p_paypal_order_id VARCHAR(255),
    p_status VARCHAR(50),
    p_paypal_response JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated BOOLEAN := FALSE;
BEGIN
    UPDATE paypal_orders 
    SET 
        status = p_status,
        paypal_response = p_paypal_response,
        payment_completed_at = CASE 
            WHEN p_status = 'COMPLETED' THEN NOW() 
            ELSE payment_completed_at 
        END
    WHERE paypal_order_id = p_paypal_order_id;
    
    v_updated := FOUND;
    RETURN v_updated;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 7. Create view for PayPal orders summary
-- ========================================

CREATE OR REPLACE VIEW paypal_orders_summary AS
SELECT 
    id,
    paypal_order_id,
    user_email,
    amount,
    currency,
    status,
    created_at,
    updated_at,
    payment_completed_at,
    CASE 
        WHEN status = 'COMPLETED' THEN '✅ Paid'
        WHEN status = 'CREATED' THEN '⏳ Pending'
        WHEN status = 'CANCELLED' THEN '❌ Cancelled'
        ELSE status
    END as status_display
FROM paypal_orders
ORDER BY created_at DESC;

-- ========================================
-- 8. Grant permissions (adjust as needed)
-- ========================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE ON paypal_orders TO authenticated;
-- No sequence for UUID id; sequence grant removed
GRANT EXECUTE ON FUNCTION log_paypal_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION update_paypal_order_status TO authenticated;
GRANT SELECT ON paypal_orders_summary TO authenticated;

-- Grant access to anon users (for read operations)
GRANT SELECT ON paypal_orders_summary TO anon;

-- ========================================
-- 9. Sample queries for testing
-- ========================================

-- View all PayPal orders
-- SELECT * FROM paypal_orders_summary;

-- View orders by status
-- SELECT * FROM paypal_orders_summary WHERE status = 'COMPLETED';

-- View orders by user
-- SELECT * FROM paypal_orders_summary WHERE user_email = 'user@example.com';

-- Log a new PayPal order (example)
-- SELECT log_paypal_transaction(
--     'PAY-123456789',
--     'user@example.com',
--     10.50,
--     'USD',
--     'CREATED',
--     '[{"name": "Test Item", "quantity": 1, "price": "10.50"}]'::jsonb
-- );

-- Update order status (example)
-- SELECT update_paypal_order_status('PAY-123456789', 'COMPLETED');

-- ========================================
-- 10. Cleanup old orders (optional)
-- ========================================

-- Delete orders older than 30 days with status 'CANCELLED'
-- DELETE FROM paypal_orders 
-- WHERE status = 'CANCELLED' 
-- AND created_at < NOW() - INTERVAL '30 days';

-- ========================================
-- Instructions:
-- ========================================
/*
1. Copy this SQL and run it in Supabase SQL Editor
2. Set environment variables in Supabase Dashboard:
   - Go to Settings → Functions
   - Add: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_API_BASE
3. Deploy the TypeScript functions:
   - supabase functions deploy create-paypal-order
   - supabase functions deploy capture-paypal-payment
4. Test the functions using the sample queries above
*/
