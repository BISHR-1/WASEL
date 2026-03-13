-- ==================================================================
-- 028: تريغر تلقائي لإشعار المشرفين عند إنشاء أي طلب جديد
-- يعمل على مستوى قاعدة البيانات → مضمون 100% لكل أنواع الدفع
-- يُنشئ إشعارات داخلية + يستدعي Edge Function للـ FCM push
-- ==================================================================
--
-- ⚠️ مهم: قبل تشغيل هذا الملف، أضف المتغيرات التالية في
-- Supabase Dashboard → SQL Editor:
--
--   INSERT INTO vault.secrets (name, secret) VALUES
--     ('supabase_url', 'https://YOUR-PROJECT-REF.supabase.co'),
--     ('service_role_key', 'YOUR-SERVICE-ROLE-KEY')
--   ON CONFLICT (name) DO UPDATE SET secret = EXCLUDED.secret;
--
-- ==================================================================

-- تأكد من تفعيل pg_net extension (مطلوب لـ HTTP calls)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- الدالة: تنشئ إشعاراً لكل مشرف/أدمن عند INSERT في جدول orders
-- وتستدعي Edge Function لإرسال FCM push notification
CREATE OR REPLACE FUNCTION public.notify_admins_on_new_order()
RETURNS TRIGGER AS $$
DECLARE
  payment_label TEXT;
  notif_title   TEXT;
  notif_body    TEXT;
  order_link    TEXT;
  v_supabase_url TEXT;
  v_service_key  TEXT;
BEGIN
  -- تحديد اسم طريقة الدفع (يطابق تنسيق Edge Function)
  payment_label := CASE LOWER(COALESCE(NEW.payment_method, ''))
    WHEN 'paypal'      THEN 'باي بال 💳'
    WHEN 'whatsapp'    THEN 'واتساب 💬'
    WHEN 'wallet'      THEN 'المحفظة 💰'
    WHEN 'shared_cart' THEN 'سلة مشتركة 🛒'
    ELSE COALESCE(NEW.payment_method, 'غير محدد')
  END;

  notif_title := '🆕 طلب جديد وصل';
  notif_body  := 'طلب جديد عبر ' || payment_label
              || ' بمبلغ $' || ROUND(COALESCE(NEW.total_usd, NEW.total_amount, 0)::numeric, 2);
  order_link  := '/TrackOrder?order=' || COALESCE(NEW.order_number, NEW.id::text);

  -- 1) إدراج إشعار داخلي لكل مشرف/أدمن (Realtime + polling يلتقطونه)
  INSERT INTO public.notifications (user_id, title, message, type, is_read, link, created_at)
  SELECT DISTINCT sub.uid, notif_title, notif_body, 'new_order', false, order_link, NOW()
  FROM (
    SELECT u.id AS uid
    FROM public.users u
    WHERE u.role IN ('admin', 'super_admin', 'supervisor', 'operator', 'support')

    UNION

    SELECT u2.id AS uid
    FROM public.admin_users au
    JOIN public.users u2 ON u2.auth_id = au.id
    WHERE au.is_active IS NOT FALSE
    AND au.role IN ('admin', 'super_admin', 'supervisor', 'operator', 'support')
  ) sub;

  -- 2) استدعاء Edge Function لإرسال FCM push notification
  BEGIN
    v_supabase_url := COALESCE(
      current_setting('app.settings.supabase_url', true),
      (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1),
      ''
    );
    v_service_key := COALESCE(
      current_setting('app.settings.service_role_key', true),
      (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1),
      ''
    );

    IF v_supabase_url <> '' AND v_service_key <> '' THEN
      PERFORM net.http_post(
        url     := v_supabase_url || '/functions/v1/send-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_service_key
        ),
        body    := jsonb_build_object(
          'topic', 'admins',
          'title', notif_title,
          'body',  notif_body,
          'data',  jsonb_build_object(
            'type', 'order_update',
            'order_id', COALESCE(NEW.id::text, ''),
            'event', 'new_order_created',
            'payment_method', COALESCE(NEW.payment_method, '')
          )
        )
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_admins_on_new_order FCM call: %', SQLERRM;
  END;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- لا نمنع إنشاء الطلب أبداً بسبب خطأ في الإشعارات
  RAISE WARNING 'notify_admins_on_new_order: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- حذف التريغر القديم إن وجد ثم إنشاء الجديد
DROP TRIGGER IF EXISTS trg_notify_admins_new_order ON public.orders;
CREATE TRIGGER trg_notify_admins_new_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_on_new_order();

-- ==================================================================
-- تريغر ثاني: إشعار المشرفين عند إنشاء سلة مشتركة جديدة
-- ==================================================================
CREATE OR REPLACE FUNCTION public.notify_admins_on_shared_cart()
RETURNS TRIGGER AS $$
DECLARE
  notif_title  TEXT;
  notif_body   TEXT;
  cart_link    TEXT;
  total_usd    NUMERIC;
  v_supabase_url TEXT;
  v_service_key  TEXT;
BEGIN
  -- استخراج المبلغ من payload
  total_usd := ROUND(COALESCE((NEW.payload->>'totalUSD')::numeric, 0), 2);

  notif_title := '🛒 سلة مشتركة جديدة';
  notif_body  := 'تم إنشاء سلة مشتركة بمبلغ $' || total_usd || ' بانتظار الدفع';
  cart_link   := '/MyOrders?tab=shared';

  -- 1) إدراج إشعار داخلي لكل مشرف/أدمن
  INSERT INTO public.notifications (user_id, title, message, type, is_read, link, created_at)
  SELECT DISTINCT sub.uid, notif_title, notif_body, 'new_order', false, cart_link, NOW()
  FROM (
    SELECT u.id AS uid
    FROM public.users u
    WHERE u.role IN ('admin', 'super_admin', 'supervisor', 'operator', 'support')

    UNION

    SELECT u2.id AS uid
    FROM public.admin_users au
    JOIN public.users u2 ON u2.auth_id = au.id
    WHERE au.is_active IS NOT FALSE
    AND au.role IN ('admin', 'super_admin', 'supervisor', 'operator', 'support')
  ) sub;

  -- 2) استدعاء Edge Function لإرسال FCM push notification
  BEGIN
    v_supabase_url := COALESCE(
      current_setting('app.settings.supabase_url', true),
      (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1),
      ''
    );
    v_service_key := COALESCE(
      current_setting('app.settings.service_role_key', true),
      (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1),
      ''
    );

    IF v_supabase_url <> '' AND v_service_key <> '' THEN
      PERFORM net.http_post(
        url     := v_supabase_url || '/functions/v1/send-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_service_key
        ),
        body    := jsonb_build_object(
          'topic', 'admins',
          'title', notif_title,
          'body',  notif_body,
          'data',  jsonb_build_object(
            'type', 'order_update',
            'order_id', COALESCE(NEW.id::text, ''),
            'event', 'new_order_created',
            'payment_method', 'shared_cart'
          )
        )
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_admins_on_shared_cart FCM call: %', SQLERRM;
  END;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_admins_on_shared_cart: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_admins_shared_cart ON public.cart_share_links;
CREATE TRIGGER trg_notify_admins_shared_cart
  AFTER INSERT ON public.cart_share_links
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_on_shared_cart();
