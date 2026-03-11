/**
 * أمثلة عملية لإرسال الإشعارات في التطبيق
 * Practical Notification Examples
 */

import { addNotification } from '@/lib/inAppNotifications';
import { sendLocalNotification } from '@/lib/pushNotifications';

/**
 * 1. إشعار عند إنشاء طلب جديد
 */
export function notifyOrderCreated(orderNumber, totalAmount) {
  // إشعار داخل التطبيق
  addNotification(
    'تم إنشاء طلبك بنجاح! 🎉',
    `طلب رقم #${orderNumber} بقيمة ${totalAmount} SYP`,
    'success',
    `/Order?id=${orderNumber}`
  );
  
  // إشعار فوري (Push)
  try {
    sendLocalNotification(
      'طلبك في الطريق! 🚗',
      `طلب #${orderNumber} تم تأكيده وسيصلك قريباً`,
      {
        type: 'order',
        orderId: orderNumber,
        action: 'view_order'
      }
    );
  } catch (error) {
    console.warn('Push notification failed:', error);
  }
}

/**
 * 2. إشعار عند تغيير حالة الطلب
 */
export function notifyOrderStatusChange(orderNumber, status) {
  const statusMessages = {
    'pending': {
      title: 'طلبك قيد المراجعة ⏳',
      message: `طلب #${orderNumber} في انتظار التأكيد`,
      type: 'info'
    },
    'confirmed': {
      title: 'تم تأكيد طلبك ✅',
      message: `طلب #${orderNumber} تم تأكيده وجاري تجهيزه`,
      type: 'success'
    },
    'preparing': {
      title: 'جاري تجهيز طلبك 👨‍🍳',
      message: `طلب #${orderNumber} قيد التجهيز`,
      type: 'info'
    },
    'on_the_way': {
      title: 'طلبك في الطريق إليك! 🚗',
      message: `المندوب في طريقه لتوصيل طلب #${orderNumber}`,
      type: 'info'
    },
    'delivered': {
      title: 'تم توصيل طلبك! 🎉',
      message: `طلب #${orderNumber} وصل بنجاح. نتمنى أن تستمتع به!`,
      type: 'success'
    },
    'cancelled': {
      title: 'تم إلغاء الطلب ❌',
      message: `طلب #${orderNumber} تم إلغاؤه`,
      type: 'error'
    }
  };

  const statusData = statusMessages[status] || statusMessages['pending'];
  
  addNotification(
    statusData.title,
    statusData.message,
    statusData.type,
    `/Order?id=${orderNumber}`
  );

  // إشعار فوري للحالات المهمة
  if (['on_the_way', 'delivered'].includes(status)) {
    try {
      sendLocalNotification(
        statusData.title,
        statusData.message,
        {
          type: 'order_status',
          orderId: orderNumber,
          status: status
        }
      );
    } catch (error) {
      console.warn('Push notification failed:', error);
    }
  }
}

/**
 * 3. إشعار عند استلام رسالة جديدة في الدردشة
 */
export function notifyNewChatMessage(orderId, senderName, message) {
  addNotification(
    `رسالة جديدة من ${senderName} 💬`,
    message.length > 50 ? message.substring(0, 50) + '...' : message,
    'info',
    `/OrderChat?orderId=${orderId}`
  );

  try {
    sendLocalNotification(
      `${senderName} أرسل رسالة`,
      message,
      {
        type: 'chat_message',
        orderId: orderId,
        sender: senderName
      }
    );
  } catch (error) {
    console.warn('Push notification failed:', error);
  }
}

/**
 * 4. تذكير بعربة التسوق
 */
export function notifyCartReminder(itemsCount, totalAmount) {
  addNotification(
    'لديك منتجات في سلة التسوق! 🛒',
    `${itemsCount} منتج بقيمة ${totalAmount} SYP في انتظارك`,
    'info',
    '/Cart'
  );
}

/**
 * 5. إشعار بعرض خاص
 */
export function notifySpecialOffer(title, description, discountPercent) {
  addNotification(
    `${title} 🎁`,
    description,
    'success',
    '/Home'
  );

  try {
    sendLocalNotification(
      `خصم ${discountPercent}% على ${title}`,
      description,
      {
        type: 'special_offer',
        title: title
      }
    );
  } catch (error) {
    console.warn('Push notification failed:', error);
  }
}

/**
 * 6. إشعار عند إضافة منتج للمفضلة
 */
export function notifyProductAddedToFavorites(productName) {
  addNotification(
    'تمت الإضافة للمفضلة ❤️',
    `تم إضافة "${productName}" إلى قائمة المفضلة`,
    'success',
    '/Favorites'
  );
}

/**
 * 7. إشعار عند وجود مشكلة في الدفع
 */
export function notifyPaymentIssue(orderId, reason) {
  addNotification(
    'فشلت عملية الدفع ❌',
    reason || 'حدثت مشكلة في معالجة الدفع',
    'error',
    `/Cart`
  );
}

/**
 * 8. إشعار عند نجاح الدفع
 */
export function notifyPaymentSuccess(orderId, amount) {
  addNotification(
    'تم الدفع بنجاح! ✅',
    `تم استلام دفعة بقيمة ${amount} SYP لطلب #${orderId}`,
    'success',
    `/Order?id=${orderId}`
  );
}

/**
 * 9. إشعار عند إضافة عنوان جديد
 */
export function notifyAddressAdded(addressLabel) {
  addNotification(
    'تم حفظ العنوان ✅',
    `تم إضافة عنوان "${addressLabel}" بنجاح`,
    'success',
    '/MyAddresses'
  );
}

/**
 * 10. إشعار بتحديث التطبيق
 */
export function notifyAppUpdate(version) {
  addNotification(
    'تحديث جديد متاح! 🎉',
    `الإصدار ${version} متاح الآن مع ميزات جديدة`,
    'info',
    null
  );
}

/**
 * 11. إشعار تذكير بتقييم الطلب
 */
export function notifyRatingReminder(orderId) {
  addNotification(
    'قيّم تجربتك معنا ⭐',
    'نود سماع رأيك! قيّم آخر طلب لك',
    'info',
    `/Order?id=${orderId}`
  );
}

/**
 * 12. إشعار بنقاط الولاء
 */
export function notifyLoyaltyPoints(points, reason) {
  addNotification(
    `حصلت على ${points} نقطة! 🎁`,
    reason || 'استمر في التسوق لتحصل على المزيد',
    'success',
    '/LoyaltyProgram'
  );
}

/**
 * مثال: استخدام في صفحة Cart عند إتمام الطلب
 */
export function handleOrderSubmit(orderData) {
  // بعد إنشاء الطلب بنجاح
  notifyOrderCreated(orderData.orderNumber, orderData.totalAmount);
  
  // إشعار بنقاط الولاء إذا كانت متاحة
  if (orderData.loyaltyPoints > 0) {
    setTimeout(() => {
      notifyLoyaltyPoints(
        orderData.loyaltyPoints,
        `حصلت على نقاط من طلبك #${orderData.orderNumber}`
      );
    }, 2000);
  }
}

/**
 * مثال: استخدام في AdminOrders عند تغيير حالة الطلب
 */
export function handleAdminStatusUpdate(orderId, newStatus) {
  notifyOrderStatusChange(orderId, newStatus);
}

/**
 * مثال: تذكير تلقائي بسلة التسوق بعد 30 دقيقة
 */
export function setupCartReminder() {
  // التحقق من وجود منتجات في السلة
  const cartItems = JSON.parse(localStorage.getItem('wasel_cart') || '[]');
  
  if (cartItems.length > 0) {
    const totalAmount = cartItems.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );
    
    // جدولة الإشعار بعد 30 دقيقة
    setTimeout(() => {
      notifyCartReminder(cartItems.length, totalAmount);
    }, 30 * 60 * 1000); // 30 دقيقة
  }
}

/**
 * طلب إذن الإشعارات من المستخدم
 */
export async function requestNotificationPermission() {
  // التحقق إذا كنا على منصة native (Android/iOS)
  try {
    const capacitor = window['Capacitor'];
    if (capacitor && typeof capacitor.isNativePlatform === 'function' && capacitor.isNativePlatform()) {
      // استخدام Capacitor Push Notifications
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const permStatus = await PushNotifications.requestPermissions();
      return permStatus.receive;
    }
  } catch (e) {
    console.log('Native push notifications not available:', e);
  }
  
  // المتصفح - التحقق من دعم الإشعارات
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (e) {
      console.log('Browser notifications not available:', e);
    }
  }
  
  return 'unsupported';
}
