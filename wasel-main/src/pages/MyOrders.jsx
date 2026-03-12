import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { getUnifiedSession } from '@/lib/unifiedAuth';
import { Package, Clock, Truck, CheckCircle, LogIn, MapPin, Star, X, Link2, Camera, RotateCcw, Users } from 'lucide-react';
import { useCart } from '@/components/cart/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ReviewModal from '../components/order/ReviewModal';
import OrderTimeline from '../components/order/OrderTimeline';
import { toast } from 'sonner';
import { useLanguage } from '../components/common/LanguageContext';
import { useLocation } from 'react-router-dom';
import { downloadOrderInvoicePdf } from '@/lib/invoicePdf';
import { getUserRegion, isInsideSyria } from '@/lib/userRegion';
import { buildPublicAppUrl } from '@/lib/publicAppUrl';
import SmartLottie from '@/components/animations/SmartLottie';
import { ANIMATION_PRESETS } from '@/components/animations/animationPresets';
import { useDarkMode } from '@/lib/DarkModeContext';
import { notifyAdminUsers } from '@/services/firebaseOrderNotifications';

const statusOptions = {
  pending: { label: 'قيد انتظار القبول', color: 'bg-gray-100 text-gray-700', icon: Clock },
  processing: { label: 'تم القبول ويتم تجهيز طلبك', color: 'bg-yellow-100 text-yellow-700', icon: Truck },
  delivering: { label: 'جاري التوصيل', color: 'bg-blue-100 text-blue-700', icon: Truck },
  completed: { label: 'تم الاستلام', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-700', icon: X }
};

function normalizeOrderStatus(status, paymentStatus) {
  const raw = String(status || '').toLowerCase();
  const payment = String(paymentStatus || '').toLowerCase();

  if (raw === 'cancelled' || raw === 'canceled') return 'cancelled';
  if (raw === 'completed' || raw === 'delivered' || raw === 'received') return 'completed';
  if (raw === 'delivering' || raw === 'out_for_delivery') return 'delivering';

  if (
    raw === 'processing'
    || raw === 'in_progress'
    || raw === 'accepted'
    || raw === 'paid'
    || raw === 'assigned'
    || payment === 'paid'
    || payment === 'succeeded'
    || payment === 'completed'
  ) {
    return 'processing';
  }

  return 'pending';
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function extractOrderItemsFallback(order) {
  if (Array.isArray(order?.items) && order.items.length > 0) return order.items;

  if (typeof order?.items === 'string') {
    try {
      const parsed = JSON.parse(order.items);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // ignore
    }
  }

  const fromMeta = order?.sender_details?.meta?.items;
  if (Array.isArray(fromMeta) && fromMeta.length > 0) return fromMeta;

  return [];
}

function detectOrderFlowType(order) {
  const meta = order?.sender_details?.meta || {};
  const collaborationMode = String(order?.collaboration_mode || '').toLowerCase();
  const createdVia = String(meta?.created_via || '').toLowerCase();
  const sourceRegion = String(meta?.sourceRegion || meta?.source_region || '').toLowerCase();
  const senderCountry = String(order?.sender_details?.country || '').toLowerCase();

  if (collaborationMode === 'shared' || createdVia === 'shared_cart_link') return 'shared';
  if (sourceRegion === 'inside_syria' || senderCountry === 'syria' || senderCountry === 'sy') return 'inside';
  return 'outside';
}

function flowLabel(type, language) {
  if (language !== 'ar') {
    if (type === 'shared') return 'Shared Cart';
    if (type === 'inside') return 'Inside Syria';
    return 'Outside Syria';
  }

  if (type === 'shared') return 'طلب مشترك';
  if (type === 'inside') return 'داخل سوريا';
  return 'خارج سوريا';
}

function flowBadgeClass(type) {
  if (type === 'shared') return 'bg-violet-100 text-violet-700';
  if (type === 'inside') return 'bg-sky-100 text-sky-700';
  return 'bg-emerald-100 text-emerald-700';
}

export default function MyOrders() {
  const queryClient = useQueryClient();
  const { isDarkMode } = useDarkMode();
  const [session, setSession] = useState(null);
  const [appUserId, setAppUserId] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [reviewingOrder, setReviewingOrder] = useState(null);
  const [activeOrdersTab, setActiveOrdersTab] = useState('current');
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [autoPromptShown, setAutoPromptShown] = useState(false);
  const [creatingShareForOrderId, setCreatingShareForOrderId] = useState(null);
  const [invoiceBannerVisible, setInvoiceBannerVisible] = useState(true);
  const { language = 'ar' } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const insideSyria = isInsideSyria(getUserRegion());
  const { addToCart } = useCart();

  const toggleOrderExpansion = (orderId) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  useEffect(() => {
    async function loadSession() {
      const unifiedSession = await getUnifiedSession();
      setSession(unifiedSession);

      let resolvedAppUserId = null;
      const sessionEmail = unifiedSession?.email || null;

      try {
        const { data: authData } = await supabase.auth.getUser();
        const authUserId = authData?.user?.id;

        if (authUserId) {
          const { data: userRowByAuth } = await supabase
            .from('users')
            .select('id')
            .or(`auth_id.eq.${authUserId},id.eq.${authUserId}`)
            .maybeSingle();

          resolvedAppUserId = userRowByAuth?.id || authUserId;
        }

        if (!resolvedAppUserId && sessionEmail) {
          const { data: userRowByEmail } = await supabase
            .from('users')
            .select('id')
            .eq('email', sessionEmail)
            .maybeSingle();

          resolvedAppUserId = userRowByEmail?.id || null;
        }
      } catch (error) {
        console.warn('Unable to resolve app user id:', error);
      }

      setAppUserId(resolvedAppUserId);
      setLoadingSession(false);
    }
    loadSession();
  }, []);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders', session?.email, appUserId],
    queryFn: async () => {
      if (!session?.email && !appUserId) return [];

      let orderRows = [];
      let error = null;

      if (appUserId) {
        const ordersQuery = await supabase
          .from('orders')
          .select('*')
          .or([
            `user_id.eq.${appUserId}`,
            `recipient_user_id.eq.${appUserId}`,
            `payer_user_id.eq.${appUserId}`,
            `paid_by_user_id.eq.${appUserId}`,
          ].join(','))
          .order('created_at', { ascending: false });

        orderRows = ordersQuery.data;
        error = ordersQuery.error;
      }

      // Removed legacy user_email fallback query to avoid schema-related 400 noise.
      
      if (error) throw error;

      const safeOrders = Array.isArray(orderRows) ? orderRows : [];
      if (safeOrders.length === 0) return [];

      const orderIds = safeOrders.map((o) => o.id);

      const [
        { data: orderItemsRows, error: itemsError },
        { data: reviewRows, error: reviewError },
        { data: feedbackRows, error: feedbackError },
        { data: proofRows, error: proofsError },
        { data: shareRows, error: sharesError },
      ] = await Promise.all([
        supabase
          .from('order_items')
          .select('*')
          .in('order_id', orderIds),
        supabase
          .from('reviews')
          .select('order_id')
          .in('order_id', orderIds),
        supabase
          .from('order_feedback')
          .select('order_id, reviewer_user_id')
          .in('order_id', orderIds),
        supabase
          .from('delivery_proofs')
          .select('id, order_id, proof_type, public_url, file_path, captured_at, notes')
          .in('order_id', orderIds)
          .order('captured_at', { ascending: false }),
        supabase
          .from('order_share_links')
          .select('id, order_id, token, short_code, status, expires_at, created_at')
          .in('order_id', orderIds)
          .order('created_at', { ascending: false }),
      ]);

      if (itemsError) throw itemsError;
      if (reviewError) throw reviewError;
      if (feedbackError) throw feedbackError;
      if (proofsError) throw proofsError;
      if (sharesError) throw sharesError;

      const itemsByOrderId = (orderItemsRows || []).reduce((acc, item) => {
        const key = item.order_id;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {});

      const reviewedOrderIds = new Set((reviewRows || []).map((r) => r.order_id));
      const feedbackOrderIds = new Set((feedbackRows || []).map((r) => r.order_id));

      const proofsByOrderId = (proofRows || []).reduce((acc, proof) => {
        if (!acc[proof.order_id]) acc[proof.order_id] = [];
        acc[proof.order_id].push(proof);
        return acc;
      }, {});

      const shareLinkByOrderId = (shareRows || []).reduce((acc, share) => {
        if (!acc[share.order_id]) acc[share.order_id] = share;
        return acc;
      }, {});

      return safeOrders.map((order) => {
        const normalizedStatus = normalizeOrderStatus(order.status, order.payment_status);

        const fallbackItems = extractOrderItemsFallback(order);
        const mergedItems = (itemsByOrderId[order.id] && itemsByOrderId[order.id].length > 0)
          ? itemsByOrderId[order.id]
          : fallbackItems;

        return {
        ...order,
        status: normalizedStatus,
        items: mergedItems,
        reviewed: reviewedOrderIds.has(order.id) || feedbackOrderIds.has(order.id),
        feedbackReviewed: feedbackOrderIds.has(order.id),
        deliveryProofs: proofsByOrderId[order.id] || [],
        shareLink: shareLinkByOrderId[order.id] || null,
      };
    });
    },
    enabled: !!session?.email || !!appUserId
  });

  const isOrderReviewed = (order) => Boolean(order?.reviewed || order?.feedbackReviewed);
  const sharedOrders = orders.filter((order) => detectOrderFlowType(order) === 'shared');
  const normalOrders = orders.filter((order) => detectOrderFlowType(order) !== 'shared');
  const currentOrders = normalOrders.filter((order) => order.status !== 'completed');
  const completedOrders = normalOrders.filter((order) => order.status === 'completed');
  const visibleOrders = activeOrdersTab === 'shared' ? sharedOrders : activeOrdersTab === 'completed' ? completedOrders : currentOrders;

  const handleReorder = (order) => {
    const items = Array.isArray(order.items) ? order.items : [];
    items.forEach(item => {
      addToCart({
        id: item.product_id || item.id,
        product_id: item.product_id || item.id,
        name: item.product_name || item.name_ar || item.name || '',
        name_ar: item.name_ar || item.product_name || item.name || '',
        image_url: item.image_url || item.image || '',
        customer_price: Number(item.price_syp || item.priceSYP || item.customer_price || item.price || 0),
        price: Number(item.price_syp || item.priceSYP || item.customer_price || item.price || 0),
        quantity: item.quantity || 1,
      });
    });
    toast.success(language === 'ar' ? 'تمت إضافة المنتجات إلى السلة' : 'Items added to cart');
    navigate('/Cart');
  };

  const createShareLinkForOrder = async (order) => {
    try {
      setCreatingShareForOrderId(order.id);

      let data = null;
      let error = null;

      const rpcResult = await supabase.rpc('create_order_share_link', {
        p_order_id: order.id,
        p_expires_in_hours: 72,
        p_recipient_name: order.recipient_details?.name || null,
        p_recipient_contact: order.recipient_details?.phone || null,
        p_notes: 'Generated from My Orders',
      });

      data = rpcResult.data;
      error = rpcResult.error;

      const missingShareLinkRpc =
        String(error?.code || '') === 'PGRST202'
        || String(error?.code || '') === '42883'
        || String(error?.message || '').toLowerCase().includes('gen_random_bytes')
        || String(error?.message || '').toLowerCase().includes('create_order_share_link')
        || String(error?.message || '').toLowerCase().includes('404');

      // Fallback when RPC is missing: direct insert into order_share_links
      if (missingShareLinkRpc) {
        const rawToken = `${order.id}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        const token = rawToken.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
        const short_code = Math.random().toString(36).slice(2, 8).toUpperCase();
        const expiresAt = new Date(Date.now() + (72 * 60 * 60 * 1000)).toISOString();

        const insertResult = await supabase
          .from('order_share_links')
          .insert([
            {
              order_id: order.id,
              token,
              short_code,
              status: 'active',
              expires_at: expiresAt,
              recipient_name: order.recipient_details?.name || null,
              recipient_contact: order.recipient_details?.phone || null,
              notes: 'Generated from My Orders (client fallback)',
            },
          ])
          .select('token, short_code')
          .single();

        data = insertResult.data;
        error = insertResult.error;
      }

      if (error) throw error;

      const shareToken = data?.token;
      const shareCode = data?.short_code;
      const shareUrl = buildPublicAppUrl(`/shared-pay/${shareToken}`);

      const items = Array.isArray(order.items) ? order.items : [];
      const compactItems = items.slice(0, 8).map((item, idx) => {
        const qty = Number(item?.quantity || 1) || 1;
        const unitPrice = Number(item?.price_syp ?? item?.priceSYP ?? item?.price ?? 0) || 0;
        const lineTotal = unitPrice * qty;
        const itemName = item?.product_name || item?.name_ar || item?.name || 'منتج';
        return `${idx + 1}) ${itemName} × ${qty} = ${Math.round(lineTotal).toLocaleString('en-US')} ل.س`;
      }).join('\n');

      const moreItemsNote = items.length > 8 ? `\n... +${items.length - 8} منتجات إضافية` : '';
      const totalSyp = Number(order?.total_syp ?? 0) || 0;
      const totalUsd = Number(order?.total_amount ?? order?.total_usd ?? 0) || 0;

      const shareMessage = language === 'ar'
        ? [
          'يا غالي/يا غالية ❤️',
          'هذا رابط دفع طلبي من تطبيق واصل داخل سوريا، وبإمكانك الدفع مباشرة من الرابط التالي:',
          shareUrl,
          '',
          'تفاصيل الطلب:',
          `- رقم الطلب: ${order.order_number || order.id}`,
          `- اسم المستلم: ${order.recipient_details?.name || 'غير محدد'}`,
          `- رقم المستلم: ${order.recipient_details?.phone || 'غير محدد'}`,
          `- العنوان: ${order.recipient_details?.address || order.delivery_address || 'غير محدد'}`,
          '',
          'المنتجات:',
          compactItems || '- لا توجد عناصر',
          moreItemsNote,
          '',
          `الإجمالي: ${Math.round(totalSyp).toLocaleString('en-US')} ل.س (حوالي $${totalUsd.toFixed(2)})`,
          `الكود: ${shareCode}`,
          '',
          'مهم: لازم تسجل/تسجلي دخول أولًا في تطبيق واصل ثم إكمال الدفع بأمان.',
          'الله يسعدك مقدمًا 🤍',
        ].filter(Boolean).join('\n')
        : [
          'Shared Wasel payment link:',
          shareUrl,
          `Order: ${order.order_number || order.id}`,
          `Recipient: ${order.recipient_details?.name || '-'}`,
          `Phone: ${order.recipient_details?.phone || '-'}`,
          `Code: ${shareCode}`,
        ].join('\n');

      await navigator.clipboard.writeText(shareMessage);
      toast.success(language === 'ar' ? 'تم إنشاء الرابط ونسخه' : 'Payment link created and copied');
    } catch (error) {
      console.error('Share link create error:', error);
      toast.error(language === 'ar' ? 'تعذر إنشاء رابط المشاركة' : 'Failed to create share link');
    } finally {
      setCreatingShareForOrderId(null);
    }
  };

  useEffect(() => {
    if (!orders.length || autoPromptShown || reviewingOrder) return;

    const unratedCompleted = orders.find((order) => (
      order.status === 'completed' &&
      !isOrderReviewed(order) &&
      Array.isArray(order.items) &&
      order.items.length > 0
    ));

    if (unratedCompleted) {
      setReviewingOrder(unratedCompleted);
      setAutoPromptShown(true);
      toast.info(language === 'ar' ? 'قيّم طلبك الأخير لمساعدتنا على التحسين' : 'Rate your latest delivered order');
    }
  }, [orders, autoPromptShown, reviewingOrder, language]);

  useEffect(() => {
    if (!location.state?.showInvoicePrompt) return;

    const message = language === 'ar'
      ? 'يمكنك تحميل الفاتورة الآن من زر "تحميل الفاتورة"'
      : 'You can download your invoice now';

    const timers = [0, 1200, 2400].map((delay) => setTimeout(() => toast.success(message), delay));

    const clearStateTimer = setTimeout(() => {
      navigate(location.pathname, { replace: true, state: {} });
    }, 2600);

    return () => {
      timers.forEach((id) => clearTimeout(id));
      clearTimeout(clearStateTimer);
    };
  }, [location.pathname, location.state, navigate, language]);

  useEffect(() => {
    const targetTab = location.state?.activeOrdersTab;
    if (!targetTab) return;
    if (['current', 'completed', 'shared'].includes(targetTab)) {
      setActiveOrdersTab(targetTab);
    }
  }, [location.state]);

  const handleSubmitReview = async (reviewPayload) => {
    try {
      const productReviews = Array.isArray(reviewPayload)
        ? reviewPayload
        : (Array.isArray(reviewPayload?.productReviews) ? reviewPayload.productReviews : []);

      const serviceReview = Array.isArray(reviewPayload)
        ? null
        : reviewPayload?.serviceReview;

      if (!productReviews.length) {
        throw new Error('No review items provided');
      }

      const reviewerRole = (() => {
        const payerId = reviewingOrder?.payer_user_id;
        if (!appUserId || !payerId) return 'single';
        if (payerId === appUserId) return 'payer';
        if (payerId !== appUserId) return 'recipient';
        return 'single';
      })();

      const uuidProductReviews = productReviews.filter((r) => isUuid(r.item_id));
      let error = null;

      // Save to reviews table only when product IDs are valid UUIDs.
      if (uuidProductReviews.length > 0) {
        const primaryRows = uuidProductReviews.map((r) => ({
          order_id: r.order_id,
          item_type: r.item_type || 'product',
          item_id: r.item_id,
          rating: r.rating,
          comment: r.comment || '',
          user_id: appUserId,
          reviewer_user_id: appUserId,
          reviewer_role: reviewerRole,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        const primaryResult = await supabase
          .from('reviews')
          .upsert(primaryRows, {
            onConflict: 'order_id,item_type,item_id,reviewer_user_id,reviewer_role',
          });

        error = primaryResult.error;

        // Some DB environments don't have a matching unique index for this onConflict.
        // Fallback to plain insert instead of failing the whole review flow.
        if (error && String(error?.code || '') === '42P10') {
          const insertResult = await supabase
            .from('reviews')
            .insert(primaryRows);
          error = insertResult.error;
        }
      }

      // Legacy fallback: some DBs still require product_id/content instead of item_type/item_id.
      const needsLegacyFallback = !!error && (
        String(error?.code || '') === 'PGRST204'
        || String(error?.code || '') === '42703'
        || String(error?.message || '').toLowerCase().includes('item_type')
        || String(error?.message || '').toLowerCase().includes('item_id')
      );

      if (needsLegacyFallback) {
        const legacyRows = productReviews
          .map((r) => {
            const maybeProductId = r.item_id;
            if (!isUuid(maybeProductId)) return null;
            return {
              user_id: appUserId,
              product_id: maybeProductId,
              order_id: r.order_id,
              rating: r.rating,
              content: r.comment || '',
              title: null,
              is_verified_purchase: true,
              reviewer_user_id: appUserId,
              reviewer_role: reviewerRole,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
          })
          .filter(Boolean);

        if (!legacyRows.length) {
          throw error;
        }

        const legacyResult = await supabase
          .from('reviews')
          .upsert(legacyRows, {
            onConflict: 'user_id,product_id,order_id',
          });

        error = legacyResult.error;

        if (error && String(error?.code || '') === '42P10') {
          const legacyInsertResult = await supabase
            .from('reviews')
            .insert(legacyRows);
          error = legacyInsertResult.error;
        }
      }

      if (error) throw error;

      if (appUserId) {
        const productAvg = Math.round(productReviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / Math.max(productReviews.length, 1));
        const serviceRating = Number(serviceReview?.rating || 0) || 0;
        const finalOverall = Math.max(1, Math.min(5, serviceRating || productAvg));
        const combinedComment = productReviews
          .map((r) => r.comment)
          .filter(Boolean)
          .join('\n')
          .slice(0, 1500);

        const serviceComment = String(serviceReview?.comment || '').trim();
        const mergedComment = [combinedComment, serviceComment].filter(Boolean).join('\n\n').slice(0, 1500);
        const itemRatingsPayload = productReviews.map((r) => ({
          item_id: r.item_id,
          rating: Number(r.rating || 0),
          comment: String(r.comment || ''),
        }));

        let { error: feedbackError } = await supabase
          .from('order_feedback')
          .upsert({
            order_id: productReviews[0]?.order_id,
            reviewer_user_id: appUserId,
            reviewer_role: reviewerRole,
            overall_rating: finalOverall,
            product_quality_rating: productAvg,
            delivery_rating: finalOverall,
            support_rating: finalOverall,
            comment: mergedComment || null,
            metadata: {
              service_rating: serviceRating || null,
              product_average_rating: productAvg,
              item_ratings: itemRatingsPayload,
            },
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'order_id,reviewer_user_id,reviewer_role',
          });

        if (feedbackError && String(feedbackError?.code || '') === '42P10') {
          const orderId = productReviews[0]?.order_id;
          const existing = await supabase
            .from('order_feedback')
            .select('id')
            .eq('order_id', orderId)
            .eq('reviewer_user_id', appUserId)
            .eq('reviewer_role', reviewerRole)
            .maybeSingle();

          if (existing.data?.id) {
            const updateResult = await supabase
              .from('order_feedback')
              .update({
                overall_rating: finalOverall,
                product_quality_rating: productAvg,
                delivery_rating: finalOverall,
                support_rating: finalOverall,
                comment: mergedComment || null,
                metadata: {
                  service_rating: serviceRating || null,
                  product_average_rating: productAvg,
                  item_ratings: itemRatingsPayload,
                },
                updated_at: new Date().toISOString(),
              })
              .eq('id', existing.data.id);
            feedbackError = updateResult.error;
          } else {
            const insertResult = await supabase
              .from('order_feedback')
              .insert({
                order_id: orderId,
                reviewer_user_id: appUserId,
                reviewer_role: reviewerRole,
                overall_rating: finalOverall,
                product_quality_rating: productAvg,
                delivery_rating: finalOverall,
                support_rating: finalOverall,
                comment: mergedComment || null,
                metadata: {
                  service_rating: serviceRating || null,
                  product_average_rating: productAvg,
                  item_ratings: itemRatingsPayload,
                },
                updated_at: new Date().toISOString(),
              });
            feedbackError = insertResult.error;
          }
        }

        if (feedbackError) {
          console.warn('Order feedback upsert warning:', feedbackError);
        }
      }

      // Do not PATCH orders.reviewed here; in production this can fail with RLS/schema drift.
      // The UI already derives reviewed state from reviews/order_feedback records.

      await queryClient.invalidateQueries({ queryKey: ['my-orders', session?.email, appUserId] });
      setAutoPromptShown(true);

      toast.success('شكراً لك! تم إرسال تقييمك بنجاح');
      setReviewingOrder(null);

      // Notify supervisor about the new review
      try {
        const avgRating = productReviews.reduce((s, r) => s + Number(r.rating || 0), 0) / Math.max(productReviews.length, 1);
        await notifyAdminUsers('new_review', reviewingOrder, { rating: Math.round(avgRating) });
      } catch (notifErr) {
        console.warn('Review notification to supervisor failed:', notifErr);
      }
    } catch (error) {
      console.error('Review error:', error);
      toast.error('حدث خطأ في إرسال التقييم');
    }
  };

  const downloadInvoiceForOrder = async (order) => {
    try {
      await downloadOrderInvoicePdf(order, { language });
      toast.success(language === 'ar' ? 'تم تحميل الفاتورة' : 'Invoice downloaded');
    } catch (error) {
      console.error('Invoice download error:', error);
      toast.error(language === 'ar' ? 'تعذر تحميل الفاتورة' : 'Failed to download invoice');
    }
  };

  if (loadingSession) {
    return <div className="min-h-screen bg-[#FDFBF7] flex justify-center items-center"><div className="loader" /></div>;
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl text-center border border-[#F5E6D3]"
        >
          <div className="w-16 h-16 bg-[#1B4332] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[#1B4332] mb-2 font-['Cairo']">
            تسجيل الدخول مطلوب
          </h2>
          <p className="text-[#1B4332]/60 mb-6 font-['Cairo']">
            لمتابعة طلباتك السابقة، يرجى تسجيل الدخول برقمك أو بريدك الإلكتروني.
          </p>
          <Link to={createPageUrl('Home')}> {/* Assuming Login Modal is on Home or Global */}
             <Button className="w-full bg-[#1B4332] hover:bg-[#2D6A4F] h-12 rounded-xl font-bold">
               العودة للرئيسية
             </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-[#FDFBF7]'} p-4 pb-24 font-['Cairo']`}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
           <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-[#1B4332]'}`}>طلباتي</h1>
           <span className="bg-[#1B4332]/10 text-[#1B4332] px-3 py-1 rounded-full text-sm font-bold">{orders.length} طلب</span>
        </div>

        {invoiceBannerVisible && location.state?.showInvoicePrompt && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-[#FBBF24] bg-gradient-to-r from-[#FFFBEB] to-[#FEF3C7] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-[#92400E]">{language === 'ar' ? 'تم إنشاء طلبك بنجاح' : 'Order created successfully'}</p>
                <p className="text-xs text-[#B45309]">{language === 'ar' ? 'يمكنك تحميل الفاتورة الآن من هذا الزر أو من كل طلب بالأسفل' : 'Download invoice now or from each order below'}</p>
              </div>
              <div className="flex items-center gap-2">
                {(() => {
                  const targetOrder = orders.find((o) => o.id === location.state?.invoiceOrderId) || orders[0];
                  return targetOrder ? (
                    <Button onClick={() => downloadInvoiceForOrder(targetOrder)} className="bg-[#1B4332] hover:bg-[#2D6A4F] text-white">
                      {language === 'ar' ? 'تحميل الفاتورة' : 'Download invoice'}
                    </Button>
                  ) : null;
                })()}
                <Button variant="outline" onClick={() => setInvoiceBannerVisible(false)} className="border-[#D6A756] text-[#92400E]">
                  {language === 'ar' ? 'إخفاء' : 'Hide'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {orders.length === 0 ? (
          isLoading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 flex flex-col items-center justify-center gap-4"
            >
              <SmartLottie
                animationPath={ANIMATION_PRESETS.pageLoading.path}
                width={100}
                height={100}
                trigger="immediate"
                loop={true}
              />
              <p className="text-gray-600 font-semibold">{language === 'ar' ? 'جاري تحميل طلباتك...' : 'Loading your orders...'}</p>
            </motion.div>
          ) : (
            <div className="text-center py-12 text-gray-500 flex flex-col items-center justify-center">
              <SmartLottie
                animationPath={ANIMATION_PRESETS.emptyOrders.path}
                width={150}
                height={150}
                trigger="immediate"
              />
              <p className="mt-4">{language === 'ar' ? 'لا توجد طلبات سابقة' : 'No orders yet'}</p>
            </div>
          )
        ) : (
           <div className="space-y-4">
              <div className="rounded-xl border border-[#E5E7EB] bg-white p-1.5 flex gap-1.5">
                <Button
                  type="button"
                  onClick={() => setActiveOrdersTab('current')}
                  className={`flex-1 text-xs py-2 ${activeOrdersTab === 'current' ? 'bg-[#1B4332] text-white' : 'bg-transparent text-[#1B4332] hover:bg-[#1B4332]/5'}`}
                >
                  {language === 'ar' ? 'الحالية' : 'Current'} ({currentOrders.length})
                </Button>
                <Button
                  type="button"
                  onClick={() => setActiveOrdersTab('completed')}
                  className={`flex-1 text-xs py-2 ${activeOrdersTab === 'completed' ? 'bg-[#1B4332] text-white' : 'bg-transparent text-[#1B4332] hover:bg-[#1B4332]/5'}`}
                >
                  {language === 'ar' ? 'المكتملة' : 'Completed'} ({completedOrders.length})
                </Button>
                <Button
                  type="button"
                  onClick={() => setActiveOrdersTab('shared')}
                  className={`flex-1 text-xs py-2 ${activeOrdersTab === 'shared' ? 'bg-violet-600 text-white' : 'bg-transparent text-violet-600 hover:bg-violet-50'}`}
                >
                  <Users className="w-3 h-3 ml-1 inline" />
                  {language === 'ar' ? 'مشتركة' : 'Shared'} ({sharedOrders.length})
                </Button>
              </div>

              {visibleOrders.length === 0 && (
                <div className="text-center py-8 text-gray-500 bg-white rounded-2xl border border-[#F5E6D3]">
                  {activeOrdersTab === 'completed'
                    ? (language === 'ar' ? 'لا توجد طلبات مكتملة بعد' : 'No completed orders yet')
                    : activeOrdersTab === 'shared'
                      ? (language === 'ar' ? 'لا توجد سلال مشتركة حالياً' : 'No shared carts yet')
                      : (language === 'ar' ? 'لا توجد طلبات حالية' : 'No current orders')}
                </div>
              )}

              {visibleOrders.map((order, idx) => {
                  const statusConfig = statusOptions[order.status] || statusOptions.pending;
                  const StatusIcon = statusConfig.icon;
                  const flowType = detectOrderFlowType(order);
                  
                  return (
                    <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#F5E6D3]'} p-5 rounded-2xl shadow-sm border hover:shadow-md transition-shadow`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                                <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-[#1B4332]'} text-lg`}>
                                  {language === 'ar' ? 'طلب' : 'Order'} #{order.order_number || order.id.slice(0, 8)}
                                </h3>
                                <p className="text-xs text-gray-400 mt-1">
                                    {new Date(order.created_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { 
                                      weekday: 'long', 
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric' 
                                    })}
                                </p>
                                <p className="text-[11px] text-gray-500 mt-1">
                                  {new Date(order.created_at).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                            <Badge className={`${statusConfig.color} border-0 hover:bg-opacity-80 px-3 py-1 shrink-0`}>
                                <StatusIcon className="w-3 h-3 ml-1" />
                                {statusConfig.label}
                            </Badge>
                            <Badge className={`${flowBadgeClass(flowType)} border-0 hover:bg-opacity-80 px-3 py-1 shrink-0`}>
                              {flowLabel(flowType, language)}
                            </Badge>
                        </div>
                        
                        {/* Order Timeline */}
                        {expandedOrders.has(order.id) && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-4"
                          >
                            <OrderTimeline status={order.status} language={language} />
                          </motion.div>
                        )}
                        
                        <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
                           <div className="flex items-center gap-2 mb-1">
                              <MapPin className="w-4 h-4 text-[#1B4332]" />
                              <span>{order.recipient_details?.name || (language === 'ar' ? 'مستلم' : 'Recipient')} - {order.recipient_details?.address}</span>
                           </div>
                           <p className="mr-6 text-xs opacity-70">
                              {language === 'ar' ? 'إجمالي:' : 'Total:'} {order.total_amount?.toLocaleString('en-US') || '0'} {order.currency}
                           </p>
                           {detectOrderFlowType(order) === 'shared' && order.sender_details?.name && (
                             <p className="mr-6 text-xs text-violet-600 mt-1 font-semibold">
                               {language === 'ar' ? '💜 المرسل (الدافع):' : '💜 Sender (Payer):'} {order.sender_details.name}
                             </p>
                           )}
                           {(() => {
                               const userTime = order.recipient_details?.delivery_time;
                               const supervisorTime = order.delivery_time || `${order.preferred_delivery_date || ''} ${order.preferred_delivery_time || ''}`.trim();
                               const timeToShow = supervisorTime || userTime;
                               if (!timeToShow) return null;
                               return (
                                 <p className="mr-6 text-xs text-[#1B4332] mt-1 font-semibold flex items-center gap-1">
                                   <Clock className="w-3 h-3" />
                                   {supervisorTime ? (language === 'ar' ? `موعد التسليم المتوقع (من المشرف): ${supervisorTime}` : `Supervisor Expected: ${supervisorTime}`) : (language === 'ar' ? `الموعد المطلوب: ${userTime}` : `Requested: ${userTime}`)}
                                 </p>
                               );
                             })()}
                        </div>

                        {/* Mini items preview (collapsed) */}
                        {!expandedOrders.has(order.id) && Array.isArray(order.items) && order.items.length > 0 && (
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            {order.items.slice(0, 3).map((item, idx) => (
                              <span key={idx} className={`text-xs px-2.5 py-1 rounded-full ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                {item?.product_name || item?.name_ar || item?.name || `صنف ${idx + 1}`} ×{item?.quantity || 1}
                              </span>
                            ))}
                            {order.items.length > 3 && (
                              <span className={`text-xs px-2 py-1 rounded-full ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                                +{order.items.length - 3} {language === 'ar' ? 'أصناف' : 'more'}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2">
                           <Button
                              onClick={() => toggleOrderExpansion(order.id)}
                              variant="outline"
                              className="flex-1 border-[#1B4332]/20 text-[#1B4332] hover:bg-[#1B4332]/5"
                           >
                               {expandedOrders.has(order.id) 
                                 ? (language === 'ar' ? 'إخفاء التفاصيل' : 'Hide Details')
                                 : (language === 'ar' ? 'تتبع الطلب' : 'Track Order')
                               }
                           </Button>
                           {(order.status === 'completed' || order.status === 'processing') && (
                             <Button
                               onClick={() => downloadInvoiceForOrder(order)}
                               variant="outline"
                               className="border-[#1B4332]/20 text-[#1B4332]"
                             >
                               {language === 'ar' ? 'الفاتورة' : 'Invoice'}
                             </Button>
                           )}
                             {order.status === 'completed' && !isOrderReviewed(order) && (
                               <Button
                                   onClick={() => setReviewingOrder(order)}
                                   className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold"
                               >
                                   <Star className="w-4 h-4 ml-1" />
                                   {language === 'ar' ? 'قيّم' : 'Rate'}
                               </Button>
                           )}

                           {order.status === 'completed' && (
                             <Button
                               onClick={() => handleReorder(order)}
                               variant="outline"
                               className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                             >
                               <RotateCcw className="w-4 h-4 ml-1" />
                               {language === 'ar' ? 'إعادة الطلب' : 'Reorder'}
                             </Button>
                           )}
                        </div>



                        {expandedOrders.has(order.id) && (
                          <div className={`mt-3 p-4 rounded-xl border ${isDarkMode ? 'border-gray-700 bg-gray-800/60' : 'border-[#E5E7EB] bg-[#FAFCFB]'} text-sm`}>
                            <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-[#1B4332]'} mb-3`}>{language === 'ar' ? 'تفاصيل الطلب' : 'Order details'}</p>

                            {/* Sender & Recipient cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/60' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                                <p className={`text-[11px] font-bold uppercase tracking-wide mb-1.5 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{language === 'ar' ? '📤 المرسل' : '📤 Sender'}</p>
                                <p className={`text-xs font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{order.sender_details?.name || '-'}</p>
                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{order.sender_details?.phone || '-'}</p>
                              </div>
                              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/60' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                                <p className={`text-[11px] font-bold uppercase tracking-wide mb-1.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>{language === 'ar' ? '📥 المستلم' : '📥 Recipient'}</p>
                                <p className={`text-xs font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{order.recipient_details?.name || '-'}</p>
                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{order.recipient_details?.phone || '-'}</p>
                              </div>
                            </div>

                            {/* Address */}
                            <div className={`flex items-start gap-2 p-2.5 rounded-lg text-xs mb-3 ${isDarkMode ? 'bg-gray-700/40 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
                              <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                              <span>{order.recipient_details?.address || order.delivery_address || '-'}</span>
                            </div>

                            {/* Payment info */}
                            <div className={`flex items-center gap-4 text-xs mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              <span>{language === 'ar' ? 'الدفع:' : 'Payment:'} <strong className={isDarkMode ? 'text-gray-200' : 'text-gray-800'}>{order.payment_method || '-'}</strong></span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                                {order.payment_status || '-'}
                              </span>
                            </div>

                            {/* Items list with images */}
                            {Array.isArray(order.items) && order.items.length > 0 && (
                              <div className="space-y-2">
                                <p className={`text-xs font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{language === 'ar' ? `الأصناف (${order.items.length})` : `Items (${order.items.length})`}</p>
                                {order.items.map((item, itemIdx) => (
                                  <div key={`${order.id}-item-${itemIdx}`} className={`flex items-center gap-3 rounded-xl border ${isDarkMode ? 'border-gray-600 bg-gray-700/40' : 'border-gray-200 bg-white'} p-2.5`}>
                                    {(item?.image_url || item?.image) && (
                                      <img
                                        src={item.image_url || item.image}
                                        alt={item?.product_name || ''}
                                        className="w-11 h-11 rounded-lg object-cover shrink-0 bg-gray-200"
                                        loading="lazy"
                                      />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-xs font-semibold truncate ${isDarkMode ? 'text-gray-200' : 'text-[#1B4332]'}`}>
                                        {item?.is_gift && '🎁 '}{item?.product_name || item?.name_ar || item?.name || `Item ${itemIdx + 1}`}
                                      </p>
                                      {item?.notes && <p className={`text-[10px] truncate ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{item.notes}</p>}
                                    </div>
                                    <div className="text-left shrink-0">
                                      <span className={`text-xs font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>×{item?.quantity || 1}</span>
                                      {(item?.price || item?.price_usd) && (
                                        <p className={`text-[10px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{(item.price || item.price_usd)?.toLocaleString()} {order.currency || 'USD'}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {Array.isArray(order.deliveryProofs) && order.deliveryProofs.length > 0 && (
                          <div className={`mt-3 p-4 rounded-2xl ${isDarkMode ? 'bg-green-900/30 border-green-800' : 'bg-green-50 border-green-200'} border`}>
                            <div className={`flex items-center gap-2 ${isDarkMode ? 'text-green-400' : 'text-green-800'} font-bold text-sm mb-3`}>
                              <Camera className="w-4 h-4" />
                              {language === 'ar' ? '📸 إثبات التسليم' : '📸 Delivery Proof'}
                            </div>
                            <div className="space-y-3">
                              {order.deliveryProofs.slice(0, 3).map((proof) => {
                                const proofUrl = proof.public_url || proof.file_path || '#';
                                const isVideo = String(proof.proof_type || '').toLowerCase().includes('video') || /\.(mp4|mov|webm)$/i.test(proofUrl);
                                return (
                                  <div key={proof.id} className={`rounded-xl border ${isDarkMode ? 'border-green-800 bg-gray-800' : 'border-green-200 bg-white'} overflow-hidden`}>
                                    {isVideo ? (
                                      <div className="w-full rounded-t-xl overflow-hidden bg-black">
                                        <video
                                          controls
                                          className="w-full h-auto max-h-[60vh] object-contain"
                                          src={proofUrl}
                                        />
                                      </div>
                                    ) : (
                                      <div className="w-full rounded-t-xl overflow-hidden bg-black/5">
                                        <img
                                          className="w-full h-auto max-h-[60vh] object-contain"
                                          src={proofUrl}
                                          alt="delivery-proof"
                                          loading="lazy"
                                        />
                                      </div>
                                    )}
                                    <div className="flex items-center justify-between p-2.5">
                                      <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {proof.proof_type === 'photo' ? '📷 صورة' : proof.proof_type === 'video' ? '🎥 فيديو' : proof.proof_type} - {new Date(proof.captured_at || proof.created_at).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                                      </span>
                                      <a
                                        href={proofUrl}
                                        download
                                        target="_blank"
                                        rel="noreferrer"
                                        className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg ${isDarkMode ? 'bg-green-800 text-green-200 hover:bg-green-700' : 'bg-green-100 text-green-700 hover:bg-green-200'} transition-colors`}
                                      >
                                        ⬇️ {language === 'ar' ? 'تحميل' : 'Download'}
                                      </a>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {order.status === 'completed' && (
                          <div className={`mt-3 p-3 rounded-xl ${isDarkMode ? 'bg-green-900/30 border-green-800 text-green-400' : 'bg-green-50 border-green-200 text-green-800'} border text-sm`}>
                            <p className="font-bold">{language === 'ar' ? 'شكرا لك، تم استلام الطلب بنجاح' : 'Thank you, your order has been delivered successfully'}</p>
                            <p className="text-xs mt-1 opacity-80">{language === 'ar' ? 'يمكنك مراجعة صور/فيديو التوثيق أعلاه.' : 'You can review delivery proof photos/videos above.'}</p>
                            {isOrderReviewed(order) && (
                              <p className="text-xs mt-1 font-semibold">{language === 'ar' ? 'شكرا لتقييمك، تم استلام ملاحظاتك.' : 'Thank you for your rating, we received your feedback.'}</p>
                            )}
                          </div>
                        )}
                    </motion.div>
                  );
              })}
           </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewingOrder && (
        <ReviewModal
          order={reviewingOrder}
          onClose={() => setReviewingOrder(null)}
          onSubmit={handleSubmitReview}
        />
      )}
    </div>
  );
}