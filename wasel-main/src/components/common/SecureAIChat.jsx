import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

const SecureAIChat = ({ className = "" }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const scrollAreaRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !user) return;

    const messageText = inputMessage.trim();
    setInputMessage('');

    // Security: Client-side input validation
    if (messageText.length > 1000) {
      toast({
        title: "رسالة طويلة جداً",
        description: "الحد الأقصى 1000 حرف",
        variant: "destructive"
      });
      return;
    }

    // Security: Basic XSS prevention (additional server-side validation)
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(messageText)) {
        toast({
          title: "محتوى غير مسموح",
          description: "يرجى إعادة صياغة رسالتك",
          variant: "destructive"
        });
        return;
      }
    }

    // Add user message to UI immediately (optimistic update)
    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
      isLoading: false
    };

    setMessages(prev => [...prev, userMessage]);

    // Add loading AI message
    const aiMessageId = crypto.randomUUID();
    const aiLoadingMessage = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    };

    setMessages(prev => [...prev, aiLoadingMessage]);
    setIsLoading(true);

    try {
      // Call secure AI chat API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.auth.getSession()?.access_token}`,
          'X-Session-ID': sessionId
        },
        body: JSON.stringify({
          message: messageText,
          session_id: sessionId,
          context: {
            current_page: window.location.pathname,
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const data = await response.json();

      // Update AI message with actual response
      setMessages(prev => prev.map(msg =>
        msg.id === aiMessageId
          ? {
              ...msg,
              content: data.response,
              isLoading: false,
              metadata: {
                processing_time_ms: data.processing_time_ms,
                tokens_used: data.tokens_used,
                confidence: data.confidence
              }
            }
          : msg
      ));

    } catch (error) {
      console.error('AI chat error:', error);

      // Update AI message with error
      setMessages(prev => prev.map(msg =>
        msg.id === aiMessageId
          ? {
              ...msg,
              content: 'عذراً، حدث خطأ في الاستجابة. يرجى المحاولة مرة أخرى.',
              isLoading: false,
              isError: true
            }
          : msg
      ));

      toast({
        title: "خطأ في الدردشة",
        description: "فشل في الحصول على رد من المساعد الذكي",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!user) {
    return (
      <Card className={`w-full max-w-2xl mx-auto ${className}`}>
        <CardContent className="p-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              يرجى تسجيل الدخول لاستخدام المساعد الذكي
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full max-w-2xl mx-auto ${className}`}>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-[#1F7A63]" />
          المساعد الذكي - WASEL
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        {/* Messages Area */}
        <ScrollArea ref={scrollAreaRef} className="h-96 p-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">مرحباً بك في المساعد الذكي!</p>
              <p className="text-sm">
                يمكنني مساعدتك في طلباتك، البحث عن المنتجات، وأسئلة التوصيل
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-[#1F7A63] flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-[#1F7A63] text-white'
                        : message.isError
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {message.isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>جاري التفكير...</span>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    )}

                    {message.metadata && (
                      <div className="text-xs opacity-70 mt-2 pt-2 border-t border-current">
                        تم الرد خلال {message.metadata.processing_time_ms}ms
                      </div>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="اكتب رسالتك هنا..."
              disabled={isLoading}
              className="flex-1"
              maxLength={1000}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="bg-[#1F7A63] hover:bg-[#2FA36B] text-white px-4"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          <div className="text-xs text-gray-500 mt-2 flex justify-between">
            <span>اضغط Enter للإرسال</span>
            <span>{inputMessage.length}/1000</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecureAIChat;
