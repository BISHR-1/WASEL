import React from 'react';
import { Star, Quote } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const defaultReviews = [
  {
    rating: 5,
    comment: 'خدمة ممتازة وتوصيل سريع، أهلي فرحوا كثير بالهدية',
    display_name: 'أحمد م.'
  },
  {
    rating: 5,
    comment: 'تواصل رائع وصور توثيق بعد التوصيل، شكرًا واصل ستور',
    display_name: 'سارة ك.'
  },
  {
    rating: 5,
    comment: 'أول مرة أستخدم الخدمة وكانت تجربة مميزة',
    display_name: 'محمد ع.'
  }
];

export default function ReviewsSection() {
  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews'],
    queryFn: async () => {
      try {
        const result = await base44?.entities?.Review?.list?.('-created_date', 6);
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
        return [];
      }
    },
    initialData: []
  });

  const safeReviews = Array.isArray(reviews) ? reviews : [];
  const displayReviews = safeReviews && safeReviews.length > 0 ? safeReviews : defaultReviews;

  return (
    <section className="py-20 bg-[#FDFBF7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block bg-[#F5E6D3] text-[#1B4332] px-4 py-2 rounded-full text-sm font-medium mb-4">
            آراء عملائنا
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1B4332] mb-4">
            ماذا يقول عملاؤنا؟
          </h2>
          <p className="text-[#1B4332]/60 max-w-2xl mx-auto">
            الثقة تُبنى من تجارب حقيقية
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {displayReviews && Array.isArray(displayReviews) ? displayReviews.slice(0, 3).map((review, index) => (
            review ? (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-[#F5E6D3] hover:shadow-lg transition-all duration-300"
              >
                <Quote className="w-10 h-10 text-[#52B788]/20 mb-4" />
                
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < (review?.rating || 0)
                          ? 'fill-[#FFB800] text-[#FFB800]'
                          : 'text-gray-200'
                      }`}
                    />
                  ))}
                </div>
                
                <p className="text-[#1B4332]/80 mb-4 leading-relaxed">
                  "{review?.comment || ''}"
                </p>
                
                <p className="text-[#1B4332] font-semibold">
                  {review?.display_name || 'عميل'}
                </p>
              </motion.div>
            ) : null
          )) : null}
        </div>
      </div>
    </section>
  );
}