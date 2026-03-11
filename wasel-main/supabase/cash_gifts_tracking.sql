-- =====================================================
-- Cash Gifts (Envelope Gifts) Tracking System
-- نظام تتبع الهدايا النقدية (هدايا الظروف)
-- =====================================================

-- Create main table for cash gifts
CREATE TABLE IF NOT EXISTS cash_gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT, -- For non-authenticated users
  
  -- Sender info
  sender_name TEXT,
  sender_phone TEXT,
  sender_country TEXT,
  
  -- Recipient info
  recipient_name TEXT,
  recipient_phone TEXT,
  recipient_address TEXT,
  
  -- Gift details
  gift_amount_usd DECIMAL(15, 2) NOT NULL,
  gift_amount_syp DECIMAL(20, 2) NOT NULL,
  gift_currency VARCHAR(10) DEFAULT 'USD', -- USD or SYP
  original_currency_amount DECIMAL(15, 2), -- Original amount entered by user
  
  -- Envelope customization (future use)
  gift_message TEXT, -- Optional message in envelope
  gift_message_ar TEXT, -- Arabic message
  envelope_color VARCHAR(20) DEFAULT 'purple', -- purple, pink, gold, etc.
  
  -- Status tracking
  order_status VARCHAR(50) DEFAULT 'pending', -- pending, sent, delivered, failed
  delivery_date TIMESTAMP,
  
  -- Metadata
  exchange_rate_used DECIMAL(10, 4), -- Rate used for conversion
  delivery_time_requested TIMESTAMP, -- When user wants gift to be delivered
  special_occasion VARCHAR(100), -- Birthday, Wedding, etc. (future)
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_cash_gifts_order_id ON cash_gifts(order_id);
CREATE INDEX idx_cash_gifts_user_id ON cash_gifts(user_id);
CREATE INDEX idx_cash_gifts_email ON cash_gifts(email);
CREATE INDEX idx_cash_gifts_recipient_phone ON cash_gifts(recipient_phone);
CREATE INDEX idx_cash_gifts_created_at ON cash_gifts(created_at);
CREATE INDEX idx_cash_gifts_order_status ON cash_gifts(order_status);

-- Create summary table for analytics
CREATE TABLE IF NOT EXISTS cash_gifts_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE DEFAULT CURRENT_DATE,
  total_gifts_count INT DEFAULT 0,
  total_amount_usd DECIMAL(20, 2) DEFAULT 0,
  total_amount_syp DECIMAL(25, 2) DEFAULT 0,
  avg_gift_amount_usd DECIMAL(15, 2),
  max_gift_amount_usd DECIMAL(15, 2),
  min_gift_amount_usd DECIMAL(15, 2),
  gifts_inside_syria INT DEFAULT 0,
  gifts_outside_syria INT DEFAULT 0,
  successful_gifts INT DEFAULT 0,
  failed_gifts INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(date)
);

CREATE INDEX idx_cash_gifts_analytics_date ON cash_gifts_analytics(date);

-- =====================================================
-- Functions for Cash Gifts Management
-- =====================================================

-- Function to create a new cash gift
CREATE OR REPLACE FUNCTION create_cash_gift(
  p_order_id UUID,
  p_user_id UUID,
  p_email TEXT,
  p_sender_name TEXT,
  p_sender_phone TEXT,
  p_sender_country TEXT,
  p_recipient_name TEXT,
  p_recipient_phone TEXT,
  p_recipient_address TEXT,
  p_gift_amount_usd DECIMAL,
  p_gift_amount_syp DECIMAL,
  p_gift_currency VARCHAR,
  p_original_amount DECIMAL,
  p_exchange_rate DECIMAL,
  p_gift_message TEXT DEFAULT NULL,
  p_delivery_time TIMESTAMP DEFAULT NULL
)
RETURNS TABLE(
  gift_id UUID,
  status TEXT,
  message TEXT
) AS $$
DECLARE
  v_gift_id UUID;
BEGIN
  INSERT INTO cash_gifts (
    order_id, user_id, email,
    sender_name, sender_phone, sender_country,
    recipient_name, recipient_phone, recipient_address,
    gift_amount_usd, gift_amount_syp, gift_currency,
    original_currency_amount, exchange_rate_used,
    gift_message, delivery_time_requested, order_status
  )
  VALUES (
    p_order_id, p_user_id, p_email,
    p_sender_name, p_sender_phone, p_sender_country,
    p_recipient_name, p_recipient_phone, p_recipient_address,
    p_gift_amount_usd, p_gift_amount_syp, p_gift_currency,
    p_original_amount, p_exchange_rate,
    p_gift_message, p_delivery_time, 'pending'
  )
  RETURNING id INTO v_gift_id;

  RETURN QUERY
  SELECT v_gift_id, 'success'::TEXT, 'تم حفظ الهدية بنجاح'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to update gift status
CREATE OR REPLACE FUNCTION update_gift_status(
  p_gift_id UUID,
  p_new_status VARCHAR
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT
) AS $$
BEGIN
  UPDATE cash_gifts
  SET order_status = p_new_status, updated_at = NOW()
  WHERE id = p_gift_id;

  RETURN QUERY
  SELECT TRUE, 'تم تحديث حالة الهدية: ' || p_new_status;
END;
$$ LANGUAGE plpgsql;

-- Function to get gift details by order
CREATE OR REPLACE FUNCTION get_gifts_by_order(p_order_id UUID)
RETURNS TABLE(
  gift_id UUID,
  recipient_name TEXT,
  recipient_phone TEXT,
  gift_amount_usd DECIMAL,
  gift_amount_syp DECIMAL,
  gift_currency VARCHAR,
  order_status VARCHAR,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cg.id,
    cg.recipient_name,
    cg.recipient_phone,
    cg.gift_amount_usd,
    cg.gift_amount_syp,
    cg.gift_currency,
    cg.order_status,
    cg.created_at
  FROM cash_gifts cg
  WHERE cg.order_id = p_order_id
  ORDER BY cg.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's total gifts sent
CREATE OR REPLACE FUNCTION get_user_gifts_summary(p_user_id UUID, p_email TEXT)
RETURNS TABLE(
  total_gifts_sent INT,
  total_amount_usd DECIMAL,
  total_amount_syp DECIMAL,
  successfully_sent INT,
  pending_gifts INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INT as total_gifts,
    ROUND(CAST(SUM(gift_amount_usd) AS NUMERIC), 2)::DECIMAL,
    ROUND(CAST(SUM(gift_amount_syp) AS NUMERIC), 2)::DECIMAL,
    COUNT(CASE WHEN order_status = 'sent' OR order_status = 'delivered' THEN 1 END)::INT,
    COUNT(CASE WHEN order_status = 'pending' THEN 1 END)::INT
  FROM cash_gifts
  WHERE (user_id = p_user_id OR (p_user_id IS NULL AND email = p_email));
END;
$$ LANGUAGE plpgsql;

-- Function to calculate daily analytics
CREATE OR REPLACE FUNCTION calculate_daily_gift_analytics(p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_total_count INT;
  v_total_usd DECIMAL;
  v_total_syp DECIMAL;
  v_avg_usd DECIMAL;
  v_max_usd DECIMAL;
  v_min_usd DECIMAL;
  v_inside_syria INT;
  v_outside_syria INT;
  v_successful INT;
  v_failed INT;
BEGIN
  -- Calculate statistics
  SELECT 
    COUNT(*),
    ROUND(CAST(SUM(COALESCE(gift_amount_usd, 0)) AS NUMERIC), 2),
    ROUND(CAST(SUM(COALESCE(gift_amount_syp, 0)) AS NUMERIC), 2),
    ROUND(CAST(AVG(gift_amount_usd) AS NUMERIC), 2),
    MAX(gift_amount_usd),
    MIN(gift_amount_usd),
    COUNT(CASE WHEN sender_country = 'syria' THEN 1 END),
    COUNT(CASE WHEN sender_country != 'syria' THEN 1 END),
    COUNT(CASE WHEN order_status IN ('sent', 'delivered') THEN 1 END),
    COUNT(CASE WHEN order_status = 'failed' THEN 1 END)
  INTO
    v_total_count, v_total_usd, v_total_syp, v_avg_usd, v_max_usd, v_min_usd,
    v_inside_syria, v_outside_syria, v_successful, v_failed
  FROM cash_gifts
  WHERE DATE(created_at) = p_date;

  -- Insert or update analytics
  INSERT INTO cash_gifts_analytics (
    date, total_gifts_count, total_amount_usd, total_amount_syp,
    avg_gift_amount_usd, max_gift_amount_usd, min_gift_amount_usd,
    gifts_inside_syria, gifts_outside_syria, successful_gifts, failed_gifts
  )
  VALUES (
    p_date, COALESCE(v_total_count, 0), COALESCE(v_total_usd, 0), COALESCE(v_total_syp, 0),
    v_avg_usd, v_max_usd, v_min_usd,
    COALESCE(v_inside_syria, 0), COALESCE(v_outside_syria, 0),
    COALESCE(v_successful, 0), COALESCE(v_failed, 0)
  )
  ON CONFLICT (date) DO UPDATE SET
    total_gifts_count = COALESCE(v_total_count, 0),
    total_amount_usd = COALESCE(v_total_usd, 0),
    total_amount_syp = COALESCE(v_total_syp, 0),
    avg_gift_amount_usd = v_avg_usd,
    max_gift_amount_usd = v_max_usd,
    min_gift_amount_usd = v_min_usd,
    gifts_inside_syria = COALESCE(v_inside_syria, 0),
    gifts_outside_syria = COALESCE(v_outside_syria, 0),
    successful_gifts = COALESCE(v_successful, 0),
    failed_gifts = COALESCE(v_failed, 0),
    updated_at = NOW();

  RETURN QUERY
  SELECT TRUE, 'تم حساب التحليلات اليومية للهدايا بنجاح'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Trigger to auto-calculate analytics
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_update_gift_analytics()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_daily_gift_analytics(DATE(NEW.created_at));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_cash_gift_insert ON cash_gifts;
CREATE TRIGGER on_cash_gift_insert
AFTER INSERT ON cash_gifts
FOR EACH ROW
EXECUTE FUNCTION trigger_update_gift_analytics();

-- =====================================================
-- QUERIES FOR ANALYTICS & REPORTING
-- =====================================================

-- Query 1: Get all gifts sent today
SELECT 
  id,
  recipient_name,
  gift_amount_usd,
  gift_amount_syp,
  gift_currency,
  order_status,
  created_at
FROM cash_gifts
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;

-- Query 2: Get gifts by amount range
SELECT 
  id,
  recipient_name,
  recipient_phone,
  gift_amount_usd,
  sender_country,
  order_status
FROM cash_gifts
WHERE gift_amount_usd BETWEEN 5 AND 50
ORDER BY gift_amount_usd DESC;

-- Query 3: Revenue from gifts (total amount received)
SELECT 
  DATE(created_at) as gift_date,
  COUNT(*) as total_gifts,
  ROUND(CAST(SUM(gift_amount_usd) AS NUMERIC), 2) as revenue_usd,
  ROUND(CAST(SUM(gift_amount_syp) AS NUMERIC), 2) as revenue_syp,
  COUNT(CASE WHEN order_status = 'sent' THEN 1 END) as successfully_sent
FROM cash_gifts
GROUP BY DATE(created_at)
ORDER BY gift_date DESC;

-- Query 4: Top recipients (most gifts received)
SELECT 
  recipient_phone,
  recipient_name,
  COUNT(*) as gifts_received,
  ROUND(CAST(SUM(gift_amount_usd) AS NUMERIC), 2) as total_amount_usd
FROM cash_gifts
WHERE order_status IN ('sent', 'delivered')
GROUP BY recipient_phone, recipient_name
ORDER BY gifts_received DESC
LIMIT 20;

-- Query 5: Top senders (most gifts sent)
SELECT 
  COALESCE(user_id::TEXT, email) as sender_id,
  sender_name,
  COUNT(*) as gifts_sent,
  ROUND(CAST(SUM(gift_amount_usd) AS NUMERIC), 2) as total_amount_usd
FROM cash_gifts
WHERE order_status IN ('sent', 'delivered')
GROUP BY sender_id, sender_name, user_id, email
ORDER BY gifts_sent DESC
LIMIT 20;

-- Query 6: Gift status distribution
SELECT 
  order_status,
  COUNT(*) as count,
  ROUND(CAST(SUM(gift_amount_usd) AS NUMERIC), 2) as total_usd,
  ROUND(CAST(100.0 * COUNT(*) / (SELECT COUNT(*) FROM cash_gifts) AS NUMERIC), 2) as percentage
FROM cash_gifts
GROUP BY order_status
ORDER BY count DESC;

-- Query 7: Geographic distribution of gifts
SELECT 
  sender_country,
  COUNT(*) as gifts_sent,
  ROUND(CAST(SUM(gift_amount_usd) AS NUMERIC), 2) as total_usd,
  ROUND(CAST(AVG(gift_amount_usd) AS NUMERIC), 2) as avg_amount
FROM cash_gifts
WHERE sender_country IS NOT NULL
GROUP BY sender_country
ORDER BY gifts_sent DESC;

-- Query 8: Daily analytics summary
SELECT 
  date,
  total_gifts_count,
  ROUND(CAST(total_amount_usd AS NUMERIC), 2) as total_usd,
  ROUND(CAST(total_amount_syp AS NUMERIC), 2) as total_syp,
  ROUND(CAST(avg_gift_amount_usd AS NUMERIC), 2) as avg_amount,
  successful_gifts,
  failed_gifts,
  CASE 
    WHEN total_gifts_count > 0 THEN ROUND(CAST(100.0 * successful_gifts / total_gifts_count AS NUMERIC), 2)
    ELSE 0
  END as success_rate_percent
FROM cash_gifts_analytics
ORDER BY date DESC
LIMIT 30;

-- Query 9: User's gift sending history
SELECT 
  id,
  order_id,
  recipient_name,
  recipient_phone,
  gift_amount_usd,
  gift_currency,
  order_status,
  created_at
FROM cash_gifts
WHERE email = 'user@example.com' -- Replace with actual email
ORDER BY created_at DESC;

-- Query 10: Failed gifts that need follow-up
SELECT 
  id,
  recipient_name,
  recipient_phone,
  gift_amount_usd,
  gift_currency,
  sender_country,
  created_at
FROM cash_gifts
WHERE order_status = 'failed'
AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Query 11: Pending gifts (not yet sent)
SELECT 
  id,
  order_id,
  recipient_name,
  recipient_phone,
  gift_amount_usd,
  delivery_time_requested,
  created_at
FROM cash_gifts
WHERE order_status = 'pending'
ORDER BY delivery_time_requested ASC, created_at ASC;

-- Query 12: Export gifts data (for reports)
SELECT 
  id,
  order_id,
  sender_name,
  sender_phone,
  sender_country,
  recipient_name,
  recipient_phone,
  recipient_address,
  gift_amount_usd,
  gift_amount_syp,
  gift_currency,
  order_status,
  created_at,
  delivery_date
FROM cash_gifts
WHERE DATE(created_at) BETWEEN '2026-03-01' AND '2026-03-11'
ORDER BY created_at DESC;

-- =====================================================
-- Maintenance Queries
-- =====================================================

-- Clean up failed gifts older than 30 days
DELETE FROM cash_gifts
WHERE order_status = 'failed'
AND created_at < NOW() - INTERVAL '30 days';

-- Update analytics for all previous dates
SELECT calculate_daily_gift_analytics(DATE(created_at))
FROM cash_gifts
WHERE DATE(created_at) != CURRENT_DATE
GROUP BY DATE(created_at);
