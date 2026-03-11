-- =====================================================
-- SHARED ORDERS + DELIVERY PROOFS + DUAL REVIEWS
-- Migration: 008_shared_orders_delivery_proofs_dual_reviews.sql
-- Date: 2026-03-09
-- =====================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- 1) SAFE HELPERS FOR MIXED SCHEMA STATES
-- =====================================================

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
	v_user_id uuid;
BEGIN
	-- Works whether users.auth_id is mapped or users.id == auth.uid()
	SELECT u.id
	INTO v_user_id
	FROM public.users u
	WHERE u.auth_id = auth.uid() OR u.id = auth.uid()
	LIMIT 1;

	RETURN v_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
	claims jsonb;
BEGIN
	claims := COALESCE(
		current_setting('request.jwt.claims', true)::jsonb,
		'{}'::jsonb
	);
	RETURN NULLIF(claims->>'email', '');
END;
$$;

CREATE OR REPLACE FUNCTION public.is_staff_user()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
	SELECT EXISTS (
		SELECT 1
		FROM public.users u
		WHERE (u.auth_id = auth.uid() OR u.id = auth.uid())
			AND u.role IN ('admin', 'operator', 'courier')
	);
$$;

CREATE OR REPLACE FUNCTION public.user_can_access_order(p_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
	v_order jsonb;
	v_uid uuid;
	v_email text;
BEGIN
	v_uid := public.current_app_user_id();
	v_email := public.current_user_email();

	SELECT to_jsonb(o)
	INTO v_order
	FROM public.orders o
	WHERE o.id = p_order_id;

	IF v_order IS NULL THEN
		RETURN false;
	END IF;

	IF public.is_staff_user() THEN
		RETURN true;
	END IF;

	-- UUID-based ownership/collaboration checks
	IF v_uid IS NOT NULL THEN
		IF (v_order->>'user_id')::uuid = v_uid THEN RETURN true; END IF;
		IF NULLIF(v_order->>'recipient_user_id', '')::uuid = v_uid THEN RETURN true; END IF;
		IF NULLIF(v_order->>'payer_user_id', '')::uuid = v_uid THEN RETURN true; END IF;
		IF NULLIF(v_order->>'paid_by_user_id', '')::uuid = v_uid THEN RETURN true; END IF;
		IF NULLIF(v_order->>'courier_id', '')::uuid = v_uid THEN RETURN true; END IF;
	END IF;

	-- Legacy email-based ownership (if orders.user_email exists)
	IF v_email IS NOT NULL AND lower(COALESCE(v_order->>'user_email', '')) = lower(v_email) THEN
		RETURN true;
	END IF;

	RETURN false;
EXCEPTION
	WHEN invalid_text_representation THEN
		RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	NEW.updated_at = now();
	RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_share_code(p_len integer DEFAULT 10)
RETURNS text
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
	v_raw text;
BEGIN
	v_raw := upper(replace(encode(gen_random_bytes(GREATEST(p_len, 6)), 'base64'), '/', 'A'));
	v_raw := replace(v_raw, '+', 'B');
	v_raw := replace(v_raw, '=', '');
	RETURN substring(v_raw from 1 for p_len);
END;
$$;

-- =====================================================
-- 2) ORDERS EXTENSIONS (ADDITIVE ONLY)
-- =====================================================

ALTER TABLE public.orders
	ADD COLUMN IF NOT EXISTS recipient_user_id uuid REFERENCES public.users(id),
	ADD COLUMN IF NOT EXISTS payer_user_id uuid REFERENCES public.users(id),
	ADD COLUMN IF NOT EXISTS paid_by_user_id uuid REFERENCES public.users(id),
	ADD COLUMN IF NOT EXISTS collaboration_mode text DEFAULT 'single' CHECK (collaboration_mode IN ('single', 'shared')),
	ADD COLUMN IF NOT EXISTS payment_locked boolean DEFAULT false,
	ADD COLUMN IF NOT EXISTS payment_link_expires_at timestamptz,
	ADD COLUMN IF NOT EXISTS delivery_proof_required boolean DEFAULT true,
	ADD COLUMN IF NOT EXISTS status_last_changed_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_orders_recipient_user_id ON public.orders(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_payer_user_id ON public.orders(payer_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_paid_by_user_id ON public.orders(paid_by_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_collaboration_mode ON public.orders(collaboration_mode);
CREATE INDEX IF NOT EXISTS idx_orders_payment_locked ON public.orders(payment_locked);

-- =====================================================
-- 3) SHARED ORDER LINKS (TOKEN/CODE FLOW)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.order_share_links (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
	created_by uuid REFERENCES public.users(id),
	recipient_name text,
	recipient_contact text,
	token text NOT NULL UNIQUE,
	short_code text NOT NULL UNIQUE,
	status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'claimed', 'paid', 'expired', 'cancelled')),
	expires_at timestamptz NOT NULL,
	claimed_by uuid REFERENCES public.users(id),
	claimed_at timestamptz,
	paid_by uuid REFERENCES public.users(id),
	paid_at timestamptz,
	notes text,
	metadata jsonb DEFAULT '{}'::jsonb,
	created_at timestamptz DEFAULT now(),
	updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_share_links_order_id ON public.order_share_links(order_id);
CREATE INDEX IF NOT EXISTS idx_order_share_links_status ON public.order_share_links(status);
CREATE INDEX IF NOT EXISTS idx_order_share_links_expires_at ON public.order_share_links(expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_order_share_links_one_open_per_order
ON public.order_share_links(order_id)
WHERE status IN ('active', 'claimed');

DROP TRIGGER IF EXISTS trg_order_share_links_touch_updated_at ON public.order_share_links;
CREATE TRIGGER trg_order_share_links_touch_updated_at
BEFORE UPDATE ON public.order_share_links
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

-- =====================================================
-- 4) DELIVERY PROOFS (PHOTO/VIDEO/SIGNATURE)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.delivery_proofs (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
	uploaded_by uuid REFERENCES public.users(id),
	uploader_role text NOT NULL DEFAULT 'courier' CHECK (uploader_role IN ('courier', 'operator', 'admin', 'system')),
	proof_type text NOT NULL CHECK (proof_type IN ('photo', 'video', 'signature', 'note')),
	file_path text,
	public_url text,
	thumbnail_url text,
	notes text,
	captured_at timestamptz DEFAULT now(),
	is_visible_to_customer boolean DEFAULT true,
	verified_by uuid REFERENCES public.users(id),
	verified_at timestamptz,
	metadata jsonb DEFAULT '{}'::jsonb,
	created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_proofs_order_id ON public.delivery_proofs(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_proofs_uploaded_by ON public.delivery_proofs(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_delivery_proofs_captured_at ON public.delivery_proofs(captured_at DESC);

-- =====================================================
-- 5) ORDER STATUS HISTORY (AUDIT TIMELINE)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.order_status_history (
	id bigserial PRIMARY KEY,
	order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
	old_status text,
	new_status text,
	status_kind text NOT NULL CHECK (status_kind IN ('order_status', 'payment_status', 'shipping_status')),
	changed_by uuid REFERENCES public.users(id),
	changer_role text,
	reason text,
	source text NOT NULL DEFAULT 'system' CHECK (source IN ('system', 'customer', 'payer', 'courier', 'admin', 'operator', 'webhook')),
	metadata jsonb DEFAULT '{}'::jsonb,
	created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON public.order_status_history(created_at DESC);

-- =====================================================
-- 6) DUAL-PARTY FEEDBACK (ORDER-LEVEL)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.order_feedback (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
	reviewer_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
	reviewer_role text NOT NULL CHECK (reviewer_role IN ('single', 'recipient', 'payer')),
	delivery_rating integer CHECK (delivery_rating BETWEEN 1 AND 5),
	product_quality_rating integer CHECK (product_quality_rating BETWEEN 1 AND 5),
	support_rating integer CHECK (support_rating BETWEEN 1 AND 5),
	overall_rating integer CHECK (overall_rating BETWEEN 1 AND 5),
	comment text,
	metadata jsonb DEFAULT '{}'::jsonb,
	created_at timestamptz DEFAULT now(),
	updated_at timestamptz DEFAULT now(),
	UNIQUE(order_id, reviewer_user_id, reviewer_role)
);

CREATE INDEX IF NOT EXISTS idx_order_feedback_order_id ON public.order_feedback(order_id);
CREATE INDEX IF NOT EXISTS idx_order_feedback_reviewer_user_id ON public.order_feedback(reviewer_user_id);

DROP TRIGGER IF EXISTS trg_order_feedback_touch_updated_at ON public.order_feedback;
CREATE TRIGGER trg_order_feedback_touch_updated_at
BEFORE UPDATE ON public.order_feedback
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

-- Backward-compatible extension for existing product reviews.
ALTER TABLE public.reviews
	ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders(id),
	ADD COLUMN IF NOT EXISTS reviewer_user_id uuid REFERENCES public.users(id),
	ADD COLUMN IF NOT EXISTS reviewer_role text DEFAULT 'single' CHECK (reviewer_role IN ('single', 'recipient', 'payer')),
	ADD COLUMN IF NOT EXISTS reviewed_for_user_id uuid REFERENCES public.users(id);

UPDATE public.reviews
SET reviewer_user_id = user_id
WHERE reviewer_user_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_dual_party_unique
ON public.reviews(
	COALESCE(order_id, '00000000-0000-0000-0000-000000000000'::uuid),
	item_type,
	item_id,
	COALESCE(reviewer_user_id, user_id),
	reviewer_role
);

-- =====================================================
-- 7) SHARE FLOW FUNCTIONS (RPC-READY)
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_order_share_link(
	p_order_id uuid,
	p_expires_in_hours integer DEFAULT 72,
	p_recipient_name text DEFAULT NULL,
	p_recipient_contact text DEFAULT NULL,
	p_notes text DEFAULT NULL
)
RETURNS public.order_share_links
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
	v_caller uuid;
	v_link public.order_share_links;
	v_token text;
	v_code text;
BEGIN
	IF NOT public.user_can_access_order(p_order_id) THEN
		RAISE EXCEPTION 'Access denied for this order';
	END IF;

	v_caller := public.current_app_user_id();
	v_token := encode(gen_random_bytes(24), 'hex');
	v_code := public.generate_share_code(10);

	-- Only one active link per order
	UPDATE public.order_share_links
	SET status = 'cancelled', updated_at = now()
	WHERE order_id = p_order_id
		AND status IN ('active', 'claimed');

	INSERT INTO public.order_share_links (
		order_id,
		created_by,
		recipient_name,
		recipient_contact,
		token,
		short_code,
		status,
		expires_at,
		notes
	) VALUES (
		p_order_id,
		v_caller,
		p_recipient_name,
		p_recipient_contact,
		v_token,
		v_code,
		'active',
		now() + make_interval(hours => GREATEST(p_expires_in_hours, 1)),
		p_notes
	)
	RETURNING * INTO v_link;

	UPDATE public.orders
	SET collaboration_mode = 'shared',
			payment_locked = true,
			payment_link_expires_at = v_link.expires_at,
			updated_at = now()
	WHERE id = p_order_id;

	RETURN v_link;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_order_share_link(p_token text)
RETURNS public.order_share_links
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
	v_uid uuid;
	v_link public.order_share_links;
BEGIN
	v_uid := public.current_app_user_id();
	IF v_uid IS NULL THEN
		RAISE EXCEPTION 'Authenticated user required';
	END IF;

	SELECT *
	INTO v_link
	FROM public.order_share_links
	WHERE token = p_token
	LIMIT 1;

	IF v_link.id IS NULL THEN
		RAISE EXCEPTION 'Invalid share token';
	END IF;

	IF v_link.expires_at < now() THEN
		UPDATE public.order_share_links
		SET status = 'expired', updated_at = now()
		WHERE id = v_link.id;
		RAISE EXCEPTION 'Share token expired';
	END IF;

	IF v_link.status NOT IN ('active', 'claimed') THEN
		RAISE EXCEPTION 'Share token is not active';
	END IF;

	UPDATE public.order_share_links
	SET status = 'claimed',
			claimed_by = COALESCE(claimed_by, v_uid),
			claimed_at = COALESCE(claimed_at, now()),
			updated_at = now()
	WHERE id = v_link.id
	RETURNING * INTO v_link;

	UPDATE public.orders
	SET payer_user_id = COALESCE(payer_user_id, v_uid),
			collaboration_mode = 'shared',
			payment_locked = true,
			updated_at = now()
	WHERE id = v_link.order_id;

	RETURN v_link;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_shared_order_paid(
	p_token text,
	p_payment_provider text,
	p_payment_reference text DEFAULT NULL,
	p_payment_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
	v_uid uuid;
	v_link public.order_share_links;
	v_order public.orders;
BEGIN
	v_uid := public.current_app_user_id();
	IF v_uid IS NULL THEN
		RAISE EXCEPTION 'Authenticated user required';
	END IF;

	SELECT *
	INTO v_link
	FROM public.order_share_links
	WHERE token = p_token
		AND status IN ('active', 'claimed')
	LIMIT 1;

	IF v_link.id IS NULL THEN
		RAISE EXCEPTION 'Invalid or inactive share token';
	END IF;

	IF v_link.expires_at < now() THEN
		UPDATE public.order_share_links
		SET status = 'expired', updated_at = now()
		WHERE id = v_link.id;
		RAISE EXCEPTION 'Share token expired';
	END IF;

	UPDATE public.order_share_links
	SET status = 'paid',
			paid_by = v_uid,
			paid_at = now(),
			claimed_by = COALESCE(claimed_by, v_uid),
			claimed_at = COALESCE(claimed_at, now()),
			updated_at = now()
	WHERE id = v_link.id;

	-- Always update collaboration columns added in this migration.
	UPDATE public.orders
	SET payer_user_id = COALESCE(payer_user_id, v_uid),
			paid_by_user_id = v_uid,
			payment_locked = false,
			collaboration_mode = 'shared',
			updated_at = now()
	WHERE id = v_link.order_id;

	-- Optional updates for heterogeneous schema versions.
	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'status'
	) THEN
		EXECUTE 'UPDATE public.orders SET status = ''completed'' WHERE id = $1' USING v_link.order_id;
	END IF;

	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'payment_status'
	) THEN
		EXECUTE 'UPDATE public.orders SET payment_status = ''succeeded'' WHERE id = $1' USING v_link.order_id;
	END IF;

	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'payment_provider'
	) THEN
		EXECUTE 'UPDATE public.orders SET payment_provider = $2 WHERE id = $1' USING v_link.order_id, p_payment_provider;
	END IF;

	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'payment_provider_order_id'
	) THEN
		EXECUTE 'UPDATE public.orders SET payment_provider_order_id = COALESCE($2, payment_provider_order_id) WHERE id = $1'
			USING v_link.order_id, p_payment_reference;
	END IF;

	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'payment_provider_response'
	) THEN
		EXECUTE 'UPDATE public.orders SET payment_provider_response = COALESCE(payment_provider_response, ''{}''::jsonb) || $2 WHERE id = $1'
			USING v_link.order_id, p_payment_payload;
	END IF;

	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'paid_at'
	) THEN
		EXECUTE 'UPDATE public.orders SET paid_at = now() WHERE id = $1' USING v_link.order_id;
	END IF;

	SELECT * INTO v_order
	FROM public.orders
	WHERE id = v_link.order_id;

	RETURN v_order;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_delivery_proof(
	p_order_id uuid,
	p_proof_type text,
	p_file_path text DEFAULT NULL,
	p_public_url text DEFAULT NULL,
	p_thumbnail_url text DEFAULT NULL,
	p_notes text DEFAULT NULL,
	p_visible_to_customer boolean DEFAULT true,
	p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS public.delivery_proofs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
	v_uid uuid;
	v_proof public.delivery_proofs;
	v_role text;
BEGIN
	v_uid := public.current_app_user_id();
	IF v_uid IS NULL THEN
		RAISE EXCEPTION 'Authenticated user required';
	END IF;

	SELECT u.role INTO v_role
	FROM public.users u
	WHERE u.id = v_uid
	LIMIT 1;

	IF COALESCE(v_role, '') NOT IN ('courier', 'operator', 'admin') THEN
		RAISE EXCEPTION 'Only courier/operator/admin can add delivery proof';
	END IF;

	INSERT INTO public.delivery_proofs (
		order_id,
		uploaded_by,
		uploader_role,
		proof_type,
		file_path,
		public_url,
		thumbnail_url,
		notes,
		is_visible_to_customer,
		metadata
	) VALUES (
		p_order_id,
		v_uid,
		v_role,
		p_proof_type,
		p_file_path,
		p_public_url,
		p_thumbnail_url,
		p_notes,
		p_visible_to_customer,
		p_metadata
	)
	RETURNING * INTO v_proof;

	RETURN v_proof;
END;
$$;

-- =====================================================
-- 8) STATUS CHANGE TRACKER TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION public.log_order_status_history()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
	old_j jsonb;
	new_j jsonb;
	v_uid uuid;
	v_role text;
BEGIN
	old_j := to_jsonb(OLD);
	new_j := to_jsonb(NEW);
	v_uid := public.current_app_user_id();

	IF v_uid IS NOT NULL THEN
		SELECT u.role INTO v_role FROM public.users u WHERE u.id = v_uid LIMIT 1;
	END IF;

	IF old_j->>'status' IS DISTINCT FROM new_j->>'status' THEN
		INSERT INTO public.order_status_history(order_id, old_status, new_status, status_kind, changed_by, changer_role, source)
		VALUES (NEW.id, old_j->>'status', new_j->>'status', 'order_status', v_uid, v_role, COALESCE(v_role, 'system'));
	END IF;

	IF old_j->>'payment_status' IS DISTINCT FROM new_j->>'payment_status' THEN
		INSERT INTO public.order_status_history(order_id, old_status, new_status, status_kind, changed_by, changer_role, source)
		VALUES (NEW.id, old_j->>'payment_status', new_j->>'payment_status', 'payment_status', v_uid, v_role, COALESCE(v_role, 'system'));
	END IF;

	IF old_j->>'shipping_status' IS DISTINCT FROM new_j->>'shipping_status' THEN
		INSERT INTO public.order_status_history(order_id, old_status, new_status, status_kind, changed_by, changer_role, source)
		VALUES (NEW.id, old_j->>'shipping_status', new_j->>'shipping_status', 'shipping_status', v_uid, v_role, COALESCE(v_role, 'system'));
	END IF;

	NEW.status_last_changed_at = now();
	RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_status_history ON public.orders;
CREATE TRIGGER trg_orders_status_history
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.log_order_status_history();

-- =====================================================
-- 9) RLS POLICIES FOR NEW TABLES + SHARED ACCESS
-- =====================================================

ALTER TABLE public.order_share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS orders_shared_access_read_2026 ON public.orders;
CREATE POLICY orders_shared_access_read_2026 ON public.orders
FOR SELECT
USING (public.user_can_access_order(id));

DROP POLICY IF EXISTS order_share_links_access_2026 ON public.order_share_links;
CREATE POLICY order_share_links_access_2026 ON public.order_share_links
FOR SELECT
USING (
	public.is_staff_user()
	OR created_by = public.current_app_user_id()
	OR claimed_by = public.current_app_user_id()
	OR paid_by = public.current_app_user_id()
	OR public.user_can_access_order(order_id)
);

DROP POLICY IF EXISTS order_share_links_insert_2026 ON public.order_share_links;
CREATE POLICY order_share_links_insert_2026 ON public.order_share_links
FOR INSERT
WITH CHECK (
	created_by = public.current_app_user_id()
	AND public.user_can_access_order(order_id)
);

DROP POLICY IF EXISTS order_share_links_update_2026 ON public.order_share_links;
CREATE POLICY order_share_links_update_2026 ON public.order_share_links
FOR UPDATE
USING (
	public.is_staff_user()
	OR created_by = public.current_app_user_id()
	OR claimed_by = public.current_app_user_id()
)
WITH CHECK (
	public.is_staff_user()
	OR created_by = public.current_app_user_id()
	OR claimed_by = public.current_app_user_id()
);

DROP POLICY IF EXISTS delivery_proofs_read_2026 ON public.delivery_proofs;
CREATE POLICY delivery_proofs_read_2026 ON public.delivery_proofs
FOR SELECT
USING (
	public.is_staff_user()
	OR (
		is_visible_to_customer = true
		AND public.user_can_access_order(order_id)
	)
);

DROP POLICY IF EXISTS delivery_proofs_insert_2026 ON public.delivery_proofs;
CREATE POLICY delivery_proofs_insert_2026 ON public.delivery_proofs
FOR INSERT
WITH CHECK (
	public.is_staff_user()
	OR (
		uploaded_by = public.current_app_user_id()
		AND public.user_can_access_order(order_id)
	)
);

DROP POLICY IF EXISTS delivery_proofs_update_2026 ON public.delivery_proofs;
CREATE POLICY delivery_proofs_update_2026 ON public.delivery_proofs
FOR UPDATE
USING (
	public.is_staff_user()
	OR uploaded_by = public.current_app_user_id()
)
WITH CHECK (
	public.is_staff_user()
	OR uploaded_by = public.current_app_user_id()
);

DROP POLICY IF EXISTS order_status_history_read_2026 ON public.order_status_history;
CREATE POLICY order_status_history_read_2026 ON public.order_status_history
FOR SELECT
USING (
	public.is_staff_user()
	OR public.user_can_access_order(order_id)
);

DROP POLICY IF EXISTS order_feedback_read_2026 ON public.order_feedback;
CREATE POLICY order_feedback_read_2026 ON public.order_feedback
FOR SELECT
USING (
	public.is_staff_user()
	OR public.user_can_access_order(order_id)
);

DROP POLICY IF EXISTS order_feedback_insert_2026 ON public.order_feedback;
CREATE POLICY order_feedback_insert_2026 ON public.order_feedback
FOR INSERT
WITH CHECK (
	reviewer_user_id = public.current_app_user_id()
	AND public.user_can_access_order(order_id)
);

DROP POLICY IF EXISTS order_feedback_update_2026 ON public.order_feedback;
CREATE POLICY order_feedback_update_2026 ON public.order_feedback
FOR UPDATE
USING (
	reviewer_user_id = public.current_app_user_id()
)
WITH CHECK (
	reviewer_user_id = public.current_app_user_id()
);

DROP POLICY IF EXISTS order_feedback_delete_2026 ON public.order_feedback;
CREATE POLICY order_feedback_delete_2026 ON public.order_feedback
FOR DELETE
USING (
	reviewer_user_id = public.current_app_user_id()
	OR public.is_staff_user()
);

-- Extend reviews table policy for dual-party reviewer identity.
DROP POLICY IF EXISTS reviews_dual_party_insert_2026 ON public.reviews;
CREATE POLICY reviews_dual_party_insert_2026 ON public.reviews
FOR INSERT
WITH CHECK (
	COALESCE(reviewer_user_id, user_id) = public.current_app_user_id()
	AND (
		order_id IS NULL
		OR public.user_can_access_order(order_id)
	)
);

DROP POLICY IF EXISTS reviews_dual_party_update_2026 ON public.reviews;
CREATE POLICY reviews_dual_party_update_2026 ON public.reviews
FOR UPDATE
USING (
	COALESCE(reviewer_user_id, user_id) = public.current_app_user_id()
)
WITH CHECK (
	COALESCE(reviewer_user_id, user_id) = public.current_app_user_id()
	AND (
		order_id IS NULL
		OR public.user_can_access_order(order_id)
	)
);

-- =====================================================
-- 10) STORAGE BUCKET + STORAGE RLS FOR PROOFS
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
	'delivery-proofs',
	'delivery-proofs',
	true,
	104857600,
	ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.extract_order_id_from_storage_path(p_name text)
RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
	v_first_part text;
BEGIN
	v_first_part := split_part(p_name, '/', 1);
	RETURN v_first_part::uuid;
EXCEPTION
	WHEN others THEN
		RETURN NULL;
END;
$$;

DROP POLICY IF EXISTS delivery_proofs_storage_read_2026 ON storage.objects;
CREATE POLICY delivery_proofs_storage_read_2026 ON storage.objects
FOR SELECT
USING (
	bucket_id = 'delivery-proofs'
	AND public.user_can_access_order(public.extract_order_id_from_storage_path(name))
);

DROP POLICY IF EXISTS delivery_proofs_storage_insert_2026 ON storage.objects;
CREATE POLICY delivery_proofs_storage_insert_2026 ON storage.objects
FOR INSERT
WITH CHECK (
	bucket_id = 'delivery-proofs'
	AND (
		public.is_staff_user()
		OR public.user_can_access_order(public.extract_order_id_from_storage_path(name))
	)
);

DROP POLICY IF EXISTS delivery_proofs_storage_update_2026 ON storage.objects;
CREATE POLICY delivery_proofs_storage_update_2026 ON storage.objects
FOR UPDATE
USING (
	bucket_id = 'delivery-proofs'
	AND public.is_staff_user()
)
WITH CHECK (
	bucket_id = 'delivery-proofs'
	AND public.is_staff_user()
);

DROP POLICY IF EXISTS delivery_proofs_storage_delete_2026 ON storage.objects;
CREATE POLICY delivery_proofs_storage_delete_2026 ON storage.objects
FOR DELETE
USING (
	bucket_id = 'delivery-proofs'
	AND public.is_staff_user()
);

-- =====================================================
-- 11) GRANTS
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON public.order_share_links TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.delivery_proofs TO authenticated;
GRANT SELECT ON public.order_status_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_feedback TO authenticated;

GRANT EXECUTE ON FUNCTION public.create_order_share_link(uuid, integer, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_order_share_link(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_shared_order_paid(text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_delivery_proof(uuid, text, text, text, text, text, boolean, jsonb) TO authenticated;

COMMIT;

