# دليل نظام الإشعارات في تطبيق واصل
# Push Notifications System Guide

## ✅ ما تم تنفيذه

تم تنفيذ نظام إشعارات كامل ومتكامل يتضمن:

### 1. الملفات الأساسية

#### 📱 الإشعارات الفورية (Push Notifications)
- **الملف**: [src/lib/pushNotifications.js](src/lib/pushNotifications.js)
- **الوظائف**:
  - `initPushNotifications()` - تهيئة النظام وطلب الأذونات
  - `sendLocalNotification()` - إرسال إشعار محلي
  - `getPendingNotifications()` - جلب الإشعارات المعلقة
  - `clearAllNotifications()` - مسح جميع الإشعارات

#### 🔔 الإشعارات الداخلية (In-App Notifications)
- **الملف**: [src/lib/inAppNotifications.js](src/lib/inAppNotifications.js)
- **الوظائف**:
  - `addNotification()` - إضافة إشعار داخلي
  - `getNotifications()` - جلب جميع الإشعارات
  - `getUnreadCount()` - عدد الإشعارات غير المقروءة
  - `markAsRead()` - تحديد كمقروء
  - `deleteNotification()` - حذف إشعار

#### 🛠️ أدوات مساعدة (Helper Functions)
- **الملف**: [src/lib/notificationHelpers.js](src/lib/notificationHelpers.js)
- **يحتوي على 12 وظيفة جاهزة للاستخدام**:
  1. `notifyOrderCreated()` - إشعار عند إنشاء طلب
  2. `notifyOrderStatusChange()` - إشعار بتغيير حالة الطلب
  3. `notifyNewChatMessage()` - إشعار برسالة جديدة
  4. `notifyCartReminder()` - تذكير بسلة التسوق
  5. `notifySpecialOffer()` - إشعار بعرض خاص
  6. `notifyProductAddedToFavorites()` - إضافة للمفضلة
  7. `notifyPaymentIssue()` - مشكلة في الدفع
  8. `notifyPaymentSuccess()` - نجاح الدفع
  9. `notifyAddressAdded()` - إضافة عنوان جديد
  10. `notifyAppUpdate()` - تحديث التطبيق
  11. `notifyRatingReminder()` - تذكير بالتقييم
  12. `notifyLoyaltyPoints()` - نقاط الولاء

#### 📄 صفحة الإشعارات
- **الملف**: [src/pages/Notifications.jsx](src/pages/Notifications.jsx)
- **المميزات**:
  - عرض جميع الإشعارات
  - عداد للإشعارات غير المقروءة
  - حذف إشعار فردي
  - حذف جميع الإشعارات
  - تحديد الكل كمقروء
  - التنقل للصفحة المرتبطة بالإشعار

### 2. التكامل مع التطبيق

#### ✅ تسجيل الدخول (EmailOtpLogin.jsx)
```javascript
// عند تسجيل الدخول بنجاح:
await initPushNotifications(); // تهيئة الإشعارات الفورية
addNotification('مرحباً بك في واصل! 💙', 'نوصل حبك لحد الباب', 'success', '/Home');
```

#### ✅ Header (Layout.jsx)
```jsx
{/* زر الإشعارات مع عداد */}
<button onClick={() => navigate('/Notifications')}>
  <Bell />
  {unreadNotifications > 0 && <span>{unreadNotifications}</span>}
</button>
```

#### ✅ سلة التسوق (Cart.jsx)
```javascript
// عند إتمام الطلب:
notifyOrderCreated(order.order_number, order.total_amount);
notifyPaymentSuccess(order.order_number, order.total_amount);
```

### 3. أدلة الإعداد

#### 📚 أمثلة عملية
- **الملف**: [PUSH_NOTIFICATIONS_EXAMPLES.js](PUSH_NOTIFICATIONS_EXAMPLES.js)
- يحتوي على أمثلة تفصيلية لجميع سيناريوهات الاستخدام

#### 🔥 Firebase Cloud Messaging
- **الملف**: [FCM_SETUP_GUIDE.md](FCM_SETUP_GUIDE.md)
- دليل كامل لإعداد Firebase للإشعارات عن بُعد

#### 📧 طرق بديلة
- **الملف**: [ALTERNATIVE_NOTIFICATIONS.md](ALTERNATIVE_NOTIFICATIONS.md)
- يشمل:
  - إشعارات البريد الإلكتروني
  - إشعارات SMS
  - Realtime Notifications

---

## 🚀 كيفية الاستخدام

### 1. إرسال إشعار بسيط

```javascript
import { addNotification } from '@/lib/inAppNotifications';

// إشعار نصي
addNotification(
  'العنوان',
  'نص الرسالة',
  'success', // info | success | warning | error
  '/Page' // رابط اختياري
);
```

### 2. إرسال إشعار فوري

```javascript
import { sendLocalNotification } from '@/lib/pushNotifications';

sendLocalNotification(
  'العنوان',
  'نص الإشعار',
  {
    type: 'order',
    orderId: '12345'
  }
);
```

### 3. إرسال إشعار بحالة الطلب

```javascript
import { notifyOrderStatusChange } from '@/lib/notificationHelpers';

// تلقائياً يختار الرسالة والأيقونة المناسبة
notifyOrderStatusChange('ORD-12345', 'on_the_way');
```

### 4. الاستماع للإشعارات الجديدة

```javascript
useEffect(() => {
  const handleNewNotification = (event) => {
    console.log('إشعار جديد:', event.detail);
    // تحديث UI
  };
  
  window.addEventListener('wasel_notification_added', handleNewNotification);
  
  return () => {
    window.removeEventListener('wasel_notification_added', handleNewNotification);
  };
}, []);
```

---

## 📦 الحزم المستخدمة

```json
{
  "@capacitor/push-notifications": "^8.0.0", // ✅ مثبت
  "@capacitor/app": "^8.0.0",               // ✅ مثبت
  "framer-motion": "^11.x.x",               // للرسوم المتحركة
  "lucide-react": "^0.x.x"                  // للأيقونات
}
```

---

## 🎯 السيناريوهات المدعومة

| السيناريو | الملف | الوظيفة |
|-----------|------|---------|
| **إنشاء طلب** | Cart.jsx | `notifyOrderCreated()` |
| **تغيير حالة الطلب** | AdminOrders.jsx | `notifyOrderStatusChange()` |
| **رسالة دردشة** | OrderChat.jsx | `notifyNewChatMessage()` |
| **تذكير سلة** | App.jsx | `notifyCartReminder()` |
| **عرض خاص** | Home.jsx | `notifySpecialOffer()` |
| **نجاح الدفع** | Cart.jsx | `notifyPaymentSuccess()` |
| **إضافة للمفضلة** | ProductCard.jsx | `notifyProductAddedToFavorites()` |
| **نقاط الولاء** | Order.jsx | `notifyLoyaltyPoints()` |

---

## 🔔 أنواع الإشعارات

### 1. داخل التطبيق (In-App)
- ✅ لا تحتاج أذونات
- ✅ تعمل فوراً
- ✅ تُحفظ في LocalStorage
- ✅ يمكن مراجعتها في أي وقت
- ❌ تظهر فقط داخل التطبيق

### 2. الإشعارات الفورية (Push)
- ✅ تصل حتى لو التطبيق مغلق
- ✅ تدعم الصور والأصوات
- ✅ يمكن جدولتها
- ❌ تحتاج أذونات من المستخدم
- ❌ تحتاج إعداد Firebase للإشعارات عن بُعد

---

## 🛡️ الأذونات المطلوبة

### Android (android/app/src/main/AndroidManifest.xml)
```xml
<!-- تم إضافتها تلقائياً مع @capacitor/push-notifications -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="com.google.android.c2dm.permission.RECEIVE" />
```

---

## 📊 تخزين البيانات

### LocalStorage Keys:
- `wasel_in_app_notifications` - الإشعارات الداخلية (آخر 50)
- `wasel_device_token` - رمز الجهاز لـ FCM

### Events:
- `wasel_notification_added` - عند إضافة إشعار جديد
- `wasel_notifications_updated` - عند تحديث الإشعارات

---

## 🎨 التصميم

- **الألوان**:
  - 🔵 Info: `bg-blue-50 border-blue-500`
  - 🟢 Success: `bg-green-50 border-green-500`
  - 🟠 Warning: `bg-orange-50 border-orange-500`
  - 🔴 Error: `bg-red-50 border-red-500`

- **الأيقونات**:
  - Info: `<Info />`
  - Success: `<CheckCircle />`
  - Warning: `<AlertTriangle />`
  - Error: `<AlertCircle />`

---

## 🔧 الخطوات التالية (اختياري)

### لإعداد الإشعارات عن بُعد:

1. **إنشاء مشروع Firebase**
   - اذهب إلى [console.firebase.google.com](https://console.firebase.google.com)
   - أنشئ مشروع جديد
   - أضف تطبيق Android

2. **تحميل google-services.json**
   - ضعه في `android/app/`
   - راجع [FCM_SETUP_GUIDE.md](FCM_SETUP_GUIDE.md)

3. **تحديث build.gradle**
   ```gradle
   // في android/build.gradle
   classpath 'com.google.gms:google-services:4.4.0'
   
   // في android/app/build.gradle
   apply plugin: 'com.google.gms.google-services'
   ```

4. **إنشاء Supabase Edge Function**
   - راجع [FCM_SETUP_GUIDE.md](FCM_SETUP_GUIDE.md)
   - استخدم القوالب الجاهزة

---

## ✨ المميزات الإضافية

### تذكير تلقائي بسلة التسوق
```javascript
import { setupCartReminder } from '@/lib/notificationHelpers';

// في App.jsx أو Cart.jsx
useEffect(() => {
  setupCartReminder(); // يرسل إشعار بعد 30 دقيقة
}, []);
```

### إشعارات مُجدولة
```javascript
import { sendLocalNotification } from '@/lib/pushNotifications';

// إشعار بعد ساعة
sendLocalNotification(
  'لا تنسَ!',
  'لديك طلب في انتظار التأكيد',
  { scheduledAt: Date.now() + (60 * 60 * 1000) }
);
```

### Realtime Updates (Supabase)
راجع [ALTERNATIVE_NOTIFICATIONS.md](ALTERNATIVE_NOTIFICATIONS.md) للتفاصيل

---

## 📱 الاختبار

### 1. اختبار الإشعارات الداخلية
1. سجّل دخولك → ستظهر إشعار ترحيبي
2. اضغط على 🔔 في الهيدر → سترى الإشعارات
3. اضغط على إشعار → ينقلك للصفحة المناسبة

### 2. اختبار الإشعارات الفورية
1. امنح الأذونات عند الطلب
2. أنشئ طلب → ستصلك إشعار فوري
3. اغلق التطبيق → ستصلك الإشعارات في شريط الإشعارات

### 3. اختبار السيناريوهات
```javascript
// في console.log أو صفحة اختبار
import * as notifications from '@/lib/notificationHelpers';

// اختبار إنشاء طلب
notifications.notifyOrderCreated('ORD-TEST', 50000);

// اختبار تغيير الحالة
notifications.notifyOrderStatusChange('ORD-TEST', 'on_the_way');

// اختبار عرض خاص
notifications.notifySpecialOffer('بيتزا', 'خصم 30% على البيتزا', 30);
```

---

## 🐛 استكشاف الأخطاء

### المشكلة: الإشعارات لا تظهر
- **الحل**: تحقق من أذونات التطبيق في الإعدادات
- تأكد من استدعاء `initPushNotifications()` بعد تسجيل الدخول

### المشكلة: العداد لا يتحدث
- **الحل**: تأكد من استدعاء الأحداث `wasel_notifications_updated`
- راجع [Layout.jsx](src/Layout.jsx) للتأكد من useEffect

### المشكلة: الإشعارات الفورية لا تعمل
- **الحل**: تحقق من تثبيت `@capacitor/push-notifications`
- نفّذ: `npx cap sync android`

---

## 📞 الدعم

للمزيد من المساعدة، راجع:
- [PUSH_NOTIFICATIONS_EXAMPLES.js](PUSH_NOTIFICATIONS_EXAMPLES.js)
- [FCM_SETUP_GUIDE.md](FCM_SETUP_GUIDE.md)
- [ALTERNATIVE_NOTIFICATIONS.md](ALTERNATIVE_NOTIFICATIONS.md)

---

## ✅ الخلاصة

تم تنفيذ نظام إشعارات متكامل يشمل:

1. ✅ **الإشعارات الداخلية** - جاهزة للاستخدام فوراً
2. ✅ **الإشعارات الفورية** - تدعم المحلية (Local)
3. ✅ **صفحة الإشعارات** - بتصميم احترافي
4. ✅ **عداد في الهيدر** - يتحدث تلقائياً
5. ✅ **12 وظيفة مساعدة** - جاهزة لجميع السيناريوهات
6. ✅ **تكامل مع Cart** - إشعارات تلقائية عند الطلب
7. ✅ **تكامل مع تسجيل الدخول** - إشعار ترحيبي
8. 📄 **أدلة شاملة** - 3 ملفات توثيق

**جاهز للاستخدام! 🚀**
