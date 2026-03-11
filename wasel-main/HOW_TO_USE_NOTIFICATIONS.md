# 🔔 نظام الإشعارات - استخدام عملي

## كيف ترسل إشعار في 3 أسطر؟

```javascript
import { addNotification } from '@/lib/inAppNotifications';

addNotification('العنوان', 'الرسالة', 'success', '/Page');
```

---

## 📌 الأمثلة الشائعة

### 1. إشعار بطلب جديد
```javascript
import { notifyOrderCreated } from '@/lib/notificationHelpers';

notifyOrderCreated('ORD-12345', 75000);
// النتيجة: "تم إنشاء طلبك بنجاح! 🎉"
//          "طلب رقم #ORD-12345 بقيمة 75000 SYP"
```

### 2. إشعار بحالة الطلب
```javascript
import { notifyOrderStatusChange } from '@/lib/notificationHelpers';

// خيارات: pending, confirmed, preparing, on_the_way, delivered, cancelled
notifyOrderStatusChange('ORD-12345', 'on_the_way');
// النتيجة: "طلبك في الطريق إليك! 🚗"
```

### 3. إشعار برسالة دردشة
```javascript
import { notifyNewChatMessage } from '@/lib/notificationHelpers';

notifyNewChatMessage('order-123', 'المطعم', 'طلبك جاهز!');
```

### 4. إشعار بعرض خاص
```javascript
import { notifySpecialOffer } from '@/lib/notificationHelpers';

notifySpecialOffer('بيتزا مارغريتا', 'خصم 30% لفترة محدودة', 30);
```

### 5. إشعار بنجاح الدفع
```javascript
import { notifyPaymentSuccess } from '@/lib/notificationHelpers';

notifyPaymentSuccess('ORD-12345', 75000);
```

---

## 🎨 أنواع الإشعارات

```javascript
import { addNotification } from '@/lib/inAppNotifications';

// معلومات (أزرق)
addNotification('معلومة', 'نص المعلومة', 'info');

// نجاح (أخضر)
addNotification('نجح!', 'تمت العملية بنجاح', 'success');

// تحذير (برتقالي)
addNotification('انتبه', 'هذا تحذير', 'warning');

// خطأ (أحمر)
addNotification('خطأ!', 'حدث خطأ ما', 'error');
```

---

## 🔗 إضافة رابط

```javascript
// عند الضغط على الإشعار، ينتقل للصفحة المحددة
addNotification(
  'طلب جديد',
  'طلب #12345 تم إنشاؤه',
  'success',
  '/Order?id=12345' // الرابط
);
```

---

## 📄 الصفحات

- **/Notifications** - عرض جميع الإشعارات
- **/TestNotifications** - اختبار الإشعارات

---

## 🚀 استخدام في المكونات

### في Cart.jsx (عند إتمام الطلب):
```javascript
import { notifyOrderCreated, notifyPaymentSuccess } from '@/lib/notificationHelpers';

// بعد إنشاء الطلب
notifyOrderCreated(order.order_number, order.total_amount);
notifyPaymentSuccess(order.order_number, order.total_amount);
```

### في AdminOrders.jsx (عند تغيير الحالة):
```javascript
import { notifyOrderStatusChange } from '@/lib/notificationHelpers';

const handleStatusChange = (orderId, newStatus) => {
  // حدّث الحالة في قاعدة البيانات...
  
  // أرسل إشعار
  notifyOrderStatusChange(orderId, newStatus);
};
```

### في ProductCard.jsx (عند إضافة للمفضلة):
```javascript
import { notifyProductAddedToFavorites } from '@/lib/notificationHelpers';

const handleAddToFavorites = () => {
  // أضف للمفضلة...
  
  // أرسل إشعار
  notifyProductAddedToFavorites(product.name);
};
```

---

## 📊 الوظائف المتاحة

| الوظيفة | الاستخدام |
|---------|-----------|
| `addNotification()` | إشعار مخصص |
| `notifyOrderCreated()` | طلب جديد |
| `notifyOrderStatusChange()` | تغيير حالة |
| `notifyNewChatMessage()` | رسالة دردشة |
| `notifyCartReminder()` | تذكير سلة |
| `notifySpecialOffer()` | عرض خاص |
| `notifyProductAddedToFavorites()` | إضافة للمفضلة |
| `notifyPaymentIssue()` | مشكلة دفع |
| `notifyPaymentSuccess()` | نجاح الدفع |
| `notifyAddressAdded()` | عنوان جديد |
| `notifyAppUpdate()` | تحديث التطبيق |
| `notifyRatingReminder()` | تذكير تقييم |
| `notifyLoyaltyPoints()` | نقاط الولاء |

---

## 🔔 العداد في الهيدر

العداد يتحدث تلقائياً! لا تحتاج فعل أي شيء.

عند إرسال إشعار جديد:
- ✅ يظهر في صفحة الإشعارات
- ✅ يزيد العداد في الهيدر
- ✅ يتحدث تلقائياً عند قراءة الإشعارات

---

## 📚 للمزيد

- **الدليل الكامل**: [NOTIFICATIONS_SYSTEM_GUIDE.md](NOTIFICATIONS_SYSTEM_GUIDE.md)
- **البدء السريع**: [QUICK_START_NOTIFICATIONS.md](QUICK_START_NOTIFICATIONS.md)
- **ملخص التنفيذ**: [NOTIFICATIONS_IMPLEMENTATION_SUMMARY.md](NOTIFICATIONS_IMPLEMENTATION_SUMMARY.md)

---

## ✨ جاهز للاستخدام!

افتح `/TestNotifications` وجرّب بنفسك! 🚀
