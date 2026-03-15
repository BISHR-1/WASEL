import React from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import AdBanner from '@/components/ads/AdBanner';

export default function AppFooter() {
  const navigate = useNavigate();

  const quickLinks = [
    { label: "الرئيسية", path: "/" },
    { label: "الهدايا", path: "/Gifts" },
    { label: "المطاعم", path: "/Restaurants" },
    { label: "الباقات", path: "/Packages" },
  ];

  const contactLinks = [
    { label: "تواصل معنا", path: "/Contact" },
    { label: "كيف يعمل واصل؟", path: "/HowItWorks" },
    { label: "الشفافية والثقة", path: "/Transparency" },
    { label: "شروط وأحكام المستخدمين", path: "/TermsAndConditions" },
    { label: "سياسة الخصوصية", path: "/PrivacyPolicy" },
    { label: "سياسة الإرجاع", path: "/ReturnPolicy" },
    { label: "الأسئلة الشائعة", path: "/FAQ" },
    { label: "التوصيل داخل درعا", path: "/DeliveryInDaraa" },
  ];

  return (
    <footer className="bg-[#184B3A] text-[#D7E8E2] border-t border-[#2A6652]" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-start text-sm">
          <div>
            <h4 className="font-bold text-white mb-1.5 text-sm">تواصل معنا 💌</h4>
            <div className="space-y-0.5">
              {contactLinks.map((link) => (
                <button key={link.path} onClick={() => navigate(link.path)} className="block text-[#CFE3DC] hover:text-white transition-colors text-xs">
                  {link.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-bold text-white mb-1.5 text-sm">روابط سريعة 🚀</h4>
            <div className="space-y-0.5">
              {quickLinks.map((link) => (
                <button key={link.path} onClick={() => navigate(link.path)} className="block text-[#CFE3DC] hover:text-white transition-colors text-xs">
                  {link.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center text-center col-span-2 md:col-span-2">
            <img
              src="/logo/wasel-logo.png"
              alt="Wasel"
              className="h-10 w-10 rounded-lg object-contain bg-white/10 border border-white/20 p-0.5 mb-2"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
            <p className="text-xs text-[#E4F1EC] max-w-sm leading-5">
              واصل ستور صُنع بحب ليجمع القلوب ❤️ نوصّل شعورك وهداياك بأمان ✨
            </p>
          </div>
        </div>

        {/* إعلان في الفوتر */}
        <div className="mt-3 mb-2">
          <AdBanner format="horizontal" className="rounded-lg opacity-80" />
        </div>

        <div className="border-t border-[#2A6652] mt-3 pt-2 text-center text-[#C6DBD3] text-xs">
          <p>© {new Date().getFullYear()} واصل ستور Wasel Store 🌸</p>
        </div>
      </div>
    </footer>
  );
}
