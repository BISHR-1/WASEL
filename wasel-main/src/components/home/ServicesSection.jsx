import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Gift, UtensilsCrossed, Package, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const services = [
  {
    icon: Gift,
    title: 'الهدايا',
    description: 'سلال هدايا، ورود، شوكولا وباقات مناسبات',
    image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&h=300&fit=crop',
    link: 'Gifts',
    color: 'from-[#52B788] to-[#40916C]'
  },
  {
    icon: UtensilsCrossed,
    title: 'المطاعم',
    description: 'وجبات طعام من أفضل مطاعم درعا',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
    link: 'Restaurants',
    color: 'from-[#1B4332] to-[#2D6A4F]'
  },
  {
    icon: Package,
    title: 'الباقات الجاهزة',
    description: 'باقات معدة مسبقًا للمناسبات المختلفة',
    image: 'https://images.unsplash.com/photo-1607469256872-48074e807b0e?w=400&h=300&fit=crop',
    link: 'Packages',
    color: 'from-[#2D6A4F] to-[#52B788]'
  }
];

export default function ServicesSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-[#FDFBF7] to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block bg-[#1B4332]/5 text-[#1B4332] px-4 py-2 rounded-full text-sm font-medium mb-4">
            خدماتنا
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1B4332] mb-4">
            ماذا يمكنك إرسال؟
          </h2>
          <p className="text-[#1B4332]/60 max-w-2xl mx-auto">
            نوفر لك خيارات متنوعة لإسعاد أحبابك بما يناسب المناسبة
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
              >
                <Link
                  to={createPageUrl(service.link)}
                  className="group block bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-[#F5E6D3]"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${service.color} opacity-60`} />
                    <div className="absolute bottom-4 right-4">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                        <Icon className="w-7 h-7 text-[#1B4332]" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-[#1B4332] mb-2 group-hover:text-[#52B788] transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-[#1B4332]/60 text-sm mb-4">
                      {service.description}
                    </p>
                    <div className="flex items-center gap-2 text-[#52B788] font-medium text-sm">
                      تصفح الآن
                      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-2 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}