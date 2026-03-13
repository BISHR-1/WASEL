import { supabase } from '@/lib/supabase';

const DISPATCH_LOG_STORAGE_KEY = 'wasel_notification_dispatch_logs_v1';
const DISPATCH_EVENT_NAME = 'wasel_notification_dispatch';
const MAX_DISPATCH_LOGS = 40;

function toUniqueStrings(values) {
  return Array.from(new Set((values || []).filter(Boolean).map((value) => String(value))));
}

function buildOrderLink(order) {
  const token = order?.order_number || order?.id;
  if (!token) return '/MyOrders';
  return `/TrackOrder?order=${encodeURIComponent(token)}`;
}

function getEventContent(eventType, order, context = {}) {
  if (eventType === 'new_order_created') {
    const paymentMethod = String(context?.paymentMethod || 'unknown');
    const methodNames = { paypal: 'باي بال 💳', whatsapp: 'واتساب 💬', wallet: 'المحفظة 💰', shared_cart: 'سلة مشتركة 🛒' };
    const methodLabel = methodNames[paymentMethod] || paymentMethod;
    const totalUsd = Number(order?.total_usd || order?.total_amount || 0).toFixed(2);
    return {
      title: '🆕 طلب جديد وصل',
      body: `طلب جديد عبر ${methodLabel} بمبلغ $${totalUsd}`,
      type: 'new_order',
      data: {
        type: 'order_update',
        order_id: String(order?.id || ''),
        event: 'new_order_created',
        payment_method: paymentMethod,
      },
    };
  }

  if (eventType === 'order_assigned') {
    return {
      title: '🛵 طلب جديد للتوصيل',
      body: 'تم فرز طلب لك. ابدأ التوصيل الآن بكل حماس.',
      type: 'order_assigned',
      data: {
        type: 'order_update',
        order_id: String(order?.id || ''),
        event: 'order_assigned',
      },
    };
  }

  if (eventType === 'shared_payment_success') {
    return {
      title: '💳 تم الدفع بنجاح',
      body: 'تم تأكيد دفع طلبك بنجاح. شكرا لك!',
      type: 'payment_success',
      data: {
        type: 'order_update',
        order_id: String(order?.id || ''),
        event: 'shared_payment_success',
      },
    };
  }

  if (eventType === 'shared_cart_paid_creator') {
    const payerName = String(context?.payerName || 'مرسل الهدية');
    return {
      title: '💜 خبر جميل وصل!',
      body: `قام ${payerName} بدفع سلتك المشتركة بكل حب! 🎉 طلبك الآن قيد التجهيز وسيصلك قريباً ❤️`,
      type: 'payment_success',
      data: {
        type: 'order_update',
        order_id: String(order?.id || ''),
        event: 'shared_cart_paid_creator',
      },
    };
  }

  if (eventType === 'shared_cart_paid_payer') {
    const recipientName = String(context?.recipientName || order?.recipient_details?.name || 'المستلم');
    return {
      title: '� شكراً لكرمك!',
      body: `تم دفع السلة المشتركة بنجاح ❤️ طلب ${recipientName} دخل مرحلة التجهيز بفضل دعمك الجميل!`,
      type: 'payment_success',
      data: {
        type: 'order_update',
        order_id: String(order?.id || ''),
        event: 'shared_cart_paid_payer',
      },
    };
  }

  if (eventType === 'shared_order_status_creator') {
    const newStatus = String(context?.newStatus || '').toLowerCase();
    const statusBody = {
      pending: 'طلبك قيد المراجعة حالياً وسيتم تأكيده قريباً.',
      processing: 'تم قبول طلبك ويجري تجهيزه الآن 🌟',
      delivering: 'طلبك في الطريق إليك! سيصلك قريباً 🚚',
      completed: 'تم توصيل طلبك بنجاح! نتمنى لك لحظات جميلة 🎉',
    };
    return {
      title: '📦 تحديث على طلبك',
      body: statusBody[newStatus] || 'صار تحديث جديد على طلبك.',
      type: 'order_update',
      data: {
        type: 'order_update',
        order_id: String(order?.id || ''),
        event: 'shared_order_status_creator',
        new_status: newStatus,
      },
    };
  }

  if (eventType === 'shared_order_status_payer') {
    const recipientName = String(context?.recipientName || order?.recipient_details?.name || 'المستلم');
    const newStatus = String(context?.newStatus || '').toLowerCase();
    const statusBody = {
      pending: `طلب ${recipientName} الآن قيد المراجعة بفضل دعمك ❤️`,
      processing: `بدأ تجهيز طلب ${recipientName} بعد دفعتك الجميلة! شكراً لكرمك 💙`,
      delivering: `الطلب الذي دفعته لـ ${recipientName} أصبح في الطريق إليه! 🚚❤️`,
      completed: `تم توصيل طلب ${recipientName} بنجاح! شكراً لكرمك وحبك 💜🎉`,
    };
    return {
      title: '💙 تحديث على طلب المُستلم',
      body: statusBody[newStatus] || `هناك تحديث جديد على طلب ${recipientName}. شكراً لدعمك ❤️`,
      type: 'order_update',
      data: {
        type: 'order_update',
        order_id: String(order?.id || ''),
        event: 'shared_order_status_payer',
        new_status: newStatus,
      },
    };
  }

  if (eventType === 'delivery_proof_uploaded') {
    return {
      title: '📸 تم رفع إثبات التسليم',
      body: 'تم رفع صور/فيديو توثيق لتسليم طلبك.',
      type: 'order_shipped',
      data: {
        type: 'order_update',
        order_id: String(order?.id || ''),
        event: 'delivery_proof_uploaded',
        proof_type: String(context?.proofType || ''),
      },
    };
  }

  if (eventType === 'order_delivered') {
    return {
      title: '✅ تم تسليم طلبك',
      body: 'وصل طلبك بنجاح. نتمنى لك تجربة سعيدة!',
      type: 'order_delivered',
      data: {
        type: 'order_update',
        order_id: String(order?.id || ''),
        event: 'order_delivered',
      },
    };
  }

  if (eventType === 'order_status_changed') {
    const statusContent = {
      pending: {
        title: '⏳ طلبك قيد المراجعة',
        body: 'استلمنا طلبك وجار تاكيده الآن.',
      },
      processing: {
        title: '👨‍🍳 طلبك قيد التجهيز',
        body: 'تم قبول طلبك ونعمل على تجهيزه.',
      },
      paid: {
        title: '👨‍🍳 طلبك قيد التجهيز',
        body: 'تم قبول طلبك ونعمل على تجهيزه.',
      },
      assigned: {
        title: '👨‍🍳 طلبك قيد التجهيز',
        body: 'تم قبول طلبك ونعمل على تجهيزه.',
      },
      in_progress: {
        title: '👨‍🍳 طلبك قيد التجهيز',
        body: 'تم قبول طلبك ونعمل على تجهيزه.',
      },
      delivering: {
        title: '🚚 طلبك بالطريق إليك',
        body: 'الموصل انطلق وطلبك في الطريق.',
      },
      completed: {
        title: '🎉 تم تسليم طلبك',
        body: 'الحمد لله تم التسليم. صحة وهنا!',
      },
      cancelled: {
        title: '❌ تم إلغاء الطلب',
        body: 'تم إلغاء طلبك. تواصل معنا لأي مساعدة.',
      },
    };
    const newStatus = context?.newStatus || '';
    const content = statusContent[newStatus] || {
      title: '🔔 تحديث على طلبك',
      body: 'صار في تحديث جديد على طلبك.',
    };
    return {
      title: content.title,
      body: content.body,
      type: 'order_update',
      data: {
        type: 'order_update',
        order_id: String(order?.id || ''),
        event: 'order_status_changed',
        new_status: newStatus,
      },
    };
  }

  if (eventType === 'new_review') {
    const rating = Number(context?.rating || 0);
    const stars = '⭐'.repeat(Math.min(rating, 5));
    return {
      title: '📝 تقييم جديد',
      body: `تقييم جديد ${stars} على طلب #${order?.order_number || ''}`,
      type: 'new_review',
      data: {
        type: 'review',
        order_id: String(order?.id || ''),
        event: 'new_review',
        rating: String(rating),
      },
    };
  }

  if (eventType === 'new_chat_message') {
    const senderName = context?.senderName || '';
    return {
      title: '💬 رسالة جديدة',
      body: senderName ? `رسالة جديدة من ${senderName}` : 'لديك رسالة جديدة',
      type: 'chat_message',
      data: {
        type: 'chat',
        conversation_id: String(order?.id || ''),
        event: 'new_chat_message',
      },
    };
  }

  return {
    title: '🔔 تحديث جديد',
    body: 'هناك تحديث جديد على طلبك.',
    type: 'order_update',
    data: {
      type: 'order_update',
      order_id: String(order?.id || ''),
      event: String(eventType || 'order_update'),
    },
  };
}

function isSharedOrder(order) {
  const collaborationMode = String(order?.collaboration_mode || '').toLowerCase();
  const createdVia = String(order?.sender_details?.meta?.created_via || '').toLowerCase();
  return collaborationMode === 'shared' || createdVia === 'shared_cart_link';
}

function resolveSharedAudience(order) {
  const creatorId = order?.recipient_user_id || order?.sender_details?.meta?.shared_cart_creator_id || order?.user_id || null;
  const payerId = order?.paid_by_user_id || order?.payer_user_id || order?.user_id || null;
  return {
    creatorIds: toUniqueStrings([creatorId]),
    payerIds: toUniqueStrings([payerId]),
  };
}

async function resolveAuthUserIds(publicUserIds) {
  const uniqueIds = toUniqueStrings(publicUserIds);
  if (!uniqueIds.length) return [];

  const [{ data: usersRows, error: usersError }, { data: adminRows, error: adminError }] = await Promise.all([
    supabase
      .from('users')
      .select('id, auth_id')
      .or(`id.in.(${uniqueIds.join(',')}),auth_id.in.(${uniqueIds.join(',')})`),
    supabase
      .from('admin_users')
      .select('id')
      .in('id', uniqueIds),
  ]);

  if (usersError) {
    console.warn('resolveAuthUserIds users warning:', usersError);
  }
  if (adminError) {
    console.warn('resolveAuthUserIds admin warning:', adminError);
  }

  const userAuthIds = (usersRows || []).map((row) => row.auth_id || row.id);
  const adminAuthIds = (adminRows || []).map((row) => row.id);
  return toUniqueStrings([...userAuthIds, ...adminAuthIds]);
}

async function createInAppNotifications(publicUserIds, content, order) {
  const uniqueIds = toUniqueStrings(publicUserIds);
  if (!uniqueIds.length) return;

  // notifications.user_id references public.users(id). Targets can be either users.id
  // or auth/admin ids, so we resolve both id and auth_id to public.users.id.
  const { data: existingUsers, error: usersError } = await supabase
    .from('users')
    .select('id, auth_id')
    .or(`id.in.(${uniqueIds.join(',')}),auth_id.in.(${uniqueIds.join(',')})`);

  if (usersError) {
    console.warn('createInAppNotifications users resolution warning:', usersError);
    return;
  }

  const existingPublicIds = toUniqueStrings((existingUsers || []).map((row) => row.id));
  if (!existingPublicIds.length) return;

  const now = new Date().toISOString();
  const rows = existingPublicIds.map((userId) => ({
    user_id: userId,
    title: content.title,
    message: content.body,
    type: content.type,
    is_read: false,
    link: buildOrderLink(order),
    created_at: now,
  }));

  const { error } = await supabase.from('notifications').insert(rows);
  if (error) {
    console.warn('createInAppNotifications warning:', error);
  }
}

async function sendFirebasePush(authUserIds, content) {
  const userIds = toUniqueStrings(authUserIds);
  if (!userIds.length) {
    return { success: false, sent: 0, failed: 0, total: 0, message: 'No target auth users' };
  }

  const { data, error } = await supabase.functions.invoke('send-notification', {
    body: {
      userIds,
      title: content.title,
      body: content.body,
      data: Object.fromEntries(
        Object.entries(content.data || {}).map(([k, v]) => [k, String(v ?? '')])
      ),
    },
  });

  if (error) {
    console.warn('sendFirebasePush warning:', error);
    return { success: false, sent: 0, failed: userIds.length, total: userIds.length, error: error.message };
  }

  return {
    success: Boolean(data?.success),
    sent: Number(data?.sent || 0),
    failed: Number(data?.failed || 0),
    total: Number(data?.total || userIds.length),
    raw: data,
  };
}

async function resolveAdminPublicUserIds() {
  const [usersResult, adminsResult] = await Promise.all([
    supabase
      .from('users')
      .select('id, role')
      .in('role', ['admin', 'super_admin', 'support', 'operator', 'supervisor']),
    supabase
      .from('admin_users')
      .select('id, is_active')
      .eq('is_active', true),
  ]);

  if (usersResult.error) {
    console.warn('resolveAdminPublicUserIds users warning:', usersResult.error);
  }
  if (adminsResult.error) {
    console.warn('resolveAdminPublicUserIds admin_users warning:', adminsResult.error);
  }

  return toUniqueStrings([
    ...(usersResult.data || []).map((row) => row.id),
    ...(adminsResult.data || []).map((row) => row.id),
  ]);
}

async function dispatchToPublicUsers(eventType, order, publicUserIds, context = {}) {
  try {
    const content = getEventContent(eventType, order, context);
    const authUserIds = await resolveAuthUserIds(publicUserIds);

    const [, pushResult] = await Promise.all([
      createInAppNotifications(publicUserIds, content, order),
      sendFirebasePush(authUserIds, content),
    ]);

    const dispatchSummary = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      created_at: new Date().toISOString(),
      event_type: eventType,
      order_id: order?.id || null,
      order_number: order?.order_number || null,
      public_targets: toUniqueStrings(publicUserIds).length,
      auth_targets: authUserIds.length,
      sent: Number(pushResult?.sent || 0),
      failed: Number(pushResult?.failed || 0),
      total: Number(pushResult?.total || authUserIds.length || 0),
      push_success: Boolean(pushResult?.success),
      note: pushResult?.message || pushResult?.error || null,
    };

    pushDispatchLog(dispatchSummary);
    return dispatchSummary;
  } catch (error) {
    console.warn('dispatchToPublicUsers warning:', error);
    const failedSummary = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      created_at: new Date().toISOString(),
      event_type: eventType,
      order_id: order?.id || null,
      order_number: order?.order_number || null,
      public_targets: 0,
      auth_targets: 0,
      sent: 0,
      failed: 0,
      total: 0,
      push_success: false,
      note: error?.message || 'Unknown error',
    };
    pushDispatchLog(failedSummary);
    return failedSummary;
  }
}

function pushDispatchLog(logEntry) {
  if (typeof window === 'undefined') return;
  try {
    const existing = JSON.parse(localStorage.getItem(DISPATCH_LOG_STORAGE_KEY) || '[]');
    const logs = Array.isArray(existing) ? existing : [];
    const updated = [logEntry, ...logs].slice(0, MAX_DISPATCH_LOGS);
    localStorage.setItem(DISPATCH_LOG_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(DISPATCH_EVENT_NAME, { detail: logEntry }));
  } catch (error) {
    console.warn('pushDispatchLog warning:', error);
  }
}

export function getNotificationDispatchLogs() {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(DISPATCH_LOG_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const notificationDispatchEventName = DISPATCH_EVENT_NAME;

export async function notifyOrderUsers(eventType, order, context = {}) {
  try {
    if (!order?.id) return { success: false, reason: 'missing_order_id' };

    if (isSharedOrder(order) && ['shared_payment_success', 'order_status_changed', 'order_delivered', 'delivery_proof_uploaded'].includes(eventType)) {
      const { creatorIds, payerIds } = resolveSharedAudience(order);
      const normalizedStatus = eventType === 'order_delivered'
        ? 'completed'
        : (context?.newStatus || (eventType === 'delivery_proof_uploaded' ? 'delivering' : 'processing'));

      const creatorEvent = eventType === 'shared_payment_success' ? 'shared_cart_paid_creator' : 'shared_order_status_creator';
      const payerEvent = eventType === 'shared_payment_success' ? 'shared_cart_paid_payer' : 'shared_order_status_payer';

      const [creatorResult, payerResult] = await Promise.all([
        creatorIds.length
          ? dispatchToPublicUsers(creatorEvent, order, creatorIds, {
            ...context,
            newStatus: normalizedStatus,
          })
          : Promise.resolve(null),
        payerIds.length
          ? dispatchToPublicUsers(payerEvent, order, payerIds, {
            ...context,
            newStatus: normalizedStatus,
          })
          : Promise.resolve(null),
      ]);

      return {
        success: true,
        creatorResult,
        payerResult,
      };
    }

    const publicUserIds = toUniqueStrings([
      order.user_id,
      order.recipient_user_id,
      order.payer_user_id,
      order.paid_by_user_id,
    ]);

    const content = getEventContent(eventType, order, context);
    const authUserIds = await resolveAuthUserIds(publicUserIds);

    const [, pushResult] = await Promise.all([
      createInAppNotifications(publicUserIds, content, order),
      sendFirebasePush(authUserIds, content),
    ]);

    const dispatchSummary = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      created_at: new Date().toISOString(),
      event_type: eventType,
      order_id: order.id,
      order_number: order.order_number || null,
      public_targets: publicUserIds.length,
      auth_targets: authUserIds.length,
      sent: Number(pushResult?.sent || 0),
      failed: Number(pushResult?.failed || 0),
      total: Number(pushResult?.total || authUserIds.length || 0),
      push_success: Boolean(pushResult?.success),
      note: pushResult?.message || pushResult?.error || null,
    };

    pushDispatchLog(dispatchSummary);
    return dispatchSummary;
  } catch (error) {
    console.warn('notifyOrderUsers warning:', error);
    const failedSummary = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      created_at: new Date().toISOString(),
      event_type: eventType,
      order_id: order?.id || null,
      order_number: order?.order_number || null,
      public_targets: 0,
      auth_targets: 0,
      sent: 0,
      failed: 0,
      total: 0,
      push_success: false,
      note: error?.message || 'Unknown error',
    };
    pushDispatchLog(failedSummary);
    return failedSummary;
  }
}

export async function notifySpecificUsers(eventType, order, publicUserIds, context = {}) {
  const uniqueIds = toUniqueStrings(publicUserIds);
  if (!uniqueIds.length) {
    return { success: false, reason: 'missing_targets' };
  }

  return dispatchToPublicUsers(eventType, order, uniqueIds, context);
}

export async function notifyAdminUsers(eventType, order, context = {}) {
  try {
    const content = getEventContent(eventType, order, context);

    // Use server-side staff resolution in Edge Function to avoid any client-side RLS blockers.
    // The edge function handles BOTH in-app notification creation AND push notifications.
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: {
        topic: 'admins',
        title: content.title,
        body: content.body,
        data: Object.fromEntries(
          Object.entries(content.data || {}).map(([k, v]) => [k, String(v ?? '')])
        ),
      },
    });

    if (error) {
      throw error;
    }

    // Also try client-side in-app notifications as fallback (may fail due to RLS)
    try {
      const { data: adminRows } = await supabase
        .from('admin_users')
        .select('id')
        .in('role', ['admin', 'supervisor']);
      const adminIds = (adminRows || []).map(r => r.id);
      if (adminIds.length) {
        await createInAppNotifications(adminIds, content, order);
      }
    } catch (inAppErr) {
      // Expected to fail for non-admin callers due to RLS - edge function handles it
    }

    const dispatchSummary = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      created_at: new Date().toISOString(),
      event_type: eventType,
      order_id: order?.id || null,
      order_number: order?.order_number || null,
      public_targets: 0,
      auth_targets: Number(data?.total || 0),
      sent: Number(data?.sent || 0),
      failed: Number(data?.failed || 0),
      total: Number(data?.total || 0),
      push_success: Boolean(data?.success),
      note: data?.message || (Array.isArray(data?.errors) ? data.errors.join(' | ') : null),
    };

    pushDispatchLog(dispatchSummary);
    return dispatchSummary;
  } catch (error) {
    console.warn('notifyAdminUsers warning:', error);
    const failedSummary = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      created_at: new Date().toISOString(),
      event_type: eventType,
      order_id: order?.id || null,
      order_number: order?.order_number || null,
      public_targets: 0,
      auth_targets: 0,
      sent: 0,
      failed: 0,
      total: 0,
      push_success: false,
      note: error?.message || 'Unknown error',
    };
    pushDispatchLog(failedSummary);
    return failedSummary;
  }
}
