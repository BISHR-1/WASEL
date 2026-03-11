import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Gift, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CTASection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] rounded-[2.5rem] p-8 sm:p-12 lg:p-16 overflow-hidden"
        >
          {/* Decorative */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-[#52B788]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-[#F5E6D3]/10 rounded-full blur-2xl" />
          
          <div className="relative text-center">
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <Gift className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              جاهز لإسعاد أحبابك؟
            </h2>
            
            <p className="text-white/70 text-lg max-w-2xl mx-auto mb-10">
              ابدأ الآن وأرسل هديتك أو طلبك. سنتولى كل شيء من هنا.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={createPageUrl('Gifts')}
                className="group inline-flex items-center justify-center gap-3 bg-white text-[#1B4332] px-10 py-5 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                تصفح الهدايا
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </Link>
              
              <Link
                to={createPageUrl('Contact')}
                className="inline-flex items-center justify-center gap-2 bg-white/10 text-white px-10 py-5 rounded-2xl font-semibold border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                تواصل معنا
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}