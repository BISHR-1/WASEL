import React, { useState, useEffect } from 'react';
import { Star, User, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

/**
 * Displays product reviews with star ratings under each product.
 * @param {string} productId - UUID of the product (item_id)
 * @param {string} productType - Type like 'product', 'gift', 'package', etc.
 * @param {boolean} isDarkMode - Dark mode flag
 * @param {number} maxVisible - How many reviews to show initially (default 3)
 */
export default function ProductReviews({ productId, productType = 'product', isDarkMode = false, maxVisible = 3 }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!productId) { setLoading(false); return; }
    fetchProductReviews();
  }, [productId]);

  const fetchProductReviews = async () => {
    try {
      // Try item_id first (modern schema), fallback to product_id (legacy)
      let { data, error } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, reviewer_role, user_id, reviewer_user_id')
        .eq('item_id', productId)
        .gt('rating', 0)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error || !data?.length) {
        const fallback = await supabase
          .from('reviews')
          .select('id, rating, comment, content, created_at, reviewer_role, user_id, reviewer_user_id')
          .eq('product_id', productId)
          .gt('rating', 0)
          .order('created_at', { ascending: false })
          .limit(20);
        data = fallback.data || [];
      }

      // Enrich with user names
      const userIds = [...new Set((data || []).map(r => r.user_id || r.reviewer_user_id).filter(Boolean))];
      let userMap = {};
      if (userIds.length) {
        const { data: users } = await supabase
          .from('users')
          .select('id, auth_id, full_name, name, email')
          .or(`id.in.(${userIds.join(',')}),auth_id.in.(${userIds.join(',')})`);
        (users || []).forEach(u => {
          userMap[u.id] = u.full_name || u.name || u.email?.split('@')[0] || 'مستخدم';
          if (u.auth_id) userMap[u.auth_id] = userMap[u.id];
        });
      }

      setReviews((data || []).map(r => ({
        ...r,
        displayName: userMap[r.user_id] || userMap[r.reviewer_user_id] || 'مستخدم واصل',
        displayComment: r.comment || r.content || '',
      })));
    } catch (err) {
      console.error('ProductReviews fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;
  if (!reviews.length) return null;

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const visibleReviews = showAll ? reviews : reviews.slice(0, maxVisible);

  return (
    <div className={`mt-4 rounded-2xl p-4 ${isDarkMode ? 'bg-[#1A1A2E]/60' : 'bg-gray-50'}`}>
      {/* Summary Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(star => (
            <Star
              key={star}
              className={`w-4 h-4 ${star <= Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : isDarkMode ? 'text-gray-600' : 'text-gray-300'}`}
            />
          ))}
        </div>
        <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          {avgRating.toFixed(1)}
        </span>
        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          ({reviews.length} تقييم)
        </span>
      </div>

      {/* Individual Reviews */}
      <AnimatePresence>
        {visibleReviews.map((review, idx) => (
          <motion.div
            key={review.id || idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: idx * 0.05 }}
            className={`flex gap-3 py-2 ${idx > 0 ? (isDarkMode ? 'border-t border-gray-700' : 'border-t border-gray-200') : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-[#2D6A4F]/30' : 'bg-[#1B4332]/10'}`}>
              <User className={`w-4 h-4 ${isDarkMode ? 'text-emerald-400' : 'text-[#1B4332]'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-xs font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  {review.displayName}
                </span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={`w-3 h-3 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : isDarkMode ? 'text-gray-600' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <span className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {new Date(review.created_at).toLocaleDateString('ar-SY')}
                </span>
              </div>
              {review.displayComment && (
                <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {review.displayComment}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Show More / Less */}
      {reviews.length > maxVisible && (
        <button
          onClick={() => setShowAll(!showAll)}
          className={`mt-2 flex items-center gap-1 text-xs font-medium mx-auto ${isDarkMode ? 'text-emerald-400 hover:text-emerald-300' : 'text-[#1B4332] hover:text-[#2D6A4F]'}`}
        >
          {showAll ? (
            <>عرض أقل <ChevronUp className="w-3 h-3" /></>
          ) : (
            <>عرض الكل ({reviews.length}) <ChevronDown className="w-3 h-3" /></>
          )}
        </button>
      )}
    </div>
  );
}
