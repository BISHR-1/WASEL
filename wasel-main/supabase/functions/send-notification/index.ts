/**
 * 🔔 Supabase Edge Function لإرسال الإشعارات
 * يستخدم Firebase Cloud Messaging V1 API
 */

import { createClient } from 'npm:@supabase/supabase-js@2.94.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  userId?: string;
  userIds?: string[];
  topic?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

function toUniqueStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set((values || []).filter(Boolean).map((v) => String(v))));
}

function getServerStyledContent(
  event: string,
  newStatus: string,
  fallbackTitle: string,
  fallbackBody: string,
  data?: Record<string, string>,
) {
  if (event === 'new_order_created') {
    const methodFromData = String(data?.payment_method || '').toLowerCase();
    const paymentMethod = methodFromData === 'paypal' ? 'باي بال 💳'
      : methodFromData === 'whatsapp' ? 'واتساب 💬'
      : methodFromData === 'wallet' ? 'المحفظة 💰'
      : methodFromData === 'shared_cart' ? 'سلة مشتركة 🛒'
      : fallbackBody?.includes('باي بال') ? 'باي بال 💳'
      : fallbackBody?.includes('واتساب') ? 'واتساب 💬'
      : fallbackBody?.includes('المحفظة') ? 'المحفظة 💰'
      : fallbackBody?.includes('سلة مشتركة') ? 'سلة مشتركة 🛒'
      : '';
    return {
      title: '🆕 طلب جديد وصل',
      body: paymentMethod ? `طلب جديد عبر ${paymentMethod}` : (fallbackBody || 'طلب جديد وصل! تحقق منه الآن.'),
    };
  }

  if (event === 'order_assigned') {
    return {
      title: '🛵 طلب جديد للتوصيل',
      body: 'تم فرز طلب لك. ابدأ التوصيل الآن بكل حماس.',
    };
  }

  if (event === 'shared_payment_success') {
    // Keep legacy support but preserve customized body if provided by client.
    return {
      title: fallbackTitle || '💳 تم الدفع بنجاح',
      body: fallbackBody || 'تم تأكيد دفع طلبك بنجاح. شكرا لك!',
    };
  }

  if (event === 'shared_cart_paid_creator') {
    return {
      title: fallbackTitle || '💜 خبر جميل وصل',
      body: fallbackBody || 'تم دفع السلة المشتركة بنجاح. طلبك الآن قيد التجهيز.',
    };
  }

  if (event === 'shared_cart_paid_payer') {
    return {
      title: fallbackTitle || '💳 تم الدفع بنجاح',
      body: fallbackBody || 'تم دفع السلة المشتركة بنجاح. شكراً لكرمك ❤️',
    };
  }

  if (event === 'shared_order_status_creator') {
    return {
      title: fallbackTitle || '📦 تحديث على سلتك المشتركة',
      body: fallbackBody || 'هناك تحديث جديد على الطلب المشترك.',
    };
  }

  if (event === 'shared_order_status_payer') {
    return {
      title: fallbackTitle || '💙 تحديث طلب المُستلم',
      body: fallbackBody || 'هناك تحديث جديد على الطلب الذي قمت بدفعه.',
    };
  }

  if (event === 'delivery_proof_uploaded') {
    return {
      title: '📸 تم رفع إثبات التسليم',
      body: 'تم رفع صور/فيديو توثيق لتسليم طلبك.',
    };
  }

  if (event === 'order_delivered') {
    return {
      title: '✅ تم تسليم طلبك',
      body: 'وصل طلبك بنجاح. نتمنى لك تجربة سعيدة!',
    };
  }

  if (event === 'order_status_changed') {
    const statusContent: Record<string, { title: string; body: string }> = {
      pending: { title: '⏳ طلبك قيد المراجعة', body: 'استلمنا طلبك وجار تاكيده الآن.' },
      processing: { title: '👨‍🍳 طلبك قيد التجهيز', body: 'تم قبول طلبك ونعمل على تجهيزه.' },
      paid: { title: '👨‍🍳 طلبك قيد التجهيز', body: 'تم قبول طلبك ونعمل على تجهيزه.' },
      assigned: { title: '👨‍🍳 طلبك قيد التجهيز', body: 'تم قبول طلبك ونعمل على تجهيزه.' },
      in_progress: { title: '👨‍🍳 طلبك قيد التجهيز', body: 'تم قبول طلبك ونعمل على تجهيزه.' },
      delivering: { title: '🚚 طلبك بالطريق إليك', body: 'الموصل انطلق وطلبك في الطريق.' },
      completed: { title: '🎉 تم تسليم طلبك', body: 'الحمد لله تم التسليم. صحة وهنا!' },
      cancelled: { title: '❌ تم إلغاء الطلب', body: 'تم إلغاء طلبك. تواصل معنا لأي مساعدة.' },
      rejected_by_courier: { title: '⚠️ الموصل رفض الطلب', body: 'قام الموصل برفض استلام الطلب. يرجى إعادة تعيينه.' },
    };
    return statusContent[String(newStatus || '').toLowerCase()] || {
      title: '🔔 تحديث على طلبك',
      body: 'صار في تحديث جديد على طلبك.',
    };
  }

  return {
    title: fallbackTitle,
    body: fallbackBody,
  };
}

// كاش Access Token عبر الطلبات (Edge Functions تبقى warm)
let cachedAccessToken: string | null = null;
let cachedTokenExpiry = 0;

// الحصول على Access Token من Service Account
async function getAccessToken(): Promise<string> {
  // إعادة استخدام التوكن إذا لم ينتهِ بعد (هامش 5 دقائق)
  if (cachedAccessToken && Date.now() < cachedTokenExpiry) {
    return cachedAccessToken;
  }

  const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT not configured');
  }

  const serviceAccount = JSON.parse(serviceAccountJson);
  
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  };

  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const signatureInput = `${headerB64}.${payloadB64}`;
  
  const privateKeyPem = serviceAccount.private_key;
  const privateKeyDer = pemToDer(privateKeyPem);
  
  const key = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    encoder.encode(signatureInput)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const jwt = `${signatureInput}.${signatureB64}`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  
  if (!tokenData.access_token) {
    throw new Error('Failed to get access token: ' + JSON.stringify(tokenData));
  }

  cachedAccessToken = tokenData.access_token;
  // صلاحية التوكن 3600 ثانية، نعيد التجديد قبل 5 دقائق
  cachedTokenExpiry = Date.now() + (55 * 60 * 1000);

  return tokenData.access_token;
}

function pemToDer(pem: string): ArrayBuffer {
  const pemContents = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  
  const binaryString = atob(pemContents);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

async function sendFCMNotification(
  token: string,
  title: string,
  body: string,
  accessToken: string,
  projectId: string,
  data?: Record<string, string>,
  imageUrl?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const message = {
      message: {
        token: token,
        notification: {
          title,
          body,
          ...(imageUrl && { image: imageUrl }),
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channel_id: 'wasel_notifications',
            click_action: 'OPEN_ORDER',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
        webpush: {
          notification: {
            icon: '/logo/wasel-logo.png',
            badge: '/logo/wasel-logo.png',
          },
          fcm_options: {
            link: data?.order_id ? `/TrackOrder?order=${data.order_id}` : '/',
          },
        },
        data: data || {},
      },
    };

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      }
    );

    const result = await response.json();

    if (response.ok) {
      return { success: true };
    } else {
      return { success: false, error: result.error?.message || 'Unknown error' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function isTokenInvalidError(message?: string): boolean {
  const lower = String(message || '').toLowerCase();
  return lower.includes('registration token is not a valid fcm registration token')
    || lower.includes('requested entity was not found')
    || lower.includes('notregistered')
    || lower.includes('registration-token-not-registered')
    || lower.includes('mismatchsenderid');
}

async function resolveDeviceUserIds(supabase: any, rawIds: Array<string | null | undefined>): Promise<string[]> {
  const ids = toUniqueStrings(rawIds);
  if (!ids.length) return [];

  // Some rows in user_devices may store auth.users.id, while others may store public.users.id.
  // Resolve and query both forms to maximize delivery reliability.
  const { data: usersRows, error } = await supabase
    .from('users')
    .select('id, auth_id')
    .or(`id.in.(${ids.join(',')}),auth_id.in.(${ids.join(',')})`);

  if (error) {
    console.warn('resolveDeviceUserIds warning:', error.message || error);
    return ids;
  }

  return toUniqueStrings([
    ...ids,
    ...((usersRows || []).map((row: any) => row?.id)),
    ...((usersRows || []).map((row: any) => row?.auth_id)),
  ]);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: NotificationPayload = await req.json();
    const { userId, userIds, topic, title, body, data, imageUrl } = payload;
    const event = String(data?.event || '');
    const newStatus = String(data?.new_status || '');
    const styledContent = getServerStyledContent(event, newStatus, title, body, data);
    const finalTitle = styledContent.title;
    const finalBody = styledContent.body;

    if (!finalTitle || !finalBody) {
      return new Response(
        JSON.stringify({ success: false, error: 'Title and body are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let tokens: string[] = [];

    if (userId) {
      const candidateUserIds = await resolveDeviceUserIds(supabase, [userId]);
      const { data: devices } = await supabase
        .from('user_devices')
        .select('fcm_token, is_active')
        .in('user_id', candidateUserIds);

      tokens = (devices || [])
        .filter((d: any) => d?.is_active !== false && d?.fcm_token)
        .map((d: any) => d.fcm_token);
    } else if (userIds && userIds.length > 0) {
      const candidateUserIds = await resolveDeviceUserIds(supabase, userIds);
      const { data: devices } = await supabase
        .from('user_devices')
        .select('fcm_token, is_active')
        .in('user_id', candidateUserIds);

      tokens = devices
        ?.filter((d) => d?.is_active !== false)
        .map((d) => d.fcm_token)
        .filter(Boolean) || [];
    } else if (topic === 'all') {
      const { data: devices } = await supabase
        .from('user_devices')
        .select('fcm_token, is_active');

      tokens = devices
        ?.filter((d) => d?.is_active !== false)
        .map((d) => d.fcm_token)
        .filter(Boolean) || [];
    } else if (topic === 'admins' || topic === 'staff') {
      // Resolve admin/staff auth IDs server-side to avoid client RLS limitations.
      const [{ data: adminUsers }, { data: usersAdmins }] = await Promise.all([
        supabase
          .from('admin_users')
          .select('id, role, is_active')
          .in('role', ['admin', 'super_admin', 'supervisor', 'operator', 'support'])
          .neq('is_active', false),
        supabase
          .from('users')
          .select('id, auth_id, role')
          .in('role', ['admin', 'super_admin', 'supervisor', 'operator', 'support']),
      ]);

      const staffAuthIds = toUniqueStrings([
        ...((adminUsers || []).map((row: any) => row?.id)),
        ...((usersAdmins || []).map((row: any) => row?.auth_id || row?.id)),
      ]);

      // Also create server-side in-app notifications for admins
      const adminPublicIds = toUniqueStrings([
        ...((usersAdmins || []).map((row: any) => row?.id)),
      ]);
      if (adminPublicIds.length > 0) {
        const now = new Date().toISOString();
        const orderId = data?.order_id || '';
        const orderLink = orderId ? `/TrackOrder?order=${orderId}` : '/MyOrders';
        const notifRows = adminPublicIds.map((uid: string) => ({
          user_id: uid,
          title: finalTitle,
          message: finalBody,
          type: event === 'new_order_created' ? 'new_order' : 'order_update',
          is_read: false,
          link: orderLink,
          created_at: now,
        }));
        await supabase.from('notifications').insert(notifRows).then(({ error: inAppErr }) => {
          if (inAppErr) console.warn('Server in-app notification insert warning:', inAppErr.message);
        });
      }

      if (staffAuthIds.length > 0) {
        const { data: devices } = await supabase
          .from('user_devices')
          .select('fcm_token, is_active')
          .in('user_id', staffAuthIds);

        tokens = devices
          ?.filter((d) => d?.is_active !== false)
          .map((d) => d.fcm_token)
          .filter(Boolean) || [];
      }
    }

    tokens = Array.from(new Set(tokens));

    if (tokens.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'No devices found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // جلب Access Token مرة واحدة لكل الطلبات بدلاً من مرة لكل توكن
    const accessToken = await getAccessToken();
    const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
    const projectId = JSON.parse(serviceAccountJson || '{}').project_id;

    const results = await Promise.all(
      tokens.map(async (token) => {
        const result = await sendFCMNotification(token, finalTitle, finalBody, accessToken, projectId, data, imageUrl);
        return { token, ...result };
      })
    );

    const failedResults = results.filter((r) => !r.success);
    const invalidTokens = failedResults
      .filter((r) => isTokenInvalidError(r.error))
      .map((r) => r.token);

    if (invalidTokens.length > 0) {
      await supabase
        .from('user_devices')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .in('fcm_token', invalidTokens);
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = failedResults.length;

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failCount,
        total: tokens.length,
        errors: failedResults.slice(0, 5).map((r) => r.error || 'Unknown error'),
        invalid_tokens_deactivated: invalidTokens.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});