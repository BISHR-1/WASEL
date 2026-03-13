import React, { useState } from 'react';
import { Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from './LanguageContext';
import AIChat from './AIChat';

export default function SupportChat({ inline = false, className = '' }) {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const floatingPositionClass = language === 'ar' ? 'left-6' : 'right-6';

  const buttonClassName = inline
    ? `relative w-10 h-10 rounded-lg border border-[#E5E7EB] bg-[#F9FAF8] text-[#1F2933] hover:bg-[#E5E7EB] ${className}`
    : `fixed bottom-6 ${floatingPositionClass} w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl ${className}`;

  return (
    <>
      <AIChat isOpen={isOpen} onClose={() => setIsOpen(false)} />

      <motion.button
        whileHover={{ scale: inline ? 1.03 : 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={language === 'ar' ? 'مساعد واصل ستور الذكي' : 'Wasel Store AI assistant'}
        className={`flex items-center justify-center z-50 transition-all ${buttonClassName}`}
      >
        <Bot className={inline ? 'w-5 h-5' : 'w-7 h-7'} />
      </motion.button>
    </>
  );
}