import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, ChevronDown, ChevronUp, Send, Loader2, ArrowRight,
  HelpCircle, Phone, Mail, Clock, CheckCircle, ThumbsUp, ThumbsDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { getUnifiedSession } from '@/lib/unifiedAuth';
import { useDarkMode } from '@/lib/DarkModeContext';
import { notifyAdminUsers } from '@/services/firebaseOrderNotifications';
import { Link } from 'react-router-dom';
import BackButton from '@/components/common/BackButton';

const FAQ_ITEMS = [
  {
    question: 'كيف أقدم طلب جديد؟',
    answer: 'من الصفحة الرئيسية، اختر القسم المطلوب (مطاعم، هدايا، إلكترونيات، سوبرماركت)، ثم أضف المنتجات للسلة واتبع خطوات الدفع.',
  },
  {
    question: 'ما هي طرق الدفع المتاحة؟',
    answer: 'يمكنك الدفع عبر PayPal أو البطاقة الائتمانية أو محفظة واصل أو الدفع المشترك (سلة مشتركة).',
  },
  {
    question: 'كم يستغرق التوصيل؟',
    answer: 'يعتمد وقت التوصيل على المسافة ونوع الطلب. عادةً من 30 دقيقة إلى ساعتين للطلبات المحلية.',
  },
  {
    question: 'كيف أتتبع طلبي؟',
    answer: 'اذهب إلى "طلباتي" من القائمة الرئيسية. ستجد حالة كل طلب محدثة في الوقت الفعلي.',
  },
  {
    question: 'كيف ألغي طلبي؟',
    answer: 'يمكنك إلغاء الطلب من صفحة "طلباتي" إذا لم يتم قبوله بعد. بعد القبول، تواصل مع الدعم.',
  },
  {
    question: 'كيف أستخدم محفظة واصل؟',
    answer: 'شحن المحفظة يتم عبر PayPal. يمكنك استخدام الرصيد للدفع عند أي طلب. اذهب إلى "المحفظة" في القائمة.',
  },
  {
    question: 'ما هو اشتراك Wasel+؟',
    answer: 'Wasel+ يمنحك توصيل مجاني وخصومات حصرية. يمكنك الاشتراك من صفحة Wasel+ في التطبيق.',
  },
  {
    question: 'كيف أقيّم تجربتي؟',
    answer: 'بعد اكتمال الطلب، سيظهر لك تلقائياً نموذج تقييم. يمكنك تقييم كل منتج والخدمة ككل.',
  },
];

export default function CustomerSupport() {
  const { isDarkMode } = useDarkMode();
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [faqHelpful, setFaqHelpful] = useState({});
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [userId, setUserId] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    (async () => {
      const s = await getUnifiedSession();
      setSession(s);
      if (s?.user?.id) setUserId(s.user.id);
    })();
  }, []);

  const conversationId = userId ? `support:${userId}` : null;

  // Load chat messages when chat opens
  useEffect(() => {
    if (!showChat || !conversationId) return;
    loadChat();
    const channel = supabase.channel(`support-chat-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        setChatMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [showChat, conversationId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadChat = async () => {
    if (!conversationId) return;
    setChatLoading(true);
    try {
      // Ensure conversation exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .maybeSingle();

      if (!existing) {
        await supabase.from('conversations').insert([{
          id: conversationId,
          type: 'support',
          participant_ids: [userId],
          status: 'active',
        }]);
      }

      const { data } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(200);
      setChatMessages(data || []);
    } catch (err) {
      console.error('Load support chat error:', err);
    } finally {
      setChatLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || !conversationId) return;
    setSending(true);
    try {
      const messageText = chatInput.trim();
      setChatInput('');
      const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'عميل';
      const msg = {
        conversation_id: conversationId,
        sender_id: userId,
        sender_name: userName,
        sender_role: 'customer',
        message: messageText,
      };
      await supabase.from('direct_messages').insert([msg]);
      await supabase.from('conversations').update({
        last_message: messageText,
        last_message_at: new Date().toISOString(),
      }).eq('id', conversationId);

      // Notify supervisor
      try {
        await notifyAdminUsers('new_chat_message', { id: conversationId }, { senderName: userName });
      } catch (e) { /* silent */ }
    } catch (err) {
      console.error('Send message error:', err);
    } finally {
      setSending(false);
    }
  };

  const toggleFaq = (idx) => {
    setExpandedFaq(expandedFaq === idx ? null : idx);
  };

  const markFaqHelpful = (idx, helpful) => {
    setFaqHelpful(prev => ({ ...prev, [idx]: helpful }));
    if (!helpful) {
      // Suggest opening chat
      setTimeout(() => setShowChat(true), 500);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#0D0D1A]' : 'bg-[#FDFBF7]'} pb-24`} dir="rtl">
      {/* Header */}
      <header className={`sticky top-0 z-40 ${isDarkMode ? 'bg-[#1A1A2E]/95' : 'bg-white/95'} backdrop-blur-md border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-4">
          <BackButton />
          <div>
            <h1 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-[#1B4332]'}`}>مركز المساعدة</h1>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>نحن هنا لمساعدتك</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowChat(true)}
            className={`rounded-2xl p-4 text-center ${isDarkMode ? 'bg-[#1A1A2E] border border-gray-700' : 'bg-white border border-gray-200'} shadow-sm`}
          >
            <MessageCircle className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? 'text-blue-400' : 'text-[#2563EB]'}`} />
            <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-[#1B4332]'}`}>محادثة مباشرة</p>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>تحدث مع فريق الدعم</p>
          </motion.button>

          <motion.a
            whileTap={{ scale: 0.97 }}
            href="https://wa.me/963936793637"
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded-2xl p-4 text-center ${isDarkMode ? 'bg-[#1A1A2E] border border-gray-700' : 'bg-white border border-gray-200'} shadow-sm block`}
          >
            <Phone className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-[#1B4332]'}`}>واتساب</p>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>تواصل عبر واتساب</p>
          </motion.a>
        </div>

        {/* FAQ Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className={`w-5 h-5 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
            <h2 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-[#1B4332]'}`}>الأسئلة الشائعة</h2>
          </div>

          <div className="space-y-2">
            {FAQ_ITEMS.map((faq, idx) => (
              <motion.div
                key={idx}
                className={`rounded-2xl overflow-hidden ${isDarkMode ? 'bg-[#1A1A2E] border border-gray-700' : 'bg-white border border-gray-200'} shadow-sm`}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between px-4 py-3 text-right"
                >
                  <span className={`text-sm font-bold flex-1 ${isDarkMode ? 'text-white' : 'text-[#1B4332]'}`}>
                    {faq.question}
                  </span>
                  {expandedFaq === idx
                    ? <ChevronUp className={`w-5 h-5 flex-shrink-0 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    : <ChevronDown className={`w-5 h-5 flex-shrink-0 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />}
                </button>

                <AnimatePresence>
                  {expandedFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className={`px-4 pb-4 ${isDarkMode ? 'border-t border-gray-700' : 'border-t border-gray-100'}`}>
                        <p className={`text-sm leading-relaxed pt-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {faq.answer}
                        </p>

                        {/* Helpful? */}
                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-dashed border-gray-200">
                          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>هل أفادك هذا الجواب؟</span>
                          {faqHelpful[idx] === undefined ? (
                            <>
                              <button
                                onClick={() => markFaqHelpful(idx, true)}
                                className="text-green-500 hover:bg-green-50 rounded-lg p-1.5 transition-colors"
                              >
                                <ThumbsUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => markFaqHelpful(idx, false)}
                                className="text-red-400 hover:bg-red-50 rounded-lg p-1.5 transition-colors"
                              >
                                <ThumbsDown className="w-4 h-4" />
                              </button>
                            </>
                          ) : faqHelpful[idx] ? (
                            <span className="text-xs text-green-500 flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> شكراً لك!
                            </span>
                          ) : (
                            <button
                              onClick={() => setShowChat(true)}
                              className="text-xs text-blue-500 underline"
                            >
                              تحدث مع الدعم
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Live Chat Section */}
        <AnimatePresence>
          {showChat && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={`rounded-3xl overflow-hidden shadow-lg border ${isDarkMode ? 'bg-[#1A1A2E] border-gray-700' : 'bg-white border-gray-200'}`}
            >
              {/* Chat Header */}
              <div className={`flex items-center justify-between px-5 py-3 ${isDarkMode ? 'bg-[#0D0D1A] border-b border-gray-700' : 'bg-[#1B4332]'}`}>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-white" />
                  <div>
                    <p className="text-sm font-bold text-white">المحادثة المباشرة</p>
                    <p className="text-[10px] text-white/70">فريق دعم واصل</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowChat(false)}
                  className="text-white/70 hover:text-white transition-colors text-sm"
                >
                  تصغير
                </button>
              </div>

              {!session ? (
                <div className="p-6 text-center">
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    يرجى تسجيل الدخول للمحادثة المباشرة
                  </p>
                  <Link to="/Account">
                    <Button className="mt-3 rounded-xl bg-[#1B4332] hover:bg-[#2D6A4F] text-white">
                      تسجيل الدخول
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  {/* Messages */}
                  <div className="h-72 overflow-y-auto p-4 space-y-3">
                    {chatLoading ? (
                      <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
                    ) : chatMessages.length === 0 ? (
                      <div className={`text-center py-6 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">مرحباً! كيف يمكننا مساعدتك؟</p>
                        <p className="text-xs mt-1">أرسل رسالتك وسنرد عليك في أقرب وقت</p>
                      </div>
                    ) : chatMessages.map((msg, idx) => {
                      const isMine = msg.sender_role === 'customer' || msg.sender_id === userId;
                      return (
                        <div key={msg.id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                            isMine
                              ? `${isDarkMode ? 'bg-[#2D6A4F]' : 'bg-[#1B4332]'} text-white rounded-br-sm`
                              : `${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} rounded-bl-sm`
                          }`}>
                            {!isMine && (
                              <p className="text-[10px] font-bold mb-0.5 opacity-70">{msg.sender_name || 'فريق الدعم'}</p>
                            )}
                            <p className="text-sm leading-relaxed">{msg.message}</p>
                            <p className={`text-[10px] mt-1 ${isMine ? 'text-green-200' : isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                              {msg.created_at ? new Date(msg.created_at).toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' }) : ''}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input */}
                  <div className={`flex items-center gap-2 px-4 py-3 border-t ${isDarkMode ? 'border-gray-700 bg-[#0D0D1A]' : 'border-gray-200 bg-gray-50'}`}>
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      placeholder="اكتب رسالتك..."
                      className={`flex-1 rounded-xl border px-4 py-2.5 text-sm focus:outline-none ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-white focus:border-green-500 placeholder-gray-500'
                          : 'bg-white border-gray-200 focus:border-[#1B4332]'
                      }`}
                      dir="rtl"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!chatInput.trim() || sending}
                      className="rounded-xl bg-[#1B4332] hover:bg-[#2D6A4F] text-white h-10 w-10 p-0"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {/* Contact Info */}
        <section className={`rounded-2xl p-5 ${isDarkMode ? 'bg-[#1A1A2E] border border-gray-700' : 'bg-white border border-gray-200'} shadow-sm`}>
          <h3 className={`text-sm font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-[#1B4332]'}`}>تواصل معنا</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Mail className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>support@wasel.app</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>متاح يومياً من 9 صباحاً حتى 12 منتصف الليل</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
