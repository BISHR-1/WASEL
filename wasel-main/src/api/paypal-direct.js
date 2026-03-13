// ⚠️ DEPRECATED: This file is deprecated and contains mock data
// DO NOT USE - Use src/api/paypal.js instead
// This file uses mock PayPal orders and is no longer maintained
// Use the Supabase Edge Function 'create-paypal-payment' through src/api/paypal.js

// PayPal API service - Direct client-side implementation (temporary solution)
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;

export const createPayPalOrder = async (amount, currency = 'USD', items) => {
  try {
    if (!PAYPAL_CLIENT_ID) {
      throw new Error('PayPal Client ID not configured');
    }

    // Create order using PayPal JS SDK approach
    // This is a simplified version that redirects to PayPal directly
    
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: amount.toFixed(2),
          breakdown: {
            item_total: {
              currency_code: currency,
              value: amount.toFixed(2)
            }
          }
        },
        items: items?.map(item => ({
          name: item.name,
          unit_amount: {
            currency_code: currency,
            value: item.price
          },
          quantity: item.quantity.toString()
        })) || []
      }],
      application_context: {
        brand_name: 'واصل ستور - Wasel Store',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: `${window.location.origin}/payment-success`,
        // ✅ Fixed: Cancel must return to /cart (not to wasel.life)
        cancel_url: `${window.location.origin}/cart`
      }
    };

    // For now, create a mock approval URL
    // In production, this should be replaced with actual PayPal order creation
    const approvalUrl = `https://www.sandbox.paypal.com/checkoutnow?token=mock_order_${Date.now()}`;
    
    return {
      order_id: `mock_order_${Date.now()}`,
      approval_url: approvalUrl
    };

  } catch (error) {
    console.error('PayPal order creation error:', error);
    throw error;
  }
};

export const capturePayPalPayment = async (orderId) => {
  try {
    // Mock successful payment for testing
    return {
      success: true,
      order_id: orderId,
      amount: '10.00'
    };
  } catch (error) {
    console.error('PayPal capture error:', error);
    throw error;
  }
};
