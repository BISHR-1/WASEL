-- ==================================================================
-- 029: إشعار منشئ السلة المشتركة عند دفع طلبه من قبل المغترب
-- يعمل على مستوى قاعدة البيانات → مضمون 100%
-- يُنشئ إشعار ويب (Realtime) + FCM push عبر Edge Function
-- ==================================================================

-- الدالة: عند INSERT في orders بـ collaboration_mode = 'shared'
-- نُرسل إشعاراً لمنشئ السلة (recipient_user_id)
CREATE OR REPLACE FUNCTION public.notify_creator_on_shared_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_creator_id     UUID;
  v_payer_id       UUID;
  v_payer_name     TEXT;
  v_recipient_name TEXT;
  v_total          NUMERIC;
  v_creator_auth   TEXT;
  v_payer_auth     TEXT;
  notif_title      TEXT;
  notif_body       TEXT;
  payer_title      TEXT;
  payer_body       TEXT;
  order_link       TEXT;
  v_supabase_url   TEXT;
  v_service_key    TEXT;
BEGIN
  -- فقط الطلبات المشتركة
  IF COALESCE(NEW.collaboration_mode, '') <> 'shared' THEN
    RETURN NEW;
  END IF;

  -- منشئ السلة = recipient_user_id (الشخص داخل سوريا)
  v_creator_id := NEW.recipient_user_id;
  IF v_creator_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- الدافع (المغترب) - يشمل user_id كفولباك
  v_payer_id := COALESCE(NEW.paid_by_user_id, NEW.payer_user_id, NEW.user_id);

  -- أسماء
  v_payer_name     := COALESCE(NEW.sender_details->>'name', 'المرسل');
  v_recipient_name := COALESCE(NEW.recipient_details->>'name', 'المستلم');
  v_total          := ROUND(COALESCE(NEW.total_usd, NEW.total_amount, 0)::numeric, 2);

  -- رسالة المنشئ
  notif_title := '💜 خبر جميل وصل!';
  notif_body  := 'قام ' || v_payer_name || ' بدفع سلتك المشتركة بمبلغ $' || v_total || ' طلبك الان قيد التجهيز وسيصلك قريبا';
  order_link  := '/TrackOrder?order=' || COALESCE(NEW.order_number, NEW.id::text);

  -- رسالة الدافع
  payer_title := '💚 شكرا لكرمك!';
  payer_body  := 'تم دفع السلة المشتركة بنجاح طلب ' || v_recipient_name || ' دخل مرحلة التجهيز بفضل دعمك الجميل';

  -- 1) إشعار ويب للمنشئ
  INSERT INTO public.notifications (user_id, title, message, type, is_read, link, created_at)
  VALUES (v_creator_id, notif_title, notif_body, 'payment_success', false, order_link, NOW());

  -- 2) إشعار ويب للدافع (إذا مختلف عن المنشئ)
  IF v_payer_id IS NOT NULL AND v_payer_id IS DISTINCT FROM v_creator_id THEN
    INSERT INTO public.notifications (user_id, title, message, type, is_read, link, created_at)
    VALUES (v_payer_id, payer_title, payer_body, 'payment_success', false, order_link, NOW());
  END IF;

  -- 3) FCM push للطرفين
  BEGIN
    v_supabase_url := (SELECT value FROM public.app_config WHERE key = 'supabase_url');
    v_service_key  := (SELECT value FROM public.app_config WHERE key = 'service_role_key');

    IF v_supabase_url IS NOT NULL AND v_service_key IS NOT NULL THEN
      -- FCM للمنشئ
      SELECT u.auth_id INTO v_creator_auth FROM public.users u WHERE u.id = v_creator_id;
      IF v_creator_auth IS NOT NULL THEN
        PERFORM net.http_post(
          url     := v_supabase_url || '/functions/v1/send-notification',
          headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_service_key),
          body    := jsonb_build_object(
            'userIds', jsonb_build_array(v_creator_auth::text),
            'title', notif_title, 'body', notif_body,
            'data', jsonb_build_object('type', 'order_update', 'order_id', COALESCE(NEW.id::text, ''), 'event', 'shared_cart_paid_creator', 'payment_method', COALESCE(NEW.payment_method, ''))
          )
        );
      END IF;

      -- FCM للدافع
      IF v_payer_id IS NOT NULL AND v_payer_id IS DISTINCT FROM v_creator_id THEN
        SELECT u.auth_id INTO v_payer_auth FROM public.users u WHERE u.id = v_payer_id;
        IF v_payer_auth IS NOT NULL THEN
          PERFORM net.http_post(
            url     := v_supabase_url || '/functions/v1/send-notification',
            headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_service_key),
            body    := jsonb_build_object(
              'userIds', jsonb_build_array(v_payer_auth::text),
              'title', payer_title, 'body', payer_body,
              'data', jsonb_build_object('type', 'order_update', 'order_id', COALESCE(NEW.id::text, ''), 'event', 'shared_cart_paid_payer', 'payment_method', COALESCE(NEW.payment_method, ''))
            )
          );
        END IF;
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_creator_on_shared_payment FCM: %', SQLERRM;
  END;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_creator_on_shared_payment: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- التريغر: يعمل بعد إنشاء أي طلب مشترك
DROP TRIGGER IF EXISTS trg_notify_creator_shared_payment ON public.orders;
CREATE TRIGGER trg_notify_creator_shared_payment
  AFTER INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.collaboration_mode = 'shared')
  EXECUTE FUNCTION public.notify_creator_on_shared_payment();

-- ==================================================================
-- تريغر ثاني: يلتقط UPDATE عند تعيين paid_by_user_id (للمسار RPC)
-- يُرسل إشعار للدافع فقط (المنشئ أُشعر بالفعل عند INSERT)
-- ==================================================================
CREATE OR REPLACE FUNCTION public.notify_payer_on_shared_payment_update()
RETURNS TRIGGER AS $$
DECLARE
  v_payer_id       UUID;
  v_payer_auth     TEXT;
  v_recipient_name TEXT;
  payer_title      TEXT;
  payer_body       TEXT;
  order_link       TEXT;
  v_supabase_url   TEXT;
  v_service_key    TEXT;
BEGIN
  -- فقط الطلبات المشتركة
  IF COALESCE(NEW.collaboration_mode, '') <> 'shared' THEN
    RETURN NEW;
  END IF;

  -- فقط عندما يتغير paid_by_user_id من NULL إلى قيمة
  IF OLD.paid_by_user_id IS NOT NULL OR NEW.paid_by_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_payer_id := NEW.paid_by_user_id;

  -- لا نرسل إشعار إذا الدافع هو نفسه المنشئ
  IF v_payer_id IS NOT DISTINCT FROM NEW.recipient_user_id THEN
    RETURN NEW;
  END IF;

  v_recipient_name := COALESCE(NEW.recipient_details->>'name', 'المستلم');
  payer_title := '💚 شكرا لكرمك!';
  payer_body  := 'تم دفع السلة المشتركة بنجاح طلب ' || v_recipient_name || ' دخل مرحلة التجهيز بفضل دعمك الجميل';
  order_link  := '/TrackOrder?order=' || COALESCE(NEW.order_number, NEW.id::text);

  -- إشعار ويب للدافع
  INSERT INTO public.notifications (user_id, title, message, type, is_read, link, created_at)
  VALUES (v_payer_id, payer_title, payer_body, 'payment_success', false, order_link, NOW());

  -- FCM push للدافع
  BEGIN
    SELECT u.auth_id INTO v_payer_auth FROM public.users u WHERE u.id = v_payer_id;
    IF v_payer_auth IS NOT NULL THEN
      v_supabase_url := (SELECT value FROM public.app_config WHERE key = 'supabase_url');
      v_service_key  := (SELECT value FROM public.app_config WHERE key = 'service_role_key');
      IF v_supabase_url IS NOT NULL AND v_service_key IS NOT NULL THEN
        PERFORM net.http_post(
          url     := v_supabase_url || '/functions/v1/send-notification',
          headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_service_key),
          body    := jsonb_build_object(
            'userIds', jsonb_build_array(v_payer_auth::text),
            'title', payer_title, 'body', payer_body,
            'data', jsonb_build_object('type', 'order_update', 'order_id', COALESCE(NEW.id::text, ''), 'event', 'shared_cart_paid_payer', 'payment_method', COALESCE(NEW.payment_method, ''))
          )
        );
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_payer_on_shared_payment_update FCM: %', SQLERRM;
  END;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_payer_on_shared_payment_update: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_payer_shared_payment_update ON public.orders;
CREATE TRIGGER trg_notify_payer_shared_payment_update
  AFTER UPDATE OF paid_by_user_id ON public.orders
  FOR EACH ROW
  WHEN (OLD.paid_by_user_id IS NULL AND NEW.paid_by_user_id IS NOT NULL AND NEW.collaboration_mode = 'shared')
  EXECUTE FUNCTION public.notify_payer_on_shared_payment_update();
