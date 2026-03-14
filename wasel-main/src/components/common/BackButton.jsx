import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function BackButton({ className = '', variant = 'default' }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/', { replace: true });
  };

  return (
    <Button
      onClick={handleBack}
      variant={variant}
      className={`inline-flex items-center gap-2 bg-white border border-[#D1D5DB] hover:bg-[#F8FAFC] text-[#1F2933] shadow-sm hover:shadow-md transition-all duration-200 rounded-full px-4 py-2 ${className}`}
    >
      <ArrowRight className="w-4 h-4" />
      رجوع
    </Button>
  );
}