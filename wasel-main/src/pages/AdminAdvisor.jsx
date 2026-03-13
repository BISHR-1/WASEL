import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, RefreshCw, Trash2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/common/BackButton';
import MessageBubble from '../components/admin/MessageBubble';
import { toast } from 'sonner';

export default function AdminAdvisor() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (currentUser?.role !== 'admin') {
          navigate('/');
          return;
        }
        setUser(currentUser);
        
        // Find existing conversation or create new one
        const conversations = await base44.agents.listConversations({
          agent_name: "business_advisor",
        });

        if (conversations.length > 0) {
          // Use the most recent one
          setConversationId(conversations[0].id);
          setMessages(conversations[0].messages || []);
        } else {
          // Create new
          const newConv = await base44.agents.createConversation({
            agent_name: "business_advisor",
            metadata: {
              name: "Strategy Session",
              description: "Advisor for Wasel App",
            }
          });
          setConversationId(newConv.id);
          setMessages([]);
        }
      } catch (err) {
        console.error("Auth check failed", err);
        navigate('/');
      }
    };
    init();
  }, [navigate]);

  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
      setMessages(data.messages);
    });

    return () => {
      unsubscribe();
    };
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !conversationId) return;
    
    const content = input;
    setInput('');
    setIsLoading(true);

    try {
      await base44.agents.addMessage({ id: conversationId }, {
        role: "user",
        content: content
      });
    } catch (err) {
      console.error("Failed to send message", err);
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    if (!conversationId) return;
    if (confirm("Are you sure you want to start a new chat history?")) {
       const newConv = await base44.agents.createConversation({
            agent_name: "business_advisor",
            metadata: {
              name: "Strategy Session " + new Date().toLocaleDateString(),
              description: "Advisor for Wasel App",
            }
          });
          setConversationId(newConv.id);
          setMessages([]);
          toast.success("New conversation started");
    }
  };

  if (!user) return <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B4332]"></div></div>;

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-4 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" onClick={() => navigate('/AdminPanel')}>
                <ArrowLeft className="w-5 h-5 text-[#1B4332]" />
             </Button>
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1B4332] rounded-full flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="font-bold text-[#1B4332] text-lg">مستشار واصل ستور الذكي</h1>
                    <p className="text-xs text-gray-500">مساعدك الشخصي لتطوير الأعمال</p>
                </div>
             </div>
          </div>
          <Button variant="outline" size="icon" onClick={handleClear} title="Start New Chat">
            <RefreshCw className="w-4 h-4 text-gray-600" />
          </Button>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 scroll-smooth">
        <div className="max-w-4xl mx-auto space-y-6">
           {messages.length === 0 && (
             <div className="text-center py-20 text-gray-400">
                <Bot className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>مرحباً بك! أنا مستشارك الذكي.</p>
                <p className="text-sm mt-2">اسألني عن كيفية زيادة المبيعات، تحسين التطبيق، أو تحليل الطلبات.</p>
             </div>
           )}
           {messages.map((msg, idx) => (
             <MessageBubble key={idx} message={msg} />
           ))}
           {isLoading && (
             <div className="flex gap-3">
                <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center mt-0.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5">
                    <span className="text-sm text-gray-500">جاري التفكير...</span>
                </div>
             </div>
           )}
           <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="اكتب سؤالك هنا..."
            className="flex-1 h-12 text-lg"
            dir="auto"
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || isLoading}
            className="h-12 w-12 rounded-xl bg-[#1B4332] hover:bg-[#2D6A4F]"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}