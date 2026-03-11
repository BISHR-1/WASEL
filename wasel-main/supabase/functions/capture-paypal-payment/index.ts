import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// ✅ Capture PayPal Payment - Hosted Fields (Card Payment)
// This function captures an already-created PayPal order after Hosted Fields submission

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    console.log('=== Capture Payment Function Started ===')
    
    let body
    try {
      body = await req.json()
      console.log('Request body:', JSON.stringify(body, null, 2))
    } catch (e: any) {
      console.error('JSON parse error:', e)
      return new Response(
        JSON.stringify({ 
          error: "Invalid JSON body",
          details: e.message
        }),
        {
          status: 400,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          },
        }
      )
    }

    const { orderId, order_id } = body
    const paypalOrderId = orderId || order_id

    console.log('Processing capture for order:', paypalOrderId)

    if (!paypalOrderId) {
      return new Response(
        JSON.stringify({ 
          error: "Missing order ID",
          received: body
        }),
        {
          status: 400,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          },
        }
      )
    }

    // Get PayPal credentials
    const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID')
    const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET')
    const PAYPAL_ENV = Deno.env.get('PAYPAL_ENV') || 'sandbox'
    
    const PAYPAL_API_BASE = PAYPAL_ENV === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com'

    console.log('Configuration:', {
      env: PAYPAL_ENV,
      apiBase: PAYPAL_API_BASE,
      hasClientId: !!PAYPAL_CLIENT_ID,
      hasClientSecret: !!PAYPAL_CLIENT_SECRET
    })

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error('Missing PayPal credentials')
    }

    // Get access token
    const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`)
    
    console.log('🔐 Getting PayPal access token...')
    const tokenResponse = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials'
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token error:', errorText)
      throw new Error(`Token request failed: ${tokenResponse.status} - ${errorText}`)
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      throw new Error('No access token received')
    }

    console.log('✅ Access token received')

    // Capture the order
    console.log(`💳 Capturing order: ${paypalOrderId}`)
    
    const captureResponse = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${paypalOrderId}/capture`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    console.log('Capture response status:', captureResponse.status)

    if (!captureResponse.ok) {
      const errorText = await captureResponse.text()
      console.error('Capture failed:', errorText)
      
      try {
        const errorJson = JSON.parse(errorText)
        throw new Error(`Capture failed: ${errorJson.message || errorText}`)
      } catch {
        throw new Error(`Capture failed: ${captureResponse.status} - ${errorText}`)
      }
    }

    const captureData = await captureResponse.json()
    
    console.log('✅ Payment captured successfully:', {
      orderId: captureData.id,
      status: captureData.status,
      payerEmail: captureData.payer?.email_address
    })

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      orderId: captureData.id,
      status: captureData.status,
      payer: captureData.payer,
      purchaseUnits: captureData.purchase_units
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
      status: 200,
    })

  } catch (error: any) {
    console.error('=== Capture Error ===')
    console.error('Error:', error.message)
    console.error('Stack:', error.stack)
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Payment capture failed',
      details: error.stack
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
      status: 500,
    })
  }
})
