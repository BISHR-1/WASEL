import React, { useState, useEffect, useRef } from 'react';

export default function AnimatedEye({ isRightEye = false }) {
  const eyeRef = useRef(null);
  const [pupilPosition, setPupilPosition] = useState({ x: 0, y: 0 });

  // Default positions based on design
  const defaultPosition = isRightEye 
    ? { x: 17, y: 15 }  // Right eye default
    : { x: -27, y: -24 }; // Left eye default

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!eyeRef.current) return;

      const eye = eyeRef.current.getBoundingClientRect();
      const eyeCenterX = eye.left + eye.width / 2;
      const eyeCenterY = eye.top + eye.height / 2;

      // Calculate angle to mouse
      const angle = Math.atan2(e.clientY - eyeCenterY, e.clientX - eyeCenterX);
      
      // Eye and pupil dimensions
      const eyeRadius = eye.width / 2;
      const pupilRadius = 32; // Pupil size
      const maxDistance = eyeRadius - pupilRadius - 10; // Buffer to prevent touching edge

      // Calculate pupil position with constraint
      const distance = Math.min(maxDistance, maxDistance);
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;

      setPupilPosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={eyeRef}
      className="relative w-[160px] h-[160px] sm:w-[200px] sm:h-[200px] bg-[#F5EDD6] rounded-full overflow-hidden"
    >
      {/* Pupil */}
      <div
        className="absolute w-16 h-16 bg-black rounded-full transition-transform duration-100 ease-out"
        style={{
          left: '50%',
          top: '50%',
          transform: `translate(calc(-50% + ${pupilPosition.x || defaultPosition.x}px), calc(-50% + ${pupilPosition.y || defaultPosition.y}px))`,
        }}
      />
    </div>
  );
}
