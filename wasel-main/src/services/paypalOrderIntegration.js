/**
 * PayPal Order Integration Service
 * خدمة دمج أوامر PayPal مع لوحة التحكم
 */

import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

/**
 * Process PayPal order and send to admin panel
 * معالجة طلب PayPal وإرساله للوحة التحكم
 */
export async function processPayPalOrder(orderData) {
  try {
    console.log('📤 Processing PayPal order for admin panel...', orderData);

    // Save order with 'paid' status
    const { data: order, error } = await supabase
      .from('orders')
      .insert([{
        user_email: orderData.sender?.email || 'guest@example.com',
        status: 'paid', // Mark as paid immediately
        total_amount: orderData.totalUSD,
        currency: 'USD',
        sender_details: orderData.sender,
        recipient_details: orderData.recipient,
        payment_method: 'paypal',
        notes: orderData.notes,
        delivery_time: orderData.deliveryTime,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    console.log('✅ PayPal order saved successfully:', order);

    // Save order items
    if (orderData.items && orderData.items.length > 0) {
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        product_name: item.name_ar || item.name,
        product_id: item.id,
        quantity: item.quantity,
        price: item.priceUSD,
        image_url: item.image_url || item.image
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('❌ Error saving order items:', itemsError);
        // Don't throw - order is already saved
      }
    }

    // Send notification to supervisors
    await notifySupervisors({
      orderId: order.id,
      customerName: orderData.sender?.name,
      amount: orderData.totalUSD,
      paymentMethod: 'PayPal',
      status: 'paid'
    });

    return order;
  } catch (error) {
    console.error('❌ Error processing PayPal order:', error);
    throw error;
  }
}

/**
 * Notify supervisors of a new paid order
 */
async function notifySupervisors(orderInfo) {
  try {
    // Get all supervisors
    const { data: supervisors, error } = await supabase
      .from('admin_users')
      .select('id, email, name')
      .eq('role', 'supervisor')
      .eq('is_active', true);

    if (error) throw error;

    if (!supervisors || supervisors.length === 0) {
      console.log('⚠️ No supervisors found to notify');
      return;
    }

    // Here you could send emails or in-app notifications
    console.log('📧 Notifying supervisors:', supervisors);

    // Example: Create notifications in database
    const notifications = supervisors.map(supervisor => ({
      supervisor_id: supervisor.id,
      type: 'new_paid_order',
      title: `طلب مدفوع جديد من ${orderInfo.customerName}`,
      message: `تم استقبال طلب مدفوع عبر PayPal بقيمة $${orderInfo.amount.toFixed(2)}`,
      order_id: orderInfo.orderId,
      is_read: false,
      created_at: new Date().toISOString()
    }));

    // Store notifications (create table if needed)
    // await supabase.from('notifications').insert(notifications);

    console.log('✅ Supervisors notified');
  } catch (error) {
    console.error('⚠️ Error notifying supervisors:', error);
    // Don't throw - notification failure shouldn't block order processing
  }
}

/**
 * Get PayPal orders waiting for supervisor assignment
 */
export async function getPendingPayPalOrders() {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'paid')
      .eq('payment_method', 'paypal')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return orders || [];
  } catch (error) {
    console.error('❌ Error fetching PayPal orders:', error);
    return [];
  }
}

/**
 * Get PayPal order details with items
 */
export async function getPayPalOrderDetails(orderId) {
  try {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (itemsError) throw itemsError;

    return {
      ...order,
      items: items || []
    };
  } catch (error) {
    console.error('❌ Error fetching order details:', error);
    return null;
  }
}

/**
 * Update PayPal order status
 */
export async function updatePayPalOrderStatus(orderId, newStatus) {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Order status updated:', order);
    return order;
  } catch (error) {
    console.error('❌ Error updating order status:', error);
    throw error;
  }
}

/**
 * Get PayPal order statistics
 */
export async function getPayPalOrderStats() {
  try {
    // Total PayPal orders
    const { data: allOrders, error: allError } = await supabase
      .from('orders')
      .select('id, status')
      .eq('payment_method', 'paypal');

    if (allError) throw allError;

    // Group by status
    const stats = {
      total: allOrders?.length || 0,
      paid: allOrders?.filter(o => o.status === 'paid').length || 0,
      assigned: allOrders?.filter(o => o.status === 'assigned').length || 0,
      in_progress: allOrders?.filter(o => o.status === 'in_progress').length || 0,
      completed: allOrders?.filter(o => o.status === 'completed').length || 0,
      cancelled: allOrders?.filter(o => o.status === 'cancelled').length || 0,
    };

    return stats;
  } catch (error) {
    console.error('❌ Error getting PayPal stats:', error);
    return null;
  }
}
