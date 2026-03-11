import React from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, Package, Truck, CheckCircle2, X } from 'lucide-react';
import SmartLottie from '@/components/animations/SmartLottie';
import { ANIMATION_PRESETS } from '@/components/animations/animationPresets';

const OrderTimeline = ({ status, language = 'ar' }) => {
  const steps = [
    {
      id: 'pending',
      label: language === 'ar' ? 'قيد انتظار القبول' : 'Pending Acceptance',
      icon: Package,
      color: 'blue',
      animation: 'statusPending'
    },
    {
      id: 'processing',
      label: language === 'ar' ? 'تم القبول ويتم تجهيز طلبك' : 'Accepted and Preparing',
      icon: Clock,
      color: 'yellow',
      animation: 'statusCooking'
    },
    {
      id: 'delivering',
      label: language === 'ar' ? 'في الطريق' : 'Out for Delivery',
      icon: Truck,
      color: 'purple',
      animation: 'statusDelivering'
    },
    {
      id: 'completed',
      label: language === 'ar' ? 'تم الاستلام' : 'Received',
      icon: CheckCircle2,
      color: 'green',
      animation: 'orderSuccess'
    }
  ];

  const cancelledStep = {
    id: 'cancelled',
    label: language === 'ar' ? 'ملغي' : 'Cancelled',
    icon: X,
    color: 'red'
  };

  // Helper function to get animation path based on step status
  const getStepAnimation = (stepId, isCompleted, isCurrent) => {
    if (!isCompleted && !isCurrent) return null;
    
    const step = steps.find(s => s.id === stepId);
    if (!step || !step.animation) return null;
    
    return ANIMATION_PRESETS[step.animation]?.path || null;
  };

  // If cancelled, show special state
  if (status === 'cancelled') {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
        <div className="flex items-center justify-center gap-3 text-red-600">
          <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
            <X className="w-6 h-6 text-white" strokeWidth={3} />
          </div>
          <div>
            <h3 className="font-bold text-lg">{cancelledStep.label}</h3>
            <p className="text-sm text-red-500">
              {language === 'ar' ? 'تم إلغاء الطلب' : 'Order has been cancelled'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentStepIndex = steps.findIndex(step => step.id === status);

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <h3 className="font-bold text-lg text-gray-800 mb-6">
        {language === 'ar' ? 'حالة الطلب' : 'Order Status'}
      </h3>
      
      <div className="relative">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isLast = index === steps.length - 1;

          const colorClasses = {
            blue: 'bg-blue-500',
            yellow: 'bg-yellow-500',
            purple: 'bg-purple-500',
            green: 'bg-green-500'
          };

          return (
            <div key={step.id} className="relative pb-8 last:pb-0">
              {/* Connector Line */}
              {!isLast && (
                <div 
                  className={`absolute ${language === 'ar' ? 'right-6' : 'left-6'} top-12 w-0.5 h-full ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}

              {/* Step Container */}
              <div className="relative flex items-start gap-4">
                {/* Icon Circle */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center ${
                    isCompleted 
                      ? colorClasses[step.color] + ' shadow-lg'
                      : 'bg-gray-200'
                  }`}
                >
                  {/* Show animation if available and step is completed/current */}
                  {(isCompleted || isCurrent) && getStepAnimation(step.id, isCompleted, isCurrent) ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <SmartLottie
                        animationPath={getStepAnimation(step.id, isCompleted, isCurrent)}
                        width={48}
                        height={48}
                        trigger="immediate"
                        autoplay={true}
                        loop={isCurrent}
                        speed={isCurrent && step.id === 'delivering' ? 1.2 : 1}
                        hideWhenDone={!isCurrent}
                      />
                    </div>
                  ) : (
                    <>
                      {isCompleted && index < currentStepIndex ? (
                        <Check className="w-6 h-6 text-white" strokeWidth={3} />
                      ) : (
                        <StepIcon 
                          className={`w-6 h-6 ${isCompleted ? 'text-white' : 'text-gray-400'}`}
                          strokeWidth={2.5}
                        />
                      )}
                    </>
                  )}
                  
                  {/* Pulse Animation for Current Step */}
                  {isCurrent && !getStepAnimation(step.id, isCompleted, isCurrent) && (
                    <span className="absolute inset-0 rounded-full animate-ping bg-current opacity-20" />
                  )}
                </motion.div>

                {/* Label */}
                <div className="flex-1 pt-2">
                  <h4 className={`font-bold ${
                    isCompleted ? 'text-gray-800' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </h4>
                  
                  {isCurrent && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-gray-500 mt-1"
                    >
                      {language === 'ar' ? 'جاري التنفيذ...' : 'In progress...'}
                    </motion.p>
                  )}
                  
                  {isCompleted && !isCurrent && (
                    <p className="text-xs text-gray-400 mt-1">
                      {language === 'ar' ? '✓ مكتمل' : '✓ Completed'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTimeline;
