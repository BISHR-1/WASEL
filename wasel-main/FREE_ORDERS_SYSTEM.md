# 🎁 نظام الطلبات الثلاث الأولى مجاناً - Free Orders System

## 📋 نظرة عامة

نظام متكامل يوفر تسليم مجاني ورسوم خدمة مجانية للطلبات الثلاث الأولى لكل مستخدم جديد. يتتبع النظام عدد الطلبات المجانية المتبقية ويحديث الأسعار تلقائياً.

---

## 🗄️ هيكل قاعدة البيانات

### 1. جدول `user_order_tracking` - تتبع المستخدمين

**الغرض:** تخزين معلومات الطلبات المجانية لكل مستخدم

**الأعمدة:**

| العمود | النوع | الوصف |
|--------|-------|-------|
| `id` | UUID | معرّف فريد |
| `user_id` | UUID | معرّف المستخدم (Supabase Auth) |
| `email` | TEXT | بريد المستخدم |
| `total_orders` | INT | إجمالي الطلبات |
| `free_delivery_remaining` | INT | عدد التسليمات المجاني المتبقية |
| `free_service_fee_remaining` | INT | عدد رسوم الخدمة المجاني المتبقية |
| `is_eligible_for_free` | BOOLEAN | هل لا يزال مؤهلاً للطلبات المجانية |
| `first_order_date` | TIMESTAMP | تاريخ الطلب الأول |
| `last_free_order_date` | TIMESTAMP | تاريخ آخر طلب مجاني |
| `created_at` | TIMESTAMP | وقت الإنشاء |
| `updated_at` | TIMESTAMP | آخر تحديث |

### 2. جدول `order_fee_tracking` - تتبع الرسوم

**الغرض:** تسجيل جميع الطلبات المجانية للإبلاغ والتحليل

**الأعمدة:**

| العمود | النوع | الوصف |
|--------|-------|-------|
| `id` | UUID | معرّف فريد |
| `order_id` | UUID | معرّف الطلب |
| `user_id` | UUID | معرّف المستخدم |
| `email` | TEXT | بريد المستخدم |
| `delivery_fee_waived` | DECIMAL | رسم التسليم المعفي |
| `service_fee_waived` | DECIMAL | رسم الخدمة المعفي |
| `total_savings_usd` | DECIMAL | إجمالي المدخرات |
| `user_location` | VARCHAR | الموقع (inside_syria / outside_syria) |
| `is_first_order` | BOOLEAN | هل هو الطلب الأول |
| `created_at` | TIMESTAMP | تاريخ الطلب |

---

## 🔧 الدوال المتاحة

### 1. `get_user_free_orders_remaining()` - الحصول على الطلبات المتبقية

**الاستخدام:**
```sql
SELECT * FROM get_user_free_orders_remaining();
```

**المُخرجات:**
```json
{
  "free_delivery_remaining": 2,
  "free_service_fee_remaining": 2,
  "total_orders": 1,
  "is_eligible_for_free": true
}
```

### 2. `decrement_free_orders()` - تقليل الطلبات المجانية

**الاستخدام:**
```sql
SELECT * FROM decrement_free_orders();
```

**المُخرجات:**
```json
{
  "free_orders_remaining": 1,
  "message": "طلبان مجانيان متبقيان! 🎁"
}
```

### 3. `init_user_order_tracking()` - تهيئة المستخدم الجديد

**الاستخدام (تلقائي):**
يُستدعى تلقائياً عند الطلب الأول.

---

## 💰 قيم الرسوم

### خارج سوريا (Default)
- **رسم الخدمة الطبيعي:** $6 USD
- **رسم التسليم الطبيعي:** $2 USD
- **الطلب المجاني:** $0 + $0 = توفير **$8 USD**

### داخل سوريا (Syria)
- **رسم الخدمة الطبيعي:** $0
- **رسم التسليم الطبيعي:** $1 USD
- **الطلب المجاني:** $0 + $0 = توفير **$1 USD**

---

## 📊 الاستعلامات المتاحة

### 1. الطلبات المجانية اليوم

```sql
SELECT 
  DATE(created_at) as order_date,
  COUNT(*) as free_orders_today,
  SUM(total_savings_usd) as total_savings
FROM order_fee_tracking
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY DATE(created_at);
```

### 2. إجمالي المدخرات الممنوحة

```sql
SELECT 
  SUM(total_savings_usd) as total_savings_usd,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) as total_free_orders
FROM order_fee_tracking;
```

### 3. الموارد المتبقية لكل مستخدم

```sql
SELECT 
  user_id, email, 
  total_orders,
  free_delivery_remaining,
  free_service_fee_remaining,
  is_eligible_for_free,
  last_free_order_date
FROM user_order_tracking
WHERE is_eligible_for_free = true
ORDER BY last_free_order_date DESC;
```

### 4. الفئات الجغرافية

```sql
SELECT 
  user_location,
  COUNT(*) as free_orders,
  AVG(total_savings_usd) as avg_savings,
  SUM(total_savings_usd) as total_savings
FROM order_fee_tracking
GROUP BY user_location;
```

### 5. معدل الاستفادة

```sql
SELECT 
  COUNT(DISTINCT user_id) as users_with_free_orders,
  COUNT(*) as total_free_orders_given,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(DISTINCT user_id) FROM user_order_tracking), 2) as usage_percent
FROM order_fee_tracking;
```

---

## 📱 التكامل مع الواجهة الأمامية

### 1. عرض الإخطار في Cart.jsx

```javascript
// عرض إخطار الجرس المتحرك
{showFreeOrderNotification && freeOrdersRemaining > 0 && (
  <div className="free-order-notification">
    <span className="bell-icon">🔔</span>
    <span className="notification-text">
      الطلبات الثلاثة الأولى بتوصيل مجاني! 🎁
    </span>
    <span className="remaining-count">
      {freeOrdersRemaining} متبقي
    </span>
    <button onClick={() => setShowFreeOrderNotification(false)}>✕</button>
  </div>
)}
```

### 2. حساب السعر تلقائياً

```javascript
// في OrderSummary component
const serviceFeeCost = isFreeOrderEligible ? 0 : (isInsideSyria ? 0 : 6);
const deliveryFeeCost = isFreeOrderEligible ? 0 : (isInsideSyria ? 1 : 2);
```

### 3. استدعاء دالة التقليل

```javascript
// بعد نجاح الدفع (PayPal, Wallet, WhatsApp)
const { data: result } = await supabase.rpc('decrement_free_orders');

// عرض رسالة مخصصة
showToast(result.message);
setFreeOrdersRemaining(result.free_orders_remaining);
```

---

## 🔄 سير العمل الكامل

### 1️⃣ **الطلب الأول للمستخدم الجديد**
```
المستخدم يفتح السلة
↓
Cart.jsx يحمّل get_user_free_orders_remaining()
↓
يحصل على: free_delivery_remaining = 3
↓
يعرض إخطار الجرس مع "3 طلبات متبقية"
↓
السعر: $0 تسليم + $0 خدمة = مجاني تماماً
↓
المستخدم يكمل الدفع (PayPal/Wallet/WhatsApp)
↓
Backend يستدعي decrement_free_orders()
↓
النتيجة: free_orders_remaining = 2
↓
Toast message: "طلبان مجانيان متبقيان! 🎁"
```

### 2️⃣ **الطلب الثاني**
```
نفس السير مع free_orders_remaining = 2
السعر: مجاني
Toast: "طلب واحد فقط متبقي! ⏰"
```

### 3️⃣ **الطلب الثالث**
```
free_orders_remaining = 1
السعر: مجاني
Toast: "هذا آخر طلب مجاني! 🎊"
```

### 4️⃣ **الطلب الرابع والطلبات اللاحقة**
```
free_orders_remaining = 0
is_eligible_for_free = false
السعر: عودة للأسعار العادية ($6 + $2 = $8)
لا يظهر إخطار الجرس
```

---

## 🎨 الرسائل المخصصة

| الحالة | الرسالة | الإيموجي |
|-------|--------|--------|
| 3 متبقي | "ثلاث طلبات مجانية متاحة لك!" | 🎁 |
| 2 متبقي | "طلبان مجانيان متبقيان! نسيت أحدهما؟" | 🎁 🎁 |
| 1 متبقي | "طلب واحد فقط متبقي! اسرع!" | ⏰ |
| 0 متبقي | "انتهت الطلبات المجانية - شكراً!" | 🌟 |

---

## 📈 حالات الاستخدام

### 1. لاحة تحكم يومية

```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as free_orders_given,
  SUM(total_savings_usd) as revenue_impact,
  COUNT(DISTINCT user_id) as new_users
FROM order_fee_tracking
WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### 2. تقرير نهائي أسبوعي

```sql
SELECT 
  'Weekly Report' as report_type,
  CURRENT_DATE as report_date,
  (SELECT COUNT(DISTINCT user_id) FROM user_order_tracking) as total_users,
  (SELECT COUNT(*) FROM order_fee_tracking WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '7 days') as free_orders_this_week,
  (SELECT SUM(total_savings_usd) FROM order_fee_tracking WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '7 days') as cost_this_week;
```

### 3. تحديد المستخدمين الجدد الفعالين

```sql
SELECT 
  user_id, email,
  COUNT(*) as orders_placed,
  SUM(total_savings_usd) as total_discount_received
FROM order_fee_tracking
WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY user_id, email
ORDER BY orders_placed DESC
LIMIT 50;
```

---

## 🚀 خطوات التطبيق

### 1. تشغيل SQL Migration

```sql
-- انسخ محتوى supabase/free_orders_tracking.sql
-- والصقه في Supabase Dashboard → SQL Editor
```

### 2. التحقق من الجداول

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%order%';
```

### 3. اختبار الدوال

```sql
-- اختبر الحصول على الطلبات المتبقية
SELECT * FROM get_user_free_orders_remaining();

-- اختبر التقليل
SELECT * FROM decrement_free_orders();
```

### 4. بناء وتطوير

```bash
npm run build
npm start
```

---

## 🔒 الأمان

- ✅ البيانات مشفرة عبر SSL
- ✅ التحقق من هوية المستخدم الإجباري
- ✅ الدوال محمية ضد SQL Injection
- ✅ تسجيل جميع المعاملات للتدقيق

---

## 📊 المقاييس الرئيسية

### لتتبع النجاح:

1. **معدل الاستفادة:** كم٪ من المستخدمين الجدد استخدموا الطلبات المجانية؟
2. **التحويل:** كم عدد المستخدمين الذين طلبوا بعد الطلبات الثلاث المجانية؟
3. **متوسط قيمة الطلب:** هل زادت قيمة الطلب بعد انتهاء المجاني؟
4. **العائد على الاستثمار:** هل كسبنا مستخدمين جدد يستحقون التكلفة؟

---

## 📞 الدعم

للمزيد من المعلومات:
- `supabase/free_orders_tracking.sql` - الكود الكامل
- `src/pages/Cart.jsx` - التكامل الكامل
- بحث عن "freeOrdersRemaining" في الكود

---

**تم التطبيق:** March 10, 2026
**الإصدار:** 1.0
**الحالة:** ✅ قيد الاستخدام الفعلي
