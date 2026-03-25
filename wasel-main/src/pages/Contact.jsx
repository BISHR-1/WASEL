import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Mail, MapPin, Clock, Phone, ExternalLink, Shield } from 'lucide-react';
import AdBanner from '@/components/ads/AdBanner';

export default function Contact() {
  const whatsappUrl = "https://wa.me/971502406519";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0FDF4] via-white to-[#F9FAF8]" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="text-3xl font-black text-[#1B4332] mb-3">تواصل مع واصل ستور</h1>
          <p className="text-gray-500 max-w-xl mx-auto leading-relaxed">
            فريق دعم واصل ستور متاح لمساعدتك في أي استفسار عن طلباتك أو خدماتنا. نحرص على الرد السريع والمفيد لكل عميل.
          </p>
        </motion.div>

        {/* Contact Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <motion.a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm group cursor-pointer block"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-black text-[#1F2933]">واتساب</h3>
                <p className="text-xs text-gray-400">الطريقة الأسرع للتواصل</p>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-300 mr-auto group-hover:text-[#1B4332] transition-colors" />
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">اضغط للتحدث مباشرة مع فريق الدعم عبر واتساب. متاح من 8 صباحاً حتى 10 مساءً بتوقيت سوريا.</p>
          </motion.a>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-black text-[#1F2933]">البريد الإلكتروني</h3>
                <p className="text-xs text-gray-400">للاستفسارات الرسمية</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">للشكاوى الرسمية أو الاستفسارات التجارية، راسلنا على البريد الإلكتروني وسنرد خلال 24 ساعة عمل.</p>
          </motion.div>
        </div>

        {/* Info Section */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-xl font-black text-[#1B4332] mb-4">معلومات إضافية</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#1B4332] mt-0.5 shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-[#1F2933] mb-1">مقر العمل</h4>
                <p className="text-sm text-gray-500">درعا، سوريا — فريق محلي متخصص في التوصيل والخدمة الميدانية.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-[#1B4332] mt-0.5 shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-[#1F2933] mb-1">ساعات العمل</h4>
                <p className="text-sm text-gray-500">الأحد إلى الجمعة، من 8:00 صباحاً حتى 8:00 مساءً بتوقيت دمشق (GMT+3).</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#1B4332] mt-0.5 shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-[#1F2933] mb-1">الأمان والخصوصية</h4>
                <p className="text-sm text-gray-500">جميع البيانات مشفرة ومحمية. لن نشارك معلوماتك مع أي طرف ثالث.</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ quick section */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-xl font-black text-[#1B4332] mb-4">أسئلة شائعة عن التواصل</h2>
          <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
            <div>
              <h4 className="font-bold text-[#2D6A4F] mb-1">كم يستغرق الرد على الاستفسارات؟</h4>
              <p>عبر واتساب: الرد خلال دقائق في أوقات العمل. عبر البريد: خلال 24 ساعة عمل. نحرص على عدم ترك أي رسالة بدون رد.</p>
            </div>
            <div>
              <h4 className="font-bold text-[#2D6A4F] mb-1">هل يمكنني تتبع طلبي عبر واتساب؟</h4>
              <p>نعم! أرسل رقم الطلب لفريق الدعم وسنعطيك تحديثاً فورياً عن حالة الطلب، من التجهيز وحتى التوصيل.</p>
            </div>
            <div>
              <h4 className="font-bold text-[#2D6A4F] mb-1">هل يمكنني تقديم شكوى؟</h4>
              <p>بالتأكيد. نرحب بجميع الملاحظات والشكاوى لأنها تساعدنا على التحسين. شكواك ستُعالج بسرية تامة وسنتواصل معك بالرد خلال 48 ساعة كحد أقصى.</p>
            </div>
            <div>
              <h4 className="font-bold text-[#2D6A4F] mb-1">هل التواصل متاح بلغات أخرى؟</h4>
              <p>فريقنا يتحدث العربية والإنجليزية. نسعد بمساعدتك بأي لغة تفضلها.</p>
            </div>
          </div>
        </div>

        <AdBanner format="auto" className="rounded-xl" />
      </div>
    </div>
  );
}
