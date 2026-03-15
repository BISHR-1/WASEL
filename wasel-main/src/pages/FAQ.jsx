import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { HelpCircle, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDarkMode } from '@/lib/DarkModeContext';
import AdBanner from '@/components/ads/AdBanner';

const faqs = [
  {
    q: 'ما هو واصل ستور؟',
    a: 'واصل ستور هو منصة إلكترونية تربط المغتربين السوريين حول العالم بعائلاتهم في درعا، سوريا. من خلال المنصة يمكنك تصفح المنتجات الغذائية والهدايا والحلويات والوجبات الجاهزة، وطلبها من أي مكان في العالم ليتم توصيلها مباشرة إلى باب بيت عائلتك في درعا. نحن نتولى كل شيء من الشراء المحلي إلى التوصيل مع تأكيد بصورة التسليم.',
  },
  {
    q: 'كيف أطلب من واصل ستور؟',
    a: 'الطلب بسيط جدًا: أنشئ حسابك بإدخال بريدك الإلكتروني وستصلك رمز تحقق. ثم تصفح المنتجات واختر ما تريد وأضفه إلى السلة. أدخل عنوان التوصيل (اسم المستلم ومنطقته في درعا) واختر طريقة الدفع (PayPal أو المحفظة أو الدفع عند الاستلام). بعد تأكيد الطلب، يبدأ فريقنا المحلي بالتجهيز والتوصيل وستتلقى إشعارات في كل مرحلة.',
  },
  {
    q: 'ما هي طرق الدفع المتاحة؟',
    a: 'نوفر عدة طرق دفع مرنة لتناسب جميع المستخدمين. PayPal هو الخيار الأساسي للمغتربين حيث يمكنك الدفع ببطاقتك البنكية أو حسابك في PayPal بأمان تام. كما نوفر محفظة إلكترونية داخل التطبيق يمكنك شحنها عبر PayPal واستخدامها للطلبات المتكررة بسرعة. للمستخدمين داخل سوريا نوفر خيار الدفع النقدي عند الاستلام.',
  },
  {
    q: 'كم يستغرق التوصيل؟',
    a: 'معظم الطلبات يتم تجهيزها وتوصيلها خلال 24 إلى 48 ساعة من تأكيد الطلب. الطلبات التي تتم في أوقات الذروة أو تحتوي على منتجات خاصة قد تحتاج وقتًا إضافيًا. نرسل لك إشعارًا فوريًا عندما يبدأ التجهيز وعندما يخرج الطلب للتوصيل وعند وصوله للمستلم مع صورة التسليم.',
  },
  {
    q: 'هل يمكنني إرسال هدية لشخص لا يعرف بالطلب؟',
    a: 'بالطبع! واصل ستور مصمم خصيصًا لهذا الغرض. يمكنك اختيار منتجات أو باقات هدايا وإدخال عنوان المستلم فقط. سيتم توصيل الهدية إليه كمفاجأة. يمكنك أيضًا إضافة رسالة شخصية مع الهدية. هذه الميزة هي الأكثر استخدامًا في المناسبات مثل الأعياد وأعياد الميلاد وشهر رمضان.',
  },
  {
    q: 'ما هي السلة المشتركة؟',
    a: 'السلة المشتركة هي ميزة فريدة تتيح لك إنشاء سلة تسوق ومشاركتها مع شخص آخر عبر رابط. مثلاً يمكنك إنشاء السلة واختيار المنتجات، ثم إرسال رابط الدفع لصديقك أو أحد أفراد عائلتك ليقوم هو بالدفع. هذه الميزة مفيدة جدًا عندما تريد أن يطلب شخص في سوريا ما يحتاجه ويدفع شخص في الخارج.',
  },
  {
    q: 'هل الأسعار ثابتة أم قد تتغير؟',
    a: 'الأسعار المعروضة على المنصة هي أسعار تقريبية تعتمد على أسعار السوق المحلي في درعا. قد تتغير الأسعار قليلاً بسبب تقلبات أسعار المواد الغذائية أو عدم توفر منتج معين واستبداله ببديل. نخبرك دائمًا بأي فرق في السعر قبل تنفيذ الطلب إذا كان التغيير كبيرًا.',
  },
  {
    q: 'ما هي عضوية Wasel+؟',
    a: 'عضوية Wasel+ هي اشتراك شهري أو سنوي يمنحك مزايا حصرية مثل خصومات على جميع الطلبات وتوصيل مجاني وأولوية في التجهيز والتوصيل وعروض خاصة للأعضاء فقط. يمكنك الاشتراك عبر PayPal أو من رصيد المحفظة. الاشتراك الشهري يبدأ بتجربة مجانية لأول شهر.',
  },
  {
    q: 'هل يمكنني تتبع طلبي؟',
    a: 'نعم! بعد تأكيد الطلب يمكنك متابعة حالته من صفحة "طلباتي" في التطبيق. ستظهر لك حالة الطلب في كل مرحلة: تم الاستلام، قيد التجهيز، خرج للتوصيل، تم التسليم. كما ستتلقى إشعارات فورية على هاتفك عند كل تغيير في حالة الطلب.',
  },
  {
    q: 'هل الخدمة متاحة خارج درعا؟',
    a: 'حاليًا نقدم خدمة التوصيل داخل مدينة درعا وريفها القريب. نعمل على توسيع نطاق خدمتنا ليشمل محافظات سورية أخرى في المستقبل القريب. إذا كنت مهتمًا بتوفر الخدمة في منطقتك، تواصل معنا وسنخبرك عند إطلاق الخدمة في مدينتك.',
  },
  {
    q: 'كيف أتواصل مع الدعم الفني؟',
    a: 'يمكنك التواصل معنا بعدة طرق: عبر صفحة الدعم الفني في التطبيق للمحادثة المباشرة، أو عبر واتساب على الرقم المتوفر في قسم "تواصل معنا"، أو عبر البريد الإلكتروني wasel.daraa@gmail.com. فريق الدعم متاح يوميًا وسيرد على استفسارك في أقرب وقت ممكن.',
  },
];

function FAQItem({ item, isDarkMode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#E5E7EB]'} overflow-hidden`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 text-right gap-3">
        <span className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-[#1B4332]'}`}>{item.q}</span>
        {open ? <ChevronUp className="w-5 h-5 text-[#52B788] shrink-0" /> : <ChevronDown className="w-5 h-5 text-[#94A3B8] shrink-0" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className={`px-4 pb-4 text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{item.a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const { isDarkMode } = useDarkMode();

  return (
    <div className={`min-h-screen pb-24 font-['Cairo'] ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200'}`}>
      {/* Hero */}
      <section className={`py-16 sm:py-20 ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-[#1B4332] to-[#2D6A4F]'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <HelpCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">الأسئلة الشائعة</h1>
            <p className="text-white/70 text-base max-w-xl mx-auto">
              إجابات واضحة على أكثر الأسئلة التي يسألها مستخدمو واصل ستور
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-3" dir="rtl">
        {faqs.map((item, idx) => (
          <FAQItem key={idx} item={item} isDarkMode={isDarkMode} />
        ))}

        <div className="pt-8 text-center">
          <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>لم تجد إجابة لسؤالك؟</p>
          <Link to={createPageUrl('CustomerSupport')} className="inline-flex items-center gap-2 bg-[#1B4332] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#2D6A4F] transition-colors">
            تواصل مع الدعم
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        <div className="mt-6">
          <AdBanner format="auto" className="rounded-xl" />
        </div>
      </div>
    </div>
  );
}
