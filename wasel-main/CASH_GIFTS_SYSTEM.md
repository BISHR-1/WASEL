# 💎 نظام الهدايا النقدية - Cash Gifts System

## 📋 نظرة عامة

نظام متكامل لإدارة وتتبع الهدايا النقدية (العملات/الأموال) التي يرسلها المستخدمون عبر تطبيق Wasel. يوفر النظام قاعدة بيانات كاملة مع تحليلات وتقارير شاملة.

---

## 🗄️ هيكل قاعدة البيانات

### 1. جدول `cash_gifts` - الهدايا الرئيسي

**الغرض:** تخزين تفاصيل كل هدية نقدية

**الأعمدة:**

| العمود | النوع | الوصف |
|--------|-------|-------|
| `id` | UUID | معرّف فريد للهدية |
| `order_id` | UUID | رابط الطلب |
| `user_id` | UUID | معرّف المستخدم (اختياري) |
| `email` | TEXT | بريد المستخدم |
| `sender_name` | TEXT | اسم المرسل |
| `sender_phone` | TEXT | رقم هاتف المرسل |
| `sender_country` | TEXT | دولة المرسل (syria, uae, etc.) |
| `recipient_name` | TEXT | اسم المستقبل |
| `recipient_phone` | TEXT | رقم هاتف المستقبل |
| `recipient_address` | TEXT | عنوان المستقبل |
| `gift_amount_usd` | DECIMAL | المبلغ بالدولار |
| `gift_amount_syp` | DECIMAL | المبلغ بالليرة السورية |
| `gift_currency` | VARCHAR | العملة الأصلية (USD/SYP) |
| `original_currency_amount` | DECIMAL | المبلغ الأصلي المدخل |
| `exchange_rate_used` | DECIMAL | سعر الصرف المستخدم |
| `gift_message` | TEXT | رسالة الهدية |
| `gift_message_ar` | TEXT | رسالة الهدية بالعربية |
| `envelope_color` | VARCHAR | لون الظرف (purple, pink, gold) |
| `order_status` | VARCHAR | الحالة (pending, sent, delivered, failed) |
| `delivery_date` | TIMESTAMP | تاريخ التسليم |
| `delivery_time_requested` | TIMESTAMP | وقت التسليم المطلوب |
| `special_occasion` | VARCHAR | المناسبة (Birthday, Wedding) |
| `created_at` | TIMESTAMP | وقت الإنشاء |
| `updated_at` | TIMESTAMP | آخر تحديث |

### 2. جدول `cash_gifts_analytics` - التحليلات اليومية

**الغرض:** تخزين إحصائيات يومية لسهولة الإبلاغ

**الأعمدة:**

| العمود | الوصف |
|--------|-------|
| `date` | التاريخ |
| `total_gifts_count` | عدد الهدايا |
| `total_amount_usd` | إجمالي بالدولار |
| `total_amount_syp` | إجمالي بالليرة |
| `avg_gift_amount_usd` | متوسط المبلغ |
| `max_gift_amount_usd` | أعلى مبلغ |
| `min_gift_amount_usd` | أقل مبلغ |
| `gifts_inside_syria` | عدد الهدايا من سوريا |
| `gifts_outside_syria` | عدد الهدايا من خارج سوريا |
| `successful_gifts` | عدد الهدايا الناجحة |
| `failed_gifts` | عدد الهدايا الفاشلة |

---

## 🔧 الدوال المتاحة

### 1. `create_cash_gift()` - إنشاء هدية جديدة

**الاستخدام:**
```sql
SELECT create_cash_gift(
  p_order_id := 'order-uuid',
  p_user_id := 'user-uuid',
  p_email := 'user@example.com',
  p_sender_name := 'أحمد',
  p_sender_phone := '0601234567',
  p_sender_country := 'syria',
  p_recipient_name := 'محمد',
  p_recipient_phone := '0601234568',
  p_recipient_address := 'دمشق - شارع النيل',
  p_gift_amount_usd := 50,
  p_gift_amount_syp := 7500,
  p_gift_currency := 'USD',
  p_original_amount := 50,
  p_exchange_rate := 150,
  p_gift_message := 'Happy Birthday!',
  p_delivery_time := NOW() + INTERVAL '1 day'
);
```

### 2. `update_gift_status()` - تحديث حالة الهدية

**الاستخدام:**
```sql
SELECT update_gift_status(
  p_gift_id := 'gift-uuid',
  p_new_status := 'delivered'
);
```

### 3. `get_gifts_by_order()` - الحصول على هدايا الطلب

**الاستخدام:**
```sql
SELECT * FROM get_gifts_by_order('order-uuid');
```

### 4. `get_user_gifts_summary()` - ملخص الهدايا للمستخدم

**الاستخدام:**
```sql
SELECT * FROM get_user_gifts_summary('user-uuid', 'user@example.com');
```

### 5. `calculate_daily_gift_analytics()` - حساب التحليلات اليومية

**الاستخدام:**
```sql
SELECT calculate_daily_gift_analytics(CURRENT_DATE);
```

---

## 📊 الاستعلامات المتاحة

### 1. الهدايا المرسلة اليوم

```sql
SELECT 
  id, recipient_name, gift_amount_usd, 
  gift_amount_syp, order_status, created_at
FROM cash_gifts
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;
```

### 2. الإيرادات حسب التاريخ

```sql
SELECT 
  DATE(created_at) as gift_date,
  COUNT(*) as total_gifts,
  SUM(gift_amount_usd) as revenue_usd,
  SUM(gift_amount_syp) as revenue_syp,
  COUNT(CASE WHEN order_status IN ('sent', 'delivered') THEN 1 END) as sent
FROM cash_gifts
GROUP BY DATE(created_at)
ORDER BY gift_date DESC;
```

### 3. أكثر المستقبلين

```sql
SELECT 
  recipient_phone, recipient_name,
  COUNT(*) as gifts_received,
  SUM(gift_amount_usd) as total_usd
FROM cash_gifts
WHERE order_status IN ('sent', 'delivered')
GROUP BY recipient_phone, recipient_name
ORDER BY gifts_received DESC
LIMIT 20;
```

### 4. التوزيع الجغرافي

```sql
SELECT 
  sender_country,
  COUNT(*) as gifts_sent,
  SUM(gift_amount_usd) as total_usd,
  AVG(gift_amount_usd) as avg_amount
FROM cash_gifts
WHERE sender_country IS NOT NULL
GROUP BY sender_country
ORDER BY gifts_sent DESC;
```

### 5. الهدايا المعلقة (لم تُرسل بعد)

```sql
SELECT 
  id, order_id, recipient_name, recipient_phone,
  gift_amount_usd, delivery_time_requested
FROM cash_gifts
WHERE order_status = 'pending'
ORDER BY delivery_time_requested ASC;
```

### 6. الهدايا الفاشلة

```sql
SELECT 
  id, recipient_name, recipient_phone,
  gift_amount_usd, sender_country, created_at
FROM cash_gifts
WHERE order_status = 'failed'
AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

---

## 🔗 التكامل مع Cart.jsx

### كيفية العمل:

1. **عند إضافة هدية:** المستخدم يدخل المبلغ والعملة في `EnvelopeGift` component
2. **عند إكمال الطلب:** `Cart.jsx` يكتشف الهدايا (item_type = 'cash_gift')
3. **عند الحفظ:** دالة `saveOrderToSupabase` تستدعي `create_cash_gift` RPC
4. **النتيجة:** الهدية محفوظة في قاعدة البيانات مع كل بيانات الطلب

### الكود في Cart.jsx:

```javascript
// اكتشاف الهدايا النقدية
const cashGifts = orderData.items?.filter(item => 
  String(item.item_type || '').toLowerCase() === 'cash_gift'
) || [];

// حفظ كل هدية
for (const gift of cashGifts) {
  const { data: savedGift, error: giftError } = await supabase.rpc('create_cash_gift', {
    p_order_id: order.id,
    p_user_id: userId,
    p_email: userEmail,
    p_sender_name: orderData.sender?.name,
    // ... باقي المعاملات
  });
}
```

---

## 📈 حالات الاستخدام

### 1. تقرير يومي للهدايا المرسلة
```sql
SELECT * FROM cash_gifts_analytics 
WHERE date = CURRENT_DATE;
```

### 2. تحليل الإيرادات من الهدايا
```sql
SELECT 
  DATE_TRUNC('month', created_at) as month,
  SUM(gift_amount_usd) as monthly_revenue,
  COUNT(*) as total_gifts
FROM cash_gifts
WHERE order_status IN ('sent', 'delivered')
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;
```

### 3. تتبع الهدايا المعلقة
```sql
SELECT * FROM cash_gifts
WHERE order_status = 'pending'
AND delivery_time_requested < NOW()
ORDER BY delivery_time_requested ASC;
```

### 4. إحصائيات المستخدم
```sql
SELECT * FROM get_user_gifts_summary('user-uuid', NULL);
```

---

## 🚀 خطوات التطبيق

### 1. تشغيل SQL Migration

انسخ محتوى `supabase/cash_gifts_tracking.sql` وشغّله في:
```
Supabase Dashboard → SQL Editor → Paste & Run
```

### 2. التحقق من الجداول

```sql
-- تحقق من الجداول
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

### 3. اختبار الدوال

```sql
-- اختبر إنشاء هدية
SELECT create_cash_gift(
  'order-uuid', 'user-uuid', 'test@example.com',
  'أحمد', '0601234567', 'syria',
  'محمد', '0601234568', 'دمشق',
  50, 7500, 'USD', 50, 150, 'رسالة الهدية'
);
```

### 4. بناء وتطوير التطبيق

```bash
npm run build
git push origin main
```

---

## 📝 الحقول الاختيارية

- `gift_message` - رسالة الهدية (اختياري)
- `gift_message_ar` - الرسالة بالعربية (اختياري)
- `special_occasion` - المناسبة (اختياري)
- `delivery_time_requested` - وقت التسليم المطلوب (اختياري)
- `envelope_color` - لون الظرف (اختياري، الافتراضي: purple)

---

## 🔒 الأمان

- ✅ جميع المعاملات مشفرة عبر SSL
- ✅ بيانات المستخدم محمية برقم تعريف فريد
- ✅ الدوال مكتوبة بـ PL/pgSQL لتجنب SQL Injection
- ✅ الوصول محدود لـ Authenticated users

---

## 📞 الدعم والمساعدة

للمزيد من المعلومات عن النظام، راجع:
- `supabase/cash_gifts_tracking.sql` - الكود الكامل
- `src/pages/Cart.jsx` - التكامل مع الواجهة
- `src/components/cart/EnvelopeGift.jsx` - واجهة إدخال الهدايا

---

**تم التطبيق:** March 11, 2026
**الإصدار:** 1.0
**الحالة:** ✅ جاهز للإنتاج
