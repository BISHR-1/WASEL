-- =====================================================
-- 031: Enhanced Coupon/Discount Code System
-- =====================================================

-- Ensure coupons table exists with all needed columns
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')) DEFAULT 'percentage',
  discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_order_usd DECIMAL(10,2) DEFAULT 0,
  max_discount_usd DECIMAL(10,2),
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  region TEXT CHECK (region IN ('all', 'inside_syria', 'outside_syria')) DEFAULT 'all',
  applicable_categories TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Add missing columns if table already existed
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coupons' AND column_name='region') THEN
    ALTER TABLE public.coupons ADD COLUMN region TEXT CHECK (region IN ('all', 'inside_syria', 'outside_syria')) DEFAULT 'all';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coupons' AND column_name='applicable_categories') THEN
    ALTER TABLE public.coupons ADD COLUMN applicable_categories TEXT[] DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coupons' AND column_name='starts_at') THEN
    ALTER TABLE public.coupons ADD COLUMN starts_at TIMESTAMPTZ DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coupons' AND column_name='expires_at') THEN
    ALTER TABLE public.coupons ADD COLUMN expires_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coupons' AND column_name='description') THEN
    ALTER TABLE public.coupons ADD COLUMN description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coupons' AND column_name='created_by') THEN
    ALTER TABLE public.coupons ADD COLUMN created_by UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coupons' AND column_name='discount_value') THEN
    ALTER TABLE public.coupons ADD COLUMN discount_value DECIMAL(10,2) DEFAULT 0;
  END IF;
END $$;

-- Coupon usage tracking
CREATE TABLE IF NOT EXISTS public.coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID,
  order_id UUID,
  used_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(coupon_id, user_id)
);

-- RLS policies
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

-- Everyone can read active coupons
DROP POLICY IF EXISTS coupons_read ON public.coupons;
CREATE POLICY coupons_read ON public.coupons FOR SELECT USING (true);

-- Staff can manage coupons
DROP POLICY IF EXISTS coupons_manage ON public.coupons;
CREATE POLICY coupons_manage ON public.coupons FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role IN ('admin', 'super_admin', 'supervisor', 'support', 'operator'))
);

-- Users can read their own coupon usage
DROP POLICY IF EXISTS coupon_usage_read ON public.coupon_usage;
CREATE POLICY coupon_usage_read ON public.coupon_usage FOR SELECT USING (true);

DROP POLICY IF EXISTS coupon_usage_insert ON public.coupon_usage;
CREATE POLICY coupon_usage_insert ON public.coupon_usage FOR INSERT WITH CHECK (true);

GRANT SELECT ON public.coupons TO anon, authenticated;
GRANT ALL ON public.coupon_usage TO authenticated;

-- RPC to validate and apply a coupon
CREATE OR REPLACE FUNCTION public.validate_coupon(
  p_code TEXT,
  p_user_id UUID DEFAULT NULL,
  p_region TEXT DEFAULT 'all'
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_coupon RECORD;
  v_usage_count INTEGER;
BEGIN
  -- Find coupon
  SELECT * INTO v_coupon FROM public.coupons
    WHERE UPPER(code) = UPPER(p_code)
    AND is_active = true
    LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'كود الخصم غير صالح');
  END IF;

  -- Check expiry
  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'كود الخصم منتهي الصلاحية');
  END IF;

  -- Check start date
  IF v_coupon.starts_at IS NOT NULL AND v_coupon.starts_at > now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'كود الخصم لم يبدأ بعد');
  END IF;

  -- Check usage limit
  IF v_coupon.usage_limit IS NOT NULL AND v_coupon.used_count >= v_coupon.usage_limit THEN
    RETURN jsonb_build_object('valid', false, 'error', 'تم استخدام كود الخصم الحد الأقصى من المرات');
  END IF;

  -- Check region
  IF v_coupon.region IS NOT NULL AND v_coupon.region != 'all' AND v_coupon.region != p_region THEN
    RETURN jsonb_build_object('valid', false, 'error', 'كود الخصم غير متاح لمنطقتك');
  END IF;

  -- Check per-user usage
  IF p_user_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_usage_count FROM public.coupon_usage
      WHERE coupon_id = v_coupon.id AND user_id = p_user_id;
    IF v_usage_count > 0 THEN
      RETURN jsonb_build_object('valid', false, 'error', 'لقد استخدمت هذا الكود من قبل');
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'id', v_coupon.id,
    'code', v_coupon.code,
    'discount_type', v_coupon.discount_type,
    'discount_value', v_coupon.discount_value,
    'description', COALESCE(v_coupon.description, ''),
    'applicable_categories', COALESCE(v_coupon.applicable_categories, '{}'),
    'max_discount_usd', v_coupon.max_discount_usd,
    'min_order_usd', v_coupon.min_order_usd
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_coupon TO anon, authenticated;

-- Track first 3 orders for free delivery
-- We'll use orders count per user to determine eligibility
-- No migration needed - logic is frontend-based using orders count query
