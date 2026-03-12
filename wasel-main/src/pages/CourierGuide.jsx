// =====================================================
// WASEL - COURIER GUIDE PAGE
// File: src/pages/CourierGuide.jsx
// =====================================================
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Truck, MapPin, Phone, Clock, Shield,
  CheckCircle, Star, DollarSign, Users, Bell,
  Package, Camera, Navigation, Award, Zap,
  BookOpen, MessageCircle, AlertTriangle
} from 'lucide-react';

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

const steps = [
  {
    icon: BookOpen,
    title: 'التسجيل وإكمال البيانات',
    desc: 'سجّل حسابك عبر رابط الدعوة أو صفحة تسجيل الموظفين، ثم أكمل بياناتك الشخصية ونوع المركبة والموقع.',
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50',
  },
  {
    icon: Bell,
    title: 'استقبال الطلبات',
    desc: 'عند فرز طلب لك من قبل المشرف، ستصلك إشعارات فورية على هاتفك. افتح لوحة الموصل لرؤية تفاصيل الطلب.',
    color: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50',
  },
  {
    icon: Navigation,
    title: 'التوجه للاستلام',
    desc: 'تحقق من عنوان المتجر أو المطعم، واتصل بالمرسل للتنسيق. غيّر حالة الطلب إلى "جاري التوصيل" عند الانطلاق.',
    color: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-50',
  },
  {
    icon: Package,
    title: 'التسليم والتوثيق',
    desc: 'سلّم الطلب للمستلم وتأكد من رضاه. ارفع إثبات التسليم (صورة) ثم غيّر الحالة إلى "تم الاستلام".',
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50',
  },
  {
    icon: DollarSign,
    title: 'استلام الأرباح',
    desc: 'تتراكم أرباحك مع كل توصيل. يمكنك طلب صرف الأرباح حسب دورة الصرف المحددة (أسبوعي أو شهري).',
    color: 'from-green-500 to-emerald-600',
    bg: 'bg-green-50',
  },
];

const tips = [
  { icon: Clock, text: 'كن دقيقًا في المواعيد — التأخير يؤثر على تقييمك' },
  { icon: Phone, text: 'تواصل مع المستلم قبل الوصول لتجنب الانتظار' },
  { icon: Camera, text: 'وثّق كل تسليم بصورة واضحة كإثبات' },
  { icon: Shield, text: 'حافظ على سلامة المنتجات أثناء النقل' },
  { icon: MapPin, text: 'تأكد من العنوان بدقة قبل الانطلاق' },
  { icon: MessageCircle, text: 'كن لبقًا مع العملاء — خدمتك تمثل واصل' },
];

const earnings = [
  { label: 'عمولة التوصيل', value: 'حسب المسافة', icon: Truck },
  { label: 'مكافأة الإحالة', value: 'لكل موصل جديد ينضم عبر رابطك', icon: Users },
  { label: 'مكافأة التقييم', value: 'أداء ممتاز = مكافآت إضافية', icon: Star },
];

export default function CourierGuide() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0FDF4] via-white to-[#F0FDF4] pb-24" dir="rtl">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C] py-16 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-60 h-60 bg-emerald-300 rounded-full blur-3xl" />
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
              <Truck className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
              دليل الموصّل
            </h1>
            <p className="text-white/80 text-lg max-w-xl mx-auto">
              كل ما تحتاج معرفته للبدء في التوصيل مع واصل وتحقيق أرباح ممتازة
            </p>
          </motion.div>
        </div>
      </div>

      {/* Steps */}
      <div className="max-w-3xl mx-auto px-4 -mt-8">
        <div className="space-y-4">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`${step.bg} rounded-2xl p-5 border border-white/50 shadow-sm`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shrink-0 shadow-lg`}>
                  <step.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-400">الخطوة {idx + 1}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{step.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tips Section */}
      <div className="max-w-3xl mx-auto px-4 mt-10">
        <motion.div {...fadeUp} transition={{ delay: 0.3 }}>
          <h2 className="text-2xl font-black text-[#1B4332] mb-5 flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-500" />
            نصائح للتميز
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tips.map((tip, idx) => (
              <div key={idx} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#1B4332]/10 flex items-center justify-center shrink-0">
                  <tip.icon className="w-5 h-5 text-[#1B4332]" />
                </div>
                <p className="text-sm text-gray-700 font-medium">{tip.text}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Earnings Section */}
      <div className="max-w-3xl mx-auto px-4 mt-10">
        <motion.div {...fadeUp} transition={{ delay: 0.4 }}>
          <h2 className="text-2xl font-black text-[#1B4332] mb-5 flex items-center gap-2">
            <Award className="w-6 h-6 text-emerald-500" />
            نظام الأرباح
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {earnings.map((item, idx) => (
              <div key={idx} className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-bold text-gray-900 mb-1">{item.label}</h4>
                <p className="text-sm text-gray-500">{item.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Important Notes */}
      <div className="max-w-3xl mx-auto px-4 mt-10">
        <motion.div {...fadeUp} transition={{ delay: 0.5 }}>
          <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-amber-800">ملاحظات مهمة</h3>
            </div>
            <ul className="space-y-2 text-sm text-amber-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />
                إذا واجهت أي مشكلة، تواصل مع المشرف فورًا عبر لوحة التحكم
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />
                لا تقبل مدفوعات نقدية من العملاء — جميع المدفوعات تتم عبر التطبيق
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />
                حافظ على تفعيل الإشعارات للحصول على الطلبات في الوقت المناسب
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />
                يمكنك دعوة موصلين جدد عبر رابط الإحالة الخاص بك لكسب مكافآت إضافية
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
