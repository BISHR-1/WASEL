// =====================================================
// WASEL — نظام التهدية الديناميكي للمغتربين
// ملف: src/components/cart/GiftToggleSection.jsx
// =====================================================

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift, Shield, Camera, FileText, CheckCircle,
  Upload, X, QrCode, Phone, MapPin, User, ChevronDown
} from 'lucide-react';

// =====================================================
// شارات الثقة — بدون ذكر طريقة التوصيل
// =====================================================
const TRUST_SEALS = [
  {
    emoji: '🛡️',
    text: 'تسليم آمن وموثوق لدرعا مع ضمان سلامة الأغراض والأجهزة والمواد الغذائية.',
  },
  {
    emoji: '📸',
    text: 'صورة توثيقية لمعاينة الهدية قبل إرسالها ولحظة التسليم عند باب المنزل كإثبات بالحب.',
  },
];

// =====================================================
// المكوّن الرئيسي
// =====================================================
export default function GiftToggleSection({ onGiftDataChange }) {
  const [isGift, setIsGift] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [noInvoice, setNoInvoice] = useState(false);
  const [includeCard, setIncludeCard] = useState(false);
  const [cardMessage, setCardMessage] = useState('');
  const [includeMedia, setIncludeMedia] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaDragging, setMediaDragging] = useState(false);
  const fileInputRef = useRef(null);

  const MAX_CARD_CHARS = 300;

  const handleToggle = () => {
    const next = !isGift;
    setIsGift(next);
    if (!next) {
      // إعادة تعيين عند الإلغاء
      onGiftDataChange?.(null);
    }
  };

  const handleDataUpdate = (updates) => {
    if (!isGift) return;
    onGiftDataChange?.({
      isGift: true,
      recipientName,
      recipientPhone,
      recipientAddress,
      noInvoice,
      includeCard,
      cardMessage,
      includeMedia,
      mediaFile,
      ...updates,
    });
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'audio/mpeg', 'audio/wav'];
    if (!validTypes.includes(file.type)) {
      alert('يُرجى رفع صورة أو فيديو أو مقطع صوتي فقط.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      alert('الحجم الأقصى المسموح 50 ميغابايت.');
      return;
    }
    setMediaFile(file);
    handleDataUpdate({ mediaFile: file });
  };

  return (
    <div className="rounded-2xl overflow-hidden border-2 border-dashed transition-all duration-300"
      style={{ borderColor: isGift ? '#FF7F11' : '#E5E7EB', background: isGift ? '#FFF0E5' : '#FAFAFA' }}
    >
      {/* ===== زر تفعيل الهدية ===== */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center gap-3 p-4 text-right"
        dir="rtl"
      >
        {/* مربع التحديد */}
        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 shrink-0
          ${isGift ? 'border-[#FF7F11] bg-[#FF7F11]' : 'border-gray-300 bg-white'}`}
        >
          {isGift && <CheckCircle className="w-4 h-4 text-white" />}
        </div>

        {/* أيقونة وعنوان */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Gift className={`w-5 h-5 shrink-0 ${isGift ? 'text-[#FF7F11]' : 'text-gray-400'}`} />
            <span className={`font-black text-base ${isGift ? 'text-[#E16200]' : 'text-[#1A202C]'}`}>
              أرسل هذا الطلب كهدية قيمة لعائلتي في درعا
            </span>
          </div>
          <p className={`text-xs mt-0.5 mr-7 ${isGift ? 'text-[#E16200]/70' : 'text-gray-400'}`}>
            سيتم تهيئة الطلب كهدية مع كافة الخيارات المتاحة
          </p>
        </div>

        {/* سهم */}
        <ChevronDown
          className={`w-5 h-5 transition-transform duration-300 shrink-0 ${isGift ? 'rotate-180 text-[#FF7F11]' : 'text-gray-400'}`}
        />
      </button>

      {/* ===== تفاصيل الهدية — تظهر عند التفعيل ===== */}
      <AnimatePresence>
        {isGift && (
          <motion.div
            key="gift-details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-5" dir="rtl">
              <div className="h-px bg-[#FECDAA]" />

              {/* ===== بيانات المستلم ===== */}
              <div className="space-y-3">
                <h4 className="font-black text-[#0B2545] flex items-center gap-2">
                  <User className="w-4 h-4 text-[#FF7F11]" />
                  بيانات المستلم في درعا
                </h4>

                {/* اسم المستلم */}
                <div className="relative">
                  <User className="absolute top-3.5 right-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => { setRecipientName(e.target.value); handleDataUpdate({ recipientName: e.target.value }); }}
                    placeholder="اسم المستلم الكامل في درعا"
                    className="w-full rounded-xl border border-[#E5E7EB] bg-white pr-10 pl-4 py-3 text-sm text-[#1A202C] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF7F11]/30 focus:border-[#FF7F11] transition-all"
                    dir="rtl"
                  />
                </div>

                {/* رقم هاتف المستلم */}
                <div className="relative">
                  <Phone className="absolute top-3.5 right-3 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => { setRecipientPhone(e.target.value); handleDataUpdate({ recipientPhone: e.target.value }); }}
                    placeholder="رقم هاتف قريبك للتنسيق الهاتفي"
                    className="w-full rounded-xl border border-[#E5E7EB] bg-white pr-10 pl-4 py-3 text-sm text-[#1A202C] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF7F11]/30 focus:border-[#FF7F11] transition-all"
                    dir="rtl"
                  />
                </div>

                {/* عنوان التسليم التفصيلي */}
                <div className="relative">
                  <MapPin className="absolute top-3.5 right-3 w-4 h-4 text-gray-400" />
                  <textarea
                    value={recipientAddress}
                    onChange={(e) => { setRecipientAddress(e.target.value); handleDataUpdate({ recipientAddress: e.target.value }); }}
                    placeholder="موقع التسليم بالتفصيل (بلدة/قرية المستلم في ريف درعا)"
                    rows={2}
                    className="w-full rounded-xl border border-[#E5E7EB] bg-white pr-10 pl-4 py-3 text-sm text-[#1A202C] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF7F11]/30 focus:border-[#FF7F11] transition-all resize-none"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* ===== خيارات الهدية ===== */}
              <div className="space-y-3">
                <h4 className="font-black text-[#0B2545] flex items-center gap-2">
                  <Gift className="w-4 h-4 text-[#FF7F11]" />
                  خيارات الهدية
                </h4>

                {/* عدم إرفاق الفاتورة */}
                <label className="flex items-start gap-3 p-3 rounded-xl bg-white border border-[#E5E7EB] cursor-pointer hover:border-[#FF7F11]/40 transition-all">
                  <input
                    type="checkbox"
                    checked={noInvoice}
                    onChange={(e) => { setNoInvoice(e.target.checked); handleDataUpdate({ noInvoice: e.target.checked }); }}
                    className="mt-1 w-4 h-4 accent-[#FF7F11] shrink-0"
                  />
                  <div>
                    <p className="font-bold text-[#1A202C] text-sm">عدم إرفاق أي فواتير أو أسعار مادية مع الهدية</p>
                    <p className="text-xs text-gray-400 mt-0.5">سيصل الطلب بدون أي أرقام مالية</p>
                  </div>
                </label>

                {/* إرفاق بطاقة تهنئة */}
                <div>
                  <label className="flex items-start gap-3 p-3 rounded-xl bg-white border border-[#E5E7EB] cursor-pointer hover:border-[#FF7F11]/40 transition-all">
                    <input
                      type="checkbox"
                      checked={includeCard}
                      onChange={(e) => { setIncludeCard(e.target.checked); handleDataUpdate({ includeCard: e.target.checked }); }}
                      className="mt-1 w-4 h-4 accent-[#FF7F11] shrink-0"
                    />
                    <div>
                      <p className="font-bold text-[#1A202C] text-sm flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-[#FF7F11]" />
                        إرفاق بطاقة تهنئة مطبوعة مجانية
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">رسالتك ستُطبع وتُضاف مع الهدية</p>
                    </div>
                  </label>

                  <AnimatePresence>
                    {includeCard && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 relative">
                          <textarea
                            value={cardMessage}
                            onChange={(e) => {
                              const val = e.target.value.slice(0, MAX_CARD_CHARS);
                              setCardMessage(val);
                              handleDataUpdate({ cardMessage: val });
                            }}
                            placeholder="اكتب رسالتك العاطفية هنا... (مثال: إلى أحبائي في درعا، أتمنى لكم الصحة والسلامة دائماً)"
                            rows={3}
                            maxLength={MAX_CARD_CHARS}
                            className="w-full rounded-xl border border-[#FECDAA] bg-[#FFF0E5] px-4 py-3 text-sm text-[#1A202C] placeholder:text-[#E16200]/50 focus:outline-none focus:ring-2 focus:ring-[#FF7F11]/30 focus:border-[#FF7F11] transition-all resize-none"
                            dir="rtl"
                          />
                          <span className={`absolute bottom-2 left-3 text-[10px] font-medium ${cardMessage.length >= MAX_CARD_CHARS ? 'text-red-500' : 'text-gray-400'}`}>
                            {cardMessage.length}/{MAX_CARD_CHARS}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* إرفاق معايدة بصرية */}
                <div>
                  <label className="flex items-start gap-3 p-3 rounded-xl bg-white border border-[#E5E7EB] cursor-pointer hover:border-[#FF7F11]/40 transition-all">
                    <input
                      type="checkbox"
                      checked={includeMedia}
                      onChange={(e) => { setIncludeMedia(e.target.checked); handleDataUpdate({ includeMedia: e.target.checked }); }}
                      className="mt-1 w-4 h-4 accent-[#FF7F11] shrink-0"
                    />
                    <div>
                      <p className="font-bold text-[#1A202C] text-sm flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-[#FF7F11]" />
                        إرفاق معايدة بصرية (فيديو أو مقطع صوتي)
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">سيُولَّد رمز QR مخصص على صندوق الهدية للمستلم</p>
                    </div>
                  </label>

                  <AnimatePresence>
                    {includeMedia && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-2"
                      >
                        {/* منطقة السحب والإفلات */}
                        <div
                          onDragOver={(e) => { e.preventDefault(); setMediaDragging(true); }}
                          onDragLeave={() => setMediaDragging(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setMediaDragging(false);
                            const file = e.dataTransfer.files?.[0];
                            if (file) handleFileSelect(file);
                          }}
                          onClick={() => fileInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200
                            ${mediaDragging
                              ? 'border-[#FF7F11] bg-[#FFF0E5]'
                              : mediaFile
                                ? 'border-[#588157] bg-[#F4F7F4]'
                                : 'border-[#E5E7EB] bg-gray-50 hover:border-[#FF7F11]/50'
                            }`}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/mp4,audio/*"
                            className="hidden"
                            onChange={(e) => handleFileSelect(e.target.files?.[0])}
                          />

                          {mediaFile ? (
                            <div className="flex items-center justify-center gap-3">
                              <QrCode className="w-8 h-8 text-[#588157]" />
                              <div className="text-right">
                                <p className="font-bold text-[#588157] text-sm">{mediaFile.name}</p>
                                <p className="text-xs text-gray-400">سيُولَّد رمز QR تلقائياً على الصندوق</p>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setMediaFile(null); handleDataUpdate({ mediaFile: null }); }}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Upload className="w-8 h-8 text-gray-300 mx-auto" />
                              <p className="font-bold text-gray-500 text-sm">اسحب الملف هنا أو انقر للاختيار</p>
                              <p className="text-xs text-gray-400">صورة، فيديو، أو صوت — حد أقصى 50MB</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* ===== شارات الثقة ===== */}
              <div className="space-y-2 pt-2 border-t border-[#FECDAA]">
                <h4 className="font-bold text-[#0B2545] text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#FF7F11]" />
                  وعودنا لك
                </h4>
                {TRUST_SEALS.map((seal, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-white rounded-xl border border-[#E5E7EB]">
                    <span className="text-xl shrink-0">{seal.emoji}</span>
                    <p className="text-xs text-[#1A202C] leading-relaxed">{seal.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
