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

const base64UrlEncode = (input: string) => {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
};

const signOtp = (email: string, code: string, exp: number, secret: string) => {
  return createHmac('sha256', secret)
    .update(`${email}:${code}:${exp}`)
    .digest('hex');
};

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        if (req.method !== 'POST') {
             throw new Error('Method not allowed');
        }

        let body;
        try {
            body = await req.json();
        } catch {
            return new Response(JSON.stringify({ success: false, error: 'Invalid JSON body' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const { email } = body;

        if (!email || typeof email !== 'string') {
             return new Response(JSON.stringify({ success: false, error: 'البريد الإلكتروني غير صحيح' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const resendKey = Deno.env.get('RESEND_API_KEY');
        const fromEmail = Deno.env.get('RESEND_FROM_EMAIL');
        const otpSecret = Deno.env.get('OTP_SECRET');

        if (!resendKey || !fromEmail || !otpSecret) {
             console.error('Missing Env Vars: RESEND_API_KEY, RESEND_FROM_EMAIL or OTP_SECRET');
             return new Response(JSON.stringify({ success: false, error: 'إعدادات البريد غير مكتملة' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const code = String(Math.floor(100000 + Math.random() * 900000));
        const exp = Date.now() + 5 * 60 * 1000; // 5 minutes
        const hash = signOtp(email.trim().toLowerCase(), code, exp, otpSecret);
        const token = base64UrlEncode(JSON.stringify({ email: email.trim().toLowerCase(), exp, hash }));

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [email],
            subject: 'رمز التحقق - واصل',
            html: `<div style="font-family: Arial, sans-serif;">
              <h2>رمز التحقق الخاص بك</h2>
              <p>استخدم الرمز التالي لإكمال تسجيل الدخول:</p>
              <div style="font-size:24px;font-weight:bold;letter-spacing:4px;">${code}</div>
              <p>هذا الرمز صالح لمدة 5 دقائق.</p>
            </div>`
          })
        });

        if (!emailResponse.ok) {
           const errorData = await emailResponse.json().catch(() => ({}));
           console.error('Resend Error:', errorData);
           return new Response(JSON.stringify({
            success: false,
            error: errorData?.message || 'فشل إرسال البريد'
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({ success: true, token, expiresAt: exp }), {
             headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Send OTP error:', error);
        return new Response(JSON.stringify({ success: false, error: 'فشل إرسال رمز التحقق' }), {
            status: 500,
             headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
