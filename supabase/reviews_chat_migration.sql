-- =============================================
-- Reviews & Chat System Migration
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Ensure reviews table has proper structure
-- (may already exist; ALTER to add missing columns)
DO $$
BEGIN
  -- Add item_type if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'item_type') THEN
    ALTER TABLE public.reviews ADD COLUMN item_type text DEFAULT 'product';
  END IF;

  -- Add item_id if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'item_id') THEN
    ALTER TABLE public.reviews ADD COLUMN item_id uuid;
  END IF;

  -- Add reviewer_user_id if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'reviewer_user_id') THEN
    ALTER TABLE public.reviews ADD COLUMN reviewer_user_id uuid REFERENCES auth.users(id);
  END IF;

  -- Add reviewer_role if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'reviewer_role') THEN
    ALTER TABLE public.reviews ADD COLUMN reviewer_role text DEFAULT 'single';
  END IF;

  -- Add user_id if missing (public.users reference)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'user_id') THEN
    ALTER TABLE public.reviews ADD COLUMN user_id uuid;
  END IF;

  -- Add comment if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'comment') THEN
    ALTER TABLE public.reviews ADD COLUMN comment text DEFAULT '';
  END IF;

  -- Add created_at if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'created_at') THEN
    ALTER TABLE public.reviews ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;

  -- Add updated_at if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'updated_at') THEN
    ALTER TABLE public.reviews ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- 2. Ensure order_feedback table has proper structure
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_feedback' AND column_name = 'reviewer_user_id') THEN
    ALTER TABLE public.order_feedback ADD COLUMN reviewer_user_id uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_feedback' AND column_name = 'reviewer_role') THEN
    ALTER TABLE public.order_feedback ADD COLUMN reviewer_role text DEFAULT 'single';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_feedback' AND column_name = 'metadata') THEN
    ALTER TABLE public.order_feedback ADD COLUMN metadata jsonb DEFAULT '{}';
  END IF;
END $$;


-- 3. Create direct_messages table for supervisor↔courier and customer support chat
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id text NOT NULL,
  sender_id uuid NOT NULL,
  sender_name text,
  sender_role text NOT NULL DEFAULT 'customer', -- 'customer', 'courier', 'supervisor'
  message text NOT NULL DEFAULT '',
  attachment_url text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Index for fast conversation lookups
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON public.direct_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON public.direct_messages(sender_id);

-- 4. Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id text PRIMARY KEY, -- format: 'type:user1_id:user2_id' or 'support:user_id'
  type text NOT NULL DEFAULT 'support', -- 'courier_supervisor', 'support'
  participant_ids uuid[] NOT NULL DEFAULT '{}',
  last_message text,
  last_message_at timestamptz,
  status text DEFAULT 'active', -- 'active', 'closed'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations USING GIN(participant_ids);
CREATE INDEX IF NOT EXISTS idx_conversations_type ON public.conversations(type);

-- 5. Enable RLS
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for direct_messages
DROP POLICY IF EXISTS "Users can read their messages" ON public.direct_messages;
CREATE POLICY "Users can read their messages" ON public.direct_messages
  FOR SELECT USING (
    sender_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND auth.uid() = ANY(c.participant_ids)
    )
    OR EXISTS (
      SELECT 1 FROM public.admin_users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their messages" ON public.direct_messages;
CREATE POLICY "Users can insert their messages" ON public.direct_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.admin_users WHERE id = auth.uid()
    )
  );

-- 7. RLS Policies for conversations
DROP POLICY IF EXISTS "Users can read their conversations" ON public.conversations;
CREATE POLICY "Users can read their conversations" ON public.conversations
  FOR SELECT USING (
    auth.uid() = ANY(participant_ids)
    OR EXISTS (
      SELECT 1 FROM public.admin_users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (
    auth.uid() = ANY(participant_ids)
    OR EXISTS (
      SELECT 1 FROM public.admin_users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their conversations" ON public.conversations;
CREATE POLICY "Users can update their conversations" ON public.conversations
  FOR UPDATE USING (
    auth.uid() = ANY(participant_ids)
    OR EXISTS (
      SELECT 1 FROM public.admin_users WHERE id = auth.uid()
    )
  );

-- 8. Enable Realtime for direct_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- 9. RLS for reviews (ensure public can read, authenticated can write)
DROP POLICY IF EXISTS "Anyone can read reviews" ON public.reviews;
CREATE POLICY "Anyone can read reviews" ON public.reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.reviews;
CREATE POLICY "Authenticated users can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
CREATE POLICY "Users can update own reviews" ON public.reviews
  FOR UPDATE USING (
    reviewer_user_id = auth.uid()
    OR user_id::text = auth.uid()::text
    OR EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
  );

-- 10. RLS for order_feedback
DROP POLICY IF EXISTS "Anyone can read feedback" ON public.order_feedback;
CREATE POLICY "Anyone can read feedback" ON public.order_feedback
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can write feedback" ON public.order_feedback;
CREATE POLICY "Authenticated users can write feedback" ON public.order_feedback
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own feedback" ON public.order_feedback;
CREATE POLICY "Users can update own feedback" ON public.order_feedback
  FOR UPDATE USING (
    reviewer_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
  );

-- 11. Helpful function: get average rating for a product
CREATE OR REPLACE FUNCTION public.get_product_avg_rating(p_item_id uuid)
RETURNS TABLE(avg_rating numeric, review_count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROUND(AVG(r.rating)::numeric, 1) as avg_rating,
    COUNT(*)::bigint as review_count
  FROM public.reviews r
  WHERE r.item_id = p_item_id
    AND r.rating > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Function: get reviews summary for supervisor dashboard
CREATE OR REPLACE FUNCTION public.get_reviews_summary()
RETURNS TABLE(
  total_reviews bigint,
  avg_overall numeric,
  avg_product numeric,
  avg_service numeric,
  five_star bigint,
  four_star bigint,
  three_star bigint,
  two_star bigint,
  one_star bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint as total_reviews,
    ROUND(AVG(of2.overall_rating)::numeric, 1) as avg_overall,
    ROUND(AVG(of2.product_quality_rating)::numeric, 1) as avg_product,
    ROUND(AVG(of2.support_rating)::numeric, 1) as avg_service,
    COUNT(*) FILTER (WHERE of2.overall_rating = 5)::bigint as five_star,
    COUNT(*) FILTER (WHERE of2.overall_rating = 4)::bigint as four_star,
    COUNT(*) FILTER (WHERE of2.overall_rating = 3)::bigint as three_star,
    COUNT(*) FILTER (WHERE of2.overall_rating = 2)::bigint as two_star,
    COUNT(*) FILTER (WHERE of2.overall_rating = 1)::bigint as one_star
  FROM public.order_feedback of2
  WHERE of2.overall_rating > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
