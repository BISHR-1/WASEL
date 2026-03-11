-- =====================================================
-- Free Orders Tracking System
-- System to track first 3 free orders for each user
-- =====================================================

-- Create table to track user order count and free orders status
CREATE TABLE IF NOT EXISTS user_order_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT, -- For non-authenticated users
  total_orders INT DEFAULT 0,
  free_orders_remaining INT DEFAULT 3,
  free_delivery_active BOOLEAN DEFAULT TRUE,
  free_service_fee_active BOOLEAN DEFAULT TRUE,
  last_order_date TIMESTAMP DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, email)
);

-- Create index for faster lookups
CREATE INDEX idx_user_order_tracking_user_id ON user_order_tracking(user_id);
CREATE INDEX idx_user_order_tracking_email ON user_order_tracking(email);

-- Create table to track individual order details for analytics
CREATE TABLE IF NOT EXISTS order_fee_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  is_first_order BOOLEAN DEFAULT FALSE,
  delivery_fee_waived BOOLEAN DEFAULT FALSE,
  service_fee_waived BOOLEAN DEFAULT FALSE,
  original_delivery_fee_usd DECIMAL(10, 2),
  original_service_fee_usd DECIMAL(10, 2),
  savings_usd DECIMAL(10, 2) DEFAULT 0,
  user_location TEXT, -- 'inside_syria' or 'outside_syria'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_order_fee_tracking_user_id ON order_fee_tracking(user_id);
CREATE INDEX idx_order_fee_tracking_order_id ON order_fee_tracking(order_id);

-- Create function to get user's free orders remaining
CREATE OR REPLACE FUNCTION get_user_free_orders_remaining(p_user_id UUID, p_email TEXT)
RETURNS TABLE(
  free_delivery_remaining INT,
  free_service_fee_remaining INT,
  total_orders INT,
  is_eligible_for_free BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ut.free_orders_remaining,
    ut.free_orders_remaining,
    ut.total_orders,
    (ut.free_orders_remaining > 0)::BOOLEAN
  FROM user_order_tracking ut
  WHERE (ut.user_id = p_user_id OR (p_user_id IS NULL AND ut.email = p_email))
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create function to decrement free orders count
CREATE OR REPLACE FUNCTION decrement_free_orders(p_user_id UUID, p_email TEXT)
RETURNS TABLE(
  free_orders_remaining INT,
  message TEXT
) AS $$
DECLARE
  v_remaining INT;
BEGIN
  UPDATE user_order_tracking
  SET
    total_orders = total_orders + 1,
    free_orders_remaining = GREATEST(0, free_orders_remaining - 1),
    last_order_date = NOW(),
    updated_at = NOW(),
    free_delivery_active = (free_orders_remaining - 1 > 0),
    free_service_fee_active = (free_orders_remaining - 1 > 0)
  WHERE (user_id = p_user_id OR (p_user_id IS NULL AND email = p_email))
  RETURNING free_orders_remaining INTO v_remaining;

  RETURN QUERY
  SELECT
    v_remaining,
    CASE
      WHEN v_remaining = 0 THEN 'آخر طلب مجاني! من الطلب الرابع ستبدأ الرسوم العادية'
      WHEN v_remaining = 1 THEN 'لديك طلب مجاني واحد متبقي'
      WHEN v_remaining = 2 THEN 'لديك طلبان مجانيان متبقيان'
      ELSE 'لديك ' || v_remaining::TEXT || ' طلبات مجانية متبقية'
    END;
END;
$$ LANGUAGE plpgsql;

-- Create function to initialize order tracking for new user
CREATE OR REPLACE FUNCTION init_user_order_tracking(p_user_id UUID, p_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO user_order_tracking (user_id, email, total_orders, free_orders_remaining)
  VALUES (p_user_id, p_email, 0, 3)
  ON CONFLICT (user_id, email) DO NOTHING;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-initialize on first order
CREATE OR REPLACE FUNCTION trigger_init_user_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Initialize or update user order tracking
  PERFORM init_user_order_tracking(NEW.user_id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on orders table
DROP TRIGGER IF EXISTS trigger_init_user_order_tracking ON orders;
CREATE TRIGGER trigger_init_user_order_tracking
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION trigger_init_user_on_order();

-- =====================================================
-- Seed data: Initialize example users (optional)
-- =====================================================
-- Insert sample entries for demonstration
INSERT INTO user_order_tracking (user_id, email, total_orders, free_orders_remaining)
VALUES
  (NULL, 'guest1@example.com', 1, 2),
  (NULL, 'guest2@example.com', 0, 3),
  (NULL, 'guest3@example.com', 3, 0)
ON CONFLICT (user_id, email) DO NOTHING;

-- =====================================================
-- Queries to check free orders status
-- =====================================================

-- Query 1: Get all users with free orders remaining
SELECT 
  user_id,
  email,
  total_orders,
  free_orders_remaining,
  free_delivery_active,
  free_service_fee_active,
  updated_at
FROM user_order_tracking
WHERE free_orders_remaining > 0
ORDER BY updated_at DESC;

-- Query 2: Get users who have used all 3 free orders
SELECT 
  user_id,
  email,
  total_orders,
  free_orders_remaining,
  last_order_date
FROM user_order_tracking
WHERE free_orders_remaining = 0
ORDER BY last_order_date DESC;

-- Query 3: Get fee savings statistics
SELECT
  COUNT(*) as total_orders_tracked,
  COUNT(CASE WHEN delivery_fee_waived THEN 1 END) as orders_with_free_delivery,
  COUNT(CASE WHEN service_fee_waived THEN 1 END) as orders_with_free_service_fee,
  ROUND(CAST(SUM(savings_usd) AS NUMERIC), 2) as total_savings_usd,
  user_location,
  DATE(created_at) as order_date
FROM order_fee_tracking
GROUP BY user_location, DATE(created_at)
ORDER BY order_date DESC;

-- Query 4: Revenue impact analysis
SELECT
  DATE(created_at) as order_date,
  COUNT(*) as total_orders,
  ROUND(CAST(SUM(original_delivery_fee_usd) AS NUMERIC), 2) as potential_delivery_revenue,
  ROUND(CAST(SUM(CASE WHEN delivery_fee_waived THEN original_delivery_fee_usd ELSE 0 END) AS NUMERIC), 2) as waived_delivery_revenue,
  ROUND(CAST(SUM(original_service_fee_usd) AS NUMERIC), 2) as potential_service_revenue,
  ROUND(CAST(SUM(CASE WHEN service_fee_waived THEN original_service_fee_usd ELSE 0 END) AS NUMERIC), 2) as waived_service_revenue
FROM order_fee_tracking
GROUP BY DATE(created_at)
ORDER BY order_date DESC;
