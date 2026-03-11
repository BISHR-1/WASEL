// PayPal API service using Supabase Functions
import { supabase } from '@/lib/supabase';

// ✅ PayPal Button: Creates order for approval flow - uses 'create-paypal-order'
// Returns order_id and approval_url for redirecting to PayPal
export const createPayPalOrder = async (amount, currency = 'USD', items) => {
  try {
    console.log('🟡 Creating PayPal order for button payment:', { amount, currency, itemsCount: items?.length });
    
    const { data, error } = await supabase.functions.invoke('create-paypal-order', { 
      body: {
        amount,
        currency,
        items
      }
    });

    if (error) {
      console.error('❌ Supabase function error:', error);
      throw new Error(`PayPal API error: ${error.message}`);
    }

    console.log('✅ PayPal order created:', { order_id: data?.order_id });
    return data;

  } catch (error) {
    console.error('❌ PayPal order creation error:', error);
    throw error;
  }
};

export const capturePayPalPayment = async (orderId) => {
  try {
    const { data, error } = await supabase.functions.invoke('capture-paypal-payment', {
      body: {
        order_id: orderId
      }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(`PayPal capture error: ${error.message}`);
    }

    return data;

  } catch (error) {
    console.error('PayPal capture error:', error);
    throw error;
  }
};
