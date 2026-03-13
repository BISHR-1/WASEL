import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// PayPal Order Creation Function - Supabase Edge Function
// CRITICAL FIX: Handles null/missing origin headers from mobile clients
// When mobile app sends requests, 'origin' header is null which was causing INVALID_PARAMETER_SYNTAX errors
// Solution: Use fallback domain 'https://www.wasel.life' when origin header is missing or null

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    console.log('=== PayPal Function Started ===')
    
    let body;
    try {
      body = await req.json();
      console.log('Request body received:', JSON.stringify(body, null, 2));
    } catch (e: any) {
      console.error('JSON parse error:', e);
      return new Response(
        JSON.stringify({ 
          error: "Invalid or missing JSON body",
          details: e.message
        }),
        {
          status: 400,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          },
        }
      );
    }

    if (!body) {
      return new Response(
        JSON.stringify({ 
          error: "Missing request body"
        }),
        {
          status: 400,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          },
        }
      );
    }

    const { amount, currency = 'USD', items } = body;

    if (!amount) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required field: amount",
          received: body
        }),
        {
          status: 400,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          },
        }
      );
    }

    // PayPal API credentials from environment variables
    const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID')
    const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET')
    const PAYPAL_ENV = Deno.env.get('PAYPAL_ENV') || 'sandbox'
    
    const PAYPAL_API_BASE = PAYPAL_ENV === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com'

    console.log('Environment check:', {
      hasClientId: !!PAYPAL_CLIENT_ID,
      hasClientSecret: !!PAYPAL_CLIENT_SECRET,
      clientIdLength: PAYPAL_CLIENT_ID?.length || 0,
      secretLength: PAYPAL_CLIENT_SECRET?.length || 0,
      env: PAYPAL_ENV,
      apiBase: PAYPAL_API_BASE
    });

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      const error = `PayPal credentials not configured. Client ID: ${!!PAYPAL_CLIENT_ID}, Secret: ${!!PAYPAL_CLIENT_SECRET}`;
      console.error(error);
      console.error('Available env vars:', Object.keys(Deno.env.toObject()));
      return new Response(
        JSON.stringify({ 
          error: error,
          availableVars: Object.keys(Deno.env.toObject()).filter(k => k.includes('PAYPAL'))
        }),
        {
          status: 500,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          },
        }
      );
    }

    // Get access token from PayPal
    const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`)
    console.log('Attempting to get PayPal token from:', PAYPAL_API_BASE);
    
    try {
      const tokenResponse = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials'
      });

      console.log('Token response status:', tokenResponse.status);

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token request failed:', errorText);
        throw new Error(`PayPal token request failed: ${tokenResponse.status} - ${errorText}`);
      }

      const tokenData = await tokenResponse.json();
      console.log('Token received successfully:', {
        hasAccessToken: !!tokenData.access_token,
        tokenType: tokenData.token_type
      });
      
      if (!tokenData.access_token) {
        throw new Error(`No access token in response: ${JSON.stringify(tokenData)}`);
      }

      // Ensure amount is a number and format it properly
      const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      if (isNaN(numericAmount) || numericAmount <= 0) {
        throw new Error(`Invalid amount: ${amount}. Must be a positive number.`);
      }

      const formattedAmount = numericAmount.toFixed(2);
      console.log('Formatted amount:', formattedAmount);

      // ✅ FIX: Calculate item_total from items, not from the total amount
      // This prevents ITEM_TOTAL_MISMATCH errors
      const processedItems = items?.map((item: any) => {
        const itemPrice = typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0);
        const itemQuantity = typeof item.quantity === 'string' ? parseInt(item.quantity) : (item.quantity || 1);
        
        if (isNaN(itemPrice) || itemPrice <= 0) {
          throw new Error(`Invalid item price: ${item.price} for item: ${item.name}`);
        }
        if (isNaN(itemQuantity) || itemQuantity <= 0) {
          throw new Error(`Invalid item quantity: ${item.quantity} for item: ${item.name}`);
        }
        
        return {
          name: item.name || 'Unknown Item',
          unit_amount: {
            currency_code: currency,
            value: itemPrice.toFixed(2)
          },
          quantity: itemQuantity.toString()
        };
      }) || [];

      // ✅ Calculate item_total correctly: sum of (unit_amount * quantity)
      const calculatedItemTotal = processedItems
        .reduce((sum: number, item: any) => {
          const unitPrice = parseFloat(item.unit_amount.value);
          const qty = parseInt(item.quantity);
          return sum + (unitPrice * qty);
        }, 0)
        .toFixed(2);

      console.log('Items breakdown:', {
        itemCount: processedItems.length,
        calculatedItemTotal,
        formattedAmount,
        amountMismatch: calculatedItemTotal !== formattedAmount ? `⚠️ Warning: Request amount (${formattedAmount}) differs from item total (${calculatedItemTotal}). Using item total.` : '✓ Match'
      });

      // Create PayPal order with proper formatting
      const orderPayload = {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency,
            value: calculatedItemTotal,  // ✅ FIX: Use calculated item total, not the request amount
            breakdown: {
              item_total: {
                currency_code: currency,
                value: calculatedItemTotal
              }
            }
          },
          items: processedItems
        }],
        application_context: {
          brand_name: 'واصل ستور - Wasel Store',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
          // ✅ Fixed: Return to app's cart page, not external website
          // On mobile: returns to /cart in the app
          // On web: returns to payment-success page
          return_url: `${req.headers.get('origin') || 'https://www.wasel.life'}/payment-success`,
          // ✅ IMPORTANT: Cancel must return to /cart (inside the app/web, not external wasel.life)
          cancel_url: `${req.headers.get('origin') || 'https://localhost:5173'}/cart`
        }
      };

      console.log('Creating PayPal order with payload:', JSON.stringify(orderPayload, null, 2));

      const orderResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload)
      });

      console.log('Order response status:', orderResponse.status);

      if (!orderResponse.ok) {
        const errorText = await orderResponse.text();
        console.error('Order request failed:', errorText);
        throw new Error(`PayPal order request failed: ${orderResponse.status} - ${errorText}`);
      }

      const order = await orderResponse.json();
      console.log('PayPal order created:', { id: order.id, status: order.status });

      if (order.id) {
        const approvalLink = order.links?.find((link: any) => link.rel === 'approve');
        
        if (!approvalLink) {
          throw new Error('No approval URL found in PayPal response');
        }

        const responseData = {
          order_id: order.id,
          approval_url: approvalLink.href
        };

        console.log('Success! Returning:', responseData);

        return new Response(JSON.stringify(responseData), {
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          },
          status: 200,
        });
      } else {
        throw new Error(`No order ID in response: ${JSON.stringify(order)}`);
      }

    } catch (fetchError: any) {
      console.error('PayPal API error:', fetchError);
      throw new Error(`PayPal API error: ${fetchError.message}`);
    }

  } catch (error: any) {
    console.error('=== Function Error ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('Available env vars:', Object.keys(Deno.env.toObject()).filter(k => k.includes('PAYPAL')));
    
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack,
      envVars: Object.keys(Deno.env.toObject()).filter(k => k.includes('PAYPAL'))
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
      status: 500,
    });
  }
})
