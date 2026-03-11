// @ts-nocheck
// =====================================================
// WASEL SUPABASE EDGE FUNCTION - SECURE ORDER CREATION
// File: supabase/functions/create-secure-order/index.ts
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, idempotency-key, x-session-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SecureOrderRequest {
  cart_id: string;
  shipping_address: {
    full_address: string;
    city: string;
    region?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  payment_provider: 'paypal' | 'stripe' | 'bank_transfer' | 'cash_on_delivery';
  coupon_code?: string;
  customer_notes?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // 1. RATE LIMITING CHECK
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0] ||
                    req.headers.get("cf-connecting-ip") ||
                    req.headers.get("x-real-ip") ||
                    "unknown";

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check rate limit (100 requests per hour per IP)
    const { data: rateLimitCheck, error: rateLimitError } = await supabaseService
      .rpc('check_rate_limit', {
        identifier: clientIP,
        endpoint: '/create-secure-order',
        max_requests: 100,
        window_minutes: 60
      });

    if (rateLimitError || !rateLimitCheck) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Please try again later.",
          retry_after: 3600
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": "3600"
          }
        }
      );
    }

    // 2. IDEMPOTENCY KEY VALIDATION
    const idempotencyKey = req.headers.get("Idempotency-Key");
    if (!idempotencyKey) {
      return new Response(
        JSON.stringify({ error: "Missing Idempotency-Key header" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if idempotency key already exists
    const { data: existingKey } = await supabaseService
      .from("idempotency_keys")
      .select("response_body")
      .eq("key", idempotencyKey)
      .single();

    if (existingKey) {
      return new Response(
        JSON.stringify(existingKey.response_body),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // 3. AUTHENTICATION VALIDATION
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      await supabaseService.rpc('detect_suspicious_activity', {
        event_type: 'unauthorized_access',
        user_id: null,
        ip_address: clientIP,
        details: { endpoint: '/create-secure-order', user_agent: req.headers.get("user-agent") }
      });

      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize user client for RLS
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user from JWT
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      await supabaseService.rpc('handle_failed_login', {
        user_email: 'unknown',
        ip_address: clientIP
      });

      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. INPUT VALIDATION
    let requestData: SecureOrderRequest;
    try {
      requestData = await req.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate required fields
    const { cart_id, shipping_address, payment_provider } = requestData;
    if (!cart_id || !shipping_address || !payment_provider) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: cart_id, shipping_address, payment_provider" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate payment provider
    const validProviders = ['paypal', 'stripe', 'bank_transfer', 'cash_on_delivery'];
    if (!validProviders.includes(payment_provider)) {
      return new Response(
        JSON.stringify({ error: "Invalid payment provider" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. CART VALIDATION AND SNAPSHOT
    const { data: cart, error: cartError } = await supabaseUser
      .from("family_carts")
      .select(`
        id,
        owner_user,
        cart_items (
          id,
          product_id,
          qty,
          price_snapshot_cents,
          attributes_snapshot,
          products (
            id,
            title,
            stock,
            is_active
          )
        )
      `)
      .eq("id", cart_id)
      .eq("owner_user", user.id)
      .single();

    if (cartError || !cart) {
      return new Response(
        JSON.stringify({ error: "Cart not found or access denied" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate cart integrity
    const { data: cartValid, error: cartValidationError } = await supabaseService
      .rpc('validate_cart_integrity', { p_cart_id: cart_id });

    if (cartValidationError || !cartValid) {
      return new Response(
        JSON.stringify({ error: "Cart validation failed. Please refresh and try again." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. COUPON VALIDATION (if provided)
    let couponData = null;
    let discountCents = 0;

    if (requestData.coupon_code) {
      // Implement coupon validation logic here
      // For now, skip coupon processing
    }

    // 7. CALCULATE TOTALS
    let subtotalCents = 0;
    let shippingCents = 500; // $5.00 fixed shipping
    let taxCents = 0;

    for (const item of cart.cart_items) {
      subtotalCents += item.qty * item.price_snapshot_cents;
    }

    // Calculate tax (example: 8% on subtotal)
    taxCents = Math.round(subtotalCents * 0.08);

    const totalCents = subtotalCents + shippingCents + taxCents - discountCents;

    // 8. ENCRYPT SENSITIVE DATA
    const shippingAddressEncrypted = await supabaseService.rpc('encrypt_data', {
      data: JSON.stringify(requestData.shipping_address),
      key_id: 'default'
    });

    const customerNotesEncrypted = requestData.customer_notes ?
      await supabaseService.rpc('encrypt_data', {
        data: requestData.customer_notes,
        key_id: 'default'
      }) : null;

    // Create cart snapshot
    const cartSnapshot = {
      id: cart.id,
      cart_items: cart.cart_items,
      subtotal_cents: subtotalCents,
      discount_cents: discountCents,
      shipping_cents: shippingCents,
      tax_cents: taxCents,
      total_cents: totalCents
    };

    // 9. GENERATE ORDER NUMBER
    const { data: orderNumber, error: orderNumberError } = await supabaseService
      .rpc('generate_order_number');

    if (orderNumberError || !orderNumber) {
      return new Response(
        JSON.stringify({ error: "Failed to generate order number" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 10. CREATE ORDER IN SECURE TRANSACTION
    const { data: orderResult, error: orderTransactionError } = await supabaseService
      .rpc('create_secure_order_transaction', {
        p_user_id: user.id,
        p_order_number: orderNumber,
        p_cart_snapshot: cartSnapshot,
        p_shipping_address_encrypted: shippingAddressEncrypted,
        p_total_cents: totalCents,
        p_payment_provider: payment_provider,
        p_idempotency_key: idempotencyKey,
        p_ip_address: clientIP,
        p_user_agent: req.headers.get("user-agent"),
        p_session_id: req.headers.get("x-session-id"),
        p_coupon_data: couponData,
        p_discount_cents: discountCents,
        p_shipping_cents: shippingCents,
        p_tax_cents: taxCents,
        p_customer_notes_encrypted: customerNotesEncrypted
      });

    if (orderTransactionError || !orderResult) {
      return new Response(
        JSON.stringify({ error: "Order creation failed: " + orderTransactionError?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 11. STORE IDEMPOTENCY KEY
    const response = {
      success: true,
      order: {
        id: orderResult.id,
        order_number: orderResult.order_number,
        total_cents: totalCents,
        total_lira: Math.round(totalCents * 0.027), // Approximate USD to TRY conversion
        currency: "USD",
        payment_provider: payment_provider,
        items_count: cart.cart_items.length,
        subtotal_cents: subtotalCents,
        discount_cents: discountCents,
        shipping_cents: shippingCents,
        tax_cents: taxCents,
        requires_payment: payment_provider !== 'cash_on_delivery'
      },
      processing_time_ms: Date.now() - startTime
    };

    await supabaseService
      .from("idempotency_keys")
      .insert({
        key: idempotencyKey,
        user_id: user.id,
        endpoint: "/create-secure-order",
        request_hash: JSON.stringify({
          cart_id,
          payment_provider,
          total_cents
        }),
        response_status: 200,
        response_body: response,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });

    // 12. LOG SUCCESSFUL ORDER CREATION
    await supabaseService.rpc('log_audit_event', {
      action_type: 'order_created',
      target_table: 'orders',
      target_id: orderResult.id,
      new_values: orderResult,
      change_reason: 'Secure order created via API'
    });

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Create secure order error:", error);

    // Log critical errors
    try {
      const supabaseService = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      await supabaseService.from("security_events").insert({
        event_type: 'api_error',
        severity: 'high',
        details: {
          endpoint: '/create-secure-order',
          error: error.message,
          stack: error.stack
        },
        created_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        request_id: crypto.randomUUID()
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
