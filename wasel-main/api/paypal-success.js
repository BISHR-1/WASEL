// PayPal success callback endpoint
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, PayerID } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Missing order token' });
    }

    // PayPal API credentials
    const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;
    const PAYPAL_CLIENT_SECRET = import.meta.env.VITE_PAYPAL_CLIENT_SECRET;
    const PAYPAL_API_BASE = process.env.NODE_ENV === 'production' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com';

    // Get access token
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

    // Capture the payment
    const captureResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${token}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      }
    });

    const captureData = await captureResponse.json();

    if (captureData.status === 'COMPLETED') {
      // Payment successful - you can:
      // 1. Save order to database
      // 2. Send confirmation email
      // 3. Clear user's cart
      // 4. Redirect to success page
      
      // For now, redirect to success page with order details
      const orderId = captureData.id;
      const amount = captureData.purchase_units[0].payments.captures[0].amount.value;
      
      // Redirect to frontend success page
      res.redirect(`/payment-success?order_id=${orderId}&status=completed&amount=${amount}`);
    } else {
      // Payment failed
      res.redirect(`/payment-failed?order_id=${token}&status=failed`);
    }

  } catch (error) {
    console.error('PayPal capture error:', error);
    res.redirect(`/payment-failed?error=server_error`);
  }
}
