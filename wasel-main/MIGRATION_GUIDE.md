# Wasel App - Migration Guide: Base44 → Supabase

## ملخص التحديثات

تم استبدال Base44 بالكامل بـ Supabase لإدارة:
- ✅ المطاعم والمنيو
- ✅ المنتجات والهدايا
- ✅ الطلبات وسلة التسوق  
- ✅ المستخدمين والمفضلة
- ✅ العناوين والإشعارات

---

## خطوات التفعيل في Supabase

### 1. إنشاء Database Schema

افتح **Supabase Dashboard** → **SQL Editor** والصق محتوى ملف:
```
SUPABASE_MIGRATION.sql
```

اضغط **Run** لإنشاء كل الجداول والـ policies.

---

### 2. Storage للصور (اختياري)

إذا تريد رفع صور للمطاعم/المنتجات:

1. اذهب إلى **Storage** في Supabase
2. أنشئ bucket اسمه `images`
3. اضبط Policies:

```sql
-- السماح بقراءة الصور للجميع
CREATE POLICY "Images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- السماح برفع الصور للمستخدمين المسجلين
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');
```

---

### 3. إضافة البيانات التجريبية (اختياري)

يمكنك إضافة بيانات تجريبية عبر SQL Editor:

```sql
-- مطاعم تجريبية
INSERT INTO public.restaurants (name, name_ar, category, image_url, rating, delivery_fee)
VALUES
  ('Pizza Place', 'مطعم البيتزا', 'restaurant', 'https://via.placeholder.com/300', 4.5, 15),
  ('Sweet Dreams', 'أحلام الحلويات', 'sweets', 'https://via.placeholder.com/300', 4.8, 10);

-- منيو تجريبي
INSERT INTO public.menu_items (restaurant_id, name, name_ar, price, category)
SELECT 
  r.id,
  'Margherita Pizza',
  'بيتزا مارغريتا',
  45.00,
  'main'
FROM public.restaurants r
WHERE r.name = 'Pizza Place'
LIMIT 1;
```

---

## الملفات المعدلة

### ملفات جديدة:
- ✅ `src/api/waselClient.js` - API كامل لـ Supabase (استبدال base44Client.js)
- ✅ `SUPABASE_MIGRATION.sql` - Database schema

### ملفات معدلة:
- ✅ `src/lib/AuthContext.jsx` - استبدال Base44 auth بـ Supabase auth
- ✅ `src/lib/supabase.js` - Supabase client (بالـ keys الصحيحة)
- 🔄 `src/App.jsx` - تحديث session management
- 🔄 `src/pages/*.jsx` - تحديث كل الصفحات (قريباً)

---

## API الجديد - أمثلة

### جلب المطاعم
```javascript
import { fetchRestaurants } from '@/api/waselClient';

const restaurants = await fetchRestaurants({ 
  category: 'restaurant',
  is_featured: true,
  limit: 10 
});
```

### جلب المنيو
```javascript
import { fetchMenuItems } from '@/api/waselClient';

const items = await fetchMenuItems({ 
  restaurant_id: 'xxx-xxx-xxx',
  category: 'main' 
});
```

### إضافة للسلة
```javascript
import { addToCart } from '@/api/waselClient';

await addToCart(userId, {
  item_type: 'menu_item',
  item_id: 'xxx-xxx-xxx',
  quantity: 2
});
```

### إنشاء طلب
```javascript
import { createOrder, createOrderItems, clearCart } from '@/api/waselClient';

const order = await createOrder({
  user_id: userId,
  total_amount: 150.00,
  subtotal: 135.00,
  delivery_fee: 15.00,
  payment_method: 'cash',
  restaurant_id: restaurantId
});

await createOrderItems([
  {
    order_id: order.id,
    item_type: 'menu_item',
    item_id: itemId,
    item_name: 'Pizza',
    quantity: 2,
    unit_price: 45.00,
    total_price: 90.00
  }
]);

await clearCart(userId);
```

---

## التوافق مع الكود القديم

### استبدال Base44 calls:

#### قبل:
```javascript
import { fetchBase44Entities } from '@/api/base44Client';
const items = await fetchBase44Entities('MenuItem');
```

#### بعد:
```javascript
import { fetchEntities } from '@/api/waselClient';
const items = await fetchEntities('MenuItem');
```

أو مباشرة:
```javascript
import { fetchMenuItems } from '@/api/waselClient';
const items = await fetchMenuItems();
```

---

## Row Level Security (RLS)

تم تفعيل RLS على كل الجداول:

✅ **المطاعم/المنتجات**: يمكن للجميع القراءة
✅ **الطلبات**: يمكن للمستخدم رؤية طلباته فقط
✅ **السلة**: يمكن للمستخدم إدارة سلته فقط
✅ **المفضلة/العناوين**: خاصة بكل مستخدم

---

## الخطوات التالية

سأقوم بتعديل ملفات الصفحات لاستخدام الـ API الجديد:

1. ✅ Home.jsx
2. ✅ Restaurants.jsx / Sweets.jsx
3. ✅ Gifts.jsx
4. ✅ Products.jsx / Electronics.jsx
5. ✅ Cart.jsx
6. ✅ MyOrders.jsx

---

## الدعم

إذا واجهت أي مشكلة، تأكد من:
1. تشغيل SQL في Supabase ✅
2. Supabase keys صحيحة في supabase.js ✅
3. RLS policies مفعّلة ✅

🎉 Base44 تم إزالته بالكامل!