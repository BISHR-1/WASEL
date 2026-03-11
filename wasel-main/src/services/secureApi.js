// =====================================================
// WASEL - SECURE API SERVICE LAYER
// File: src/services/secureApi.js
// =====================================================

import { supabase } from '@/lib/supabase';

// =====================================================
// SECURITY UTILITIES
// =====================================================

// Generate idempotency key
export function generateIdempotencyKey() {
  return `${Date.now()}-${crypto.randomUUID()}`;
}

// Generate session ID
export function generateSessionId() {
  const stored = sessionStorage.getItem('wasel_session_id');
  if (stored) return stored;
  
  const sessionId = `sess_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
  sessionStorage.setItem('wasel_session_id', sessionId);
  return sessionId;
}

// Sanitize user input
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim();
}

// CSRF Token management
let csrfToken = null;

export function getCSRFToken() {
  if (!csrfToken) {
    csrfToken = crypto.randomUUID();
    sessionStorage.setItem('csrf_token', csrfToken);
  }
  return csrfToken;
}

export function validateCSRFToken(token) {
  return token === sessionStorage.getItem('csrf_token');
}

// =====================================================
// INTERACTIONS TRACKING
// =====================================================

const interactionQueue = [];
let flushTimeout = null;

export async function trackInteraction(eventType, payload = {}) {
  const session = await supabase.auth.getSession();
  const userId = session.data?.session?.user?.id;
  
  const interaction = {
    user_id: userId,
    session_id: generateSessionId(),
    event_type: eventType,
    event_category: getEventCategory(eventType),
    target_id: payload.targetId || null,
    target_type: payload.targetType || null,
    payload: sanitizePayload(payload),
    page_url: window.location.pathname,
    referrer_url: document.referrer,
    device_type: getDeviceType(),
    browser: getBrowser(),
    os: getOS(),
    created_at: new Date().toISOString()
  };

  interactionQueue.push(interaction);

  // Batch send interactions
  if (!flushTimeout) {
    flushTimeout = setTimeout(flushInteractions, 2000);
  }

  // Immediate flush if queue is large
  if (interactionQueue.length >= 10) {
    flushInteractions();
  }
}

async function flushInteractions() {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }

  if (interactionQueue.length === 0) return;

  const batch = interactionQueue.splice(0, interactionQueue.length);

  try {
    await supabase.from('interactions').insert(batch);
  } catch (error) {
    console.error('Failed to track interactions:', error);
    // Re-queue failed interactions (limit to prevent memory issues)
    if (interactionQueue.length < 50) {
      interactionQueue.push(...batch);
    }
  }
}

function getEventCategory(eventType) {
  const categories = {
    'view_product': 'product',
    'add_to_cart': 'cart',
    'remove_from_cart': 'cart',
    'update_cart_qty': 'cart',
    'favorite': 'product',
    'unfavorite': 'product',
    'checkout_start': 'checkout',
    'checkout_complete': 'checkout',
    'payment_start': 'payment',
    'payment_success': 'payment',
    'payment_failed': 'payment',
    'search': 'search',
    'page_view': 'navigation',
    'button_click': 'interaction',
    'ai_chat': 'chat'
  };
  return categories[eventType] || 'other';
}

function sanitizePayload(payload) {
  const safe = { ...payload };
  // Remove sensitive fields
  delete safe.password;
  delete safe.token;
  delete safe.creditCard;
  delete safe.cvv;
  return safe;
}

function getDeviceType() {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

function getBrowser() {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Other';
}

function getOS() {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'MacOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone')) return 'iOS';
  return 'Other';
}

// =====================================================
// FAVORITES API
// =====================================================

export async function toggleFavorite(productId) {
  const session = await supabase.auth.getSession();
  if (!session.data?.session?.user) {
    throw new Error('يجب تسجيل الدخول لإضافة المفضلات');
  }

  const userId = session.data.session.user.id;

  // Check if already favorited
  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .single();

  if (existing) {
    // Remove favorite
    await supabase
      .from('favorites')
      .delete()
      .eq('id', existing.id);

    trackInteraction('unfavorite', { targetId: productId, targetType: 'product' });
    return { favorited: false };
  } else {
    // Add favorite
    await supabase
      .from('favorites')
      .insert({ user_id: userId, product_id: productId });

    trackInteraction('favorite', { targetId: productId, targetType: 'product' });
    return { favorited: true };
  }
}

export async function getFavorites() {
  const session = await supabase.auth.getSession();
  if (!session.data?.session?.user) {
    return [];
  }

  const { data, error } = await supabase
    .from('favorites')
    .select(`
      id,
      product_id,
      created_at,
      products (
        id,
        title,
        title_ar,
        price_cents,
        original_price_cents,
        images,
        stock,
        category
      )
    `)
    .eq('user_id', session.data.session.user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function isFavorited(productId) {
  const session = await supabase.auth.getSession();
  if (!session.data?.session?.user) return false;

  const { data } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', session.data.session.user.id)
    .eq('product_id', productId)
    .single();

  return !!data;
}

// =====================================================
// CART API (Secure)
// =====================================================

export async function getOrCreateCart() {
  const session = await supabase.auth.getSession();
  if (!session.data?.session?.user) {
    throw new Error('يجب تسجيل الدخول');
  }

  const userId = session.data.session.user.id;

  // Get active cart
  let { data: cart } = await supabase
    .from('family_carts')
    .select('*')
    .eq('owner_user_id', userId)
    .eq('status', 'active')
    .single();

  if (!cart) {
    // Create new cart
    const { data: newCart, error } = await supabase
      .from('family_carts')
      .insert({ owner_user_id: userId })
      .select()
      .single();

    if (error) throw error;
    cart = newCart;
  }

  return cart;
}

export async function addToCart(productId, quantity = 1, attributes = {}) {
  const cart = await getOrCreateCart();

  // Get current product price for snapshot
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('price_cents, stock, is_active')
    .eq('id', productId)
    .single();

  if (productError || !product) {
    throw new Error('المنتج غير موجود');
  }

  if (!product.is_active) {
    throw new Error('المنتج غير متوفر حالياً');
  }

  if (product.stock < quantity) {
    throw new Error(`الكمية المتوفرة: ${product.stock} فقط`);
  }

  // Check if item already exists
  const { data: existingItem } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('cart_id', cart.id)
    .eq('product_id', productId)
    .single();

  if (existingItem) {
    // Update quantity
    const newQty = existingItem.quantity + quantity;
    if (newQty > product.stock) {
      throw new Error(`لا يمكن إضافة أكثر من ${product.stock} قطعة`);
    }

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: newQty, updated_at: new Date().toISOString() })
      .eq('id', existingItem.id);

    if (error) throw error;
  } else {
    // Insert new item
    const session = await supabase.auth.getSession();
    const { error } = await supabase
      .from('cart_items')
      .insert({
        cart_id: cart.id,
        product_id: productId,
        quantity,
        price_snapshot_cents: product.price_cents,
        attributes_snapshot: attributes,
        added_by_user_id: session.data?.session?.user?.id
      });

    if (error) throw error;
  }

  trackInteraction('add_to_cart', { 
    targetId: productId, 
    targetType: 'product',
    quantity,
    price_cents: product.price_cents
  });

  return { success: true };
}

export async function removeFromCart(itemId) {
  const cart = await getOrCreateCart();

  const { data: item } = await supabase
    .from('cart_items')
    .select('product_id')
    .eq('id', itemId)
    .eq('cart_id', cart.id)
    .single();

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', itemId)
    .eq('cart_id', cart.id);

  if (error) throw error;

  if (item) {
    trackInteraction('remove_from_cart', { 
      targetId: item.product_id, 
      targetType: 'product' 
    });
  }

  return { success: true };
}

export async function updateCartItemQuantity(itemId, quantity) {
  if (quantity < 1) {
    return removeFromCart(itemId);
  }

  const cart = await getOrCreateCart();

  // Get item with product stock
  const { data: item, error: itemError } = await supabase
    .from('cart_items')
    .select(`
      id,
      product_id,
      products (stock)
    `)
    .eq('id', itemId)
    .eq('cart_id', cart.id)
    .single();

  if (itemError || !item) {
    throw new Error('العنصر غير موجود في السلة');
  }

  if (quantity > item.products.stock) {
    throw new Error(`الكمية المتوفرة: ${item.products.stock} فقط`);
  }

  const { error } = await supabase
    .from('cart_items')
    .update({ quantity, updated_at: new Date().toISOString() })
    .eq('id', itemId);

  if (error) throw error;

  trackInteraction('update_cart_qty', { 
    targetId: item.product_id, 
    targetType: 'product',
    quantity 
  });

  return { success: true };
}

export async function getCartItems() {
  const cart = await getOrCreateCart();

  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      id,
      quantity,
      price_snapshot_cents,
      attributes_snapshot,
      created_at,
      products (
        id,
        title,
        title_ar,
        price_cents,
        original_price_cents,
        images,
        stock,
        is_active
      )
    `)
    .eq('cart_id', cart.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Filter out inactive products and update prices if needed
  const validItems = (data || []).filter(item => item.products?.is_active);

  return {
    cart_id: cart.id,
    items: validItems,
    total_items: validItems.reduce((sum, item) => sum + item.quantity, 0),
    subtotal_cents: validItems.reduce((sum, item) => sum + (item.price_snapshot_cents * item.quantity), 0)
  };
}

// =====================================================
// ORDER API (Secure)
// =====================================================

export async function createOrder(orderData) {
  const { shipping_address, payment_provider, coupon_code, customer_notes } = orderData;
  
  const cart = await getOrCreateCart();
  const idempotencyKey = generateIdempotencyKey();

  trackInteraction('checkout_start', { payment_provider });

  const session = await supabase.auth.getSession();
  const token = session.data?.session?.access_token;

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Idempotency-Key': idempotencyKey
    },
    body: JSON.stringify({
      cart_id: cart.id,
      shipping_address,
      payment_provider,
      coupon_code,
      customer_notes
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'فشل في إنشاء الطلب');
  }

  return data;
}

export async function getOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getOrderById(orderId) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error) throw error;
  return data;
}

// =====================================================
// AI CHAT API (Secure)
// =====================================================

export async function sendChatMessage(message, context = {}) {
  const session = await supabase.auth.getSession();
  const token = session.data?.session?.access_token;

  if (!token) {
    throw new Error('يجب تسجيل الدخول لاستخدام المساعد');
  }

  const sanitizedMessage = sanitizeInput(message);
  const sessionId = generateSessionId();

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      message: sanitizedMessage,
      session_id: sessionId,
      context: {
        current_page: window.location.pathname,
        ...context
      }
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'فشل في إرسال الرسالة');
  }

  return data;
}

// =====================================================
// PRODUCTS API
// =====================================================

export async function getProducts(options = {}) {
  const { category, search, limit = 20, offset = 0, sortBy = 'created_at', sortOrder = 'desc' } = options;

  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .gt('stock', 0)
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(offset, offset + limit - 1);

  if (category) {
    query = query.eq('category', category);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,title_ar.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  // Track search if provided
  if (search) {
    trackInteraction('search', { 
      query: search, 
      results_count: count || 0 
    });
  }

  return { products: data || [], total: count || 0 };
}

export async function getProductById(productId) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (error) throw error;

  // Track view
  trackInteraction('view_product', { 
    targetId: productId, 
    targetType: 'product' 
  });

  // Increment view count
  await supabase.rpc('increment_product_views', { product_id: productId });

  return data;
}

// =====================================================
// FLUSH ON PAGE UNLOAD
// =====================================================

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    flushInteractions();
  });

  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushInteractions();
    }
  });
}

export default {
  trackInteraction,
  toggleFavorite,
  getFavorites,
  isFavorited,
  addToCart,
  removeFromCart,
  updateCartItemQuantity,
  getCartItems,
  createOrder,
  getOrders,
  getOrderById,
  sendChatMessage,
  getProducts,
  getProductById,
  generateIdempotencyKey,
  generateSessionId,
  sanitizeInput
};
