/**
 * SmartLottie Component
 * ═════════════════════════════════════════════════════════════════════════
 * مكون ذكي للأنيميشنات Lottie بدون إزعاج
 * - يحمّل الملفات بكفاءة
 * - ينتظر التفاعل للعب (إذا كانت المرة الأولى)
 * - متجاوب مع الأجهزة المختلفة
 * - يتجاهل الأنيميشنات إذا كانت الأجهزة بطيئة
 */

import React, { useState, useEffect, useRef } from 'react';
import Lottie from 'lottie-web';

const SmartLottie = ({
  animationPath,
  width = 100,
  height = 100,
  loop = true,
  autoplay = false,
  speed = 1,
  onComplete = null,
  className = '',
  style = {},
  trigger = 'never', // 'immediate', 'onHover', 'onClick', 'never'
  hideWhenDone = false,
  reduceMotion = true, // احترم تفضيلات المستخدم
  lightMode = false, // تقليل الموارد على الأجهزة البطيئة
}) => {
  const containerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lottieInstance, setLottieInstance] = useState(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // التحقق من تفضيلات المستخدم للحد من الحركة
  useEffect(() => {
    if (!reduceMotion) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [reduceMotion]);

  // إذا كان المستخدم يفضل تقليل الحركة، لا نعرض الأنيميشن
  if (prefersReducedMotion && reduceMotion) {
    return null;
  }

  // تحميل Lottie وتشغيل الأنيميشن
  useEffect(() => {
    if (!containerRef.current || isLoaded) return;

    const loadLottie = () => {
      try {
        // Clear previous content
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        const instance = Lottie.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop: loop && !hideWhenDone,
          autoplay: autoplay || (trigger === 'immediate'), // Auto-play إذا كان محدد أو trigger immediate
          path: animationPath,
          rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice',
            progressiveLoad: lightMode,
          },
        });

        // تعديل السرعة
        instance.setSpeed(speed);

        // معالج انتهاء الأنيميشن
        if (onComplete || hideWhenDone) {
          instance.addEventListener('complete', () => {
            if (hideWhenDone && containerRef.current) {
              containerRef.current.style.display = 'none';
            }
            onComplete?.();
          });
        }

        setLottieInstance(instance);
        setIsLoaded(true);

        // التشغيل الفوري إذا تم تحديده
        if (trigger === 'immediate') {
          setIsPlaying(true);
        }
      } catch (error) {
        console.warn(`Failed to load animation: ${animationPath}`, error);
      }
    };

    // تأخير صغير للتأكد من أن DOM جاهز
    setTimeout(loadLottie, 100);
  }, [animationPath, isLoaded, loop, hideWhenDone, trigger, onComplete, speed]);

  // معالج التفاعلات
  const handleInteraction = () => {
    if (!lottieInstance) return;

    if (isPlaying) {
      lottieInstance.pause();
      setIsPlaying(false);
    } else {
      lottieInstance.play();
      setIsPlaying(true);
    }
  };

  const handleHover = () => {
    if (trigger === 'onHover' && lottieInstance && !isPlaying) {
      lottieInstance.play();
      setIsPlaying(true);
    }
  };

  const handleHoverEnd = () => {
    if (trigger === 'onHover' && lottieInstance && isPlaying && !loop) {
      lottieInstance.stop();
      setIsPlaying(false);
    }
  };

  const interactionProps = trigger === 'onClick' ? { onClick: handleInteraction } : {};
  const hoverProps = trigger === 'onHover' ? { onMouseEnter: handleHover, onMouseLeave: handleHoverEnd } : {};

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width,
        height,
        ...style,
      }}
      {...interactionProps}
      {...hoverProps}
    />
  );
};

export default SmartLottie;
