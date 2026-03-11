const API_BASE = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || import.meta.env.VITE_PAYPAL_API_URL || 'https://api.waselstore.com';

export async function createPayPalPayment(payload) {
  const response = await fetch(`${API_BASE}/create-paypal-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload || {})
  });

  let data = {};
  try {
    data = await response.json();
  } catch (err) {
    data = {};
  }

  if (!response.ok) {
    return {
      success: false,
      error: data?.error || 'Failed to create PayPal payment'
    };
  }

  return data;
}