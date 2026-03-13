import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';

const STORAGE_KEY = 'wasel_android_banner_dismissed';

function isAndroid() {
  if (typeof navigator === 'undefined') return false;
  return /android/i.test(navigator.userAgent);
}

export default function AndroidSmartBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isAndroid()) return;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setShow(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          className="fixed top-0 left-0 right-0 z-[200] bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white shadow-2xl"
          dir="rtl"
        >
          <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
            {/* App icon */}
            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-lg overflow-hidden">
              <img src="/logo/wasel-logo.png" alt="Wasel" className="w-9 h-9 object-contain" onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<span class="text-lg font-black text-emerald-700">W</span>'; }} />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm leading-tight">تطبيق وصل</p>
              <p className="text-white/70 text-xs">حمّل التطبيق لتجربة أفضل وأسرع</p>
            </div>

            {/* Download link */}
            <Link
              to="/DownloadApp"
              onClick={handleDismiss}
              className="shrink-0 flex items-center gap-1.5 bg-white text-[#1B4332] font-bold text-xs px-4 py-2 rounded-xl shadow hover:bg-gray-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              تحميل
            </Link>

            {/* Close */}
            <button
              onClick={handleDismiss}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
