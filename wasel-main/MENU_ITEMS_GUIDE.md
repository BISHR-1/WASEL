# دليل إضافة أصناف المطاعم

## المشكلة
عندما تضيف صنف في Supabase مباشرة، يجب تحديد المطعم الذي ينتمي إليه الصنف.

## ✅ الحلول المتاحة

### **الحل 1: استخدام صفحة Admin Menu Items (الأفضل)** ⭐

تم إضافة صفحة جديدة لإدارة جميع أصناف المطاعم من مكان واحد:

1. افتح التطبيق
2. اذهب إلى **لوحة الإدارة** (Admin Panel)
3. اضغط على **"إدارة أصناف المطاعم"**
4. اضغط **"إضافة صنف جديد"**
5. اختر المطعم من القائمة المنسدلة
6. املأ بيانات الصنف
7. اضغط **"إضافة الصنف"**

**المميزات:**
- اختيار المطعم من قائمة منسدلة
- رفع الصور بسهولة
- معاينة فورية
- دعم اللغتين العربية والإنجليزية
- حساب تلقائي لسعر العميل (10% زيادة)

---

### **الحل 2: استخدام لوحة المطعم**

إذا كنت صاحب مطعم:

1. افتح التطبيق
2. اذهب إلى **لوحة المطعم** (Restaurant Dashboard)
3. اختر تبويب **"قائمة الطعام"**
4. اضغط **"إضافة منتج جديد"**
5. املأ البيانات
6. الصنف سيُربط تلقائياً بمطعمك

---

### **الحل 3: الإضافة من Supabase مباشرة**

إذا كنت تريد الإضافة من Supabase Dashboard مباشرة:

#### الخطوات:

1. **افتح Supabase Dashboard**
2. **اذهب إلى Table Editor**
3. **اختر جدول `menu_items`**
4. **اضغط Insert row**
5. **املأ الحقول التالية:**

```javascript
{
  "restaurant_id": "UUID-OF-RESTAURANT",  // ⚠️ مطلوب - معرف المطعم
  "name": "شاورما فروج",                 // مطلوب
  "name_en": "Chicken Shawarma",          // اختياري
  "description": "شاورما فروج طازجة",      // اختياري
  "description_en": "Fresh chicken shawarma", // اختياري
  "category": "ساندويشات",                // اختياري
  "base_price": 50000,                    // مطلوب - سعر المطعم
  "customer_price": 55000,                // مطلوب - سعر العميل (base_price * 1.1)
  "price": 55000,                         // مطلوب - للتوافق مع Schema القديم
  "image_url": "https://...",             // اختياري
  "is_available": true,                   // افتراضي true
  "is_featured": false                    // افتراضي false
}
```

#### كيفية الحصول على `restaurant_id`:

1. افتح جدول `restaurants` في Supabase
2. ابحث عن المطعم المطلوب
3. انسخ قيمة `id` (UUID)
4. استخدمها في حقل `restaurant_id`

---

## 📊 Schema جدول menu_items

```sql
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,  -- ⚠️ مطلوب
  name TEXT NOT NULL,                    -- ⚠️ مطلوب
  name_en TEXT,
  description TEXT,
  description_en TEXT,
  image_url TEXT,
  price DECIMAL(10,2) NOT NULL,          -- ⚠️ مطلوب
  base_price DECIMAL(10,2),
  customer_price DECIMAL(10,2),
  category TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔍 الفلترة حسب المطعم

للحصول على أصناف مطعم معين:

### من Supabase SQL Editor:
```sql
SELECT * FROM menu_items 
WHERE restaurant_id = 'UUID-OF-RESTAURANT'
ORDER BY created_at DESC;
```

### من API:
```javascript
const items = await fetchMenuItems({ restaurant_id: 'UUID-OF-RESTAURANT' });
```

---

## ⚠️ ملاحظات مهمة

1. **يجب** أن يكون لكل صنف `restaurant_id`
2. إذا حذفت مطعم، سيتم حذف جميع أصنافه تلقائياً (`ON DELETE CASCADE`)
3. سعر العميل = سعر المطعم + 10%
4. استخدم صفحة Admin Menu Items لتسهيل العمل

---

## 🎯 أفضل الممارسات

- ✅ استخدم صفحة **Admin Menu Items** لإضافة الأصناف
- ✅ أضف صور واضحة لكل صنف
- ✅ اكتب وصف مختصر وجذاب
- ✅ حدد التصنيف (مقبلات، أطباق رئيسية، حلويات، مشروبات...)
- ✅ تأكد من صحة الأسعار قبل النشر
- ✅ فعّل/عطّل الأصناف حسب التوفر
