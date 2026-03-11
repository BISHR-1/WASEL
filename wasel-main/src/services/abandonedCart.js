// src/services/abandonedCart.js
import { supabase } from '@/lib/supabase';

/**
 * Save abandoned cart to Supabase
 * @param {Object} cart - Cart object (array of items)
 * @param {string} userId - User ID (nullable for guests)
 * @param {string} userEmail - User email (nullable for guests)
 * @param {number} total - Total price
 * @param {Object} [meta] - Optional metadata (timestamp, device info, etc)
 */
export async function saveAbandonedCart({ cart, userId, userEmail, total, meta }) {
  if (!Array.isArray(cart) || cart.length === 0) return;
  try {
    const { error } = await supabase.from('abandoned_carts').insert([
      {
        user_id: userId || null,
        user_email: userEmail || null,
        cart_items: cart,
        total,
        meta: meta || {},
        abandoned_at: new Date().toISOString(),
      }
    ]);
    if (error && error.code !== '42P01' && !error.message?.includes('404')) {
      console.warn('Abandoned cart save skipped:', error.message);
    }
  } catch (err) {
    // Silently ignore - table may not exist
  }
}
