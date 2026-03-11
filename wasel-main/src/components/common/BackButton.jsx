import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function BackButton({ className = '', variant = 'default' }) {
  const navigate = useNavigate();

  return (
    <Button
      onClick={() => navigate(-1)}
      variant={variant}
      className={`fixed top-20 right-4 z-40 bg-gradient-to-r from-[#52B788] to-[#40916C] hover:from-[#40916C] hover:to-[#2D6A4F] text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl ${className}`}
    >
      <ArrowRight className="w-5 h-5 ml-2" />
      رجوع
    </Button>
  );
}