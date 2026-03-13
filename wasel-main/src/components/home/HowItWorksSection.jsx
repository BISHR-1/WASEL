import React from 'react';
import { Search, Send, Truck, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
  {
    icon: Search,
    title: 'اختر طلبك',
    description: 'تصفح الهدايا أو المطاعم واختر ما يناسبك',
    color: 'bg-[#52B788]'
  },
  {
    icon: Send,
    title: 'أرسل التفاصيل',
    description: 'أدخل بيانات المستلم وملاحظاتك',
    color: 'bg-[#1B4332]'
  },
  {
    icon: Truck,
    title: 'نتكفل بالباقي',
    description: 'فريقنا المحلي ينفذ ويوصل الطلب',
    color: 'bg-[#2D6A4F]'
  },
  {
    icon: CheckCircle,
    title: 'تأكيد التوصيل',
    description: 'نرسل لك صورة توثيق التسليم',
    color: 'bg-[#40916C]'
  }
];

export default function HowItWorksSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block bg-[#F5E6D3] text-[#1B4332] px-4 py-2 rounded-full text-sm font-medium mb-4">
            خطوات بسيطة
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1B4332] mb-4">
            كيف يعمل واصل ستور؟
          </h2>
          <p className="text-[#1B4332]/60 max-w-2xl mx-auto">
            أربع خطوات فقط تفصلك عن إسعاد أحبابك في سوريا
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative group"
              >
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 right-0 w-full h-0.5 bg-gradient-to-l from-[#F5E6D3] to-transparent" />
                )}
                
                <div className="relative bg-[#FDFBF7] rounded-3xl p-8 text-center hover:shadow-xl transition-all duration-300 border border-[#F5E6D3]">
                  <div className="relative mb-6">
                    <div className={`w-20 h-20 ${step.color} rounded-2xl flex items-center justify-center mx-auto shadow-lg`}>
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-8 h-8 bg-[#F5E6D3] rounded-full flex items-center justify-center font-bold text-[#1B4332]">
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[#1B4332] mb-3">{step.title}</h3>
                  <p className="text-[#1B4332]/60 text-sm">{step.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}