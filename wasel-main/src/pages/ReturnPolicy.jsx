import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { RefreshCw, Clock, DollarSign, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDarkMode } from '@/lib/DarkModeContext';
import AdBanner from '@/components/ads/AdBanner';

export default function ReturnPolicy() {
  const { isDarkMode } = useDarkMode();

  return (
    <div className={`min-h-screen pb-24 font-['Cairo'] ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200'}`}>
      {/* Hero */}
      <section className={`py-16 sm:py-20 ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-[#1B4332] to-[#2D6A4F]'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <RefreshCw className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">سياسة الإرجاع والاسترداد</h1>
            <p className="text-white/70 text-base max-w-xl mx-auto">
              نلتزم بضمان رضاك التام. إذا حدث أي خطأ في طلبك، نتعامل معه بسرعة وإنصاف.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12" dir="rtl">
        <div className={`rounded-3xl p-6 sm:p-10 shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#F5E6D3]'} border space-y-8`}>

          <section>
            <div className="flex items-center gap-3 mb-3">
              <Clock className={`w-6 h-6 ${isDarkMode ? 'text-emerald-400' : 'text-[#2D6A4F]'}`} />
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-[#1B4332]'}`}>متى يمكنك إلغاء الطلب؟</h2>
            </div>
            <div className={`space-y-2 text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <p>يمكنك إلغاء طلبك مجانًا وبدون أي تكلفة في أي وقت قبل أن يبدأ فريقنا في تجهيزه. بمجرد أن تتغير حالة الطلب إلى "قيد التجهيز"، يعني أن فريقنا المحلي في درعا قد بدأ بالفعل في شراء المنتجات وتحضيرها لك. في هذه الحالة قد لا يكون الإلغاء ممكنًا أو قد يتطلب خصم تكلفة ما تم شراؤه.</p>
              <p>لإلغاء طلبك، يمكنك التواصل معنا فورًا عبر واتساب أو من خلال صفحة الدعم الفني في التطبيق. كلما كان التواصل أسرع، زادت فرصة الإلغاء الكامل واسترداد المبلغ بالكامل.</p>
              <p>الطلبات التي تتم عبر السلة المشتركة يجب أن يطلب الإلغاء منشئ السلة الأصلي. المدفوع عبر PayPal يُعاد إلى حساب PayPal الخاص بك، والمدفوع من المحفظة يُعاد كرصيد إلى محفظتك في التطبيق.</p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className={`w-6 h-6 ${isDarkMode ? 'text-emerald-400' : 'text-[#2D6A4F]'}`} />
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-[#1B4332]'}`}>ماذا لو وصل المنتج تالفًا أو مختلفًا؟</h2>
            </div>
            <div className={`space-y-2 text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <p>إذا وصل طلبك بحالة سيئة أو كان المنتج مختلفًا عما طلبته، نعتذر عن ذلك ونلتزم بتعويضك بشكل كامل. يرجى التواصل معنا خلال 24 ساعة من استلام الطلب مع إرفاق صورة توضح المشكلة. سيقوم فريقنا بمراجعة الحالة واتخاذ الإجراء المناسب خلال ساعات قليلة.</p>
              <p>التعويض يتم بإحدى الطرق التالية حسب تفضيلك: إعادة إرسال المنتج الصحيح مجانًا، أو إضافة رصيد تعويضي إلى محفظتك في التطبيق، أو في بعض الحالات استرداد المبلغ المدفوع كاملًا. نتعامل مع كل حالة على حدة لضمان الحل الأنسب لك.</p>
              <p>في حالة المواد الغذائية الطازجة مثل الخضار والفواكه، قد يختلف المنتج قليلاً في الحجم أو المظهر عن الصورة المعروضة وهذا طبيعي ولا يعتبر عيبًا. لكن إذا كانت الجودة سيئة بشكل واضح فنحن نتحمل المسؤولية الكاملة.</p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-3">
              <DollarSign className={`w-6 h-6 ${isDarkMode ? 'text-emerald-400' : 'text-[#2D6A4F]'}`} />
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-[#1B4332]'}`}>كيف يتم الاسترداد المالي؟</h2>
            </div>
            <div className={`space-y-2 text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <p>عند الموافقة على استرداد المبلغ، يتم معالجته حسب طريقة الدفع الأصلية. المبالغ المدفوعة عبر PayPal تُعاد إلى حسابك في PayPal خلال 3 إلى 7 أيام عمل. المبالغ المدفوعة من المحفظة تُعاد فورًا كرصيد إلى محفظتك. الطلبات بالدفع عند الاستلام لا تحتاج استردادًا ماليًا في حال الإلغاء قبل التوصيل.</p>
              <p>رسوم التوصيل تُسترد فقط في حالات الإلغاء الكامل قبل بدء التجهيز أو في حالة خطأ من طرفنا. أما رسوم الخدمة فقد تُخصم في بعض الحالات لتغطية تكاليف المعالجة الإدارية.</p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className={`w-6 h-6 ${isDarkMode ? 'text-emerald-400' : 'text-[#2D6A4F]'}`} />
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-[#1B4332]'}`}>التزامنا تجاهك</h2>
            </div>
            <div className={`space-y-2 text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <p>نؤمن في واصل ستور بأن ثقة العميل هي أساس نجاحنا. لذلك نتعامل مع كل شكوى بجدية تامة ونسعى لحلها بأسرع وقت ممكن. هدفنا أن تكون تجربتك معنا إيجابية في كل مرة، وإذا لم تكن راضيًا عن أي جانب من الخدمة، نريد أن نسمع منك لنتحسن.</p>
              <p>يمكنك دائمًا التواصل مع فريق الدعم عبر واتساب أو عبر صفحة الدعم الفني في التطبيق أو عبر البريد الإلكتروني wasel.daraa@gmail.com. فريقنا متواجد يوميًا لمساعدتك وحل أي مشكلة تواجهها مع خدمتنا.</p>
            </div>
          </section>
        </div>

        <div className="mt-8 text-center">
          <Link to={createPageUrl('Home')} className="inline-flex items-center gap-2 text-[#1B4332] font-bold hover:underline">
            العودة للرئيسية
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
