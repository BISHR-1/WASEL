import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Eye, DollarSign, AlertCircle, RefreshCw, HelpCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/components/common/LanguageContext';
import { useDarkMode } from '@/lib/DarkModeContext';

const sections = [
  {
    icon: DollarSign,
    title: 'كيف نحدد الأسعار؟',
    content: [
      'السعر النهائي يتكون من: تكلفة المنتج + تكلفة التوصيل + عمولة واصل ستور',
      'نخبرك بالسعر التقريبي عند التصفح، والسعر النهائي الدقيق بعد التواصل معك',
      'أسعارنا عادلة ولا نضيف هوامش مبالغ بها',
      'نرسل لك إيصال الشراء إذا طلبت ذلك'
    ]
  },
  {
    icon: AlertCircle,
    title: 'لماذا قد يتغير السعر؟',
    content: [
      'تغير أسعار المنتجات في السوق المحلي',
      'عدم توفر المنتج الأصلي واستبداله ببديل',
      'المسافة بين موقع الشراء وموقع التوصيل',
      'طلبات خاصة تتطلب جهدًا إضافيًا'
    ]
  },
  {
    icon: RefreshCw,
    title: 'ماذا نفعل إن حدث خطأ؟',
    content: [
      'إذا كان الخطأ منا، نعوضك بإعادة التنفيذ أو استرجاع المبلغ',
      'نتواصل معك فورًا لإخبارك بأي مشكلة',
      'نوثق كل خطوة لضمان الشفافية',
      'رضاك أهم من أي ربح'
    ]
  },
  {
    icon: HelpCircle,
    title: 'سياسة الإلغاء والاسترجاع',
    content: [
      'يمكنك إلغاء الطلب قبل بدء التنفيذ بدون أي تكلفة',
      'إذا تم الدفع وطلبت الإلغاء قبل الشراء، نعيد المبلغ كاملًا',
      'بعد الشراء، نخصم تكلفة ما تم شراؤه فقط',
      'نتعامل مع كل حالة بمرونة وإنصاف'
    ]
  }
];

export default function Transparency() {
  const { language } = useLanguage();
  const { isDarkMode } = useDarkMode();

  const faqs = [
    {
      question: 'كيف أدفع؟',
      answer: 'حاليًا نقبل التحويل البنكي، Western Union، وبعض المحافظ الإلكترونية. نخبرك بالخيارات المتاحة حسب بلدك.'
    },
    {
      question: 'كم يستغرق التوصيل؟',
      answer: 'معظم الطلبات يتم تنفيذها خلال 24-48 ساعة. الباقات الخاصة والطوارئ قد تكون أسرع (6-12 ساعة).'
    },
    {
      question: 'هل يمكنني طلب شيء غير موجود في القائمة؟',
      answer: 'نعم! تواصل معنا وسنحاول توفير طلبك إذا كان متاحًا في درعا.'
    },
    {
      question: 'هل الخدمة متاحة خارج درعا؟',
      answer: 'حاليًا نخدم درعا فقط، لكن نخطط للتوسع لمحافظات أخرى قريبًا.'
    },
    {
      question: 'كيف أتأكد أن طلبي وصل؟',
      answer: 'نرسل لك صورة توثيق بعد كل عملية توصيل ناجحة.'
    }
  ];

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
              <Eye className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              الشفافية
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              نؤمن أن الشفافية أساس الثقة، لذلك نشرح لك كل شيء بوضوح
            </p>
          </motion.div>
        </div>
      </section>

      {/* Sections */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="space-y-8">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#F5E6D3]"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#52B788] rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-[#1B4332] mb-4">{section.title}</h3>
                    <ul className="space-y-3">
                      {section.content.map((item, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="w-1.5 h-1.5 bg-[#52B788] rounded-full mt-2 shrink-0" />
                          <span className="text-[#1B4332]/70">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-[#1B4332] mb-4">أسئلة شائعة</h2>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-[#F5E6D3]"
            >
              <h4 className="font-bold text-[#1B4332] mb-2">{faq.question}</h4>
              <p className="text-[#1B4332]/70 text-sm">{faq.answer}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-[#F5E6D3] rounded-3xl p-8 sm:p-12 text-center"
        >
          <h2 className="text-2xl font-bold text-[#1B4332] mb-4">
            لديك سؤال آخر؟
          </h2>
          <p className="text-[#1B4332]/70 mb-8">
            لا تتردد في التواصل معنا، نحن هنا للمساعدة
          </p>
          <Link
            to={createPageUrl('Contact')}
            className="inline-flex items-center gap-2 bg-[#1B4332] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#2D6A4F] transition-colors"
          >
            تواصل معنا
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>
    </div>
  );
}