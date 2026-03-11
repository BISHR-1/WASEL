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
    // Validate that at least one item is rated or all? Requirement says "Rate items".
    // We'll require all items to have at least a star or just skip 0s.
    // Let's submit only rated items.
    
    const reviewsToInsert = Object.entries(ratings)
        .filter(([_, data]) => data.rating > 0)
        .map(([itemId, data]) => ({
            order_id: orderId,
            order_item_id: itemId,
            rating: data.rating,
            comment: data.comment
        }));

    if (reviewsToInsert.length === 0) {
        toast.error('يرجى تقييم منتج واحد على الأقل');
        return;
    }

    setSubmitting(true);
    try {
        const { error } = await supabase
            .from('product_reviews') // Make sure this table matches schema
            .insert(reviewsToInsert);
            
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
