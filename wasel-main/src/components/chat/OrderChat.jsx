import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Send, Paperclip, User, Users, Image as ImageIcon, X, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function OrderChat({ orderId, orderNumber, senderType, senderName }) {
  const [message, setMessage] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const scrollRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', orderId],
    queryFn: async () => {
      try {
        const result = await base44?.entities?.Message?.filter?.({ order_id: orderId }, '-created_date');
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        return [];
      }
    },
    refetchInterval: 3000, // Auto-refresh every 3 seconds
    initialData: []
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data) => {
      const newMessage = await base44.entities.Message.create(data);

      // إرسال إشعار للطرف الآخر
      try {
        // جلب بيانات الطلب
        const orders = await base44.entities.Order.filter({ id: orderId });
        const order = orders[0];
        
        if (order) {
          // تحديد المستلم بناءً على نوع المرسل
          const recipientEmail = senderType === 'customer' 
            ? 'wasel.daraa@gmail.com'
            : order.created_by;

          const recipientName = senderType === 'customer'
            ? 'فريق التنفيذ'
            : order.sender_name;

          await base44.functions.invoke('sendNotification', {
            type: 'new_message',
            orderNumber: order.order_number,
            recipientEmail,
            recipientName,
            message: data.message,
            additionalData: {
              senderName,
              chatUrl: `${window.location.origin}/OrderChat?order=${orderId}`
            }
          });
        }
      } catch (err) {
        console.error('Failed to send notification:', err);
      }

      return newMessage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', orderId] });
      setMessage('');
      scrollToBottom();
    }
  });

  const handleFileUpload = async (file) => {
    setUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await sendMessageMutation.mutateAsync({
        order_id: orderId,
        sender_type: senderType,
        sender_name: senderName,
        message: '📎 ملف مرفق',
        attachment_url: file_url
      });
    } catch (error) {
      console.error(error);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    sendMessageMutation.mutate({
      order_id: orderId,
      sender_type: senderType,
      sender_name: senderName,
      message: message.trim()
    });
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const groupedMessages = (Array.isArray(messages) ? messages : []).reduce((acc, msg) => {
    if (!msg?.created_date) return acc;
    const date = new Date(msg.created_date).toLocaleDateString('ar-SA', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-[#F5E6D3]">
      {/* Header */}
      <div className="p-4 border-b border-[#F5E6D3] bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold">محادثة الطلب {orderNumber}</h3>
            <p className="text-xs text-white/70">تواصل مباشر مع {senderType === 'customer' ? 'فريق التنفيذ' : 'العميل'}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-[#1B4332] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-[#1B4332]/60">جاري التحميل...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-[#F5E6D3] mx-auto mb-3" />
            <p className="text-[#1B4332]/60 text-sm">لا توجد رسائل بعد</p>
            <p className="text-[#1B4332]/40 text-xs mt-1">ابدأ المحادثة الآن</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(typeof groupedMessages === 'object' && groupedMessages ? Object.entries(groupedMessages) : []).reverse().map(([date, msgs]) => (
              <div key={date}>
                {/* Date Divider */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-[#F5E6D3]" />
                  <span className="text-xs text-[#1B4332]/50 bg-[#F5E6D3] px-3 py-1 rounded-full">
                    {date}
                  </span>
                  <div className="flex-1 h-px bg-[#F5E6D3]" />
                </div>

                {/* Messages */}
                {(Array.isArray(msgs) ? msgs : []).reverse().map((msg) => {
                  const isOwn = msg.sender_type === senderType;
                  const isTeam = msg.sender_type === 'team';
                  
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2 mb-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                    >
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isTeam ? 'bg-[#52B788]' : 'bg-blue-500'
                      }`}>
                        {isTeam ? (
                          <Users className="w-4 h-4 text-white" />
                        ) : (
                          <User className="w-4 h-4 text-white" />
                        )}
                      </div>

                      {/* Message Bubble */}
                      <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                        <div className={`rounded-2xl px-4 py-2 ${
                          isOwn 
                            ? 'bg-[#1B4332] text-white rounded-br-sm' 
                            : 'bg-[#F5E6D3] text-[#1B4332] rounded-bl-sm'
                        }`}>
                          {!isOwn && (
                            <p className="text-xs font-semibold mb-1 opacity-70">{msg.sender_name}</p>
                          )}
                          
                          {msg.attachment_url ? (
                            <a
                              href={msg.attachment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 hover:underline"
                            >
                              <ImageIcon className="w-4 h-4" />
                              <span>{msg.message}</span>
                            </a>
                          ) : (
                            <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                          )}
                        </div>
                        <span className="text-xs text-[#1B4332]/50 mt-1 px-1">
                          {new Date(msg.created_date).toLocaleTimeString('ar-SA', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-[#F5E6D3]">
        <form onSubmit={handleSend} className="flex gap-2">
          <label className="cursor-pointer shrink-0">
            <div className="w-10 h-10 bg-[#F5E6D3] hover:bg-[#1B4332]/10 rounded-xl flex items-center justify-center transition-colors">
              {uploadingFile ? (
                <div className="w-4 h-4 border-2 border-[#1B4332] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Paperclip className="w-5 h-5 text-[#1B4332]" />
              )}
            </div>
            <input
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              className="hidden"
              disabled={uploadingFile}
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
          </label>

          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="اكتب رسالتك..."
            className="flex-1 border-[#F5E6D3] focus:border-[#1B4332] rounded-xl"
            disabled={sendMessageMutation.isPending}
          />

          <Button
            type="submit"
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl px-6"
          >
            {sendMessageMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}