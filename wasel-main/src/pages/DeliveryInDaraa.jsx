import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Truck, MapPin, Clock, Package, CheckCircle, Shield, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDarkMode } from '@/lib/DarkModeContext';
import AdBanner from '@/components/ads/AdBanner';

const deliveryAreas = [
  'درعا البلد', 'درعا المحطة', 'طريق السد', 'المخيم',
  'الكاشف', 'النعيمة', 'اليادودة', 'طفس', 'الصنمين',
  'أم المياذن', 'بصر الحرير', 'جاسم', 'إنخل', 'الحراك',
];

export default function DeliveryInDaraa() {
  const { isDarkMode } = useDarkMode();

  return (
    <div className={`min-h-screen pb-24 font-['Cairo'] ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200'}`}>
      {/* Hero */}
      <section className={`py-16 sm:py-20 ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-[#1B4332] to-[#2D6A4F]'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">التوصيل داخل دَرْعَا</h1>
            <p className="text-white/70 text-base max-w-xl mx-auto">
              فريق توصيل محلي موثوق يصل إلى باب بيتك في درعا وريفها
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12" dir="rtl">
        <div className={`rounded-3xl p-6 sm:p-10 shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#F5E6D3]'} border space-y-8`}>

          <section>
            <div className="flex items-center gap-3 mb-3">
              <MapPin className={`w-6 h-6 ${isDarkMode ? 'text-emerald-400' : 'text-[#2D6A4F]'}`} />
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-[#1B4332]'}`}>نطاق التغطية</h2>
            </div>
            <div className={`space-y-2 text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <p>يغطي واصل ستور حاليًا مدينة درعا بأحيائها الرئيسية وعددًا من مناطق الريف القريب. فريق التوصيل المحلي يعرف المنطقة جيدًا ويصل إلى معظم الأحياء والشوارع حتى في المناطق التي يصعب الوصول إليها. نعمل باستمرار على توسيع نطاق التغطية ليشمل مناطق جديدة.</p>
              <p>التوصيل يتم من خلال فريق من الموصلين المحليين الذين يعيشون في درعا ويعرفون كل حي وشارع فيها. هذا يضمن سرعة التوصيل ودقة الوصول إلى العنوان الصحيح حتى بدون أرقام شوارع رسمية — يكفي ذكر الحي والمعلم القريب.</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {deliveryAreas.map((area) => (
                <span key={area} className={`px-3 py-1 rounded-full text-xs font-bold ${isDarkMode ? 'bg-gray-700 text-emerald-400' : 'bg-[#ECFDF5] text-[#065F46]'}`}>
                  {area}
                </span>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-3">
              <Clock className={`w-6 h-6 ${isDarkMode ? 'text-emerald-400' : 'text-[#2D6A4F]'}`} />
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-[#1B4332]'}`}>أوقات التوصيل</h2>
            </div>
            <div className={`space-y-2 text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <p>نعمل يوميًا من الساعة 8 صباحًا حتى 8 مساءً بتوقيت سوريا. الطلبات التي تصل قبل الساعة 12 ظهرًا يتم تجهيزها وتوصيلها في نفس اليوم في الغالب. الطلبات المسائية قد تُجهز وتوصل في اليوم التالي صباحًا.</p>
              <p>متوسط زمن التوصيل من لحظة تأكيد الطلب حتى استلام المستلم هو 24 إلى 48 ساعة للطلبات العادية. في المناسبات والأعياد قد يزداد الضغط على فريق التوصيل مما يتطلب وقتًا إضافيًا. ننصح بالطلب مبكرًا قبل المناسبات الكبيرة مثل عيد الفطر وعيد الأضحى ورمضان.</p>
              <p>لا نقوم بالتوصيل خلال ساعات حظر التجول إن وُجد، وفي حالات الطقس القاسي قد نتأخر قليلاً مع إشعارك بذلك. سلامة فريقنا والمنتجات هي أولوية قصوى.</p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-3">
              <Package className={`w-6 h-6 ${isDarkMode ? 'text-emerald-400' : 'text-[#2D6A4F]'}`} />
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-[#1B4332]'}`}>رسوم التوصيل</h2>
            </div>
            <div className={`space-y-2 text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <p>رسوم التوصيل تعتمد على المسافة بين نقطة الشراء وعنوان المستلم. داخل مدينة درعا الرسوم ثابتة ومنخفضة. المناطق الريفية البعيدة قد يُضاف عليها رسم إضافي بسيط. يمكنك دائمًا رؤية رسوم التوصيل قبل تأكيد الطلب في صفحة السلة.</p>
              <p>المستخدمون الجدد يحصلون على أول 3 طلبات بتوصيل مجاني تمامًا. أعضاء Wasel+ يحصلون على توصيل مجاني دائم على جميع طلباتهم. كما نوفر عروض توصيل مجاني بشكل دوري على بعض المنتجات والباقات.</p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-3">
              <Shield className={`w-6 h-6 ${isDarkMode ? 'text-emerald-400' : 'text-[#2D6A4F]'}`} />
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-[#1B4332]'}`}>ضمانات التوصيل</h2>
            </div>
            <div className={`space-y-2 text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <p>كل عملية توصيل يتم توثيقها بصورة عند التسليم تُرسل إليك كإثبات وصول الطلب. نتعامل مع المواد الغذائية بعناية خاصة ونستخدم أكياس مناسبة للحفاظ على جودة المنتجات أثناء النقل.</p>
              <p>في حال عدم وجود المستلم في العنوان، يتواصل الموصل عبر الهاتف لترتيب تسليم بديل. إذا تعذر التسليم بعد 3 محاولات، يتم إعادة الطلب ونتواصل معك لترتيب موعد جديد دون تكلفة إضافية.</p>
              <p>نحن نتحمل المسؤولية الكاملة عن أي خطأ يحدث أثناء التوصيل سواء كان تلفًا أو فقدانًا أو تأخرًا غير مبرر. رضاك هو معيار نجاحنا.</p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className={`w-6 h-6 ${isDarkMode ? 'text-emerald-400' : 'text-[#2D6A4F]'}`} />
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-[#1B4332]'}`}>نصائح لتوصيل أسرع</h2>
            </div>
            <ul className={`space-y-1.5 text-sm leading-relaxed list-disc list-inside ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <li>اكتب عنوان المستلم بدقة: الحي، الشارع، المعلم القريب.</li>
              <li>تأكد من أن رقم هاتف المستلم صحيح وفعّال.</li>
              <li>اطلب قبل الظهر للحصول على توصيل في نفس اليوم.</li>
              <li>في المناسبات الكبيرة، اطلب قبل يوم أو يومين.</li>
              <li>إذا كان المستلم سيغيب عن المنزل، أخبرنا بموعد تواجده.</li>
            </ul>
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
