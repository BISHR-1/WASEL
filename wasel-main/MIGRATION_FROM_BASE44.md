# دليل نقل البيانات من Base44 إلى Supabase
## كيفية استرجاع بياناتك من Base44

---

## 🚨 **المشكلة:**
- لديك بيانات مهمة في Base44 (مطاعم، أصناف، هدايا، باقات، إلخ)
- بعد التحديث، التطبيق الآن يستخدم Supabase
- تحتاج لنقل البيانات من Base44 إلى Supabase

---

## ✅ **الحل: سكربت النقل التلقائي**

### الخطوة 1: الحصول على معلومات Base44

أولاً، تحتاج إلى:

1. **رابط API الخاص بـ Base44**
   ```
   مثال: https://api.base44.com/v1
   ```

2. **API Key أو Token**
   ```
   مثال: sk_live_xxxxxxxxxxx
   ```

3. **كيفية الوصول لبياناتك:**
   - اذهب إلى لوحة تحكم Base44
   - ابحث عن قسم API أو Settings
   - انسخ API Key

### الخطوة 2: الحصول على Supabase Service Role Key

1. افتح [Supabase Dashboard](https://app.supabase.com)
2. اختر مشروعك
3. اذهب إلى **Settings** → **API**
4. انسخ **service_role** key (⚠️ ليس anon key!)

### الخطوة 3: تعديل ملف النقل

افتح ملف `migrate-from-base44.js` وعدّل:

```javascript
// ضع معلومات Base44 هنا
const BASE44_API_URL = 'https://api.base44.com/v1'; // رابط API
const BASE44_API_KEY = 'YOUR_BASE44_API_KEY';       // API Key

// ضع معلومات Supabase هنا
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY';
```

### الخطوة 4: تثبيت المكتبات المطلوبة

```bash
cd "c:\Users\HP ENVY 15\Downloads\wasel-main\wasel-main"
npm install axios @supabase/supabase-js
```

### الخطوة 5: تشغيل السكربت

```bash
node migrate-from-base44.js
```

**سيقوم السكربت بـ:**
1. ✅ جلب جميع المطاعم من Base44
2. ✅ جلب جميع الأصناف من Base44
3. ✅ جلب جميع المنتجات من Base44
4. ✅ جلب جميع الهدايا من Base44
5. ✅ جلب جميع الباقات من Base44
6. ✅ إدخالها جميعاً في Supabase

---

## 🔧 **إذا لم يعمل Base44 API:**

### طريقة بديلة: التصدير اليدوي

إذا كان Base44 لا يوفر API أو لم يعمل معك:

#### 1. تصدير من Base44 Dashboard

1. افتح لوحة تحكم Base44
2. اذهب لكل قسم (Restaurants, Menu Items, Products, إلخ)
3. ابحث عن زر **Export** أو **Download**
4. احفظ الملفات بصيغة **JSON** أو **CSV**

#### 2. استخدام سكربت التحميل

أنشئ ملف `upload-to-supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SERVICE_ROLE_KEY'
);

// قراءة ملف JSON
const restaurants = JSON.parse(fs.readFileSync('./restaurants.json', 'utf8'));

// رفعها إلى Supabase
async function upload() {
  const { error } = await supabase
    .from('restaurants')
    .insert(restaurants);
    
  if (error) console.error(error);
  else console.log('✅ تم الرفع بنجاح!');
}

upload();
```

---

## 📱 **الوصول لصفحة RestaurantDashboard:**

### في المتصفح:
```
http://localhost:5173/#/RestaurantDashboard
```

### في التطبيق:
1. افتح التطبيق
2. سجل دخول بحساب Google
3. اذهب إلى القائمة
4. اختر "لوحة المطعم"

### إذا لم تظهر:
الصفحة موجودة لكن تحتاج **تسجيل دخول أولاً**:

```javascript
// في المتصفح Console:
localStorage.clear(); // امسح الكاش
location.reload();    // أعد التحميل
```

---

## 🎯 **للأدمن (Admin):**

إذا كنت تريد الوصول للوحة الإدارة:

### 1. إنشاء حساب أدمن في Supabase

افتح **Supabase SQL Editor** ونفذ:

```sql
-- إضافة مستخدم كأدمن
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@gmail.com';

-- أو إنشاء عمود role إذا لم يكن موجوداً
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
```

### 2. الوصول للوحة الإدارة

```
http://localhost:5173/#/AdminPanel
```

---

## 📊 **التحقق من البيانات:**

بعد النقل، تحقق من Supabase:

```sql
-- عدد المطاعم
SELECT COUNT(*) FROM restaurants;

-- عدد الأصناف
SELECT COUNT(*) FROM menu_items;

-- عدد المنتجات
SELECT COUNT(*) FROM products;

-- عدد الهدايا
SELECT COUNT(*) FROM gifts;

-- عدد الباقات
SELECT COUNT(*) FROM packages;
```

---

## ⚠️ **ملاحظات مهمة:**

1. **Service Role Key خطير!**
   - لا تشاركه مع أحد
   - لا ترفعه على GitHub
   - استخدمه فقط في السكربتات المحلية

2. **النسخ الاحتياطي**
   ```bash
   # قبل أي شيء، احفظ نسخة من البيانات
   pg_dump supabase > backup.sql
   ```

3. **الصور والملفات**
   - الصور المرفوعة على Base44 تحتاج نقل منفصل
   - يمكن استخدام سكربت لتحميلها وإعادة رفعها على Supabase Storage

---

## 🆘 **إذا واجهت مشاكل:**

### المشكلة: "Cannot find Base44 credentials"
**الحل:** تأكد من أنك وضعت API URL و API Key الصحيحين

### المشكلة: "Supabase connection failed"
**الحل:** 
1. تأكد من استخدام Service Role Key
2. تحقق من RLS policies في Supabase
3. تأكد من تفعيل جميع الجداول

### المشكلة: "البيانات لم تظهر في التطبيق"
**الحل:**
```bash
# امسح الكاش وأعد البناء
npm run build
npx cap sync android
```

---

## 📞 **هل تحتاج مساعدة؟**

إذا لم تستطع الحصول على بيانات Base44:
1. تواصل مع دعم Base44
2. أرسل لي رابط API أو ملفات JSON المصدرة
3. سأساعدك في النقل

---

## ✅ **بعد النقل:**

بعد التأكد من نقل جميع البيانات بنجاح:
1. احتفظ بنسخة احتياطية من Base44
2. يمكنك حذف base44Client.js
3. جميع البيانات الآن آمنة في Supabase! 🎉
