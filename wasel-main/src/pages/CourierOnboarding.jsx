import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import {
  Truck, DollarSign, Clock, Shield, MapPin, Users,
  CheckCircle, Star, ArrowLeft, Phone, Bike
} from "lucide-react";
import { useDarkMode } from "@/lib/DarkModeContext";
import AdBanner from "@/components/ads/AdBanner";

const benefits = [
  { icon: DollarSign, title: "أرباح مجزية", desc: "عمولة 1.5 دولار لكل طلب مكتمل بالإضافة إلى مكافأة 30 دولار عند إتمام 40 طلبًا. كلما زادت طلباتك، زادت أرباحك بشكل مستمر." },
  { icon: Clock, title: "مرونة كاملة", desc: "اعمل في الأوقات التي تناسبك بدون التزام بدوام ثابت. أنت من يحدد ساعات العمل وعدد الطلبات التي تريد توصيلها يوميًا." },
  { icon: Shield, title: "حماية وأمان", desc: "نظام تتبع وتوثيق كامل لكل عملية توصيل. إثبات التسليم بالصور يحمي حقوقك ويضمن حصولك على مستحقاتك كاملة." },
  { icon: MapPin, title: "تغطية واسعة", desc: "نعمل في أكثر من 30 منطقة في درعا والمناطق المحيطة. يمكنك اختيار المنطقة الأقرب لك لتقليل وقت التنقل وزيادة عدد الطلبات." },
  { icon: Users, title: "فريق داعم", desc: "مشرفون متواجدون على مدار الساعة لمساعدتك. فريق واصل ستور يقدم الدعم الفني والتنسيقي لضمان تجربة عمل سلسة." },
  { icon: Star, title: "نظام مكافآت", desc: "احصل على مكافآت إضافية عند تحقيق أداء ممتاز أو إحالة موصلين جدد. نظام تقييم عادل يكافئ التميز والالتزام." },
];

const requirements = [
  "العمر 18 سنة أو أكثر مع إثبات هوية ساري المفعول",
  "امتلاك دراجة نارية أو سيارة في حالة جيدة",
  "هاتف ذكي يدعم التطبيقات الحديثة واتصال إنترنت مستقر",
  "معرفة جيدة بالمناطق المحلية والطرق في درعا",
  "الالتزام بالمواعيد والتعامل الاحترافي مع العملاء",
  "القدرة على رفع إثبات تسليم (صورة) لكل طلب مكتمل",
];

const steps = [
  { num: "١", title: "سجّل بياناتك", desc: "أدخل معلوماتك الشخصية ونوع المركبة والمنطقة التي تغطيها عبر رابط التسجيل." },
  { num: "٢", title: "راجع الشروط", desc: "اطّلع على شروط وأحكام الموصل ودليل التوصيل لفهم آلية العمل بالتفصيل." },
  { num: "٣", title: "انتظر الموافقة", desc: "يراجع فريقنا طلبك ويتواصل معك خلال 24-48 ساعة لتأكيد قبولك." },
  { num: "٤", title: "ابدأ التوصيل", desc: "بعد الموافقة، ستصلك الطلبات مباشرة على هاتفك وتبدأ بتحقيق الأرباح فورًا." },
];

const faqs = [
  { q: "كم أربح من كل طلب؟", a: "العمولة الأساسية 1.5 دولار لكل طلب مكتمل مع إثبات تسليم. بالإضافة إلى مكافأة 30 دولار عند إتمام 40 طلبًا في الشهر. يمكن أن تزيد الأرباح مع المكافآت الإضافية." },
  { q: "متى أستلم أرباحي؟", a: "يمكنك اختيار دورة صرف أسبوعية أو شهرية عند التسجيل. يتم تحويل المستحقات في الموعد المحدد بعد خصم أي مبالغ مستحقة." },
  { q: "هل أحتاج سيارة؟", a: "ليس بالضرورة. نقبل التوصيل بالدراجة النارية أو السيارة أو حتى سيرًا على الأقدام للطلبات القريبة. المهم هو القدرة على التوصيل في الوقت المناسب." },
  { q: "ماذا لو رفض المستلم الطلب؟", a: "تواصل مع المشرف فورًا عبر التطبيق. سيتم التعامل مع الحالة وفق السياسة المعتمدة ولن تتأثر مستحقاتك إذا اتبعت الإجراءات الصحيحة." },
];

export default function CourierOnboarding() {
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
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">انضم كموصّل في واصل ستور</h1>
            <p className="text-white/70 text-base max-w-xl mx-auto">
              حقق دخلًا إضافيًا بمرونة تامة من خلال توصيل الطلبات في منطقتك. سجّل الآن وابدأ العمل خلال 48 ساعة.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12" dir="rtl">

        {/* Benefits */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-[#1B4332]'}`}>لماذا تعمل مع واصل ستور؟</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            {benefits.map((b, i) => (
              <div key={i} className={`rounded-2xl p-5 border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#F5E6D3]'} shadow-sm`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${isDarkMode ? 'bg-emerald-900/50' : 'bg-[#1B4332]/10'}`}>
                  <b.icon className={`w-5 h-5 ${isDarkMode ? 'text-emerald-400' : 'text-[#1B4332]'}`} />
                </div>
                <h3 className={`font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-[#1B4332]'}`}>{b.title}</h3>
                <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{b.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Steps */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-[#1B4332]'}`}>كيف تبدأ؟</h2>
          <div className={`rounded-3xl p-6 sm:p-8 border mb-12 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#F5E6D3]'} shadow-sm`}>
            <div className="space-y-6">
              {steps.map((s, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-lg ${isDarkMode ? 'bg-emerald-900/50 text-emerald-400' : 'bg-[#1B4332] text-white'}`}>
                    {s.num}
                  </div>
                  <div>
                    <h3 className={`font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-[#1B4332]'}`}>{s.title}</h3>
                    <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Requirements */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-[#1B4332]'}`}>المتطلبات الأساسية</h2>
          <div className={`rounded-3xl p-6 sm:p-8 border mb-12 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#F5E6D3]'} shadow-sm`}>
            <ul className="space-y-3">
              {requirements.map((r, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className={`w-5 h-5 shrink-0 mt-0.5 ${isDarkMode ? 'text-emerald-400' : 'text-[#2D6A4F]'}`} />
                  <span className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-[#1B4332]'}`}>أسئلة شائعة للموصلين</h2>
          <div className="space-y-4 mb-12">
            {faqs.map((f, i) => (
              <div key={i} className={`rounded-2xl p-5 border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#F5E6D3]'} shadow-sm`}>
                <h3 className={`font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-[#1B4332]'}`}>{f.q}</h3>
                <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{f.a}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <div className={`rounded-3xl p-8 text-center border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-[#1B4332]/5 border-[#1B4332]/10'}`}>
          <Bike className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-emerald-400' : 'text-[#1B4332]'}`} />
          <h2 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-[#1B4332]'}`}>جاهز للانطلاق؟</h2>
          <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            تواصل معنا عبر واتساب للتسجيل كموصّل والبدء بتوصيل الطلبات في منطقتك.
          </p>
          <a
            href="https://wa.me/963933000000"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#20bd5a] transition-colors"
          >
            <Phone className="w-5 h-5" />
            تواصل عبر واتساب
          </a>
        </div>

        <div className="mt-8 text-center">
          <Link to={createPageUrl('CourierGuide')} className={`inline-flex items-center gap-2 font-bold hover:underline ${isDarkMode ? 'text-emerald-400' : 'text-[#1B4332]'}`}>
            اقرأ دليل الموصّل الكامل
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