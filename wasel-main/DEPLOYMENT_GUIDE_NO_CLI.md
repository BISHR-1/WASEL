# 🚀 دليل نشر المتطلبات الأمنية والقانونية - بدون CLI

## 📋 نظرة عامة
هذا الدليل يوضح كيفية نشر جميع المتطلبات الأمنية والقانونية المُطبقة لتطبيق WASEL باستخدام Supabase Dashboard فقط (بدون الحاجة لـ CLI).

---

## 🔧 **الخطوة 1: إعداد Supabase Dashboard**

### **1.1 تسجيل الدخول**
- اذهب إلى [Supabase Dashboard](https://supabase.com/dashboard)
- اختر مشروعك الحالي أو أنشئ مشروعاً جديداً

### **1.2 إعداد المتغيرات البيئية**
اذهب إلى **Settings** → **Environment Variables** وأضف:

```bash
# PayPal Settings
PAYPAL_WEBHOOK_ID=your_paypal_webhook_id_here
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# OpenAI Settings
OPENAI_API_KEY=your_openai_api_key_here

# Security Keys (Generate random strings)
ENCRYPTION_KEY_DEFAULT=your_32_char_random_string
WEBHOOK_ENCRYPTION_KEY=your_32_char_random_string
```

---

## 🗄️ **الخطوة 2: تطبيق ترحيلات قاعدة البيانات**

### **2.1 فتح SQL Editor**
- اذهب إلى **SQL Editor** في الشريط الجانبي
- انقر على **New Query**

### **2.2 تطبيق الترحيلات بالترتيب**

#### **الترحيلة الأولى: 005_comprehensive_security_schema.sql**
```sql
-- انسخ محتوى الملف wasel-main/supabase/migrations/005_comprehensive_security_schema.sql
-- والصقه في SQL Editor وانقر Run
```

#### **الترحيلة الثانية: 006_comprehensive_rls_policies.sql**
```sql
-- انسخ محتوى الملف wasel-main/supabase/migrations/006_comprehensive_rls_policies.sql
-- والصقه في SQL Editor وانقر Run
```

#### **الترحيلة الثالثة: 007_security_functions_triggers.sql**
```sql
-- انسخ محتوى الملف wasel-main/supabase/migrations/007_security_functions_triggers.sql
-- والصقه في SQL Editor وانقر Run
```

#### **الترحيلة الرابعة: 008_secure_order_transaction.sql**
```sql
-- انسخ محتوى الملف wasel-main/supabase/migrations/008_secure_order_transaction.sql
-- والصقه في SQL Editor وانقر Run
```

---

## ⚙️ **الخطوة 3: إنشاء Edge Functions**

### **3.1 فتح Edge Functions**
- اذهب إلى **Edge Functions** في الشريط الجانبي
- انقر على **Create Function**

### **3.2 إنشاء الوظائف**

#### **الوظيفة 1: create-secure-order**
```
Function Name: create-secure-order
Slug: create-secure-order
```

**المحتوى:**
```typescript
// انسخ محتوى الملف wasel-main/supabase/functions/create-secure-order/index.ts
// والصقه في محرر الكود
```

#### **الوظيفة 2: secure-paypal-webhook**
```
Function Name: secure-paypal-webhook
Slug: secure-paypal-webhook
```

**المحتوى:**
```typescript
// انسخ محتوى الملف wasel-main/supabase/functions/secure-paypal-webhook/index.ts
// والصقه في محرر الكود
```

#### **الوظيفة 3: secure-ai-chat**
```
Function Name: secure-ai-chat
Slug: secure-ai-chat
```

**المحتوى:**
```typescript
// انسخ محتوى الملف wasel-main/supabase/functions/secure-ai-chat/index.ts
// والصقه في محرر الكود
```

#### **الوظيفة 4: send-payment-notification**
```
Function Name: send-payment-notification
Slug: send-payment-notification
```

**المحتوى:**
```typescript
// انسخ محتوى الملف wasel-main/supabase/functions/send-notification/index.ts
// والصقه في محرر الكود
```

#### **الوظيفة 5: financial-reports**
```
Function Name: financial-reports
Slug: financial-reports
```

**المحتوى:**
```typescript
// انسخ محتوى الملف wasel-main/supabase/functions/financial-reports/index.ts
// والصقه في محرر الكود
```

### **3.3 نشر الوظائف**
- بعد إنشاء كل وظيفة، انقر **Deploy**
- تأكد من أن جميع الوظائف نشرت بنجاح

---

## 🔗 **الخطوة 4: إعداد PayPal Webhook**

### **4.1 الحصول على Webhook URL**
بعد نشر `secure-paypal-webhook`، ستحصل على URL مثل:
```
https://your-project.supabase.co/functions/v1/secure-paypal-webhook
```

### **4.2 إعداد PayPal**
- اذهب إلى [PayPal Developer Dashboard](https://developer.paypal.com/)
- اذهب إلى **Apps & Credentials**
- اختر تطبيقك أو أنشئ واحداً جديداً
- اذهب إلى **Webhooks**
- انقر **Add Webhook**
- أدخل URL الخاص بـ Supabase
- اختر الأحداث التالية:
  - `PAYMENT.CAPTURE.COMPLETED`
  - `PAYMENT.CAPTURE.DENIED`
  - `PAYMENT.CAPTURE.DECLINED`
  - `PAYMENT.CAPTURE.REFUNDED`

### **4.3 حفظ Webhook ID**
- انسخ Webhook ID من PayPal
- أضفه إلى Environment Variables في Supabase:
```
PAYPAL_WEBHOOK_ID=your_webhook_id_here
```

---

## 🔐 **الخطوة 5: إعداد Firebase (إذا لم يكن مُعدّاً)**

### **5.1 إعداد Firebase Project**
- اذهب إلى [Firebase Console](https://console.firebase.google.com/)
- أنشئ مشروعاً جديداً أو اختر الموجود

### **5.2 تفعيل الخدمات**
- **Authentication**: فعل Email/Password و Google
- **Firestore**: فعل قاعدة البيانات
- **Cloud Messaging**: فعل FCM
- **Analytics**: فعل Google Analytics
- **Remote Config**: فعل
- **Crashlytics**: فعل

### **5.3 ربط مع Supabase**
- انسخ Firebase Config من Project Settings
- أضف إلى Environment Variables في Supabase:
```
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
```

---

## 🧪 **الخطوة 6: الاختبار**

### **6.1 اختبار قاعدة البيانات**
```sql
-- في SQL Editor، شغل هذا الاستعلام للتحقق
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### **6.2 اختبار الوظائف**
```bash
# اختبر الوظائف عبر curl أو Postman
curl -X POST "https://your-project.supabase.co/functions/v1/create-secure-order" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### **6.3 اختبار الأمان**
- حاول حقن SQL في التطبيق
- اختبر rate limiting
- تحقق من تشفير البيانات

---

## 📊 **الخطوة 7: المراقبة والصيانة**

### **7.1 إعداد التنبيهات**
- في Supabase Dashboard → **Logs**
- راقب الأخطاء والأداء
- إعداد تنبيهات للأحداث الأمنية

### **7.2 النسخ الاحتياطي**
- اذهب إلى **Settings** → **Database**
- فعل النسخ الاحتياطي التلقائي
- احتفظ بنسخ احتياطية يومية

### **7.3 التحديثات الأمنية**
- راقب تحديثات Supabase
- حدث الوظائف عند الحاجة
- راقب سجلات الأمان بانتظام

---

## 🚨 **استكشاف الأخطاء**

### **مشاكل شائعة:**

#### **خطأ في الترحيلات:**
```
ERROR: relation "table_name" already exists
```
**الحل:** تأكد من عدم وجود الجداول مسبقاً أو أضف `IF NOT EXISTS`

#### **خطأ في الوظائف:**
```
Function not found
```
**الحل:** تأكد من نشر الوظيفة وصحة الاسم

#### **مشاكل PayPal:**
```
Webhook verification failed
```
**الحل:** تحقق من PAYPAL_WEBHOOK_ID و URL صحيح

#### **مشاكل Firebase:**
```
Invalid Firebase config
```
**الحل:** تحقق من مفاتيح Firebase في Environment Variables

---

## ✅ **التحقق من النجاح**

### **قائمة التحقق:**
- [ ] جميع الترحيلات نُفذت بنجاح
- [ ] جميع الوظائف نُشرت وتعمل
- [ ] PayPal webhook مُعدّ ومتصل
- [ ] Firebase مُعدّ ومتصل
- [ ] المتغيرات البيئية مُضافة
- [ ] الاختبارات الأساسية نجحت
- [ ] لا توجد أخطاء في السجلات

### **اختبار نهائي:**
```sql
-- تحقق من الجداول المُنشأة
SELECT COUNT(*) as tables_count FROM information_schema.tables
WHERE table_schema = 'public';

-- تحقق من الوظائف
SELECT proname FROM pg_proc WHERE proname LIKE '%secure%';

-- تحقق من السياسات
SELECT schemaname, tablename, policyname FROM pg_policies
WHERE schemaname = 'public';
```

---

## 🎯 **الخلاصة**

باتباع هذا الدليل، ستحصل على:

- ✅ **قاعدة بيانات آمنة** مع 18 جدول و 18 سياسة RLS
- ✅ **5 وظائف آمنة** للمعالجة الآمنة
- ✅ **تكامل PayPal آمن** مع webhook verification
- ✅ **مساعد ذكي محمي** من prompt injection
- ✅ **إشعارات فورية** للمدفوعات
- ✅ **تقارير مالية تلقائية**

**التطبيق الآن آمن ومطابق للمعايير الدولية! 🛡️**

---

## 📞 **الدعم**

إذا واجهت أي مشاكل:
1. تحقق من سجلات Supabase Logs
2. راجع رسائل الخطأ بالتفصيل
3. تأكد من صحة المتغيرات البيئية
4. تحقق من إعدادات PayPal و Firebase

**نجاح النشر يعني تطبيقاً آمناً وموثوقاً! 🚀**
