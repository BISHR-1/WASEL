import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from './LanguageContext';
import { useDarkMode } from '@/lib/DarkModeContext';

export default function AIChat({ isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const { language } = useLanguage();
  const { isDarkMode } = useDarkMode();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Welcome message
      setMessages([
        {
          role: 'bot',
          content: language === 'ar' 
            ? 'مرحباً! أنا مساعد واصل الذكي. كيف يمكنني مساعدتك اليوم؟ 😊'
            : 'Hello! I\'m Wasel\'s smart assistant. How can I help you today? 😊'
        }
      ]);
    }
  }, [isOpen, language]);

  // Simple rule-based responses about Wasel
  const getAIResponse = (userMessage) => {
    const msg = userMessage.toLowerCase();
    
    // Arabic responses
    if (language === 'ar') {
      // Greetings
      if (msg.includes('مرحبا') || msg.includes('السلام') || msg.includes('أهلا')) {
        return 'أهلاً وسهلاً بك! 😊 كيف يمكنني مساعدتك في معرفة المزيد عن تطبيق واصل؟';
      }
      
      // What is Wasel
      if (msg.includes('واصل') && (msg.includes('ما هو') || msg.includes('ماهو') || msg.includes('تعريف'))) {
        return 'واصل هي منصة تمكّنك من إرسال الوجبات والهدايا لعائلتك في درعا بكل سهولة وأمان. نحن نهتم بكل التفاصيل من الطلب حتى التوصيل 🎁❤️';
      }
      
      // How it works
      if (msg.includes('كيف') && (msg.includes('عمل') || msg.includes('تعمل') || msg.includes('نعمل') || msg.includes('الخطوات'))) {
        return 'الأمر بسيط جداً:\n1️⃣ اختر الوجبات أو الهدايا\n2️⃣ أكمل الطلب عبر واتساب\n3️⃣ ادفع بعد التأكيد\n4️⃣ نوصل لعائلتك ونرسل لك صورة التسليم 📸';
      }
      
      // Payment
      if (msg.includes('دفع') || msg.includes('الدفع') || msg.includes('السعر') || msg.includes('أسعار') || msg.includes('تكلفة')) {
        return 'الدفع يتم بعد التأكيد فقط عبر واتساب! نقبل PayPal والتحويل البنكي. لا يوجد أي دفع تلقائي أو مخفي 💳✅';
      }
      
      // Delivery / توصيل
      if (msg.includes('توصيل') || msg.includes('التوصيل') || msg.includes('يوصل') || msg.includes('متى')) {
        return 'معظم الطلبات يتم توصيلها خلال 24-48 ساعة. نرسل لك صورة عند التسليم لتطمئن أن طلبك وصل بأمان 🚚📦';
      }
      
      // Areas / المناطق
      if (msg.includes('منطقة') || msg.includes('مناطق') || msg.includes('درعا') || msg.includes('أين')) {
        return 'حالياً نخدم محافظة درعا بالكامل. نخطط للتوسع لمحافظات أخرى قريباً إن شاء الله 🗺️';
      }
      
      // Products / المنتجات
      if (msg.includes('منتج') || msg.includes('وجبات') || msg.includes('هدايا') || msg.includes('ماذا') || msg.includes('ماهي المنتجات')) {
        return 'نوفر:\n🍕 وجبات من مطاعم محلية\n🎁 هدايا متنوعة\n🛒 سوبر ماركت\n🍰 حلويات\n📦 باقات خاصة\nوغيرها الكثير!';
      }
      
      // Safety / الأمان
      if (msg.includes('أمان') || msg.includes('ثقة') || msg.includes('موثوق') || msg.includes('آمن')) {
        return 'نحن نعمل بشفافية كاملة:\n✅ لا دفع قبل التأكيد\n✅ فريق محلي موثوق\n✅ توثيق كل عملية توصيل\n✅ تواصل مباشر عبر واتساب';
      }
      
      // Contact / التواصل
      if (msg.includes('تواصل') || msg.includes('اتصل') || msg.includes('رقم') || msg.includes('واتساب')) {
        return 'يمكنك التواصل معنا مباشرة عبر واتساب عند إكمال أي طلب، أو من صفحة "اتصل بنا" في التطبيق 📱';
      }
      
      // Registration / التسجيل
      if (msg.includes('تسجيل') || msg.includes('حساب') || msg.includes('اشترك')) {
        return 'يمكنك التسجيل بسهولة باستخدام رقم هاتفك أو حساب Google. عملية بسيطة وسريعة! 🔐';
      }
      
      // Off-topic response
      if (!msg.includes('واصل') && !msg.includes('تطبيق') && !msg.includes('منصة')) {
        return 'عذراً، أنا متخصص فقط في الإجابة عن أسئلة تتعلق بتطبيق واصل. هل لديك أي سؤال عن خدماتنا؟ 🤔';
      }
      
      // Default response
      return 'شكراً لسؤالك! يمكنك سؤالي عن:\n• كيف يعمل واصل\n• طرق الدفع\n• مناطق التوصيل\n• أنواع المنتجات\n• الأمان والثقة\n\nأو تواصل معنا مباشرة عبر واتساب 😊';
    }
    
    // English responses
    else {
      // Greetings
      if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('greet')) {
        return 'Hello! 😊 How can I help you learn more about Wasel app?';
      }
      
      // What is Wasel
      if ((msg.includes('what') || msg.includes('about')) && msg.includes('wasel')) {
        return 'Wasel is a platform that enables you to send meals and gifts to your family in Daraa easily and safely. We care about every detail from order to delivery 🎁❤️';
      }
      
      // How it works
      if (msg.includes('how') && (msg.includes('work') || msg.includes('steps') || msg.includes('process'))) {
        return 'It\'s very simple:\n1️⃣ Choose meals or gifts\n2️⃣ Complete order via WhatsApp\n3️⃣ Pay after confirmation\n4️⃣ We deliver to your family and send you proof photo 📸';
      }
      
      // Payment
      if (msg.includes('pay') || msg.includes('payment') || msg.includes('price') || msg.includes('cost')) {
        return 'Payment is made only after confirmation via WhatsApp! We accept PayPal and bank transfer. No automatic or hidden payments 💳✅';
      }
      
      // Delivery
      if (msg.includes('deliver') || msg.includes('delivery') || msg.includes('when') || msg.includes('shipping')) {
        return 'Most orders are delivered within 24-48 hours. We send you a photo upon delivery so you can be sure your order arrived safely 🚚📦';
      }
      
      // Areas
      if (msg.includes('area') || msg.includes('location') || msg.includes('daraa') || msg.includes('where')) {
        return 'We currently serve all of Daraa governorate. We plan to expand to other governorates soon 🗺️';
      }
      
      // Products
      if (msg.includes('product') || msg.includes('meal') || msg.includes('gift') || msg.includes('what can')) {
        return 'We offer:\n🍕 Meals from local restaurants\n🎁 Various gifts\n🛒 Supermarket items\n🍰 Sweets\n📦 Special packages\nAnd much more!';
      }
      
      // Safety
      if (msg.includes('safe') || msg.includes('trust') || msg.includes('secure') || msg.includes('reliable')) {
        return 'We work with complete transparency:\n✅ No payment before confirmation\n✅ Trusted local team\n✅ Document every delivery\n✅ Direct communication via WhatsApp';
      }
      
      // Contact
      if (msg.includes('contact') || msg.includes('call') || msg.includes('number') || msg.includes('whatsapp')) {
        return 'You can contact us directly via WhatsApp when completing any order, or from the "Contact Us" page in the app 📱';
      }
      
      // Registration
      if (msg.includes('register') || msg.includes('sign up') || msg.includes('account') || msg.includes('join')) {
        return 'You can easily register using your phone number or Google account. Simple and fast process! 🔐';
      }
      
      // Off-topic response
      if (!msg.includes('wasel') && !msg.includes('app') && !msg.includes('platform')) {
        return 'Sorry, I specialize only in answering questions about the Wasel app. Do you have any questions about our services? 🤔';
      }
      
      // Default response
      return 'Thank you for your question! You can ask me about:\n• How Wasel works\n• Payment methods\n• Delivery areas\n• Product types\n• Safety and trust\n\nOr contact us directly via WhatsApp 😊';
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    // Show typing indicator
    setIsTyping(true);

    // Simulate thinking time (500-1000ms)
    setTimeout(() => {
      const botResponse = getAIResponse(userMessage);
      setMessages(prev => [...prev, { role: 'bot', content: botResponse }]);
      setIsTyping(false);
    }, 500 + Math.random() * 500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        className={`fixed ${language === 'ar' ? 'left-4 bottom-24' : 'right-4 bottom-24'} w-96 max-w-[calc(100vw-2rem)] h-[500px] rounded-2xl shadow-2xl overflow-hidden z-50 ${
          isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-white font-bold">
                {language === 'ar' ? 'مساعد واصل الذكي' : 'Wasel AI Assistant'}
              </h3>
              <p className="text-white/80 text-xs">
                {language === 'ar' ? 'متاح دائماً' : 'Always available'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className={`h-[350px] overflow-y-auto p-4 space-y-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2 ${message.role === 'user' ? (language === 'ar' ? 'flex-row-reverse' : '') : (language === 'ar' ? '' : 'flex-row')}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                message.role === 'bot' ? 'bg-blue-500' : (isDarkMode ? 'bg-gray-700' : 'bg-gray-300')
              }`}>
                {message.role === 'bot' ? (
                  <Bot className="w-5 h-5 text-white" />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>
              <div
                className={`max-w-[75%] p-3 rounded-2xl whitespace-pre-line ${
                  message.role === 'bot'
                    ? (isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800')
                    : 'bg-blue-500 text-white'
                }`}
              >
                {message.content}
              </div>
            </motion.div>
          ))}
          
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`flex gap-2 ${language === 'ar' ? '' : 'flex-row'}`}
            >
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={`p-4 border-t ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={language === 'ar' ? 'اكتب سؤالك هنا...' : 'Type your question...'}
              className={`flex-1 px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-gray-100 border-gray-300 text-gray-800'
              }`}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
