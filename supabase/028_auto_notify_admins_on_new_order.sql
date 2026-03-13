-- ==================================================================
-- 028: تريغر تلقائي لإشعار المشرفين عند إنشاء أي طلب جديد
-- يعمل على مستوى قاعدة البيانات → مضمون 100% لكل أنواع الدفع
-- ==================================================================

-- الدالة: تنشئ إشعاراً لكل مشرف/أدمن عند INSERT في جدول orders
CREATE OR REPLACE FUNCTION public.notify_admins_on_new_order()
RETURNS TRIGGER AS $$
DECLARE
  payment_label TEXT;
  notif_title   TEXT;
  notif_body    TEXT;
  order_link    TEXT;
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

  -- إدراج إشعار لكل مشرف/أدمن (public.users.id فقط لتجنب FK violation)
  INSERT INTO public.notifications (user_id, title, message, type, is_read, link, created_at)
  SELECT DISTINCT sub.uid, notif_title, notif_body, 'new_order', false, order_link, NOW()
  FROM (
    -- المشرفون من جدول users
    SELECT u.id AS uid
    FROM public.users u
    WHERE u.role IN ('admin', 'super_admin', 'supervisor', 'operator', 'support')

    UNION

    -- المشرفون من جدول admin_users مع ربطهم بـ public.users
    SELECT u2.id AS uid
    FROM public.admin_users au
    JOIN public.users u2 ON u2.auth_id = au.id
    WHERE au.is_active IS NOT FALSE
    AND au.role IN ('admin', 'super_admin', 'supervisor', 'operator', 'support')
  ) sub;

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
BEGIN
  -- استخراج المبلغ من payload
  total_usd := ROUND(COALESCE((NEW.payload->>'totalUSD')::numeric, 0), 2);

  notif_title := '🛒 سلة مشتركة جديدة';
  notif_body  := 'تم إنشاء سلة مشتركة بمبلغ $' || total_usd || ' بانتظار الدفع';
  cart_link   := '/MyOrders?tab=shared';

  -- إدراج إشعار لكل مشرف/أدمن
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
