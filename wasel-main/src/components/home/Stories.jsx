import React, { useState } from 'react';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Play, X } from 'lucide-react';
import { useLanguage } from '../common/LanguageContext';

export default function Stories() {
  const [selectedStory, setSelectedStory] = useState(null);
  const { language, t } = useLanguage();

  const { data: stories = [] } = useQuery({
    queryKey: ['stories-public'],
    queryFn: async () => {
      try {
        const result = await base44?.entities?.Story?.filter?.({ active: true }, '-created_date');
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('Failed to fetch stories:', error);
        return [];
      }
    },
    initialData: []
  });

  if (!Array.isArray(stories) || stories.length === 0) return null;

  const getStoryTitle = (story) => {
    return (language === 'en' && story.title_en) ? story.title_en : story.title;
  };

  return (
    <>
      <div className="bg-white py-6 border-b border-[#F5E6D3]">
        <div className="max-w-7xl mx-auto px-4">
          <ScrollArea className="w-full whitespace-nowrap" dir="ltr">
            <div className="flex gap-4 sm:gap-6 pb-2">
              {(Array.isArray(stories) ? stories : []).map((story, i) => (
                <motion.div 
                  key={story.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col items-center gap-2 cursor-pointer group"
                  onClick={() => setSelectedStory(story)}
                >
                  <div className={`p-1 rounded-full ring-2 ring-offset-2 ${story.media_type === 'video' ? 'ring-red-500' : 'ring-[#1B4332]'} group-hover:scale-105 transition-transform duration-300 relative`}>
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-white relative z-10">
                      <img 
                        src={story.thumbnail || story.url} 
                        alt={getStoryTitle(story)} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {story.media_type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <Play className="w-6 h-6 text-white fill-white" />
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-medium text-[#1B4332] group-hover:text-[#52B788] transition-colors max-w-[80px] truncate text-center">
                    {getStoryTitle(story)}
                  </span>
                </motion.div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="hidden" />
          </ScrollArea>
        </div>
      </div>

      <AnimatePresence>
        {selectedStory && (
          <Dialog open={!!selectedStory} onOpenChange={() => setSelectedStory(null)}>
            <DialogContent className="p-0 bg-black/95 border-0 text-white max-w-sm sm:max-w-md h-[80vh] sm:h-[600px] flex flex-col items-center justify-center overflow-hidden rounded-2xl">
                <button 
                    onClick={() => setSelectedStory(null)}
                    className="absolute top-4 right-4 z-50 p-2 bg-black/50 rounded-full hover:bg-white/20 transition-colors"
                >
                    <X className="w-6 h-6 text-white" />
                </button>
                
                <div className="w-full h-full flex items-center justify-center relative">
                    {selectedStory.media_type === 'video' ? (
                        <video 
                            src={selectedStory.url} 
                            controls 
                            autoPlay 
                            className="w-full h-full object-contain"
                            playsInline
                        />
                    ) : (
                        <img 
                            src={selectedStory.url} 
                            alt={getStoryTitle(selectedStory)} 
                            className="w-full h-full object-contain"
                        />
                    )}
                    
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
                        <h3 className="text-xl font-bold mb-2">{getStoryTitle(selectedStory)}</h3>
                        {selectedStory.link && (
                            <a 
                                href={selectedStory.link} 
                                className="inline-block bg-[#1B4332] text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-[#52B788] transition-colors"
                            >
                                {t('browseNow')}
                            </a>
                        )}
                    </div>
                </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  );
}