import React, { useEffect } from 'react';

export default function Contact() {
  useEffect(() => {
    // Immediate redirect to WhatsApp
    window.location.href = "https://wa.me/971502406519";
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDFBF7] p-4 text-center">
      <div className="md:w-16 md:h-16 w-12 h-12 border-4 border-[#1B4332] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-[#1B4332] font-bold text-lg font-['Cairo']">جاري التحويل إلى واتساب...</p>
      <p className="text-gray-500 text-sm mt-2">Redirecting to WhatsApp...</p>
    </div>
  );
}
