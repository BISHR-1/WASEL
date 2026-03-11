# طرق بديلة لإرسال الإشعارات

## 1. إشعارات البريد الإلكتروني 📧

### استخدام Supabase Auth لإرسال الإيميلات:

```javascript
import { supabase } from '@/lib/supabase';

async function sendEmailNotification(email, subject, message) {
  // طريقة 1: استخدام Resend (مدمج مع Supabase)
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: {
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2>${subject}</h2>
          <p>${message}</p>
          <br/>
          <p>مع تحيات فريق واصل 💙</p>
        </div>
      `
    }
  });

  return data;
}

// استخدام:
await sendEmailNotification(
  'user@example.com',
  'تم تأكيد طلبك',
  'طلبك #12345 تم تأكيده وسيصلك قريباً'
);
```

### قالب HTML احترافي للإيميلات:

```javascript
function getOrderEmailTemplate(orderNumber, status, items) {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Arial', sans-serif; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; }
    .header { text-align: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    .status { display: inline-block; padding: 10px 20px; border-radius: 20px; background: #4ade80; color: white; }
    .items { margin: 20px 0; }
    .item { padding: 10px; border-bottom: 1px solid #eee; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>واصل || Wasel</h1>
      <p>نوصل حبك لحد الباب 💙</p>
    </div>
    
    <div style="padding: 20px;">
      <h2>تحديث الطلب #${orderNumber}</h2>
      <p>حالة الطلب: <span class="status">${status}</span></p>
      
      <div class="items">
        <h3>تفاصيل الطلب:</h3>
        ${items.map(item => `
          <div class="item">
            <strong>${item.name}</strong> - الكمية: ${item.quantity}
          </div>
        `).join('')}
      </div>
      
      <p style="margin-top: 20px;">
        يمكنك تتبع طلبك من التطبيق في أي وقت.
      </p>
    </div>
    
    <div class="footer">
      <p>شكراً لاختيارك واصل</p>
      <p>للتواصل: support@wasel.app</p>
    </div>
  </div>
</body>
</html>
  `;
}
```

---

## 2. إشعارات SMS 📱

### استخدام Twilio لإرسال الرسائل النصية:

```javascript
// في Supabase Edge Function

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')!

serve(async (req) => {
  try {
    const { phoneNumber, message } = await req.json()

    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          To: phoneNumber,
          From: TWILIO_PHONE_NUMBER,
          Body: message
        })
      }
    )

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

### استخدام من التطبيق:

```javascript
async function sendSMSNotification(phoneNumber, message) {
  const { data, error } = await supabase.functions.invoke('send-sms', {
    body: {
      phoneNumber: phoneNumber,
      message: message
    }
  });

  if (error) {
    console.error('Error sending SMS:', error);
    return false;
  }

  console.log('SMS sent:', data);
  return true;
}

// مثال: إرسال SMS عند تأكيد الطلب
await sendSMSNotification(
  '+963987654321',
  'مرحباً! تم تأكيد طلبك #12345 في واصل. سيصلك خلال 30 دقيقة 🚗'
);
```

---

## 3. إشعارات داخل التطبيق (In-App Notifications) 🔔

### إنشاء نظام إشعارات داخلي:

```javascript
// src/lib/inAppNotifications.js

/**
 * إضافة إشعار داخل التطبيق
 */
export function addNotification(title, message, type = 'info', actionUrl = null) {
  const notifications = getNotifications();
  
  const newNotification = {
    id: Date.now().toString(),
    title,
    message,
    type, // 'info', 'success', 'warning', 'error'
    actionUrl,
    read: false,
    createdAt: new Date().toISOString()
  };
  
  notifications.unshift(newNotification);
  
  // احفظ آخر 50 إشعار فقط
  const limited = notifications.slice(0, 50);
  localStorage.setItem('wasel_in_app_notifications', JSON.stringify(limited));
  
  // إظهار toast
  if (window.toast) {
    window.toast(message, { title, type });
  }
  
  return newNotification;
}

/**
 * جلب جميع الإشعارات
 */
export function getNotifications() {
  const stored = localStorage.getItem('wasel_in_app_notifications');
  return stored ? JSON.parse(stored) : [];
}

/**
 * عدد الإشعارات غير المقروءة
 */
export function getUnreadCount() {
  const notifications = getNotifications();
  return notifications.filter(n => !n.read).length;
}

/**
 * تحديد إشعار كمقروء
 */
export function markAsRead(notificationId) {
  const notifications = getNotifications();
  const updated = notifications.map(n => 
    n.id === notificationId ? { ...n, read: true } : n
  );
  localStorage.setItem('wasel_in_app_notifications', JSON.stringify(updated));
}

/**
 * تحديد جميع الإشعارات كمقروءة
 */
export function markAllAsRead() {
  const notifications = getNotifications();
  const updated = notifications.map(n => ({ ...n, read: true }));
  localStorage.setItem('wasel_in_app_notifications', JSON.stringify(updated));
}

/**
 * حذف إشعار
 */
export function deleteNotification(notificationId) {
  const notifications = getNotifications();
  const filtered = notifications.filter(n => n.id !== notificationId);
  localStorage.setItem('wasel_in_app_notifications', JSON.stringify(filtered));
}

/**
 * مسح جميع الإشعارات
 */
export function clearAllNotifications() {
  localStorage.removeItem('wasel_in_app_notifications');
}
```

### إنشاء صفحة الإشعارات:

```jsx
// src/pages/Notifications.jsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, Trash2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications
} from '@/lib/inAppNotifications';

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    setNotifications(getNotifications());
    setUnreadCount(getUnreadCount());
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    loadNotifications();
    
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-100 to-gray-200 pt-6 pb-8 px-4 rounded-b-[2rem] shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Bell className="w-8 h-8 text-blue-500" />
              الإشعارات
              {unreadCount > 0 && (
                <span className="px-3 py-1 bg-red-500 text-white text-sm rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
            {notifications.length > 0 && (
              <button
                onClick={() => {
                  markAllAsRead();
                  loadNotifications();
                }}
                className="text-sm text-blue-600 font-medium"
              >
                تحديد الكل كمقروء
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        {notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800">
              لا توجد إشعارات
            </h2>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleNotificationClick(notification)}
                className={`bg-white rounded-2xl p-4 shadow-md cursor-pointer transition-all hover:shadow-lg ${
                  !notification.read ? 'border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 mb-1">
                      {notification.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(notification.createdAt).toLocaleString('ar-EG')}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                      loadNotifications();
                    }}
                    className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### إضافة رابط الإشعارات في الهيدر:

```jsx
// في Layout.jsx أو Header:

import { Bell } from 'lucide-react';
import { getUnreadCount } from '@/lib/inAppNotifications';

function NotificationBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(getUnreadCount());
    
    // تحديث العدد كل 30 ثانية
    const interval = setInterval(() => {
      setCount(getUnreadCount());
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <button 
      onClick={() => navigate('/Notifications')}
      className="relative"
    >
      <Bell className="w-6 h-6" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
}
```

---

## 4. Real-time Notifications (Supabase Realtime)

### الاستماع للتحديثات في الوقت الفعلي:

```javascript
import { supabase } from '@/lib/supabase';
import { addNotification } from '@/lib/inAppNotifications';

/**
 * الاستماع لتحديثات الطلبات
 */
export function subscribeToOrderUpdates(userId) {
  const subscription = supabase
    .channel('order_updates')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('Order updated:', payload);
        
        const order = payload.new;
        
        // إضافة إشعار داخل التطبيق
        addNotification(
          'تحديث الطلب',
          `طلبك #${order.order_number} تم تحديثه`,
          'info',
          `/Order?id=${order.id}`
        );
      }
    )
    .subscribe();

  return subscription;
}

// استخدام في App.jsx:
useEffect(() => {
  const userId = localStorage.getItem('wasel_user_id');
  if (userId) {
    const sub = subscribeToOrderUpdates(userId);
    return () => {
      sub.unsubscribe();
    };
  }
}, []);
```

---

## ملخص الطرق المتاحة

| الطريقة | الاستخدام | المميزات | العيوب |
|---------|-----------|-----------|---------|
| **Push Notifications** | إشعارات فورية | تصل حتى لو التطبيق مغلق | تحتاج إعداد Firebase |
| **Email** | إشعارات رسمية | احترافية، تصل للجميع | قد لا تُقرأ فوراً |
| **SMS** | إشعارات عاجلة | تصل فوراً | مكلفة |
| **In-App** | إشعارات داخلية | سهلة التنفيذ | فقط عند فتح التطبيق |
| **Realtime** | تحديثات لحظية | فورية | تحتاج اتصال إنترنت |

---

## أفضل ممارسات

1. **استخدم مزيج من الطرق**: Push + In-App للإشعارات المهمة
2. **احترم إعدادات المستخدم**: تحقق من تفعيل الإشعارات
3. **لا ترسل كثيراً**: اجمع الإشعارات المتشابهة
4. **اجعلها قابلة للإجراء**: أضف روابط لصفحات معينة
5. **اختبر جيداً**: جرّب على أجهزة مختلفة
