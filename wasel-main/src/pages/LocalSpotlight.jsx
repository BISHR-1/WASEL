import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, User, Calendar } from 'lucide-react';
import AppFooter from '@/components/common/AppFooter';

import { supabase } from '@/lib/supabase';
import { useLanguage } from '../components/common/LanguageContext';
import { Button } from "@/components/ui/button";

export default function LocalSpotlight() {
  const { t, language } = useLanguage();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const { data, error } = await supabase
          .from('stories')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setStories(data || []);
      } catch (err) {
        console.error('Error fetching stories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStories();
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-[#52B788] font-bold tracking-wider uppercase text-sm">
            {language === 'ar' ? 'صنع في درعا' : 'Made in Daraa'}
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-[#1B4332] mt-2 mb-4 font-['Cairo']">
            {language === 'ar' ? 'قصص نجاح محلية' : 'Local Success Stories'}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto font-['Cairo']">
            {language === 'ar' 
              ? 'ندعم أصحاب المشاريع الصغيرة والحرفيين في درعا. اكتشف منتجات فريدة وتعرف على الأشخاص وراءها.' 
              : 'Supporting small business owners and artisans in Daraa. Discover unique products and meet the people behind them.'}
          </p>
        </div>

        {loading ? (
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1,2,3].map(i => <div key={i} className="h-96 bg-gray-100 rounded-2xl animate-pulse" />)}
           </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {stories.map((story, idx) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all border border-[#F5E6D3] flex flex-col"
              >
                {/* Image / Video Thumbnail */}
                <div className="relative h-64 overflow-hidden bg-gray-100">
                  <img 
                    src={story.image_url || 'https://via.placeholder.com/400x300?text=No+Image'} 
                    alt={story.title} 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-[#1B4332]">
                    {story.media_type === 'video' ? 'VIDEO' : 'STORY'}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-2xl font-bold text-[#1B4332] mb-3 font-['Cairo']">{story.title}</h3>
                  <p className="text-gray-600 mb-6 line-clamp-4 font-['Cairo'] leading-relaxed">
                    {story.content}
                  </p>
                  
                  <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                     <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(story.created_at).toLocaleDateString()}
                     </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        
        {!loading && stories.length === 0 && (
            <div className="text-center py-20 text-gray-500">
                {language === 'ar' ? 'لا توجد قصص حالياً.' : 'No stories found.'}
            </div>
        )}
      </div>
      <AppFooter />
    </div>
  );
}
