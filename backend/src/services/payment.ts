
import crypto from 'crypto';
import fetch from 'node-fetch'; // Ensure node-fetch is installed
import { supabaseAdmin } from '../utils/supabase';
import { AuditService } from './audit_service';
import { NotificationService } from './notification_service';

// Configuration
const PAYPAL_API_BASE = process.env.PAYPAL_ENV === 'production'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID || '';

/**
 * Generate an OAuth 2.0 access token for retrieving API credentials.
 */
async function generateAccessToken(): Promise<string> {
    const auth = Buffer.from(PAYPAL_CLIENT_ID + ':' + PAYPAL_CLIENT_SECRET).toString('base64');
    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
        method: 'POST',
        body: 'grant_type=client_credentials',
        headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });

    const data = await response.json() as any;
    if (!data.access_token) {
        throw new Error('Failed to generate PayPal Access Token');
    }
    return data.access_token;
}

/**
 * Create an order in PayPal system. Server-side integration.
 * @param orderId Internal System Order ID
 * @param userId User ID owning the order
 * @param cartTotal Total amount in currency
 * @param currency Currency code (e.g., 'USD')
 * @returns Order details including ID and Approve Link
 */
export async function createPayPalOrder(orderId: string, userId: string, cartTotal: number, currency: string = 'USD') {
    const accessToken = await generateAccessToken();
    const payload = {
        intent: 'CAPTURE',
        purchase_units: [
            {
                reference_id: orderId, // Link PayPal transaction to our Order ID
                amount: {
                    currency_code: currency,
                    value: cartTotal.toFixed(2),
                },
            },
        ],
    };

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
    });

    const data = await response.json() as any;

    // --- LOGGING START ---
    if (data.id) {
        // 1. Create Payment Record
        const { error: paymentError } = await supabaseAdmin.from('payments').insert({
            order_id: orderId,
            user_id: userId,
            provider: 'paypal',
            provider_transaction_id: data.id,
            amount: cartTotal,
            currency: currency,
            status: 'initiated',
            raw_provider_response: data
        });

        if (paymentError) console.error('Payment Log Error:', paymentError);

        // 2. Audit Log
        await AuditService.logAction({
            actor_id: userId,
            action_type: 'PAYMENT_INITIATED',
            target_table: 'orders',
            target_id: orderId,
            new_value: { paypal_order_id: data.id, amount: cartTotal }
        });
    } else {
        // Log failure attempt
        await AuditService.logAction({
            actor_id: userId,
            action_type: 'PAYMENT_CREATION_FAILED',
            target_table: 'orders',
            target_id: orderId,
            new_value: { error: data }
        });

        // Notify Admin of creation failure (potential issue with PayPal creds)
        await NotificationService.sendAdminAlert({
            title: 'Payment Creation Failed',
            body: `Failed to init payment for Order ${orderId}`,
            data: { error: JSON.stringify(data) }
        });
    }
    // --- LOGGING END ---

    return data;
}

/**
 * Capture payment for a created order.
 * @param paypalOrderId PayPal Order ID
 * @param systemOrderId Our internal Order ID (optional but recommended for verification)
 */
export async function capturePayPalOrder(paypalOrderId: string, systemOrderId?: string) {
    const accessToken = await generateAccessToken();
    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${paypalOrderId}/capture`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
    });

    const data = await response.json() as any;

    // --- LOGGING START ---
    const status = data.status === 'COMPLETED' ? 'succeeded' : 'failed';

    // Update Payment Record
    // We search by provider_transaction_id (PayPal Order ID) since that's what we have here
    const { data: inputs } = await supabaseAdmin.from('payments')
        .select('payment_id, order_id, user_id, amount, currency')
        .eq('provider_transaction_id', paypalOrderId)
        .single();

    if (inputs) {
        await supabaseAdmin.from('payments')
            .update({
                status: status,
                raw_provider_response: data,
                updated_at: new Date().toISOString()
            })
            .eq('payment_id', inputs.payment_id);

        // Audit Log
        await AuditService.logAction({
            actor_id: inputs.user_id,
            action_type: `PAYMENT_${status.toUpperCase()}`,
            target_table: 'orders',
            target_id: inputs.order_id, // Use system order ID from DB
            new_value: { status: status, paypal_capture_id: data.id }
        });

        // If successful, update the main Order status as well (Double Write for safety)
        if (status === 'succeeded') {
            await supabaseAdmin.from('orders')
                .update({
                    payment_status: 'succeeded',
                    payment_provider: 'paypal',
                    payment_provider_response: data
                })
                .eq('id', inputs.order_id);

            // Notify Admin
            await NotificationService.sendAdminAlert({
                title: '💰 Payment Received',
                body: `Order ${inputs.order_id} paid. ${inputs.amount} ${inputs.currency}`,
                data: { orderId: inputs.order_id, paymentId: inputs.payment_id }
            });
        } else {
            // Notify Admin of Failure
            await NotificationService.sendAdminAlert({
                title: '❌ Payment Failed',
                body: `Order ${inputs.order_id} capture failed.`,
                data: { orderId: inputs.order_id, reason: JSON.stringify(data) }
            });
        }
    }
    // --- LOGGING END ---

    return data;
}

/**
 * Verify PayPal Webhook Signature.
 * Crucial for preventing replay attacks and ensuring the event is from PayPal.
 * @param headers HTTP Headers from the request
 * @param rawBody Raw HTTP Body string (do not parse JSON before this)
 * @returns boolean indicating validity
 */
export async function verifyWebhookSignature(headers: any, rawBody: string): Promise<boolean> {
    const transmissionId = headers['paypal-transmission-id'];
    const transmissionTime = headers['paypal-transmission-time'];
    const certUrl = headers['paypal-cert-url'];
    const authAlgo = headers['paypal-auth-algo'];
    const transmissionSig = headers['paypal-transmission-sig'];

    // 1. Basic check: headers presence
    if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
        return false;
    }

    // 2. Validate Certificate URL (must be *.paypal.com)
    // In a real implementation, you would download the cert and verify the chain.
    // For this snippet, we use PayPal's API to verify the signature (simpler approach).

    const accessToken = await generateAccessToken();

    const verificationPayload = {
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: PAYPAL_WEBHOOK_ID,
        webhook_event: JSON.parse(rawBody) // We need the event body here
    };

    const response = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(verificationPayload),
    });

    const verification = await response.json() as any;
    return verification.verification_status === 'SUCCESS';
}
