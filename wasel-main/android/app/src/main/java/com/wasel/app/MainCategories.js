
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { UtensilsCrossed, Gift, Package, ArrowLeft, ShoppingCart, Smartphone } from 'lucide-react';

const CATEGORIES = [
  {
    id: 'restaurants',
    title: 'المطاعم',
    description: 'أشهى المأكولات من أفضل مطاعم المدينة تصلك ساخنة',
    icon: UtensilsCrossed,
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1000&auto=format&fit=crop',
    link: 'Restaurants',
    color: 'from-orange-500 to-red-600',
    delay: 0.1
  },
  {
    id: 'supermarket',
    title: 'سوبر ماركت',
    description: 'مقاضي البيت والخضار والفواكه الطازجة',
    icon: ShoppingCart,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop',
    link: 'Supermarket',
    color: 'from-green-500 to-emerald-600',
    delay: 0.15
  },
  {
    id: 'electronics',
    title: 'موبايلات وإلكترونيات',
    description: 'أحدث الهواتف الذكية والإكسسوارات',
    icon: Smartphone,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1000&auto=format&fit=crop',
    link: 'Electronics',
    color: 'from-blue-500 to-indigo-600',
    delay: 0.2
  },
  {
    id: 'gifts',
    title: 'الهدايا',
    description: 'عبر عن مشاعرك بهدايا مميزة لكل المناسبات',
    icon: Gift,
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=1000&auto=format&fit=crop',
    link: 'Gifts',
    color: 'from-pink-500 to-rose-600',
    delay: 0.25
  },
  {
    id: 'packages',
    title: 'الباقات',
    description: 'باقات متكاملة وعروض خاصة تناسب جميع احتياجاتك',
    icon: Package,
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1000&auto=format&fit=crop',
    link: 'Packages',
    color: 'from-purple-500 to-indigo-600',
    delay: 0.3
  }
];

import { useLanguage } from '../common/LanguageContext';

export default function MainCategories() {
  const { t, language } = useLanguage();

  const localizedCategories = CATEGORIES.map(cat => ({
    ...cat,
    title: t(cat.id) || cat.title,
    description: t(cat.id === 'restaurants' ? 'restaurantDesc' : cat.id === 'gifts' ? 'giftDesc' : 'packageDesc') || cat.description
  }));

  return (
    <section className="py-12 px-4 sm:px-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-[#1B4332] text-center mb-10">
        {t('browseCategories')}
      </h2>

      <div className="grid md:grid-cols-3 gap-8">
        {localizedCategories.map((cat) => (
          <Link to={createPageUrl(cat.link)} key={cat.id} className="group perspective">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: cat.delay, duration: 0.5 }}
              whileHover={{
                scale: 1.05,
                rotateY: 5,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
              }}
              className="relative h-96 rounded-3xl overflow-hidden cursor-pointer shadow-xl transition-all duration-500 transform-style-3d"
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} opacity-80 mix-blend-multiply transition-opacity duration-500 group-hover:opacity-90`} />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
              </div>

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-8 text-white">
                <div className="transform transition-transform duration-500 translate-y-4 group-hover:translate-y-0">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-500">
                    <cat.icon className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-3xl font-bold mb-2 group-hover:text-[#F5E6D3] transition-colors">
                    {cat.title}
                  </h3>

                  <p className="text-white/90 text-sm mb-6 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 h-0 group-hover:h-auto">
                    {cat.description}
                  </p>

                  <div className="flex items-center gap-2 font-bold text-sm bg-white/20 backdrop-blur-sm w-fit px-4 py-2 rounded-full hover:bg-white hover:text-[#1B4332] transition-all duration-300">
                    {t('browseNow')}
                    <ArrowLeft className={`w-4 h-4 transition-transform group-hover:-translate-x-1 ${language === 'en' ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </section>
  );
}
