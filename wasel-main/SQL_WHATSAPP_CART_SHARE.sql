-- SQL بسيط: إلغاء شروط WhatsApp ومشاركة السلة + إرسال إشعار مباشر للمشرف

-- حذف الـ Trigger القديم إن وجد
DROP TRIGGER IF EXISTS trigger_notify_order ON public.orders;
DROP FUNCTION IF EXISTS public.notify_on_order();

-- ✅ Trigger جديد: عند أي طلب جديد → إشعار فوري للمشرف مع payment_method
CREATE OR REPLACE FUNCTION public.notify_on_order()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (
    user_id, 
    title, 
    message, 
    type, 
    is_read,
    created_at
  )
  SELECT
    admin_id,
    '🔔 طلب جديد',
    'طلب #' || SUBSTRING(NEW.id::TEXT, 1, 8) || ' | الدفع: ' || COALESCE(NEW.payment_method, 'غير محدد') || ' | المبلغ: ' || NEW.total_amount || ' ' || COALESCE(NEW.currency, 'USD'),
    'order_new',
    false,
    NOW()
  FROM (
    SELECT id as admin_id FROM public.admin_users WHERE is_active = true
  ) admins;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_order
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_order();

-- ✅ إضافة عمود لـ Cart Share لو مش موجود
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS share_message TEXT;
