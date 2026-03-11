// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { createHmac } from "node:crypto";
import { Buffer } from "node:buffer";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

const base64UrlDecode = (input: string) => {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '==='.slice((base64.length + 3) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
};

const signOtp = (email: string, code: string, exp: number, secret: string) => {
  return createHmac('sha256', secret)
    .update(`${email}:${code}:${exp}`)
    .digest('hex');
};

const signSession = (email: string, exp: number, secret: string) => {
  return createHmac('sha256', secret)
    .update(`${email}:${exp}`)
    .digest('hex');
};

const base64UrlEncode = (input: string) => {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
};

interface VerifyOtpRequest {
    email: string;
    code: string;
    token: string;
}

interface OtpPayload {
    email: string;
    exp: number;
    hash: string;
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        if (req.method !== 'POST') {
                throw new Error('Method not allowed');
        }

        let body: VerifyOtpRequest;
        try {
                body = await req.json();
        } catch {
                 return new Response(JSON.stringify({ success: false, error: 'Invalid JSON' }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
        }

        const { email, code, token } = body;
        
        if (!email || !code || !token) {
                return new Response(JSON.stringify({ success: false, error: 'البيانات غير مكتملة' }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
        }

        const otpSecret = Deno.env.get('OTP_SECRET');
        if (!otpSecret) {
                console.error('Missing OTP_SECRET env var');
                return new Response(JSON.stringify({ success: false, error: 'خطأ في الخادم' }), { // Hide internal detail
                        status: 500,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
        }

        let payload: OtpPayload;
        try {
            payload = JSON.parse(base64UrlDecode(token));
        } catch (err) {
            return new Response(JSON.stringify({ success: false, error: 'رمز غير صالح (Decode)' }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        
        // Validate payload structure
        if (!payload || !payload.email || !payload.exp || !payload.hash) {
                 return new Response(JSON.stringify({ success: false, error: 'بيانات الرمز تالفة' }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
        }

        if (payload.email !== normalizedEmail) {
            return new Response(JSON.stringify({ success: false, error: 'البريد الإلكتروني لا يطابق الرمز' }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (Date.now() > payload.exp) {
            return new Response(JSON.stringify({ success: false, error: 'انتهت صلاحية الرمز' }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const expectedHash = signOtp(normalizedEmail, String(code).trim(), payload.exp, otpSecret);
        if (expectedHash !== payload.hash) {
            return new Response(JSON.stringify({ success: false, error: 'كود التحقق خاطئ' }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const sessionExp = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
        const sessionSig = signSession(normalizedEmail, sessionExp, otpSecret);
        const sessionToken = base64UrlEncode(JSON.stringify({ email: normalizedEmail, exp: sessionExp, sig: sessionSig }));

        // TODO: Save user to database when needed
        // Can be implemented via REST API call to Supabase if needed

        return new Response(JSON.stringify({
            success: true,
            sessionToken,
            sessionExpiresAt: sessionExp,
            user: {
                email: normalizedEmail
            }
        }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Verify OTP error:', error);
        return new Response(JSON.stringify({ success: false, error: 'فشل التحقق من الرمز' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
})
