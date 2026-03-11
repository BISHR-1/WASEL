// PayPal Integration - Server Side (Deno/Edge Function)
// Note: This is a local duplicate, main implementation is in supabase/functions
// WARNING: This file is deprecated - use supabase/functions/create-paypal-payment/index.ts instead
// The main implementation now includes proper fallback for null/missing origin headers from mobile clients

const PAYPAL_ENVIRONMENT = (globalThis as any).Deno?.env.get("PAYPAL_ENVIRONMENT") || "sandbox";
const PAYPAL_API_BASE_LOCAL = PAYPAL_ENVIRONMENT === "production" 
  ? "https://api-m.paypal.com" 
  : "https://api-m.sandbox.paypal.com";

const PAYPAL_CLIENT_ID_LOCAL = (globalThis as any).Deno?.env.get("PAYPAL_CLIENT_ID") || "test";
const PAYPAL_CLIENT_SECRET_LOCAL = (globalThis as any).Deno?.env.get("PAYPAL_CLIENT_SECRET") || "test";

const corsHeadersLocal = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getAccessTokenLocal() {
  if (!PAYPAL_CLIENT_ID_LOCAL || !PAYPAL_CLIENT_SECRET_LOCAL) {
      throw new Error("Missing PayPal Credentials");
  }
  const auth = btoa(`${PAYPAL_CLIENT_ID_LOCAL}:${PAYPAL_CLIENT_SECRET_LOCAL}`);
  const response = await fetch(`${PAYPAL_API_BASE_LOCAL}/v1/oauth2/token`, {
    method: "POST",
    body: "grant_type=client_credentials",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  
  if (!response.ok) {
     const errorText = await response.text();
     throw new Error(`PayPal Token Error: ${response.status} ${errorText}`);
  }
  
  const data = await response.json();
  return data.access_token;
}

interface OrderAmount {
    currency_code: string;
    value: string;
}

interface PurchaseUnit {
    amount: OrderAmount;
}

interface CreateOrderPayload {
    intent: "CAPTURE" | "AUTHORIZE";
    purchase_units: PurchaseUnit[];
}

async function createOrderLocal(amount: string, currency: string = "USD"): Promise<any> {
    const accessToken = await getAccessTokenLocal();
    const payload: CreateOrderPayload = {
        intent: "CAPTURE",
        purchase_units: [
            {
                amount: {
                    currency_code: currency,
                    value: amount,
                },
            },
        ],
    };

    const response = await fetch(`${PAYPAL_API_BASE_LOCAL}/v2/checkout/orders`, {
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

async function captureOrderLocal(orderId: string): Promise<any> {
    const accessToken = await getAccessTokenLocal();
    const response = await fetch(`${PAYPAL_API_BASE_LOCAL}/v2/checkout/orders/${orderId}/capture`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
        },
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`PayPal Capture Error: ${errorText}`);
    }

    return response.json();
}

// @ts-ignore
(globalThis as any).Deno?.serve(async (req: Request) => {
  // CORS handling
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeadersLocal });
  }

  try {
    let bodyData;
    try {
        bodyData = await req.json();
    } catch (e) {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400, headers: corsHeadersLocal });
    }
    
    const { action, amount, currency, orderID } = bodyData;

    if (action === 'create') {
      const data = await createOrderLocal(amount, currency || 'USD');
      return Response.json(data, { headers: corsHeadersLocal });
    }

    if (action === 'capture') {
      const data = await captureOrderLocal(orderID);
      return Response.json(data, { headers: corsHeadersLocal });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400, headers: corsHeadersLocal });

  } catch (error: any) {
    console.error("PayPal Function Error:", error);
    return Response.json({ error: error.message }, { status: 500, headers: corsHeadersLocal });
  }
});
