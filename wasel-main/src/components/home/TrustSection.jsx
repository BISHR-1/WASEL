import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Shield, Users, MessageCircle, CreditCard, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const trustPoints = [
  {
    icon: Users,
    title: 'فريق محلي حقيقي',
    description: 'التنفيذ يتم عبر فريق موثوق داخل درعا يعرف المنطقة جيدًا'
  },
  {
    icon: MessageCircle,
    title: 'تواصل مباشر',
    description: 'نتواصل معك عبر واتساب لتأكيد كل التفاصيل قبل التنفيذ'
  },
  {
    icon: Shield,
    title: 'توثيق التوصيل',
    description: 'نرسل لك صورة تثبت تسليم الطلب لطمأنتك'
  },
  {
    icon: CreditCard,
    title: 'لا دفع قبل التأكيد',
    description: 'لا نطلب أي مبلغ إلا بعد الاتفاق على كامل التفاصيل'
  }
];

export default function TrustSection() {
  return (
    <section className="py-20 bg-[#1B4332] relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#52B788]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-[#F5E6D3]/5 rounded-full blur-3xl" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
            لماذا واصل؟
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            ثقتك أولويتنا
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            نعلم أن الثقة هي أهم ما تبحث عنه، لذلك نعمل بشفافية تامة
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustPoints.map((point, index) => {
            const Icon = point.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300"
              >
                <div className="w-14 h-14 bg-[#52B788] rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{point.title}</h3>
                <p className="text-white/60 text-sm">{point.description}</p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link
            to={createPageUrl('WhyWasel')}
            className="inline-flex items-center gap-2 text-white font-medium hover:text-[#52B788] transition-colors"
          >
            اعرف المزيد عنا
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}