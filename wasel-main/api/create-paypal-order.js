// PayPal API endpoint for creating orders
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency = 'USD', items } = req.body;

    // PayPal API credentials - these should be environment variables
    const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;
    const PAYPAL_CLIENT_SECRET = import.meta.env.VITE_PAYPAL_CLIENT_SECRET;
    const PAYPAL_API_BASE = process.env.NODE_ENV === 'production' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com';

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      return res.status(500).json({ 
        error: 'PayPal credentials not configured' 
      });
    }

    // Get access token from PayPal
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    
    const tokenResponse = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials'
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      return res.status(500).json({ error: 'Failed to get PayPal access token' });
    }

    // Create PayPal order
    const orderPayload = {
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
        brand_name: 'واصل - Wasel',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        // ✅ Fixed: Return to app's cart page, not external website
        // On mobile: returns to /cart in the app
        // On web: returns to payment-success page
        return_url: `${req.headers.origin || 'https://www.wasel.life'}/payment-success`,
        // ✅ IMPORTANT: Cancel must return to /cart (inside the app/web, not external wasel.life)
        cancel_url: `${req.headers.origin || 'https://localhost:5173'}/cart`
      }
    };

    const orderResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(orderPayload)
    });

    const order = await orderResponse.json();

    if (order.id) {
      // Find the approval URL from the links
      const approvalLink = order.links.find(link => link.rel === 'approve');
      
      return res.status(200).json({
        order_id: order.id,
        approval_url: approvalLink.href
      });
    } else {
      return res.status(500).json({ 
        error: 'Failed to create PayPal order',
        details: order 
      });
    }

  } catch (error) {
    console.error('PayPal order creation error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
