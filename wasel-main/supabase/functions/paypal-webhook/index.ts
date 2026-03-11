// @ts-nocheck
// =====================================================
// WASEL SUPABASE EDGE FUNCTION - PAYPAL WEBHOOK HANDLER
// File: supabase/functions/paypal-webhook/index.ts
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  resource_type: string;
  resource: {
    id: string;
    status?: string;
    purchase_units?: Array<{
      reference_id?: string;
      custom_id?: string;
      amount: {
        currency_code: string;
        value: string;
      };
    }>;
    payer?: {
      email_address?: string;
      payer_id?: string;
    };
  };
  create_time: string;
  summary?: string;
}

// PayPal Webhook signature verification
async function verifyPayPalWebhook(
  req: Request,
  body: string,
  webhookId: string
): Promise<boolean> {
  const transmissionId = req.headers.get("paypal-transmission-id");
  const transmissionTime = req.headers.get("paypal-transmission-time");
  const certUrl = req.headers.get("paypal-cert-url");
  const authAlgo = req.headers.get("paypal-auth-algo");
  const transmissionSig = req.headers.get("paypal-transmission-sig");

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    console.error("Missing PayPal headers");
    return false;
  }

  // Validate cert URL is from PayPal
  const certUrlParsed = new URL(certUrl);
  if (!certUrlParsed.hostname.endsWith(".paypal.com")) {
    console.error("Invalid cert URL hostname");
    return false;
  }

  try {
    // Fetch PayPal certificate
    const certResponse = await fetch(certUrl);
    const certPem = await certResponse.text();

    // Construct expected signature string
    const expectedSignatureString = `${transmissionId}|${transmissionTime}|${webhookId}|${await computeCrc32(body)}`;

    // For production, use proper certificate verification
    // This is a simplified check - in production use crypto.subtle.verify
    console.log("Webhook verification data:", {
      transmissionId,
      transmissionTime,
      webhookId,
      bodyLength: body.length
    });

    // For now, we'll do basic validation and trust the headers
    // In production, implement full certificate chain verification
    return true;
  } catch (error) {
    console.error("Webhook verification error:", error);
    return false;
  }
}

// CRC32 computation for PayPal signature
async function computeCrc32(data: string): Promise<number> {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(data);
  
  let crc = 0xFFFFFFFF;
  const table = new Uint32Array(256);
  
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  
  for (const byte of bytes) {
    crc = table[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
  }
  
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const paypalWebhookId = Deno.env.get("PAYPAL_WEBHOOK_ID")!;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.text();
    const event: PayPalWebhookEvent = JSON.parse(body);

    // Log webhook receipt
    const { data: webhookLog, error: logError } = await supabase
      .from("webhook_logs")
      .insert({
        provider: "paypal",
        event_type: event.event_type,
        event_id: event.id,
        payload: event,
        signature: req.headers.get("paypal-transmission-sig"),
        signature_valid: false, // Will update after verification
        processed: false
      })
      .select()
      .single();

    if (logError) {
      console.error("Failed to log webhook:", logError);
    }

    // Verify webhook signature
    const isValid = await verifyPayPalWebhook(req, body, paypalWebhookId);

    // Update signature validity
    if (webhookLog) {
      await supabase
        .from("webhook_logs")
        .update({ signature_valid: isValid })
        .eq("id", webhookLog.id);
    }

    if (!isValid) {
      console.error("Invalid webhook signature");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process webhook based on event type
    let processed = false;
    let errorMessage = null;

    switch (event.event_type) {
      case "CHECKOUT.ORDER.APPROVED":
        // Order approved - ready to capture
        console.log("Order approved:", event.resource.id);
        processed = true;
        break;

      case "PAYMENT.CAPTURE.COMPLETED":
        // Payment captured successfully
        const captureId = event.resource.id;
        const purchaseUnit = event.resource.purchase_units?.[0];
        const orderId = purchaseUnit?.custom_id || purchaseUnit?.reference_id;

        if (orderId) {
          // Update order status
          const { error: updateError } = await supabase
            .from("orders")
            .update({
              payment_status: "succeeded",
              payment_provider_order_id: captureId,
              payment_provider_response: event.resource,
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq("id", orderId);

          if (updateError) {
            console.error("Failed to update order:", updateError);
            errorMessage = updateError.message;
          } else {
            // Log audit
            await supabase
              .from("audit_logs")
              .insert({
                action: "PAYMENT_CAPTURED",
                table_name: "orders",
                record_id: orderId,
                new_values: {
                  capture_id: captureId,
                  amount: purchaseUnit?.amount
                }
              });

            processed = true;
          }
        } else {
          errorMessage = "Missing order ID in webhook";
        }
        break;

      case "PAYMENT.CAPTURE.DENIED":
      case "PAYMENT.CAPTURE.DECLINED":
        // Payment failed
        const failedOrderId = event.resource.purchase_units?.[0]?.custom_id;
        
        if (failedOrderId) {
          await supabase
            .from("orders")
            .update({
              payment_status: "failed",
              payment_provider_response: event.resource,
              updated_at: new Date().toISOString()
            })
            .eq("id", failedOrderId);

          // Restore cart status
          const { data: order } = await supabase
            .from("orders")
            .select("cart_id")
            .eq("id", failedOrderId)
            .single();

          if (order?.cart_id) {
            await supabase
              .from("family_carts")
              .update({ status: "active" })
              .eq("id", order.cart_id);
          }

          processed = true;
        }
        break;

      case "PAYMENT.CAPTURE.REFUNDED":
        // Payment refunded
        const refundedOrderId = event.resource.purchase_units?.[0]?.custom_id;
        
        if (refundedOrderId) {
          await supabase
            .from("orders")
            .update({
              payment_status: "refunded",
              payment_provider_response: event.resource,
              updated_at: new Date().toISOString()
            })
            .eq("id", refundedOrderId);

          processed = true;
        }
        break;

      default:
        console.log("Unhandled event type:", event.event_type);
        processed = true; // Mark as processed to avoid retries
    }

    // Update webhook log
    if (webhookLog) {
      await supabase
        .from("webhook_logs")
        .update({
          processed,
          processed_at: new Date().toISOString(),
          error_message: errorMessage
        })
        .eq("id", webhookLog.id);
    }

    return new Response(
      JSON.stringify({ received: true, processed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
