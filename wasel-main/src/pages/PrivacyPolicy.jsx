import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Shield, Lock, Eye, Database, Trash2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDarkMode } from '@/lib/DarkModeContext';
import AdBanner from '@/components/ads/AdBanner';

export default function PrivacyPolicy() {
  const { isDarkMode } = useDarkMode();

  return (
    <div className={`min-h-screen pb-24 font-['Cairo'] ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200'}`}>
      {/* Hero */}
      <section className={`py-16 sm:py-20 ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-[#1B4332] to-[#2D6A4F]'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">سياسة الخصوصية</h1>
            <p className="text-white/70 text-base max-w-xl mx-auto">
              نحرص في واصل ستور على حماية بياناتك الشخصية وعدم مشاركتها مع أي طرف ثالث دون موافقتك.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12" dir="rtl">
        <div className={`rounded-3xl p-6 sm:p-10 shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#F5E6D3]'} border space-y-8`}>

          <section>
            <div className="flex items-center gap-3 mb-3">
              <Database className={`w-6 h-6 ${isDarkMode ? 'text-emerald-400' : 'text-[#2D6A4F]'}`} />
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-[#1B4332]'}`}>ما البيانات التي نجمعها؟</h2>
            </div>
            <div className={`space-y-2 text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <p>عند استخدامك لمنصة واصل ستور، قد نجمع أنواعًا محددة من البيانات الشخصية اللازمة لتقديم الخدمة بشكل سليم. تشمل هذه البيانات اسمك الكامل وعنوان بريدك الإلكتروني ورقم هاتفك الذي تسجل الدخول به عبر رمز التحقق OTP. كما نحتفظ بعناوين التوصيل التي تقوم بإدخالها لضمان دقة عمليات التوصيل.</p>
              <p>في حال استخدامك لطرق الدفع الإلكتروني مثل PayPal، فإن بيانات الدفع تُعالج بالكامل من خلال بوابة الدفع الآمنة ولا نحتفظ بأي معلومات بطاقات ائتمانية على خوادمنا. أما في حال استخدام المحفظة الرقمية، فنحتفظ فقط بسجل الرصيد والمعاملات المالية المرتبطة بحسابك.</p>
              <p>نجمع أيضًا معلومات تقنية مثل نوع الجهاز ونظام التشغيل وعنوان IP، وذلك لأغراض تحسين الأداء وضمان الأمان ومنع الاستخدام غير المصرح به للمنصة.</p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-3">
              <Eye className={`w-6 h-6 ${isDarkMode ? 'text-emerald-400' : 'text-[#2D6A4F]'}`} />
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-[#1B4332]'}`}>كيف نستخدم بياناتك؟</h2>
            </div>
            <div className={`space-y-2 text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <p>نستخدم بياناتك الشخصية حصريًا لأغراض تشغيل الخدمة وتحسينها. يشمل ذلك إنشاء حسابك وإدارة الطلبات والتوصيل وإرسال إشعارات حول حالة طلبك والتواصل معك بشأن الدعم الفني أو الاستفسارات.</p>
              <p>لا نبيع بياناتك الشخصية ولا نشاركها مع أي شركات تسويق أو أطراف ثالثة خارج نطاق تقديم الخدمة. قد نشارك بعض البيانات مع مزودي الخدمة الموثوقين مثل Supabase لاستضافة قاعدة البيانات وFirebase لخدمة الإشعارات، وذلك في حدود ما هو ضروري لتشغيل المنصة.</p>
              <p>نستخدم بيانات الاستخدام المجمعة والمجهولة الهوية لتحليل أنماط التصفح وتحسين تجربة المستخدم وتطوير ميزات جديدة تلبي احتياجاتكم. هذه البيانات لا تُستخدم لتحديد هوية أي مستخدم بعينه.</p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-3">
              <Lock className={`w-6 h-6 ${isDarkMode ? 'text-emerald-400' : 'text-[#2D6A4F]'}`} />
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-[#1B4332]'}`}>كيف نحمي بياناتك؟</h2>
            </div>
            <div className={`space-y-2 text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <p>نطبق إجراءات أمنية متعددة الطبقات لحماية بياناتك. جميع الاتصالات بين تطبيقك وخوادمنا مشفرة باستخدام بروتوكول HTTPS-TLS. كما نستخدم سياسات أمان على مستوى قاعدة البيانات (Row Level Security) لضمان أن كل مستخدم لا يمكنه الوصول إلا إلى بياناته الخاصة فقط.</p>
              <p>نراجع بشكل دوري ممارساتنا الأمنية ونحدث أنظمتنا للتعامل مع أحدث التهديدات. كما نحد من وصول الموظفين إلى بيانات المستخدمين ونقتصر ذلك على الحالات الضرورية لتقديم الدعم الفني أو معالجة الطلبات.</p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-3">
              <Trash2 className={`w-6 h-6 ${isDarkMode ? 'text-emerald-400' : 'text-[#2D6A4F]'}`} />
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-[#1B4332]'}`}>حقوقك كمستخدم</h2>
            </div>
            <div className={`space-y-2 text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <p>يحق لك في أي وقت طلب الاطلاع على بياناتك الشخصية المخزنة لدينا أو تعديلها أو حذفها بالكامل. يمكنك التواصل معنا عبر واتساب أو البريد الإلكتروني wasel.daraa@gmail.com لتقديم طلبك وسنستجيب خلال 48 ساعة.</p>
              <p>يمكنك أيضًا إلغاء تلقي الإشعارات في أي وقت من إعدادات التطبيق أو إعدادات جهازك. كما يمكنك حذف حسابك نهائيًا عبر التواصل مع فريق الدعم، وعند ذلك سنحذف جميع بياناتك الشخصية من أنظمتنا خلال 30 يومًا.</p>
              <p>نحتفظ بالحق في تعديل سياسة الخصوصية هذه وفقًا لتطور الخدمة. سيتم إعلامك بأي تغييرات جوهرية عبر إشعار داخل التطبيق. آخر تحديث لهذه السياسة: مارس 2026.</p>
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
