import React from 'react';
import { motion } from 'framer-motion';
import { Download, Shield, Truck, Gift, CreditCard, Star, MapPin, Headphones, ChevronDown, Store, Utensils, Smartphone, Globe } from 'lucide-react';

const APK_URL = 'https://github.com/BISHR-1/WASEL/releases/download/v1.0.0/app-debug.apk';

const features = [
  { icon: Store, title: 'سوبرماركت متكامل', desc: 'تصفّح آلاف المنتجات من المتاجر المحلية مع أسعار واضحة وتوصيل سريع', color: 'from-emerald-500 to-green-600' },
  { icon: Utensils, title: 'مطاعم وحلويات', desc: 'طلب الطعام من المطاعم والحلويات المفضلة واستلامه طازجاً على الباب', color: 'from-orange-500 to-red-500' },
  { icon: Gift, title: 'هدايا وباقات', desc: 'إرسال هدايا وباقات مميزة بتخصيص كامل — مناسبات، أعياد، ومفاجآت', color: 'from-pink-500 to-rose-600' },
  { icon: Smartphone, title: 'إلكترونيات', desc: 'قسم كامل للإلكترونيات والأجهزة مع تفاصيل كل منتج', color: 'from-blue-500 to-indigo-600' },
  { icon: Truck, title: 'توصيل سريع', desc: 'فريق توصيل مخصص يضمن وصول الطلبات بأقصى سرعة', color: 'from-teal-500 to-cyan-600' },
  { icon: CreditCard, title: 'دفع آمن', desc: 'خيارات دفع متعددة — PayPal، محفظة إلكترونية، أو دفع عند الاستلام', color: 'from-violet-500 to-purple-600' },
  { icon: MapPin, title: 'تتبع مباشر', desc: 'متابعة حالة كل طلب لحظة بلحظة من التجهيز حتى الوصول', color: 'from-amber-500 to-orange-600' },
  { icon: Headphones, title: 'دعم فني متواصل', desc: 'فريق دعم متاح للمساعدة عبر الدردشة المباشرة والواتساب', color: 'from-cyan-500 to-teal-600' },
  { icon: Star, title: 'عروض وخصومات دائمة', desc: 'كوبونات خصم، توصيل مجاني لأول ٣ طلبات، وعروض موسمية مستمرة', color: 'from-yellow-500 to-amber-600' },
  { icon: Globe, title: 'يعمل داخل وخارج سوريا', desc: 'خدمة تغطي مناطق متعددة داخل سوريا وتتوسع باستمرار', color: 'from-green-500 to-emerald-600' },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 200 } },
};

export default function DownloadApp() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0FDF4] via-white to-[#ECFDF5]" dir="rtl">

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C]" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-56 h-56 bg-emerald-300 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-lg mx-auto px-5 pt-12 pb-10 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-24 h-24 mx-auto mb-6 bg-white rounded-3xl shadow-2xl flex items-center justify-center overflow-hidden"
          >
            <img src="/logo/wasel-logo.png" alt="Wasel" className="w-20 h-20 object-contain" onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<span class="text-4xl font-black text-emerald-700">W</span>'; }} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl md:text-4xl font-black text-white mb-3"
          >
            وصل — منصة توصيل وتسوّق
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-white/90 text-sm md:text-base leading-relaxed mb-8"
          >
            واصل هي منصة سورية شاملة للتسوّق والتوصيل.
            تجمع بين السوبرماركت، المطاعم، الحلويات، الإلكترونيات، الهدايا والباقات في مكان واحد.
            الهدف هو تسهيل الحياة اليومية عبر تجربة طلب سريعة وآمنة، مع فريق توصيل مخصص وأسعار شفافة.
            تعمل المنصة داخل سوريا وتتوسع تدريجياً لتشمل مناطق أكثر.
          </motion.p>

          {/* Download Button */}
          <motion.a
            href={APK_URL}
            download="wasel.apk"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-3 bg-white text-[#1B4332] font-extrabold text-lg px-8 py-4 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.25)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] transition-shadow"
          >
            <Download className="w-6 h-6" />
            تحميل التطبيق (APK)
          </motion.a>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-white/60 text-xs mt-4 flex items-center justify-center gap-1"
          >
            <Shield className="w-3.5 h-3.5" />
            آمن ومجاني — لأجهزة أندرويد
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8"
          >
            <ChevronDown className="w-6 h-6 text-white/50 mx-auto animate-bounce" />
          </motion.div>
        </div>
      </motion.section>

      {/* What is Wasel */}
      <section className="max-w-lg mx-auto px-5 py-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl font-black text-center mb-4 text-[#1B4332]"
        >
          ما هي منصة واصل؟
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-sm text-gray-600 leading-relaxed text-center mb-4"
        >
          وصل منصة إلكترونية مصممة لتوفير تجربة تسوّق وتوصيل متكاملة.
          يمكن من خلالها تصفّح المنتجات من متاجر ومطاعم متنوعة، إنشاء طلب، واختيار طريقة الدفع المناسبة.
          يتم توصيل الطلبات عبر فريق متخصص مع إمكانية تتبع كل طلب بشكل مباشر.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-sm text-gray-600 leading-relaxed text-center"
        >
          المنصة تدعم الدفع الإلكتروني عبر PayPal والمحفظة الرقمية، بالإضافة للدفع عند الاستلام.
          كما تتضمن نظام كوبونات خصم، برنامج ولاء، وعضوية Wasel+ التي توفر مزايا إضافية مثل خصومات حصرية وتوصيل مجاني.
        </motion.p>
      </section>

      {/* Features Section */}
      <section className="bg-[#F8FBF9] py-10">
        <div className="max-w-lg mx-auto px-5">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl font-black text-center mb-8 text-[#1B4332]"
          >
            مزايا المنصة
          </motion.h2>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="bg-white border-gray-100 rounded-2xl p-4 border shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-3 shadow-lg`}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-sm mb-1 text-[#1F2933]">{f.title}</h3>
                <p className="text-xs leading-relaxed text-gray-500">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How to Install */}
      <section className="bg-[#F0FDF4] py-10">
        <div className="max-w-lg mx-auto px-5">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xl font-black text-center mb-6 text-[#1B4332]"
          >
            طريقة التثبيت
          </motion.h2>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {[
              { step: '١', text: 'الضغط على زر "تحميل التطبيق" في هذه الصفحة' },
              { step: '٢', text: 'فتح الملف المحمّل من الإشعارات أو مدير الملفات' },
              { step: '٣', text: 'السماح بالتثبيت من مصادر غير معروفة إذا ظهر طلب بذلك' },
              { step: '٤', text: 'الضغط على "تثبيت" — التطبيق جاهز للاستخدام' },
            ].map((s, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="flex items-start gap-4 bg-white rounded-xl p-4 shadow-sm"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shrink-0 shadow">
                  <span className="text-white font-black text-sm">{s.step}</span>
                </div>
                <p className="text-sm font-medium pt-1.5 text-[#1F2933]">{s.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-lg mx-auto px-5 py-10 text-center">
        <motion.a
          href={APK_URL}
          download="wasel.apk"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center gap-3 bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white font-extrabold text-base px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow"
        >
          <Download className="w-5 h-5" />
          تحميل واصل الآن
        </motion.a>
        <p className="text-xs mt-3 text-gray-400">الإصدار الأحدث — مجاني بالكامل</p>
      </section>
    </div>
  );
}
