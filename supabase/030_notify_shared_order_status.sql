-- ==================================================================
-- 030: إشعار الدافع ومنشئ السلة عند تغيير حالة طلب سلة مشتركة
-- يعمل على مستوى قاعدة البيانات → مضمون 100%
-- يُرسل إشعار ويب (Realtime) + FCM push عبر Edge Function
-- ==================================================================

CREATE OR REPLACE FUNCTION public.notify_shared_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_creator_id   UUID;
  v_payer_id     UUID;
  v_creator_auth TEXT;
  v_payer_auth   TEXT;
  v_status_label TEXT;
  v_order_link   TEXT;
  v_supabase_url TEXT;
  v_service_key  TEXT;
  -- رسائل المنشئ (داخل سوريا)
  c_title        TEXT;
  c_body         TEXT;
  -- رسائل الدافع (المغترب)
  p_title        TEXT;
  p_body         TEXT;
  v_recipient_name TEXT;
BEGIN
  -- فقط الطلبات المشتركة
  IF COALESCE(NEW.collaboration_mode, '') <> 'shared' THEN
    RETURN NEW;
  END IF;

  -- فقط عند تغيير الحالة فعلا
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  v_creator_id := NEW.recipient_user_id;
  v_payer_id   := COALESCE(NEW.paid_by_user_id, NEW.payer_user_id, NEW.user_id);
  v_order_link := '/TrackOrder?order=' || COALESCE(NEW.order_number, NEW.id::text);

  v_recipient_name := COALESCE(
    NEW.recipient_details->>'name',
    'المستلم'
  );

  -- رسائل حسب الحالة الجديدة
  CASE LOWER(COALESCE(NEW.status, ''))
    WHEN 'processing' THEN
      v_status_label := 'قيد التجهيز';
      c_title := '👨‍🍳 طلبك قيد التجهيز';
      c_body  := 'تم قبول طلبك ويجري تجهيزه الان';
      p_title := '👨‍🍳 الطلب قيد التجهيز';
      p_body  := 'بدأ تجهيز طلب ' || v_recipient_name || ' بفضل دعمك الجميل';
    WHEN 'loading_goods' THEN
      v_status_label := 'جاري التحميل';
      c_title := '📦 جاري تحميل طلبك';
      c_body  := 'يتم الان تحميل طلبك تمهيدا للتوصيل';
      p_title := '📦 جاري تحميل الطلب';
      p_body  := 'يتم تحميل طلب ' || v_recipient_name || ' تمهيدا للتوصيل';
    WHEN 'delivering' THEN
      v_status_label := 'في الطريق';
      c_title := '🚚 طلبك في الطريق اليك';
      c_body  := 'الموصل انطلق وطلبك في الطريق سيصلك قريبا';
      p_title := '🚚 الطلب في الطريق';
      p_body  := 'طلب ' || v_recipient_name || ' الذي دفعته اصبح في الطريق اليه';
    WHEN 'completed' THEN
      v_status_label := 'تم التسليم';
      c_title := '🎉 تم تسليم طلبك';
      c_body  := 'الحمد لله تم التسليم بنجاح صحة وهنا';
      p_title := '🎉 تم تسليم الطلب';
      p_body  := 'تم توصيل طلب ' || v_recipient_name || ' بنجاح شكرا لكرمك';
    WHEN 'cancelled' THEN
      v_status_label := 'ملغي';
      c_title := '❌ تم الغاء الطلب';
      c_body  := 'تم الغاء طلبك تواصل معنا لاي مساعدة';
      p_title := '❌ تم الغاء الطلب';
      p_body  := 'تم الغاء طلب ' || v_recipient_name || ' تواصل معنا لاي استفسار';
    ELSE
      -- حالة غير معروفة، لا نرسل إشعار
      RETURN NEW;
  END CASE;

  -- 1) إشعار ويب للمنشئ (داخل سوريا)
  IF v_creator_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, is_read, link, created_at)
    VALUES (v_creator_id, c_title, c_body, 'order_update', false, v_order_link, NOW());
  END IF;

  -- 2) إشعار ويب للدافع (المغترب)
  IF v_payer_id IS NOT NULL AND v_payer_id IS DISTINCT FROM v_creator_id THEN
    INSERT INTO public.notifications (user_id, title, message, type, is_read, link, created_at)
    VALUES (v_payer_id, p_title, p_body, 'order_update', false, v_order_link, NOW());
  END IF;

  -- 3) FCM push للطرفين
  BEGIN
    v_supabase_url := (SELECT value FROM public.app_config WHERE key = 'supabase_url');
    v_service_key  := (SELECT value FROM public.app_config WHERE key = 'service_role_key');

    IF v_supabase_url IS NOT NULL AND v_service_key IS NOT NULL THEN
      -- FCM للمنشئ
      IF v_creator_id IS NOT NULL THEN
        SELECT u.auth_id INTO v_creator_auth FROM public.users u WHERE u.id = v_creator_id;
        IF v_creator_auth IS NOT NULL THEN
          PERFORM net.http_post(
            url     := v_supabase_url || '/functions/v1/send-notification',
            headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_service_key),
            body    := jsonb_build_object(
              'userIds', jsonb_build_array(v_creator_auth::text),
              'title', c_title, 'body', c_body,
              'data', jsonb_build_object('type', 'order_update', 'order_id', COALESCE(NEW.id::text, ''), 'event', 'shared_order_status_creator', 'new_status', NEW.status)
            )
          );
        END IF;
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
              'title', p_title, 'body', p_body,
              'data', jsonb_build_object('type', 'order_update', 'order_id', COALESCE(NEW.id::text, ''), 'event', 'shared_order_status_payer', 'new_status', NEW.status)
            )
          );
        END IF;
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_shared_order_status_change FCM: %', SQLERRM;
  END;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_shared_order_status_change: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_shared_order_status ON public.orders;
CREATE TRIGGER trg_notify_shared_order_status
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  WHEN (NEW.collaboration_mode = 'shared' AND OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_shared_order_status_change();
