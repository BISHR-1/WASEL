// PayPal cancel callback endpoint
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token } = req.query;

    // User cancelled the payment
    // Redirect back to cart with a message
    res.redirect('/cart?payment=cancelled');
    
  } catch (error) {
    console.error('PayPal cancel error:', error);
    res.redirect('/cart?payment=error');
  }
}
