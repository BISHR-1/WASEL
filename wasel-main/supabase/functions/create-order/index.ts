// @ts-nocheck
// =====================================================
// WASEL SUPABASE EDGE FUNCTION - SECURE ORDER CREATION
// File: supabase/functions/create-order/index.ts
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, idempotency-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CartItem {
  product_id: string;
  quantity: number;
  price_snapshot_cents: number;
  attributes_snapshot?: Record<string, unknown>;
}

interface OrderRequest {
  cart_id: string;
  shipping_address: {
    full_address: string;
    city: string;
    region?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  payment_provider: 'paypal' | 'bank_transfer' | 'cash_on_delivery';
  coupon_code?: string;
  customer_notes?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get idempotency key
    const idempotencyKey = req.headers.get("Idempotency-Key");
    if (!idempotencyKey) {
      return new Response(
        JSON.stringify({ error: "Missing Idempotency-Key header" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create user client for RLS
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user from JWT
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check idempotency
    const { data: existingKey } = await supabase
      .from("idempotency_keys")
      .select("*")
      .eq("key", idempotencyKey)
      .single();

    if (existingKey) {
      // Return cached response
      return new Response(
        JSON.stringify(existingKey.response_body),
        { 
          status: existingKey.response_status, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Parse request body
    const body: OrderRequest = await req.json();
    const { cart_id, shipping_address, payment_provider, coupon_code, customer_notes } = body;

    // Validate required fields
    if (!cart_id || !shipping_address || !payment_provider) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: cart_id, shipping_address, payment_provider" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate payment provider
    const validProviders = ['paypal', 'bank_transfer', 'cash_on_delivery'];
    if (!validProviders.includes(payment_provider)) {
      return new Response(
        JSON.stringify({ error: "Invalid payment provider" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Start transaction-like operations
    // 1. Get cart and verify ownership
    const { data: cart, error: cartError } = await supabase
      .from("family_carts")
      .select("*")
      .eq("id", cart_id)
      .eq("owner_user_id", user.id)
      .eq("status", "active")
      .single();

    if (cartError || !cart) {
      return new Response(
        JSON.stringify({ error: "Cart not found or not active" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Get cart items with product details
    const { data: cartItems, error: itemsError } = await supabase
      .from("cart_items")
      .select(`
        id,
        product_id,
        quantity,
        price_snapshot_cents,
        attributes_snapshot,
        products (
          id,
          title,
          sku,
          stock,
          reserved_stock,
          is_active,
          images
        )
      `)
      .eq("cart_id", cart_id);

    if (itemsError || !cartItems || cartItems.length === 0) {
      return new Response(
        JSON.stringify({ error: "Cart is empty" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Validate stock availability
    const stockErrors: string[] = [];
    for (const item of cartItems) {
      const product = item.products as any;
      if (!product.is_active) {
        stockErrors.push(`Product "${product.title}" is no longer available`);
      }
      const availableStock = product.stock - product.reserved_stock + item.quantity; // +quantity because it's already reserved
      if (availableStock < item.quantity) {
        stockErrors.push(`Insufficient stock for "${product.title}". Available: ${availableStock}`);
      }
    }

    if (stockErrors.length > 0) {
      return new Response(
        JSON.stringify({ error: "Stock validation failed", details: stockErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Calculate totals
    let subtotalCents = 0;
    const cartSnapshot = {
      items: cartItems.map(item => {
        const itemTotal = item.price_snapshot_cents * item.quantity;
        subtotalCents += itemTotal;
        return {
          product_id: item.product_id,
          quantity: item.quantity,
          price_cents: item.price_snapshot_cents,
          total_cents: itemTotal,
          attributes: item.attributes_snapshot,
          product_title: (item.products as any).title,
          product_sku: (item.products as any).sku,
          product_image: (item.products as any).images?.[0]
        };
      }),
      created_at: new Date().toISOString()
    };

    // 5. Apply coupon if provided
    let discountCents = 0;
    let couponData = null;
    if (coupon_code) {
      const { data: coupon, error: couponError } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", coupon_code.toUpperCase())
        .eq("is_active", true)
        .gt("valid_until", new Date().toISOString())
        .single();

      if (coupon && !couponError) {
        // Check usage limits
        if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
          // Coupon exhausted, skip
        } else if (subtotalCents >= coupon.min_order_cents) {
          // Apply discount
          if (coupon.discount_type === 'percentage') {
            discountCents = Math.floor(subtotalCents * (coupon.discount_value / 100));
          } else {
            discountCents = coupon.discount_value;
          }
          
          // Apply max discount cap
          if (coupon.max_discount_cents && discountCents > coupon.max_discount_cents) {
            discountCents = coupon.max_discount_cents;
          }

          couponData = { code: coupon.code, discount_cents: discountCents };

          // Increment coupon usage
          await supabase
            .from("coupons")
            .update({ usage_count: coupon.usage_count + 1 })
            .eq("id", coupon.id);
        }
      }
    }

    // 6. Calculate shipping (simplified - could be based on location)
    const shippingCents = 500; // $5.00 flat rate

    // 7. Calculate tax (if applicable)
    const taxRate = 0; // 0% for Syria
    const taxCents = Math.floor((subtotalCents - discountCents) * taxRate);

    // 8. Calculate total
    const totalCents = subtotalCents - discountCents + shippingCents + taxCents;

    // 9. Get exchange rate (USD to LYR)
    const exchangeRate = 115.00; // 1 USD = 115 LYR (should be dynamic)

    // 10. Lock cart
    await supabase
      .from("family_carts")
      .update({ status: "checkout" })
      .eq("id", cart_id);

    // 11. Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        cart_id: cart_id,
        cart_snapshot: cartSnapshot,
        items_count: cartItems.length,
        subtotal_cents: subtotalCents,
        discount_cents: discountCents,
        shipping_cents: shippingCents,
        tax_cents: taxCents,
        total_cents: totalCents,
        currency: "USD",
        exchange_rate: exchangeRate,
        payment_provider: payment_provider,
        payment_status: "pending",
        shipping_address: shipping_address,
        shipping_status: "pending",
        customer_notes: customer_notes,
        idempotency_key: idempotencyKey,
        ip_address: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip"),
        user_agent: req.headers.get("user-agent"),
        metadata: {
          coupon: couponData
        }
      })
      .select()
      .single();

    if (orderError || !order) {
      // Rollback cart status
      await supabase
        .from("family_carts")
        .update({ status: "active" })
        .eq("id", cart_id);

      console.error("Order creation error:", orderError);
      return new Response(
        JSON.stringify({ error: "Failed to create order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 12. Log audit
    await supabase
      .from("audit_logs")
      .insert({
        user_id: user.id,
        action: "ORDER_CREATED",
        table_name: "orders",
        record_id: order.id,
        new_values: { order_number: order.order_number, total_cents: totalCents },
        ip_address: req.headers.get("x-forwarded-for"),
        user_agent: req.headers.get("user-agent")
      });

    // 13. Prepare response
    const response = {
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        total_cents: totalCents,
        total_lira: Math.round(totalCents * exchangeRate / 100),
        currency: "USD",
        payment_provider: payment_provider,
        items_count: cartItems.length,
        subtotal_cents: subtotalCents,
        discount_cents: discountCents,
        shipping_cents: shippingCents,
        requires_payment: payment_provider === 'paypal'
      }
    };

    // 14. Store idempotency key
    await supabase
      .from("idempotency_keys")
      .insert({
        key: idempotencyKey,
        user_id: user.id,
        endpoint: "/create-order",
        request_hash: JSON.stringify({ cart_id, payment_provider }),
        response_status: 200,
        response_body: response
      });

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Create order error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
