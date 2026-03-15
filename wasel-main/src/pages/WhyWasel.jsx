import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Shield, Users, MessageCircle, CreditCard, Image, Clock, Heart, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/components/common/LanguageContext';
import { useDarkMode } from '@/lib/DarkModeContext';
import AdBanner from '@/components/ads/AdBanner';

const features = [
  {
    icon: Users,
    title: 'متابعة تشغيلية مباشرة',
    description: 'كل طلب جديد يظهر مباشرة للمشرف لتسريع الفرز والمعالجة من أول دقيقة.',
    color: 'bg-[#52B788]'
  },
  {
    icon: MessageCircle,
    title: 'إشعارات فورية',
    description: 'النظام يرسل إشعارات Firebase عند الأحداث المهمة لتبقى حالة الطلب واضحة لك وللفريق.',
    color: 'bg-[#1B4332]'
  },
  {
    icon: Image,
    title: 'سلة مشتركة منظمة',
    description: 'مشاركة السلة أصبحت مرتبطة بتسجيل الدخول أولًا، ثم دفع آمن من رابط السلة.',
    color: 'bg-[#2D6A4F]'
  },
  {
    icon: CreditCard,
    title: 'خيارات دفع مرنة',
    description: 'PayPal أو واتساب حسب نوع الطلب، مع تسجيل وتوثيق واضح داخل التطبيق.',
    color: 'bg-[#40916C]'
  },
  {
    icon: Clock,
    title: 'بيانات أقل وضوح أكبر',
    description: 'نعرض داخل الصفحات ما تحتاجه فقط، بدون معلومات زائدة تربك المستخدم.',
    color: 'bg-[#52B788]'
  },
  {
    icon: Heart,
    title: 'خصوصية محسّنة',
    description: 'بيانات المرسل والمستلم معزولة حسب الحساب ولا تُستخدم إلا لتنفيذ الطلب.',
    color: 'bg-[#1B4332]'
  }
];

export default function WhyWasel() {
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
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              لماذا واصل ستور؟
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              نعرض لك طريقة عمل واصل ستور الحالية بشكل واضح، بدون تفاصيل غير مهمة.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`rounded-3xl p-8 sm:p-12 shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#F5E6D3]'} border`}
        >
          <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-[#1B4332]'}`}>قصتنا</h2>
          <div className={`space-y-4 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-[#1B4332]/80'}`}>
            <p>
              واصل ستور اليوم يعمل على مسارين واضحين: طلب مباشر داخل التطبيق، أو مشاركة سلة مع طرف خارج سوريا عبر رابط آمن.
            </p>
            <p>
              عند إنشاء الطلب يتم إرساله فورًا إلى لوحة المشرف، ويتم إرسال تنبيه Firebase حتى تبدأ المتابعة بسرعة.
            </p>
            <p>
              ركزنا في التحديثات الأخيرة على الخصوصية، وضوح الحالة، وتقليل المعلومات المعروضة إلى ما يفيد المستخدم فعليًا.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-[#1B4332] mb-4">ما يميزنا</h2>
          <p className="text-[#1B4332]/60 max-w-2xl mx-auto">
            كل ما نقوم به مصمم ليمنحك الثقة والراحة
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-[#F5E6D3] hover:shadow-lg transition-all duration-300"
              >
                <div className={`w-14 h-14 ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-[#1B4332] mb-2">{feature.title}</h3>
                <p className="text-[#1B4332]/60 text-sm">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Promise */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-[#1B4332] rounded-3xl p-8 sm:p-12"
        >
          <h2 className="text-2xl font-bold text-white mb-6 text-center">وعدنا لك</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              'متابعة الطلب من إنشائه حتى التسليم',
              'تنبيه فوري للفريق عند الطلبات الجديدة',
              'إظهار الحالة بشكل مفهوم داخل التطبيق',
              'عدم عرض معلومات غير ضرورية',
              'حماية بياناتك واستخدامها للتوصيل فقط',
              'تحسين مستمر بناءً على ملاحظاتكم'
            ].map((promise, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-[#52B788] shrink-0" />
                <span className="text-white/90">{promise}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-[#1B4332] mb-4">جرب بنفسك</h2>
          <p className="text-[#1B4332]/60 mb-8">
            أفضل طريقة لمعرفتنا هي تجربة خدمتنا
          </p>
          <Link
            to={createPageUrl('Order')}
            className="inline-flex items-center gap-2 bg-[#1B4332] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#2D6A4F] transition-colors"
          >
            ابدأ الآن
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      {/* إعلان أسفل الصفحة */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        <AdBanner format="auto" className="rounded-xl" />
      </div>
    </div>
  );
}