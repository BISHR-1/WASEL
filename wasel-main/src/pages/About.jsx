import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, Truck, Heart, MapPin, Globe, Award, Clock, CheckCircle2 } from 'lucide-react';
import AdBanner from '@/components/ads/AdBanner';

const milestones = [
  { year: '2024', event: 'انطلاق فكرة واصل ستور كمشروع صغير لتوصيل الطلبات في درعا' },
  { year: '2025', event: 'إطلاق المنصة الإلكترونية الكاملة مع نظام دفع PayPal والمحفظة' },
  { year: '2025', event: 'إضافة أقسام المطاعم والحلويات والإلكترونيات والهدايا' },
  { year: '2026', event: 'إطلاق تطبيق أندرويد وعضوية Wasel+ وبرنامج الولاء' },
  { year: '2026', event: 'توسيع التغطية لتشمل أكثر من 30 منطقة في محافظة درعا' },
];

const values = [
  { icon: Shield, title: 'الشفافية', desc: 'كل طلب موثق بصورة تأكيد عند التسليم. أسعار واضحة بدون رسوم مخفية. نؤمن بأن الثقة تُبنى بالأفعال لا بالكلام.' },
  { icon: Heart, title: 'الإنسانية', desc: 'نحن لسنا مجرد منصة توصيل — نحن جسر بين المغتربين وأهلهم. كل طلب يحمل معه مشاعر حب وحنين نحرص على إيصالها بأمانة.' },
  { icon: Users, title: 'المجتمع', desc: 'فريقنا بالكامل من أبناء درعا. نوظف محلياً، ندعم الاقتصاد المحلي، ونعمل مع متاجر ومطاعم محلية لتوفير أفضل المنتجات.' },
  { icon: Award, title: 'الجودة', desc: 'نختار منتجاتنا بعناية من أفضل الموردين المحليين. خضار طازجة يومياً، حلويات مصنوعة حديثاً، ولحوم من مصادر موثوقة.' },
  { icon: Clock, title: 'السرعة', desc: 'فريق توصيل مخصص يعمل يومياً من 8 صباحاً حتى 8 مساءً. معظم الطلبات تصل في نفس اليوم لضمان طزاجة المنتجات.' },
  { icon: Globe, title: 'التوسع', desc: 'بدأنا في درعا ونسعى للتوسع تدريجياً لتغطية مدن سورية أخرى. هدفنا: أن يصل كل مغترب لأهله أينما كانوا في سوريا.' },
];

const stats = [
  { number: '30+', label: 'منطقة تغطية في درعا' },
  { number: '1000+', label: 'طلب تم توصيله بنجاح' },
  { number: '500+', label: 'عائلة سورية نخدمها' },
  { number: '50+', label: 'متجر ومطعم شريك' },
];

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0FDF4] via-white to-[#F9FAF8]" dir="rtl">

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C]" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-56 h-56 bg-emerald-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-5 py-16 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-black text-white mb-4"
          >
            من نحن — قصة واصل ستور
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/85 text-base md:text-lg leading-relaxed max-w-2xl mx-auto"
          >
            منصة سورية أسسها مغتربون يؤمنون بأن المسافة لا يجب أن تقطع الصلة بالأهل.
            نربط ملايين السوريين في المهجر بعائلاتهم في درعا عبر خدمة توصيل موثوقة وشفافة.
          </motion.p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-16">

        {/* Our Story */}
        <section>
          <h2 className="text-2xl font-black text-[#1B4332] mb-4">قصتنا</h2>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4 text-gray-700 leading-relaxed">
            <p>
              وُلدت فكرة واصل ستور من تجربة شخصية: مغترب سوري يعيش بعيداً عن أهله في درعا، يريد أن يرسل لأمه طلبات البيت لكن لا يجد طريقة آمنة وموثوقة للقيام بذلك. البدائل المتاحة كانت إما تحويل أموال بدون ضمان أنها ستُصرف على الاحتياجات الفعلية، أو الاعتماد على معارف قد لا يكونون متاحين دائماً.
            </p>
            <p>
              من هنا جاءت الفكرة: منصة إلكترونية متكاملة تمكّن المغترب من تصفح المنتجات المتاحة محلياً في درعا، اختيار ما يريد، الدفع بالدولار أو العملة المحلية، ومتابعة الطلب حتى يصل لباب بيت عائلته مع صورة تأكيد التسليم. بهذه البساطة، حوّلنا الحنين إلى فعل ملموس.
            </p>
            <p>
              اليوم واصل ستور هي أكثر من متجر إلكتروني — هي مجتمع من المغتربين السوريين الذين يشتركون في رغبة واحدة: الاهتمام بأهلهم رغم البُعد. فريقنا المحلي في درعا يعمل يومياً لتأمين أفضل المنتجات من أفضل الموردين وتوصيلها بأمان وسرعة.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl border border-gray-100 p-5 text-center shadow-sm"
              >
                <div className="text-3xl font-black text-[#1B4332] mb-1">{stat.number}</div>
                <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Values */}
        <section>
          <h2 className="text-2xl font-black text-[#1B4332] mb-6">قِيَمنا ومبادئنا</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {values.map((val, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] flex items-center justify-center">
                    <val.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-black text-[#1F2933]">{val.title}</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{val.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section>
          <h2 className="text-2xl font-black text-[#1B4332] mb-6">مسيرتنا</h2>
          <div className="space-y-4">
            {milestones.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex items-start gap-4 bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
              >
                <div className="w-14 h-8 bg-[#1B4332] text-white rounded-lg flex items-center justify-center font-black text-sm shrink-0">{m.year}</div>
                <p className="text-sm text-gray-700 leading-relaxed pt-0.5">{m.event}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Mission */}
        <section className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-black mb-4">رسالتنا ورؤيتنا</h2>
          <p className="leading-relaxed max-w-2xl mx-auto mb-4">
            <strong>رسالتنا:</strong> تسهيل حياة المغتربين السوريين من خلال منصة تسوق وتوصيل موثوقة وشفافة تربطهم بعائلاتهم في سوريا.
          </p>
          <p className="leading-relaxed max-w-2xl mx-auto">
            <strong>رؤيتنا:</strong> أن نصبح المنصة الأولى للمغتربين العرب لإرسال الطلبات والهدايا لعائلاتهم في أوطانهم، بدءاً من سوريا وتوسعاً لتشمل المنطقة العربية كاملة.
          </p>
        </section>

        {/* Ad */}
        <AdBanner format="auto" className="rounded-xl" />
      </div>
    </div>
  );
}
