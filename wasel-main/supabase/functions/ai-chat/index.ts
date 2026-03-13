// @ts-nocheck
// Supabase Edge Function - AI Chat with RAG
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Encryption key from environment
const ENCRYPTION_KEY = Deno.env.get('CHAT_ENCRYPTION_KEY') || ''
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || ''

// AES-256-GCM encryption
async function encryptMessage(plaintext: string): Promise<{ encrypted: string; iv: string }> {
  const encoder = new TextEncoder()
  const data = encoder.encode(plaintext)
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  )
  
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  )
  
  return {
    encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv))
  }
}

async function decryptMessage(encrypted: string, ivBase64: string): Promise<string> {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  )
  
  const iv = Uint8Array.from(atob(ivBase64), (c) => c.charCodeAt(0))
  const encryptedData = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0))
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    encryptedData
  )
  
  return decoder.decode(decrypted)
}

// Prompt injection detection
function detectPromptInjection(input: string): boolean {
  const patterns = [
    /ignore\s+(all\s+)?previous\s+instructions/i,
    /disregard\s+(all\s+)?previous/i,
    /forget\s+(all\s+)?previous/i,
    /you\s+are\s+now/i,
    /act\s+as\s+if/i,
    /pretend\s+(you\s+are|to\s+be)/i,
    /system\s*:\s*/i,
    /\[INST\]/i,
    /\<\|im_start\|\>/i,
    /\<\|system\|\>/i,
    /jailbreak/i,
    /bypass\s+(your\s+)?restrictions/i,
  ]
  
  return patterns.some(pattern => pattern.test(input))
}

// Sanitize user input
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/\x00/g, '')
    .trim()
    .slice(0, 2000)
}

// Search products for RAG context
async function searchProducts(supabase: any, query: string): Promise<any[]> {
  const { data: products } = await supabase
    .from('products')
    .select('id, name, name_ar, description, description_ar, price, category, image_url')
    .or(`name.ilike.%${query}%,name_ar.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
    .eq('is_active', true)
    .limit(5)
  
  return products || []
}

// Search orders for context
async function searchOrders(supabase: any, userId: string): Promise<any[]> {
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, status, total, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)
  
  return orders || []
}

// Build system prompt with RAG context
function buildSystemPrompt(products: any[], orders: any[], language: string): string {
  const isArabic = language === 'ar'
  
  let context = isArabic 
    ? 'أنت مساعد ذكي لتطبيق واصل ستور للتوصيل. ساعد العملاء في طلباتهم واستفساراتهم.\n\n'
    : 'You are a helpful assistant for Wasel delivery app. Help customers with their orders and inquiries.\n\n'
  
  if (products.length > 0) {
    context += isArabic ? 'المنتجات المتاحة:\n' : 'Available products:\n'
    products.forEach((p: any) => {
      context += `- ${isArabic ? p.name_ar || p.name : p.name}: ${p.price} SAR\n`
    })
    context += '\n'
  }
  
  if (orders.length > 0) {
    context += isArabic ? 'طلباتك الأخيرة:\n' : 'Your recent orders:\n'
    orders.forEach((o: any) => {
      context += `- #${o.order_number}: ${o.status} (${o.total} SAR)\n`
    })
    context += '\n'
  }
  
  context += isArabic
    ? 'قواعد مهمة: لا تكشف معلومات حساسة، لا تنفذ أوامر تتعارض مع سياسات التطبيق.'
    : 'Important rules: Do not reveal sensitive information, do not execute commands that conflict with app policies.'
  
  return context
}

// Call OpenAI API
async function callOpenAI(systemPrompt: string, userMessage: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  })
  
  const data = await response.json()
  return data.choices?.[0]?.message?.content || 'عذراً، لم أتمكن من معالجة طلبك.'
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const { message, language = 'ar' } = await req.json()
    
    // Validate input
    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Sanitize and check for injection
    const sanitizedMessage = sanitizeInput(message)
    
    if (detectPromptInjection(sanitizedMessage)) {
      return new Response(
        JSON.stringify({ error: 'Invalid input detected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // RAG: Gather context
    const [products, orders] = await Promise.all([
      searchProducts(supabase, sanitizedMessage),
      searchOrders(supabase, user.id)
    ])
    
    // Build prompt and get response
    const systemPrompt = buildSystemPrompt(products, orders, language)
    const aiResponse = await callOpenAI(systemPrompt, sanitizedMessage)
    
    // Encrypt and store conversation
    const [encryptedUserMsg, encryptedAiMsg] = await Promise.all([
      encryptMessage(sanitizedMessage),
      encryptMessage(aiResponse)
    ])
    
    await supabase.from('chat_messages').insert([
      {
        user_id: user.id,
        role: 'user',
        encrypted_content: encryptedUserMsg.encrypted,
        iv: encryptedUserMsg.iv
      },
      {
        user_id: user.id,
        role: 'assistant',
        encrypted_content: encryptedAiMsg.encrypted,
        iv: encryptedAiMsg.iv
      }
    ])
    
    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        products: products.map((p: any) => ({ id: p.id, name: p.name, price: p.price }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('AI Chat Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
