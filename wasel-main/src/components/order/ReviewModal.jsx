import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function ReviewModal({ order, onClose, onSubmit }) {
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});
  const [serviceRating, setServiceRating] = useState(0);
  const [serviceComment, setServiceComment] = useState('');
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoveredServiceStar, setHoveredServiceStar] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const orderItems = order?.items || [];

  const handleStarClick = (itemId, rating) => {
    setRatings(prev => ({ ...prev, [itemId]: rating }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    
    const reviews = orderItems.map(item => ({
      order_item_id: item.id,
      order_id: order.id,
      item_type: item.item_type || 'product',
      item_id: item.item_id || item.product_id || item.id,
      rating: ratings[item.id || item.item_id] || 0,
      comment: comments[item.id || item.item_id] || '',
    }));

    await onSubmit({
      productReviews: reviews,
      serviceReview: {
        order_id: order.id,
        rating: serviceRating,
        comment: serviceComment,
      },
    });
    setSubmitting(false);
  };

  const allRated = orderItems.every(item => ratings[item.id || item.item_id] > 0) && serviceRating > 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-800">قيّم طلبك</h2>
              <p className="text-sm text-gray-500 mt-1">رأيك يهمنا لتحسين خدماتنا</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {orderItems.map((item) => {
              const itemKey = item.id || item.item_id;
              return (
              <div key={itemKey} className="bg-gray-50 rounded-xl p-4 space-y-3">
                {/* Product Info */}
                <div className="flex items-center gap-3">
                  <img
                    src={item.image_url || item.item_image || 'https://placehold.co/80x80?text=No+Image'}
                    alt={item.name || item.item_name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{item.name || item.item_name || 'Item'}</h3>
                    <p className="text-sm text-gray-500">الكمية: {item.quantity}</p>
                  </div>
                </div>

                {/* Star Rating */}
                <div className="flex items-center justify-center gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleStarClick(itemKey, star)}
                      onMouseEnter={() => setHoveredItem({ id: itemKey, star })}
                      onMouseLeave={() => setHoveredItem(null)}
                      className="transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          star <= (hoveredItem?.id === itemKey ? hoveredItem.star : ratings[itemKey] || 0)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {/* Rating Text */}
                <div className="text-center text-sm text-gray-600">
                  {ratings[itemKey] === 5 && '🌟 ممتاز جداً!'}
                  {ratings[itemKey] === 4 && '👍 جيد جداً'}
                  {ratings[itemKey] === 3 && '😊 جيد'}
                  {ratings[itemKey] === 2 && '😐 مقبول'}
                  {ratings[itemKey] === 1 && '😞 يحتاج تحسين'}
                </div>

                {/* Comment (Optional) */}
                {ratings[itemKey] > 0 && (
                  <Textarea
                    placeholder="أخبرنا المزيد... (اختياري)"
                    value={comments[itemKey] || ''}
                    onChange={(e) => setComments(prev => ({ ...prev, [itemKey]: e.target.value }))}
                    className="resize-none h-20 text-sm"
                  />
                )}
              </div>
            );
            })}

            <div className="bg-[#FFF7E6] rounded-xl p-4 space-y-3 border border-[#FCD34D]">
              <h3 className="font-bold text-gray-800">تقييم الخدمة ككل</h3>
              <p className="text-xs text-gray-600">قيّم تجربتك العامة مع واصل ستور (السرعة، الدقة، المتابعة)</p>

              <div className="flex items-center justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={`service-${star}`}
                    onClick={() => setServiceRating(star)}
                    onMouseEnter={() => setHoveredServiceStar(star)}
                    onMouseLeave={() => setHoveredServiceStar(null)}
                    className="transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= (hoveredServiceStar || serviceRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {serviceRating > 0 && (
                <Textarea
                  placeholder="ملاحظة عامة عن الخدمة (اختياري)"
                  value={serviceComment}
                  onChange={(e) => setServiceComment(e.target.value)}
                  className="resize-none h-20 text-sm"
                />
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 bg-gray-50">
            <Button
              onClick={handleSubmit}
              disabled={!allRated || submitting}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold h-12 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  جاري الإرسال...
                </>
              ) : (
                'إرسال التقييم'
              )}
            </Button>
            {!allRated && (
              <p className="text-center text-sm text-gray-500 mt-2">
                يرجى تقييم جميع المنتجات والخدمة ككل
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
