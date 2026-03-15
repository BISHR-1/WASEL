import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Star, Loader2, Package } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';

export default function OrderRating({ orderId, isOpen, onClose }) {
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [ratings, setRatings] = useState({}); // { itemId: { rating: 0, comment: '' } }
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && orderId) {
        fetchOrderItems();
    }
  }, [isOpen, orderId]);

  const fetchOrderItems = async () => {
    setLoadingItems(true);
    try {
        const { data, error } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', orderId);
        
        if (error) throw error;
        setItems(data || []);
        
        // Initialize ratings state
        const initialRatings = {};
        data.forEach(item => {
            initialRatings[item.id] = { rating: 0, comment: '' };
        });
        setRatings(initialRatings);
    } catch (err) {
        console.error(err);
    } finally {
        setLoadingItems(false);
    }
  };

  const handleRatingChange = (itemId, rating) => {
    setRatings(prev => ({
        ...prev,
        [itemId]: { ...prev[itemId], rating }
    }));
  };

  const handleCommentChange = (itemId, comment) => {
    setRatings(prev => ({
        ...prev,
        [itemId]: { ...prev[itemId], comment }
    }));
  };

  const handleSubmit = async () => {
    const reviewsToInsert = Object.entries(ratings)
        .filter(([_, data]) => data.rating > 0)
        .map(([orderItemId, data]) => {
            const item = items.find(i => String(i.id) === String(orderItemId));
            const productId = item?.product_id || item?.item_id || orderItemId;
            return {
                order_id: orderId,
                item_type: 'product',
                item_id: productId,
                rating: data.rating,
                comment: data.comment || '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
        });

    if (reviewsToInsert.length === 0) {
        toast.error('يرجى تقييم منتج واحد على الأقل');
        return;
    }

    setSubmitting(true);
    try {
        // Get current user for user_id field
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
            reviewsToInsert.forEach(r => { r.user_id = user.id; r.reviewer_user_id = user.id; });
        }

        let { error } = await supabase
            .from('reviews')
            .insert(reviewsToInsert);

        // Fallback: if reviews table rejects (e.g. missing item_type column), try legacy format
        if (error && (String(error.code) === 'PGRST204' || String(error.code) === '42703')) {
            const legacyRows = reviewsToInsert.map(r => ({
                order_id: r.order_id,
                product_id: r.item_id,
                rating: r.rating,
                content: r.comment || '',
                user_id: r.user_id,
                created_at: r.created_at,
                updated_at: r.updated_at,
            }));
            const legacyResult = await supabase.from('reviews').insert(legacyRows);
            error = legacyResult.error;
        }
            
        if (error) throw error;
        
        toast.success('شكراً لتقييمك!');
        onClose();
    } catch (err) {
        console.error(err);
        toast.error('فشل إرسال التقييم');
    } finally {
        setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md font-['Cairo'] max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">تقييم الطلب</DialogTitle>
          <DialogDescription className="text-center">شاركنا رأيك في المنتجات التي وصلتك</DialogDescription>
        </DialogHeader>
        
        {loadingItems ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
        ) : (
            <div className="space-y-6 py-4">
                {items.map(item => (
                    <div key={item.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border">
                                {item.image_url ? (
                                    <img src={item.image_url} className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                    <Package className="w-5 h-5 text-gray-400" />
                                )}
                            </div>
                            <span className="font-bold text-sm text-[#1B4332]">{item.product_name}</span>
                        </div>
                        
                        {/* Stars */}
                        <div className="flex justify-center gap-2 mb-3" dir="ltr">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => handleRatingChange(item.id, star)}
                                    className="focus:outline-none transition-transform active:scale-95"
                                >
                                    <Star 
                                        className={`w-6 h-6 ${
                                            star <= (ratings[item.id]?.rating || 0)
                                            ? 'fill-[#FFC107] text-[#FFC107]' 
                                            : 'text-gray-300'
                                        }`} 
                                    />
                                </button>
                            ))}
                        </div>
                        
                        <Textarea 
                            placeholder="تعليقك على هذا المنتج..."
                            value={ratings[item.id]?.comment || ''}
                            onChange={(e) => handleCommentChange(item.id, e.target.value)}
                            className="bg-white text-sm"
                        />
                    </div>
                ))}
            </div>
        )}
        
        <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">إلغاء</Button>
            <Button 
                onClick={handleSubmit} 
                className="flex-1 bg-[#1B4332] text-white hover:bg-[#2D6A4F]"
                disabled={submitting}
            >
                {submitting ? <Loader2 className="animate-spin" /> : 'إرسال التقييم'}
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
