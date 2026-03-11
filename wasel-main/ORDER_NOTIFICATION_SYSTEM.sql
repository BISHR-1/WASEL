-- =====================================================
-- WASEL ORDER NOTIFICATION & REVIEW SYSTEM
-- SQL Script for Supabase
-- =====================================================

-- =====================================================
-- 1. EMAIL NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.email_notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_email text NOT NULL,
  recipient_name text,
  subject text NOT NULL,
  body_html text NOT NULL,
  body_text text,
  notification_type text NOT NULL CHECK (notification_type IN (
    'order_confirmation', 'payment_success', 'order_shipped',
    'order_delivered', 'admin_notification', 'refund_notification'
  )),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view all email notifications" ON public.email_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_id = auth.uid()
      AND users.role IN ('admin', 'operator')
    )
  );

CREATE POLICY "System can insert email notifications" ON public.email_notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update email notifications" ON public.email_notifications
  FOR UPDATE USING (true);

-- Indexes
CREATE INDEX idx_email_notifications_order_id ON public.email_notifications(order_id);
CREATE INDEX idx_email_notifications_user_id ON public.email_notifications(user_id);
CREATE INDEX idx_email_notifications_status ON public.email_notifications(status);
CREATE INDEX idx_email_notifications_type ON public.email_notifications(notification_type);

-- =====================================================
-- 2. ORDER REVIEWS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.order_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  delivery_rating integer CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
  product_quality_rating integer CHECK (product_quality_rating >= 1 AND product_quality_rating <= 5),
  customer_service_rating integer CHECK (customer_service_rating >= 1 AND customer_service_rating <= 5),
  is_verified_purchase boolean DEFAULT true,
  is_public boolean DEFAULT true,
  admin_response text,
  admin_response_at timestamp with time zone,
  helpful_votes integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  -- Ensure one review per order per user
  UNIQUE(order_id, user_id)
);

-- Enable RLS
ALTER TABLE public.order_reviews ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view public reviews" ON public.order_reviews
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own reviews" ON public.order_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON public.order_reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews" ON public.order_reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_id = auth.uid()
      AND users.role IN ('admin', 'operator')
    )
  );

-- Indexes
CREATE INDEX idx_order_reviews_order_id ON public.order_reviews(order_id);
