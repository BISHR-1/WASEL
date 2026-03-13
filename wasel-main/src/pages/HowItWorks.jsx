import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { FileText, Search, Send, Truck, CheckCircle, MessageCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/components/common/LanguageContext';
import { useDarkMode } from '@/lib/DarkModeContext';

const steps = [
  {
    number: '1️⃣',
    icon: Search,
    title: 'اختيار الطلب وتعبئة البيانات الأساسية',
    description: 'تختار المنتجات أو الوجبات، ثم تدخل بيانات المرسل والمستلم الضرورية فقط لإتمام التوصيل بدقة.',
    color: 'bg-[#52B788]'
  },
  {
    number: '2️⃣',
    icon: MessageCircle,
    title: 'مسار الدفع المناسب لك',
    description: 'يمكنك الإكمال عبر PayPal أو واتساب حسب نوع الطلب. وفي حالة السلة المشتركة، يتم تسجيل الدخول أولًا ثم المتابعة من الرابط بأمان.',
    color: 'bg-[#1B4332]'
  },
  {
    number: '3️⃣',
    icon: Truck,
    title: 'متابعة فورية وتنبيهات',
    description: 'بعد إنشاء الطلب، يظهر في لوحة المتابعة ويتم إرسال إشعارات فورية عند تغيّر الحالة (قبول، تجهيز، توصيل، تسليم).',
    color: 'bg-[#2D6A4F]'
  },
  {
    number: '4️⃣',
    icon: CheckCircle,
    title: 'تنفيذ محلي وتسليم موثق',
    description: 'يُنفذ الطلب محليًا ويصل إلى المستلم، مع تحديثات واضحة داخل التطبيق وإثبات تسليم عند توفره.',
    color: 'bg-[#40916C]'
  }
];

export default function HowItWorks() {
  const { language } = useLanguage();
  const { isDarkMode } = useDarkMode();

  return (
    <div className={`min-h-screen pb-24 ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200'}`}>
      {/* Hero */}
      <section className={`py-16 sm:py-24 ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-100 to-blue-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              كيف نعمل؟
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              هذا هو التدفق الحالي داخل واصل ستور: من إنشاء الطلب وحتى التسليم مع متابعة واضحة وخصوصية أعلى.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Steps */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="relative">
          {/* Vertical Line */}
          <div className={`hidden md:block absolute right-[39px] top-0 bottom-0 w-0.5 ${isDarkMode ? 'bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700' : 'bg-gradient-to-b from-[#52B788] via-[#1B4332] to-[#40916C]'}`} />
          
          <div className="space-y-12">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  className="relative flex gap-6 md:gap-8"
                >
                  {/* Icon */}
                  <div className={`relative z-10 w-16 h-16 sm:w-20 sm:h-20 ${step.color} rounded-2xl flex items-center justify-center shrink-0 shadow-lg`}>
                    <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                  
                  {/* Content */}
                  <div className={`rounded-2xl p-6 flex-1 shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#F5E6D3]'} border`}>
                    <div className="flex items-center gap-2 mb-3">
                         <span className="text-2xl">{step.number}</span>
                         <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-[#1B4332]'}`}>{step.title}</h3>
                    </div>
                    <p className={`leading-relaxed whitespace-pre-line ${isDarkMode ? 'text-gray-300' : 'text-[#1B4332]/70'}`}>{step.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Important Notes */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-[#F5E6D3] rounded-3xl p-8"
        >
          <h3 className="text-xl font-bold text-[#1B4332] mb-6">ملاحظات مهمة</h3>
          <ul className="space-y-4">
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-[#1B4332] rounded-full flex items-center justify-center text-white text-sm shrink-0">✓</span>
              <span className="text-[#1B4332]/80">السلة المشتركة تتطلب تسجيل الدخول أولًا قبل إتمام الدفع</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-[#1B4332] rounded-full flex items-center justify-center text-white text-sm shrink-0">✓</span>
              <span className="text-[#1B4332]/80">يتم إشعار فريق الإشراف فور إنشاء الطلب لتسريع المتابعة</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-[#1B4332] rounded-full flex items-center justify-center text-white text-sm shrink-0">✓</span>
              <span className="text-[#1B4332]/80">حالة الطلب تظهر في "طلباتي" بشكل محدث</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-[#1B4332] rounded-full flex items-center justify-center text-white text-sm shrink-0">✓</span>
              <span className="text-[#1B4332]/80">لا نعرض بيانات غير مهمة داخل الصفحة</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-[#1B4332] rounded-full flex items-center justify-center text-white text-sm shrink-0">✓</span>
              <span className="text-[#1B4332]/80">بياناتك محفوظة وتستخدم فقط لتنفيذ الطلب</span>
            </li>
          </ul>
        </motion.div>
      </section>

      {/* CTA Text */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-4"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1B4332]">
            جاهز لإرسال طلبك؟
          </h2>
          <p className="text-[#1B4332]/70 text-lg">
            ابدأ الآن وخلّي طلبك يمشي بخطوات واضحة من أول لحظة.
          </p>
          <div className="py-4">
             <span className="text-[#1B4332] font-bold text-xl block">اطلب الآن</span>
             <span className="text-[#52B788] font-bold text-lg block mt-1">Wasel.life</span>
          </div>
          <p className="text-[#1B4332] font-medium text-lg">
            نوصّل طلبك… كأنك موجود معهم.
          </p>
          <p className="text-[#1B4332]/60 text-sm max-w-md mx-auto">
            منصة تربط المغتربين السوريين بعائلاتهم داخل سوريا عبر تنفيذ محلي موثوق.
          </p>
        </motion.div>
      </section>
    </div>
  );
}