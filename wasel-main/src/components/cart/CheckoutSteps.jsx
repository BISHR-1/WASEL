import React from 'react';
import { Check, ShoppingBag, FileText, CreditCard } from 'lucide-react';
import { useLanguage } from '../common/LanguageContext';

export default function CheckoutSteps({ currentStep }) {
  const { language } = useLanguage();
  
  const steps = [
    { id: 1, name: language === 'en' ? 'Cart' : 'السلة', icon: ShoppingBag },
    { id: 2, name: language === 'en' ? 'Details' : 'التفاصيل', icon: FileText },
    { id: 3, name: language === 'en' ? 'Payment' : 'الدفع', icon: CreditCard },
  ];

  return (
    <div className="flex items-center justify-center w-full mb-8">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center relative z-10">
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                currentStep >= step.id 
                  ? 'bg-[#1B4332] border-[#1B4332] text-white' 
                  : 'bg-white border-gray-300 text-gray-400'
              }`}
            >
              {currentStep > step.id ? <Check className="w-6 h-6" /> : <step.icon className="w-5 h-5" />}
            </div>
            <span 
              className={`text-xs font-bold mt-2 absolute -bottom-6 w-20 text-center ${
                currentStep >= step.id ? 'text-[#1B4332]' : 'text-gray-400'
              }`}
            >
              {step.name}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div 
              className={`w-16 sm:w-24 h-1 mx-2 rounded-full transition-all duration-300 ${
                currentStep > step.id ? 'bg-[#1B4332]' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}