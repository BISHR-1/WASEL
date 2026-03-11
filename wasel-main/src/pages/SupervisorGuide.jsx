// =====================================================
// WASEL - SUPERVISOR GUIDE PAGE
// File: src/pages/SupervisorGuide.jsx
// =====================================================
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ShieldCheck, ClipboardList, Users, Bell,
  CheckCircle, Settings, Truck, Package, FileDown,
  MessageCircle, BarChart3, Zap, AlertTriangle,
  UserPlus, RefreshCcw, Eye, MapPin, Clock, Star
} from 'lucide-react';
import AppFooter from '@/components/common/AppFooter';

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

const sections = [
  {
    icon: ClipboardList,
    title: 'إدارة الطلبات',
    items: [
      'جميع الطلبات الواردة تظهر تلقائيًا في لوحة المشرف',
      'يمكنك فلترة الطلبات حسب الحالة (معلّق، قيد التجهيز، جاري التوصيل، مكتمل)',
      'ابحث بالاسم أو رقم الهاتف أو رقم الطلب',
      'اضغط "التفاصيل" لعرض معلومات الطلب كاملة',
    ],
    color: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    icon: Truck,
    title: 'فرز الطلبات للموصلين',
    items: [
      'اختر الموصل المناسب من القائمة المنسدلة في كل طلب',
      'اضغط "فرز + إشعار" لتعيين الطلب وإرسال إشعار فوري للموصل',
      'يمكنك تبديل الموصل في أي وقت أو إلغاء الفرز',
      'حدد وقت التوصيل المطلوب للموصل',
    ],
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  {
    icon: RefreshCcw,
    title: 'تحديث حالة الطلبات',
    items: [
      'غيّر حالة الطلب من القائمة المنسدلة (معلّق ← قيد التجهيز ← جاري التوصيل ← مكتمل)',
      'عند تغيير الحالة، يتم إرسال إشعار تلقائي للعميل',
      'يمكنك إلغاء الطلب إذا لزم الأمر أو حذفه نهائيًا',
    ],
    color: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  {
    icon: Users,
    title: 'إدارة الموصلين',
    items: [
      'قسم الموصلين يعرض جميع الموصلين المسجلين مع بياناتهم',
      'تابع حالة كل موصل (متاح/غير متاح) ونوع مركبته',
      'راجع عدد الطلبات المكتملة ورصيد الأرباح',
      'يمكنك إعادة تعيين كلمة مرور أي موصل',
    ],
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
  },
  {
    icon: Star,
    title: 'إدارة العضويات',
    items: [
      'تفعيل أو إيقاف عضويات Wasel+ للعملاء',
      'تعديل تواريخ بداية ونهاية العضوية',
      'إضافة أوسمة ومميزات خاصة للأعضاء',
    ],
    color: 'from-pink-500 to-rose-600',
    bg: 'bg-pink-50',
    border: 'border-pink-200',
  },
];

const quickActions = [
  { icon: FileDown, label: 'تحميل فاتورة', desc: 'اضغط زر "الفاتورة" في أي طلب' },
  { icon: MessageCircle, label: 'واتساب المستلم', desc: 'تواصل مباشر مع العميل' },
  { icon: Bell, label: 'الإشعارات', desc: 'تصلك تنبيهات فورية للطلبات الجديدة' },
  { icon: Settings, label: 'سعر الصرف', desc: 'حدّث سعر صرف الدولار يدويًا' },
];

export default function SupervisorGuide() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EFF6FF] via-white to-[#EFF6FF] pb-24" dir="rtl">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1E3A5F] via-[#1B4332] to-[#2D6A4F] py-16 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-blue-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <button
            onClick={() => navigate(-1)}
            className="absolute top-0 left-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <motion.div {...fadeUp}>
            <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
              دليل المشرف
            </h1>
            <p className="text-white/80 text-lg max-w-xl mx-auto">
              دليلك الشامل لإدارة الطلبات والموصلين بكفاءة عالية
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Sections */}
      <div className="max-w-3xl mx-auto px-4 -mt-8 space-y-5">
        {sections.map((section, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`${section.bg} rounded-2xl p-5 border ${section.border} shadow-sm`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center shadow-lg`}>
                <section.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-black text-gray-900 text-lg">{section.title}</h3>
            </div>
            <ul className="space-y-2">
              {section.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="max-w-3xl mx-auto px-4 mt-10">
        <motion.div {...fadeUp} transition={{ delay: 0.4 }}>
          <h2 className="text-2xl font-black text-[#1B4332] mb-5 flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-500" />
            إجراءات سريعة
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map((action, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
                <div className="w-11 h-11 bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] rounded-xl flex items-center justify-center mx-auto mb-3 shadow">
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-bold text-gray-900 text-sm mb-1">{action.label}</h4>
                <p className="text-xs text-gray-500">{action.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Daily Workflow */}
      <div className="max-w-3xl mx-auto px-4 mt-10">
        <motion.div {...fadeUp} transition={{ delay: 0.5 }}>
          <h2 className="text-2xl font-black text-[#1B4332] mb-5 flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-500" />
            سير العمل اليومي
          </h2>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="space-y-4">
              {[
                { step: '1', text: 'افتح لوحة المشرف وراجع الطلبات الجديدة', icon: Eye },
                { step: '2', text: 'فرز كل طلب جديد للموصل المناسب حسب الموقع', icon: MapPin },
                { step: '3', text: 'تابع حالة التوصيل وتواصل مع الموصل عند الحاجة', icon: MessageCircle },
                { step: '4', text: 'تأكد من اكتمال جميع الطلبات وإغلاقها بنهاية اليوم', icon: CheckCircle },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] flex items-center justify-center text-white font-black text-sm shadow shrink-0">
                    {item.step}
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <item.icon className="w-4 h-4 text-gray-400 shrink-0" />
                    <p className="text-sm text-gray-700 font-medium">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Important Notes */}
      <div className="max-w-3xl mx-auto px-4 mt-10">
        <motion.div {...fadeUp} transition={{ delay: 0.6 }}>
          <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-amber-800">تذكيرات مهمة</h3>
            </div>
            <ul className="space-y-2 text-sm text-amber-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />
                تأكد من تحديث سعر الصرف بشكل دوري لضمان دقة الأسعار
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />
                راجع العضويات المنتهية وتواصل مع العملاء لتجديدها
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />
                تابع أداء الموصلين وقدّم ملاحظات بناءة
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />
                في حال وجود شكوى من عميل، تعامل معها فورًا وأبلغ الإدارة
              </li>
            </ul>
          </div>
        </motion.div>
      </div>

      <AppFooter />
    </div>
  );
}
