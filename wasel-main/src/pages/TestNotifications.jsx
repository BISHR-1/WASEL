/**
 * صفحة اختبار الإشعارات
 * Test Notifications Page
 * 
 * يمكنك استخدام هذه الصفحة لاختبار جميع أنواع الإشعارات
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Send, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { addNotification } from '@/lib/inAppNotifications';
import { sendLocalNotification } from '@/lib/pushNotifications';
import * as notificationHelpers from '@/lib/notificationHelpers';

export default function TestNotifications() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [actionUrl, setActionUrl] = useState('');

  const handleSendInApp = () => {
    if (!title || !message) {
      alert('الرجاء إدخال العنوان والرسالة');
      return;
    }
    
    addNotification(title, message, type, actionUrl || null);
    alert('تم إرسال الإشعار الداخلي!');
  };

  const handleSendPush = async () => {
    if (!title || !message) {
      alert('الرجاء إدخال العنوان والرسالة');
      return;
    }
    
    try {
      await sendLocalNotification(title, message, { type });
      alert('تم إرسال الإشعار الفوري!');
    } catch (error) {
      alert('فشل إرسال الإشعار الفوري: ' + error.message);
    }
  };

  const testScenarios = [
    {
      name: 'طلب جديد',
      action: () => notificationHelpers.notifyOrderCreated('ORD-TEST-123', 75000)
    },
    {
      name: 'طلب قيد التوصيل',
      action: () => notificationHelpers.notifyOrderStatusChange('ORD-TEST-123', 'on_the_way')
    },
    {
      name: 'طلب تم توصيله',
      action: () => notificationHelpers.notifyOrderStatusChange('ORD-TEST-123', 'delivered')
    },
    {
      name: 'رسالة دردشة',
      action: () => notificationHelpers.notifyNewChatMessage('123', 'المطعم', 'طلبك جاهز!')
    },
    {
      name: 'تذكير سلة',
      action: () => notificationHelpers.notifyCartReminder(3, 45000)
    },
    {
      name: 'عرض خاص',
      action: () => notificationHelpers.notifySpecialOffer('بيتزا مارغريتا', 'خصم 30% على جميع أنواع البيتزا', 30)
    },
    {
      name: 'إضافة للمفضلة',
      action: () => notificationHelpers.notifyProductAddedToFavorites('برغر اللحم')
    },
    {
      name: 'نجاح الدفع',
      action: () => notificationHelpers.notifyPaymentSuccess('ORD-TEST-123', 75000)
    },
    {
      name: 'فشل الدفع',
      action: () => notificationHelpers.notifyPaymentIssue('ORD-TEST-123', 'رصيد غير كافي')
    },
    {
      name: 'عنوان جديد',
      action: () => notificationHelpers.notifyAddressAdded('المنزل')
    },
    {
      name: 'تحديث التطبيق',
      action: () => notificationHelpers.notifyAppUpdate('2.0.0')
    },
    {
      name: 'تذكير تقييم',
      action: () => notificationHelpers.notifyRatingReminder('ORD-TEST-123')
    },
    {
      name: 'نقاط الولاء',
      action: () => notificationHelpers.notifyLoyaltyPoints(50, 'مكافأة طلب جديد')
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-100 to-gray-200 pt-6 pb-8 px-4 rounded-b-[2rem] shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <TestTube className="w-8 h-8 text-blue-500" />
            اختبار الإشعارات
          </h1>
          <p className="text-gray-600 mt-2">
            اختبر جميع أنواع الإشعارات في التطبيق
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        
        {/* إرسال إشعار مخصص */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-md"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Send className="w-6 h-6 text-blue-500" />
            إرسال إشعار مخصص
          </h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">العنوان</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="عنوان الإشعار"
              />
            </div>
            
            <div>
              <Label htmlFor="message">الرسالة</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="نص الإشعار"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="type">النوع</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">معلومات (Info)</SelectItem>
                  <SelectItem value="success">نجاح (Success)</SelectItem>
                  <SelectItem value="warning">تحذير (Warning)</SelectItem>
                  <SelectItem value="error">خطأ (Error)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="actionUrl">رابط الإجراء (اختياري)</Label>
              <Input
                id="actionUrl"
                value={actionUrl}
                onChange={(e) => setActionUrl(e.target.value)}
                placeholder="/Page"
              />
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={handleSendInApp}
                className="flex-1 bg-blue-500 hover:bg-blue-600"
              >
                <Bell className="w-4 h-4 mr-2" />
                إشعار داخلي
              </Button>
              
              <Button
                onClick={handleSendPush}
                className="flex-1 bg-purple-500 hover:bg-purple-600"
              >
                <Send className="w-4 h-4 mr-2" />
                إشعار فوري
              </Button>
            </div>
          </div>
        </motion.div>

        {/* السيناريوهات الجاهزة */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-md"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TestTube className="w-6 h-6 text-green-500" />
            السيناريوهات الجاهزة
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {testScenarios.map((scenario, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={scenario.action}
                className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-blue-100 hover:border-blue-300 transition-all hover:shadow-md"
              >
                <p className="text-sm font-bold text-gray-800 text-center">
                  {scenario.name}
                </p>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ملاحظات */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200"
        >
          <h3 className="text-lg font-bold text-blue-800 mb-2">📝 ملاحظات</h3>
          <ul className="text-sm text-blue-700 space-y-2">
            <li>• <strong>الإشعارات الداخلية</strong>: تظهر داخل التطبيق فقط</li>
            <li>• <strong>الإشعارات الفورية</strong>: تحتاج أذونات وتظهر في شريط الإشعارات</li>
            <li>• يمكنك مراجعة جميع الإشعارات من صفحة "الإشعارات" 🔔</li>
            <li>• اضغط على الإشعار للانتقال للصفحة المرتبطة به</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
