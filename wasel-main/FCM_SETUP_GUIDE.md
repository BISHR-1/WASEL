# دليل إعداد Firebase Cloud Messaging (FCM)

## الخطوة 1: إعداد Firebase Project

### 1.1 إنشاء مشروع Firebase:
1. اذهب إلى https://console.firebase.google.com
2. اضغط "Add project" أو "إضافة مشروع"
3. اسم المشروع: `Wasel App`
4. فعّل Google Analytics (اختياري)
5. اضغط "Create project"

### 1.2 إضافة تطبيق Android:
1. في Firebase Console، اضغط على أيقونة Android
2. Android package name: `com.wasel.app` (من capacitor.config.ts)
3. App nickname: `Wasel`
4. اضغط "Register app"
5. حمّل ملف `google-services.json`
6. ضع الملف في: `android/app/google-services.json`

### 1.3 تفعيل Cloud Messaging:
1. في Firebase Console → Project Settings
2. تبويب "Cloud Messaging"
3. انسخ "Server key" - ستحتاجه لإرسال الإشعارات

---

## الخطوة 2: تحديث ملفات Android

### 2.1 تحديث android/build.gradle:
```gradle
buildscript {
    dependencies {
        // إضافة هذا السطر
        classpath 'com.google.gms:google-services:4.3.15'
    }
}
```

### 2.2 تحديث android/app/build.gradle:
```gradle
apply plugin: 'com.android.application'

// إضافة هذا السطر في النهاية
apply plugin: 'com.google.gms.google-services'

dependencies {
    // إضافة Firebase dependencies
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-messaging'
}
```

---

## الخطوة 3: إنشاء دالة لإرسال الإشعارات من السيرفر

### طريقة 1: باستخدام Node.js

```javascript
// في ملف جديد: functions/sendPushNotification.js

const admin = require('firebase-admin');

// تهيئة Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

/**
 * إرسال إشعار لجهاز واحد
 */
async function sendToDevice(deviceToken, title, body, data = {}) {
  const message = {
    notification: {
      title: title,
      body: body,
      sound: 'default'
    },
    data: data,
    token: deviceToken
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error: error.message };
  }
}

/**
 * إرسال إشعار لعدة أجهزة
 */
async function sendToMultipleDevices(deviceTokens, title, body, data = {}) {
  const message = {
    notification: {
      title: title,
      body: body,
      sound: 'default'
    },
    data: data,
    tokens: deviceTokens // مصفوفة tokens
  };

  try {
    const response = await admin.messaging().sendMulticast(message);
    console.log('Successfully sent messages:', response.successCount);
    return { 
      success: true, 
      successCount: response.successCount,
      failureCount: response.failureCount
    };
  } catch (error) {
    console.error('Error sending messages:', error);
    return { success: false, error: error.message };
  }
}

/**
 * إرسال إشعار لجميع المستخدمين (Topic)
 */
async function sendToTopic(topic, title, body, data = {}) {
  const message = {
    notification: {
      title: title,
      body: body,
      sound: 'default'
    },
    data: data,
    topic: topic
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message to topic:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error sending message to topic:', error);
    return { success: false, error: error.message };
  }
}

// أمثلة استخدام:
module.exports = {
  sendToDevice,
  sendToMultipleDevices,
  sendToTopic
};
```

### طريقة 2: باستخدام HTTP API مباشرة

```javascript
// إرسال إشعار باستخدام fetch

async function sendPushNotificationViaAPI(deviceToken, title, body, data = {}) {
  const FCM_SERVER_KEY = 'YOUR_FIREBASE_SERVER_KEY'; // من Firebase Console
  
  const notification = {
    to: deviceToken,
    notification: {
      title: title,
      body: body,
      sound: 'default',
      priority: 'high'
    },
    data: data
  };

  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${FCM_SERVER_KEY}`
      },
      body: JSON.stringify(notification)
    });

    const result = await response.json();
    console.log('FCM Response:', result);
    return result;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}
```

---

## الخطوة 4: إنشاء Supabase Edge Function لإرسال الإشعارات

```typescript
// في supabase/functions/send-notification/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY')!

serve(async (req) => {
  try {
    const { deviceToken, title, body, data } = await req.json()

    const notification = {
      to: deviceToken,
      notification: {
        title: title,
        body: body,
        sound: 'default',
        priority: 'high'
      },
      data: data || {}
    }

    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${FCM_SERVER_KEY}`
      },
      body: JSON.stringify(notification)
    })

    const result = await response.json()

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }
})
```

### استدعاء الدالة من التطبيق:

```javascript
import { supabase } from '@/lib/supabase';

async function sendNotificationFromApp(userId, title, body) {
  // 1. جلب device token للمستخدم من قاعدة البيانات
  const { data: devices } = await supabase
    .from('device_tokens')
    .select('token')
    .eq('user_id', userId);

  if (!devices || devices.length === 0) {
    console.log('No devices found for user');
    return;
  }

  // 2. إرسال الإشعار عبر Edge Function
  for (const device of devices) {
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: {
        deviceToken: device.token,
        title: title,
        body: body,
        data: { type: 'order', timestamp: new Date().toISOString() }
      }
    });

    if (error) {
      console.error('Error sending notification:', error);
    } else {
      console.log('Notification sent:', data);
    }
  }
}
```

---

## الخطوة 5: أمثلة عملية

### مثال 1: إشعار عند تغيير حالة الطلب

```javascript
// في لوحة التحكم (AdminOrders.jsx):
async function updateOrderStatus(orderId, newStatus) {
  // 1. تحديث حالة الطلب
  await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId);

  // 2. جلب بيانات الطلب والمستخدم
  const { data: order } = await supabase
    .from('orders')
    .select('user_id, order_number')
    .eq('id', orderId)
    .single();

  // 3. إرسال الإشعار
  const messages = {
    'confirmed': 'تم تأكيد طلبك ✅',
    'on_the_way': 'طلبك في الطريق 🚗',
    'delivered': 'تم التوصيل بنجاح 🎉'
  };

  await sendNotificationFromApp(
    order.user_id,
    messages[newStatus],
    `الطلب #${order.order_number}`
  );
}
```

### مثال 2: إشعار جماعي لجميع المستخدمين

```javascript
async function sendBroadcastNotification(title, body) {
  // 1. جلب جميع device tokens
  const { data: tokens } = await supabase
    .from('device_tokens')
    .select('token');

  if (!tokens) return;

  // 2. إرسال للجميع
  const deviceTokens = tokens.map(t => t.token);
  
  // استخدام Firebase Admin SDK:
  await sendToMultipleDevices(deviceTokens, title, body);
}

// استخدام:
await sendBroadcastNotification(
  '🎉 عروض خاصة اليوم',
  'خصم 50% على جميع المطاعم!'
);
```

---

## نصائح مهمة

### 1. حفظ Device Tokens:
```sql
-- في Supabase
CREATE TABLE device_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  device_type TEXT, -- 'android' or 'ios'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_device_tokens_user_id ON device_tokens(user_id);
```

### 2. تنظيف Tokens القديمة:
```javascript
// حذف tokens منتهية الصلاحية
async function cleanupInvalidTokens() {
  // FCM يعيد خطأ إذا كان token غير صالح
  // احذفه من قاعدة البيانات
}
```

### 3. معدل الإرسال:
- FCM يسمح بإرسال 500 إشعار في الطلب الواحد
- للإرسال الجماعي، قسّم الـ tokens إلى مجموعات

### 4. الأمان:
- لا تضع FCM_SERVER_KEY في الكود الأمامي
- استخدم Edge Functions أو Backend
- احفظ المفتاح في متغيرات البيئة
