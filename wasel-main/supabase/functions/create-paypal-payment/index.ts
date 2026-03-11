// @ts-nocheck
// PayPal Payment Creation Function - Supabase Edge Function
// CRITICAL FIX: Handles null/missing origin headers from mobile clients
// When mobile app sends requests, 'origin' header is null which was causing PayPal errors
// This function now includes proper fallback domain handling

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID");
const PAYPAL_CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET");
const PAYPAL_ENV = (Deno.env.get('PAYPAL_ENV') || 'sandbox').toLowerCase().trim();
const PAYPAL_API_BASE = PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

// ✅ Validate configuration on startup
if (!PAYPAL_CLIENT_ID) {
  console.error('❌ CRITICAL: PAYPAL_CLIENT_ID not set in environment variables!');
}
if (!PAYPAL_CLIENT_SECRET) {
  console.error('❌ CRITICAL: PAYPAL_CLIENT_SECRET not set in environment variables!');
}

// ✅ Log environment setup for debugging
console.log('🔧 PayPal Configuration:', {
  PAYPAL_ENV,
  PAYPAL_API_BASE,
  HAS_CLIENT_ID: !!PAYPAL_CLIENT_ID,
  HAS_CLIENT_SECRET: !!PAYPAL_CLIENT_SECRET,
  CLIENT_ID_LENGTH: PAYPAL_CLIENT_ID?.length || 0,
});

// ✅ Get base URL with fallback for mobile apps (Capacitor)
function getBaseUrl(): string {
  const appUrl = Deno.env.get('APP_URL');
  if (appUrl) return appUrl;
  
  // Fallback for different environments
  if (PAYPAL_ENV === 'live') {
    return 'https://www.wasel.life';
  }
  return 'https://localhost:5173';
}

// ✅ Helper: Convert to Base64 (works in Deno)
function toBase64(str: string): string {
  return new TextEncoder().encode(str);
}

// ✅ Properly encode credentials for PayPal OAuth
function encodeBasicAuth(clientId: string, clientSecret: string): string {
  const credentials = `${clientId}:${clientSecret}`;
  // Convert to bytes then to base64
  const bytes = new TextEncoder().encode(credentials);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function getAccessToken() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error("Missing PayPal Credentials");
  }
  
  // ✅ FIX: Use proper base64 encoding for Deno
  const auth = encodeBasicAuth(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET);
  
  console.log('🔐 Attempting PayPal OAuth with:', {
    env: PAYPAL_ENV,
    apiBase: PAYPAL_API_BASE,
    clientIdLength: PAYPAL_CLIENT_ID?.length || 0,
  });
  
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    body: "grant_type=client_credentials",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  
  if (!response.ok) {
     const errorText = await response.text();
     console.error('❌ PayPal OAuth Failed:', {
       status: response.status,
       error: errorText,
       env: PAYPAL_ENV,
     });
     throw new Error(`PayPal Token Error: ${response.status} ${errorText}`);
  }
  
  const data = await response.json();
  console.log('✅ PayPal OAuth Success - Got access token');
  return data.access_token;
}

async function createOrder(amount: string, currency: string = "USD", description: string, returnUrl: string, cancelUrl: string) {
    const accessToken = await getAccessToken();
    
    // ✅ IMPORTANT: For Hosted Fields (Card Payment), no redirect happens
    // These URLs are only used if PayPal Button (not Hosted Fields)
    // Hosted Fields completes payment in-app without redirect
    const return_url = returnUrl || "https://example.com/return";
    const cancel_url = cancelUrl || "https://example.com/cancel";

    const payload = {
        intent: "CAPTURE",
        purchase_units: [
            {
                description: description || "Wasel Order",
                amount: {
                    currency_code: currency,
                    value: Number(amount).toFixed(2),
                },
            },
        ],
        application_context: {
            brand_name: "Wasel",
            landing_page: "NO_PREFERENCE",
            user_action: "PAY_NOW",
            // ✅ These URLs are NOT USED for Hosted Fields
            // They're only for PayPal Button (redirect flow)
            // For Hosted Fields, payment happens in-app Modal
            return_url: return_url,
            cancel_url: cancel_url
        }
    };

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`PayPal Create Order Error: ${errorText}`);
    }
    
    return response.json();
}

async function captureOrder(orderId: string) {
    const accessToken = await getAccessToken();
    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
        },
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        try {
            const errJson = JSON.parse(errorText);
            throw new Error(errJson.message || errJson.error_description || errorText);
        } catch {
             throw new Error(`PayPal Capture Error: ${errorText}`);
        }
    }

    return response.json();
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    let body;
    try {
        body = await req.json();
    } catch {
        return new Response(JSON.stringify({ success: false, error: 'Invalid JSON' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const {
      action,
      orderId, 
      orderID, 
      amount,
      currency,
      orderDescription,
      return_url,
      cancel_url
    } = body;

    const requestAction = action || (amount ? 'create' : null);

    console.log('📋 Request received:', {
      action: requestAction,
      hasAmount: !!amount,
      hasOrderId: !!(orderID || orderId),
      bodyKeys: Object.keys(body)
    });

    if (requestAction === 'create') {
        if (!amount || isNaN(parseFloat(amount.toString()))) {
            console.error('❌ Invalid amount:', amount, 'type:', typeof amount);
            throw new Error("Amount is required and must be a valid number");
        }
        console.log('🟢 Processing CREATE action');
        const result = await createOrder(amount, currency || 'USD', orderDescription, return_url, cancel_url);
        console.log('🟢 CREATE action completed, returning result');
        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } 
    else if (requestAction === 'capture') {
        const id = orderID || orderId;
        console.log('🟡 Processing CAPTURE action with ID:', id);
        if (!id) {
            console.error('❌ CAPTURE action: No order ID provided');
            throw new Error("Order ID is required for capture");
        }
        console.log('🟡 Calling captureOrder function');
        const result = await captureOrder(id);
        console.log('🟡 CAPTURE action completed:', result?.status);
        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
    else {
        throw new Error("Invalid action or missing parameters");
    }

  } catch (error: any) {
    console.error("PayPal Error:", error.message);
    return new Response(JSON.stringify({ success: false, error: error.message || "Unknown Error" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
