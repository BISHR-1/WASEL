import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Gift, ArrowLeft, Heart, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F5E6D3]/50 via-white to-[#52B788]/10" />
      
      {/* Decorative Elements */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-[#52B788]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#F5E6D3]/50 rounded-full blur-3xl" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-[#1B4332]/5 px-4 py-2 rounded-full mb-6">
              <MapPin className="w-4 h-4 text-[#52B788]" />
              <span className="text-[#1B4332] text-sm font-medium">خدماتنا تغطي محافظة درعا</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1B4332] leading-tight mb-6">
              نوصّل طلبك...
              <br />
              <span className="text-[#52B788]">كما لو كنت هناك</span>
            </h1>
            
            <p className="text-lg text-[#1B4332]/70 leading-relaxed mb-8 max-w-lg">
              منصة واصل تتيح لك إرسال الهدايا والطعام لأحبابك في سوريا بكل سهولة وثقة. فريقنا المحلي يتكفل بكل التفاصيل.
            </p>
            
            <div className="flex flex-col gap-4">
              <div className="flex gap-3">
                <Link
                  to={createPageUrl('Gifts')}
                  className="flex-1 bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white px-6 py-4 rounded-2xl font-bold text-center shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
                >
                  🎁 هدايا
                </Link>
                <Link
                  to={createPageUrl('Restaurants')}
                  className="flex-1 bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white px-6 py-4 rounded-2xl font-bold text-center shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
                >
                  🍽️ طعام
                </Link>
                <Link
                  to={createPageUrl('Packages')}
                  className="flex-1 bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white px-6 py-4 rounded-2xl font-bold text-center shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
                >
                  📦 باقات
                </Link>
              </div>
              
              <Link
                to={createPageUrl('HowItWorks')}
                className="inline-flex items-center justify-center gap-2 bg-white text-[#1B4332] px-8 py-4 rounded-2xl font-semibold border-2 border-[#1B4332]/10 hover:border-[#1B4332]/30 transition-all duration-300"
              >
                كيف يعمل؟
              </Link>
            </div>
            
            {/* Trust Badges */}
            <div className="flex items-center gap-6 mt-10 pt-10 border-t border-[#1B4332]/10">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-[#52B788]/10 rounded-full flex items-center justify-center">
                  <Heart className="w-5 h-5 text-[#52B788]" />
                </div>
                <div>
                  <p className="font-bold text-[#1B4332]">موثوق</p>
                  <p className="text-xs text-[#1B4332]/60">فريق محلي</p>
                </div>
              </div>
              <div className="w-px h-10 bg-[#1B4332]/10" />
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-[#F5E6D3] rounded-full flex items-center justify-center">
                  <span className="text-[#1B4332] font-bold">✓</span>
                </div>
                <div>
                  <p className="font-bold text-[#1B4332]">سريع</p>
                  <p className="text-xs text-[#1B4332]/60">توصيل سريع</p>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Image - Desktop and Mobile */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#52B788]/20 to-[#F5E6D3]/30 rounded-[3rem] rotate-6" />
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6956904186fea0685d192690/024ed755c_image.png"
                alt="هدايا"
                className="relative rounded-[3rem] shadow-2xl w-full max-w-md mx-auto"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}