import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Percent, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function OffersCarousel({ offers, autoPlay = true }) {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    if (!autoPlay || offers.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % offers.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoPlay, offers.length]);

  const goToNext = () => {
    if (Array.isArray(offers) && offers.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % offers.length);
    }
  };

  const goToPrev = () => {
    if (Array.isArray(offers) && offers.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + offers.length) % offers.length);
    }
  };

  if (!Array.isArray(offers) || offers.length === 0) return null;

  const safeCurrentIndex = Math.max(0, Math.min(currentIndex, offers.length - 1));
  const currentOffer = offers[safeCurrentIndex];
  if (!currentOffer) return null;

  return (
    <div className="relative bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 rounded-2xl overflow-hidden shadow-xl mb-8">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <Link to={currentOffer.link} className="block">
            <div className="relative h-48 sm:h-64 md:h-80">
              {/* Background Image */}
              {currentOffer.image && (
                <img
                  src={currentOffer.image}
                  alt={currentOffer.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
              )}

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />

              {/* Content */}
              <div className="relative h-full flex items-center px-6 sm:px-12">
                <div className="max-w-2xl">
                  {/* Badge */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="inline-flex items-center gap-2 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full font-bold text-sm mb-4 shadow-lg"
                  >
                    <Percent className="w-4 h-4" />
                    عرض حصري
                  </motion.div>

                  {/* Title */}
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg">
                    {currentOffer.title}
                  </h2>

                  {/* Description */}
                  <p className="text-lg sm:text-xl text-white/90 mb-4 drop-shadow-md">
                    {currentOffer.description}
                  </p>

                  {/* Discount Badge */}
                  {currentOffer.discount && (
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="inline-flex items-center gap-2 bg-white text-red-600 px-6 py-3 rounded-xl font-bold text-2xl shadow-xl"
                    >
                      <Tag className="w-6 h-6" />
                      خصم {currentOffer.discount}
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      </AnimatePresence>


    </div>
  );
}