# 🔔 دليل الإشعارات الحقيقية (Push Notifications)

## ✅ ما تم إعداده

1. **خدمة الإشعارات** - `src/services/pushNotifications.js`
2. **جداول قاعدة البيانات** - `PUSH_NOTIFICATIONS_TABLES.sql`
3. **Edge Function** - `supabase/functions/send-notification/index.ts`
4. **إعدادات Android** - تم تحديث MainActivity و AndroidManifest

---

## 🚀 خطوات التفعيل

### 1️⃣ إعداد Firebase (مرة واحدة)

1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. أنشئ مشروع جديد أو استخدم مشروع موجود
3. أضف تطبيق Android:
   - Package name: `com.wasel.app`
   - حمّل `google-services.json`
4. ضع الملف في: `android/app/google-services.json`

### 2️⃣ الحصول على Server Key

1. في Firebase Console، اذهب إلى:
   - ⚙️ Project Settings → Cloud Messaging
2. انسخ **Server Key** (أو Legacy server key)
3. أضفه في Supabase:
   ```bash
   supabase secrets set FCM_SERVER_KEY=your_server_key_here
   ```

### 3️⃣ إنشاء الجداول في Supabase

شغّل محتوى ملف `PUSH_NOTIFICATIONS_TABLES.sql` في SQL Editor في Supabase

### 4️⃣ نشر Edge Function

```bash
cd wasel-main
supabase functions deploy send-notification
```

### 5️⃣ بناء التطبيق

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

---

## 📤 إرسال الإشعارات

### من الكود (JavaScript)

```javascript
import { supabase } from '@/lib/supabase';

// إرسال لمستخدم واحد
const sendToUser = async (userId, title, body) => {
  const { data, error } = await supabase.functions.invoke('send-notification', {
    body: {
      userId: userId,
      title: title,
      body: body,
      data: {
        type: 'order_update',
        order_id: '12345'
      }
    }
  });
  return data;
};

// إرسال للجميع
const sendToAll = async (title, body) => {
  const { data, error } = await supabase.functions.invoke('send-notification', {
    body: {
      topic: 'all',
      title: title,
      body: body
    }
  });
  return data;
};

// أمثلة الاستخدام
sendToUser('user-uuid', '🎉 طلبك جاهز!', 'طلبك رقم #123 في الطريق إليك');
sendToAll('🔥 عرض خاص!', 'خصم 50% على جميع المطاعم لمدة ساعة!');
```

### من Supabase Dashboard

يمكنك استدعاء الدالة من:
- **Edge Functions** → send-notification → Invoke

---

## 📱 أنواع الإشعارات

| النوع | الوصف | مثال |
|-------|-------|------|
| `order_update` | تحديث الطلب | طلبك في الطريق |
| `promotion` | عروض وخصومات | خصم 20% اليوم |
| `new_restaurant` | مطعم جديد | مطعم جديد قريب منك |
| `general` | إشعار عام | رسالة عامة |

---

## 🔧 استكشاف الأخطاء

### الإشعار لا يصل؟

1. **تأكد من `google-services.json`** موجود في `android/app/`
2. **تأكد من Server Key** صحيح في Supabase secrets
3. **تأكد من الأذونات** - المستخدم قبل الإشعارات
4. **تأكد من Token** محفوظ في جدول `user_devices`

### للتحقق من Token

```javascript
import { getFCMToken } from '@/services/pushNotifications';
console.log('FCM Token:', getFCMToken());
```

### للاختبار في Firebase

1. Firebase Console → Cloud Messaging
2. Send your first message
3. اختر Single device
4. ألصق الـ Token

---

## 📊 مراقبة الإشعارات

```sql
-- عدد الأجهزة المسجلة
SELECT COUNT(*) FROM user_devices WHERE is_active = true;

-- آخر الإشعارات المرسلة
SELECT * FROM notification_history 
ORDER BY sent_at DESC 
LIMIT 10;

-- إشعارات مستخدم معين
SELECT * FROM notification_history 
WHERE user_id = 'user-uuid'
ORDER BY sent_at DESC;
```

---

## ⚠️ ملاحظات مهمة

1. **الإشعارات تعمل فقط على APK** - ليس في المتصفح
2. **يجب قبول الإذن** من المستخدم
3. **Token يتغير أحياناً** - يتم تحديثه تلقائياً
4. **Rate Limits** - Firebase لديه حدود للإرسال المجاني

---

## 💡 أفكار للاستخدام

- ✅ إشعار عند تأكيد الطلب
- ✅ إشعار عند خروج الطلب للتوصيل
- ✅ إشعار عند وصول الطلب
- ✅ عروض يومية
- ✅ تذكير بالسلة المتروكة
- ✅ مطاعم جديدة قريبة
