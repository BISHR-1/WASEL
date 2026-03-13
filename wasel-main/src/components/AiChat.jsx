// =====================================================
// WASEL - AI CHAT COMPONENT (Secure)
// File: src/components/AiChat.jsx
// =====================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, X, Send, Bot, User, 
  Loader2, AlertCircle, ShoppingCart, Heart,
  ChevronDown, Sparkles
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// =====================================================
// CONSTANTS
// =====================================================
const MAX_MESSAGE_LENGTH = 500;
const RATE_LIMIT_MESSAGES = 10;
const RATE_LIMIT_WINDOW_MS = 60000;

// =====================================================
// MESSAGE BUBBLE COMPONENT
// =====================================================
function MessageBubble({ message, isUser }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
    >
      <div className={`flex items-start gap-2 max-w-[85%] ${isUser ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? 'bg-[#1F7A63]' : 'bg-gradient-to-br from-[#1F7A63] to-[#2FA36B]'
        }`}>
          {isUser ? (
            <User className="w-4 h-4 text-white" />
          ) : (
            <Bot className="w-4 h-4 text-white" />
          )}
        </div>

        {/* Message Content */}
        <div className={`rounded-2xl px-4 py-2.5 ${
          isUser 
            ? 'bg-[#1F7A63] text-white rounded-br-md' 
            : 'bg-white border border-[#E5E7EB] text-[#1F2933] rounded-bl-md shadow-sm'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap" dir="rtl">
            {message.content}
          </p>
          
          {/* Action Buttons (for assistant messages) */}
          {!isUser && message.actions && message.actions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-[#E5E7EB]">
              {message.actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={action.onClick}
                  className="text-xs px-3 py-1.5 bg-[#1F7A63]/10 hover:bg-[#1F7A63]/20 text-[#1F7A63] rounded-full transition-colors flex items-center gap-1"
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* Timestamp */}
          <p className={`text-[10px] mt-1 ${isUser ? 'text-white/60' : 'text-[#1F2933]/40'}`}>
            {new Date(message.timestamp).toLocaleTimeString('ar-SY', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// =====================================================
// TYPING INDICATOR
// =====================================================
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-start gap-2 mb-3"
    >
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1F7A63] to-[#2FA36B] flex items-center justify-center">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white border border-[#E5E7EB] rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-[#1F7A63]"
              animate={{ y: [0, -4, 0] }}
              transition={{
                repeat: Infinity,
                duration: 0.6,
                delay: i * 0.15
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// =====================================================
// QUICK SUGGESTIONS
// =====================================================
function QuickSuggestions({ onSelect }) {
  const suggestions = [
    { text: 'ما هي طرق الدفع المتاحة؟', icon: '💳' },
    { text: 'كيف أستخدم Wasel+؟', icon: '⭐' },
    { text: 'كيف يمكنني تتبع طلبي؟', icon: '📦' },
    { text: 'ما هي رسوم التوصيل؟', icon: '🛵' },
    { text: 'أريد التواصل مع خدمة العملاء', icon: '📞' },
    { text: 'هل يوجد خصومات أو كوبونات؟', icon: '🎁' },
  ];

  return (
    <div className="flex flex-wrap gap-2 p-3 border-t border-[#E5E7EB]">
      {suggestions.map((suggestion, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(suggestion.text)}
          className="text-xs px-3 py-1.5 bg-[#F9FAF8] hover:bg-[#E5E7EB] border border-[#E5E7EB] text-[#1F2933] rounded-full transition-colors"
        >
          {suggestion.icon} {suggestion.text}
        </button>
      ))}
    </div>
  );
}

// =====================================================
// MAIN AI CHAT COMPONENT
// =====================================================
export default function AiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [messageCount, setMessageCount] = useState(0);
  const [lastMessageTime, setLastMessageTime] = useState(0);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Generate session ID
  const [sessionId] = useState(() => {
    const stored = sessionStorage.getItem('wasel_chat_session');
    if (stored) return stored;
    const newId = `chat_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem('wasel_chat_session', newId);
    return newId;
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Add welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: 'مرحباً بك في واصل ستور! 👋\nأنا مساعدك الذكي، كيف يمكنني مساعدتك اليوم؟',
        timestamp: new Date().toISOString()
      }]);
    }
  }, [isOpen, messages.length]);

  // Check rate limit
  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    if (now - lastMessageTime > RATE_LIMIT_WINDOW_MS) {
      setMessageCount(0);
      setLastMessageTime(now);
      return true;
    }
    if (messageCount >= RATE_LIMIT_MESSAGES) {
      setError('لقد تجاوزت الحد المسموح. يرجى الانتظار قليلاً.');
      return false;
    }
    return true;
  }, [messageCount, lastMessageTime]);

  // Sanitize input
  const sanitizeInput = (input) => {
    return input
      .replace(/[<>]/g, '')
      .replace(/[\x00-\x1F\x7F]/g, '')
      .trim()
      .slice(0, MAX_MESSAGE_LENGTH);
  };

  // Send message
  const sendMessage = async (content = inputValue) => {
    const sanitized = sanitizeInput(content);
    if (!sanitized || isLoading) return;

    if (!checkRateLimit()) return;

    setError(null);
    setInputValue('');
    setMessageCount(prev => prev + 1);

    // Add user message
    const userMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: sanitized,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);

    setIsLoading(true);

    try {
      const quickLocalResponse = await (async () => {
        const lower = sanitized.toLowerCase();

        const orderTokenMatch = sanitized.match(/(WSL-[A-Za-z0-9-]+|[0-9a-fA-F]{8,})/);
        const asksOrderStatus = /تتبع|طلبي|طلبي|status|order/.test(lower);
        if (asksOrderStatus && orderTokenMatch?.[1]) {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user?.email) {
            return 'للاستعلام عن الطلب، يرجى تسجيل الدخول أولاً ثم إرسال رقم الطلب (مثال: WSL-12345678).';
          }

          const token = orderTokenMatch[1].trim();
          const { data: orderRow, error: orderError } = await supabase
            .from('orders')
            .select('order_number, status, created_at, total_amount, currency, user_email')
            .eq('user_email', user.email)
            .or(`order_number.eq.${token},id.eq.${token}`)
            .limit(1)
            .maybeSingle();

          if (orderError || !orderRow) {
            return 'لم أجد طلبًا بهذا الرقم على حسابك. تأكد من الرقم ثم أعد المحاولة.';
          }

          const statusLabels = {
            pending: 'قيد المراجعة',
            processing: 'قيد التنفيذ',
            delivering: 'جاري التوصيل',
            completed: 'تم التسليم',
            cancelled: 'ملغي',
          };

          const statusLabel = statusLabels[orderRow.status] || orderRow.status;
          return `حالة طلبك ${orderRow.order_number || token}: ${statusLabel}\nالإجمالي: ${orderRow.total_amount || 0} ${orderRow.currency || 'USD'}\nتاريخ الإنشاء: ${new Date(orderRow.created_at).toLocaleString('ar-SY')}`;
        }

        if (/wasel\+|واصل\+|اشتراك|عضوية/.test(lower)) {
          return 'عضوية Wasel+ تعطيك خصومات حصرية وتوصيل مجاني/أسرع حسب الخطة. يمكنك الاشتراك من صفحة WaselPlusMembership واختيار الخطة الشهرية أو السنوية.';
        }

        if (/دفع|paypal|بطاقة|credit|card|واتساب/.test(lower)) {
          return 'طرق الدفع المتاحة: PayPal، بطاقة بنكية عبر PayPal، وطلب عبر واتساب. في صفحة الدفع ستظهر لك الخيارات بشكل مباشر.';
        }

        if (/توصيل|delivery|رسوم|fee/.test(lower)) {
          return 'رسوم التوصيل تعتمد على قيمة الطلب والمنطقة. بعض الطلبات مؤهلة لتوصيل مجاني، وتظهر التفاصيل في ملخص الطلب قبل الدفع.';
        }

        if (/خصم|كوبون|coupon|offer|عرض/.test(lower)) {
          return 'نعم، يوجد كوبونات وخصومات موسمية وخصومات إضافية لأعضاء Wasel+. يمكنك إدخال الكوبون داخل السلة قبل تأكيد الطلب.';
        }

        if (/خدمة العملاء|support|تواصل|واتساب/.test(lower)) {
          return 'يمكنك التواصل مع خدمة العملاء عبر زر الدعم داخل التطبيق أو عبر واتساب الرسمي، وسيتم الرد عليك بأسرع وقت.';
        }

        return null;
      })();

      if (quickLocalResponse) {
        setMessages(prev => [...prev, {
          id: `assistant_local_${Date.now()}`,
          role: 'assistant',
          content: quickLocalResponse,
          timestamp: new Date().toISOString()
        }]);
        setIsLoading(false);
        return;
      }

      const session = await supabase.auth.getSession();
      const token = session.data?.session?.access_token;

      if (!token) {
        throw new Error('يجب تسجيل الدخول لاستخدام المساعد');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: sanitized,
          session_id: sessionId,
          context: {
            current_page: window.location.pathname,
            cart_items: parseInt(localStorage.getItem('cart_count') || '0')
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'فشل في إرسال الرسالة');
      }

      // Add assistant message
      const assistantMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
        metadata: data.metadata
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (err) {
      console.error('Chat error:', err);
      setError(err.message || 'حدث خطأ. يرجى المحاولة مرة أخرى.');
      
      // Add error message
      setMessages(prev => [...prev, {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.',
        timestamp: new Date().toISOString(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.button
        className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-[#1F7A63] to-[#2FA36B] text-white shadow-lg flex items-center justify-center"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={isOpen ? { rotate: 0 } : { rotate: 0 }}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6" />
            <motion.div
              className="absolute -top-1 -right-1 w-4 h-4 bg-[#2FA36B] rounded-full flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </motion.div>
          </>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-40 right-4 z-50 w-[340px] max-w-[calc(100vw-32px)] bg-[#F9FAF8] rounded-2xl shadow-2xl border border-[#E5E7EB] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1F7A63] to-[#2FA36B] text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">مساعد واصل ستور</h3>
                    <p className="text-xs text-white/80">متصل الآن</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="h-80 overflow-y-auto p-4 bg-[#F9FAF8]">
              {messages.map(message => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isUser={message.role === 'user'}
                />
              ))}
              
              {isLoading && <TypingIndicator />}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions (show only when few messages) */}
            {messages.length <= 2 && !isLoading && (
              <QuickSuggestions onSelect={sendMessage} />
            )}

            {/* Error Message */}
            {error && (
              <div className="px-4 py-2 bg-red-50 border-t border-red-100">
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {error}
                </p>
              </div>
            )}

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="اكتب رسالتك..."
                  maxLength={MAX_MESSAGE_LENGTH}
                  className="flex-1 bg-[#F9FAF8] border border-[#E5E7EB] rounded-full px-4 py-2.5 text-sm text-[#1F2933] placeholder:text-[#1F2933]/40 focus:outline-none focus:ring-2 focus:ring-[#1F7A63]/30 focus:border-[#1F7A63]"
                  dir="rtl"
                  disabled={isLoading}
                />
                <motion.button
                  onClick={() => sendMessage()}
                  disabled={!inputValue.trim() || isLoading}
                  className="w-10 h-10 rounded-full bg-[#1F7A63] text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </motion.button>
              </div>
              
              {/* Character Counter */}
              {inputValue.length > 0 && (
                <p className="text-[10px] text-[#1F2933]/40 text-right mt-1">
                  {inputValue.length}/{MAX_MESSAGE_LENGTH}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
