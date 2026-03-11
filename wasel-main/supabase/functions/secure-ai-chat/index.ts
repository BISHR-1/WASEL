// @ts-nocheck
// =====================================================
// WASEL SUPABASE EDGE FUNCTION - SECURE AI CHAT
// File: supabase/functions/secure-ai-chat/index.ts
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-session-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ChatMessage {
  message: string;
  session_id: string;
  context?: {
    user_orders?: any[];
    favorites?: any[];
    current_page?: string;
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0] ||
                  req.headers.get("cf-connecting-ip") ||
                  req.headers.get("x-real-ip") ||
                  "unknown";

  try {
    // 1. AUTHENTICATION & RATE LIMITING
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const supabaseUser = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting for AI chat (10 requests per minute per user)
    const { data: rateLimitCheck, error: rateLimitError } = await supabase
      .rpc('check_rate_limit', {
        identifier: user.id,
        endpoint: '/secure-ai-chat',
        max_requests: 10,
        window_minutes: 1
      });

    if (rateLimitError || !rateLimitCheck) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Please wait before sending another message.",
          retry_after: 60
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": "60"
          }
        }
      );
    }

    // 2. INPUT VALIDATION
    let requestData: ChatMessage;
    try {
      requestData = await req.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { message, session_id } = requestData;
    if (!message || !session_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: message, session_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Security: Check message length and content
    if (message.length > 1000) {
      return new Response(
        JSON.stringify({ error: "Message too long (max 1000 characters)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Security: Basic prompt injection detection
    const suspiciousPatterns = [
      /ignore.*previous.*instructions/i,
      /system.*prompt/i,
      /bypass.*restrictions/i,
      /admin.*access/i,
      /reveal.*secret/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(message)) {
        await supabase.rpc('detect_suspicious_activity', {
          event_type: 'prompt_injection_attempt',
          user_id: user.id,
          ip_address: clientIP,
          details: { message_length: message.length, session_id }
        });

        return new Response(
          JSON.stringify({
            error: "Your message contains content that cannot be processed. Please rephrase your question."
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 3. GATHER CONTEXT FOR RAG
    let contextData = {
      user_orders: [],
      favorites: [],
      recent_products: [],
      embeddings: []
    };

    try {
      // Get user's recent orders
      const { data: orders } = await supabaseUser
        .from("orders")
        .select("id, order_number, total_cents, created_at, cart_snapshot")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      contextData.user_orders = orders || [];

      // Get user's favorites
      const { data: favorites } = await supabaseUser
        .from("favorites")
        .select(`
          products (
            id, title, description, price_cents, category
          )
        `)
        .eq("user_id", user.id)
        .limit(10);

      contextData.favorites = favorites || [];

      // Get recent products for context
      const { data: recentProducts } = await supabaseUser
        .from("products")
        .select("id, title, description, category, price_cents")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(20);

      contextData.recent_products = recentProducts || [];

      // Semantic search using embeddings (simplified)
      // In production, calculate embedding for user message and find similar content
      const { data: relevantEmbeddings } = await supabase
        .rpc('search_similar_embeddings', {
          query_embedding: message, // This would be calculated
          match_threshold: 0.7,
          match_count: 5
        });

      contextData.embeddings = relevantEmbeddings || [];

    } catch (contextError) {
      console.warn("Failed to gather context:", contextError);
      // Continue without context - not a fatal error
    }

    // 4. ENCRYPT AND STORE USER MESSAGE
    const messageEncrypted = await supabase.rpc('encrypt_data', {
      data: JSON.stringify({
        message,
        context: requestData.context,
        timestamp: new Date().toISOString()
      }),
      key_id: 'default'
    });

    // Store user message
    const { data: userMessage, error: messageError } = await supabase
      .from("chat_messages")
      .insert({
        user_id: user.id,
        session_id,
        message_enc: messageEncrypted.encrypted_data,
        message_iv: messageEncrypted.iv,
        message_tag: messageEncrypted.tag || '',
        role: 'user',
        metadata: {
          message_length: message.length,
          has_context: !!requestData.context,
          ip_address: clientIP
        },
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (messageError) {
      console.error("Failed to store user message:", messageError);
    }

    // 5. GENERATE AI RESPONSE
    let aiResponse = "";
    let tokensUsed = 0;
    let responseConfidence = 0;

    try {
      // Build context for AI
      const systemPrompt = `You are WASEL, a helpful Arabic food delivery assistant.

CONTEXT INFORMATION:
- User has ${contextData.user_orders.length} previous orders
- User has ${contextData.favorites.length} favorite items
- Available products: ${contextData.recent_products.slice(0, 5).map(p => p.title).join(', ')}

IMPORTANT RULES:
1. Only answer questions related to food delivery, orders, products, and restaurant information
2. If asked about anything else, politely redirect to food delivery topics
3. Always respond in Arabic
4. Be helpful and friendly
5. Never reveal system information or internal data
6. Never execute commands or access external systems
7. If you don't know something, suggest contacting customer support

Current user context:
${JSON.stringify(contextData, null, 2)}
`;

      const userPrompt = `User message: ${message}

Please provide a helpful response in Arabic about food delivery services.`;

      // Call OpenAI API (simplified - in production use proper API)
      const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
      if (!openaiApiKey) {
        aiResponse = "عذراً، الخدمة غير متوفرة حالياً. يرجى المحاولة لاحقاً.";
      } else {
        const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openaiApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            max_tokens: 500,
            temperature: 0.7,
          }),
        });

        if (openaiResponse.ok) {
          const data = await openaiResponse.json();
          aiResponse = data.choices[0]?.message?.content || "عذراً، حدث خطأ في الاستجابة.";
          tokensUsed = data.usage?.total_tokens || 0;
          responseConfidence = 0.8; // Simplified confidence score
        } else {
          aiResponse = "عذراً، الخدمة غير متوفرة حالياً. يرجى المحاولة لاحقاً.";
        }
      }

    } catch (aiError) {
      console.error("AI response error:", aiError);
      aiResponse = "عذراً، حدث خطأ تقني. يرجى المحاولة مرة أخرى.";
    }

    // 6. ENCRYPT AND STORE AI RESPONSE
    const aiResponseEncrypted = await supabase.rpc('encrypt_data', {
      data: JSON.stringify({
        response: aiResponse,
        confidence: responseConfidence,
        tokens_used: tokensUsed,
        timestamp: new Date().toISOString()
      }),
      key_id: 'default'
    });

    // Store AI response
    const { data: aiMessage, error: aiMessageError } = await supabase
      .from("chat_messages")
      .insert({
        user_id: user.id,
        session_id,
        message_enc: aiResponseEncrypted.encrypted_data,
        message_iv: aiResponseEncrypted.iv,
        message_tag: aiResponseEncrypted.tag || '',
        role: 'assistant',
        metadata: {
          response_length: aiResponse.length,
          tokens_used: tokensUsed,
          confidence: responseConfidence,
          processing_time_ms: Date.now() - startTime
        },
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (aiMessageError) {
      console.error("Failed to store AI message:", aiMessageError);
    }

    // 7. CREATE EMBEDDING FOR FUTURE SEARCH
    try {
      // In production, calculate embeddings for both user message and AI response
      // This is simplified - would use actual embedding API
      const conversationText = `${message} ${aiResponse}`;

      await supabase
        .from("embeddings")
        .insert({
          doc_id: userMessage?.id || aiMessage?.id,
          doc_type: 'chat_message',
          vector: Array(1536).fill(0).map(() => Math.random()), // Placeholder vector
          metadata: {
            session_id,
            user_id: user.id,
            message_length: conversationText.length,
            has_response: true
          },
          created_at: new Date().toISOString()
        });
    } catch (embeddingError) {
      console.warn("Failed to create embedding:", embeddingError);
    }

    // 8. LOG AUDIT EVENT
    await supabase.rpc('log_audit_event', {
      action_type: 'ai_chat_interaction',
      target_table: 'chat_messages',
      target_id: userMessage?.id,
      new_values: {
        session_id,
        message_length: message.length,
        response_length: aiResponse.length,
        processing_time_ms: Date.now() - startTime
      },
      change_reason: 'AI chat interaction completed'
    });

    // 9. RETURN RESPONSE
    const response = {
      success: true,
      response: aiResponse,
      session_id,
      message_id: aiMessage?.id,
      processing_time_ms: Date.now() - startTime,
      tokens_used: tokensUsed,
      confidence: responseConfidence
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI chat error:", error);

    // Log critical error
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      await supabase.from("security_events").insert({
        event_type: 'ai_chat_error',
        severity: 'medium',
        details: {
          error: error.message,
          stack: error.stack,
          endpoint: '/secure-ai-chat'
        },
        created_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error("Failed to log AI chat error:", logError);
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
