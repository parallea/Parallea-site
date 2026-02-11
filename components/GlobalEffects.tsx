import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const GlobalEffects: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Move cursor logic
    const moveCursor = (e: MouseEvent) => {
      gsap.to(cursorRef.current, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.1,
        ease: 'power2.out'
      });
      gsap.to(followerRef.current, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.5,
        ease: 'power2.out'
      });
    };

    window.addEventListener('mousemove', moveCursor);
    return () => window.removeEventListener('mousemove', moveCursor);
  }, []);

  return (
    <>
      {/* Noise Overlay */}
      <div className="fixed inset-0 z-[9999] pointer-events-none opacity-[0.04] mix-blend-overlay">
        <svg className="w-full h-full">
          <filter id="noiseFilter">
            <feTurbulence 
              type="fractalNoise" 
              baseFrequency="0.7" 
              numOctaves="3" 
              stitchTiles="stitch" 
            />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
      </div>

      {/* Custom Cursor - White Theme */}
      <div 
        ref={cursorRef} 
        className="fixed top-0 left-0 w-2 h-2 bg-white rounded-full mix-blend-difference pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 hidden md:block"
      />
      <div 
        ref={followerRef} 
        className="fixed top-0 left-0 w-8 h-8 border border-white/50 rounded-full mix-blend-difference pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 transition-transform duration-300 ease-out hidden md:block"
      />
      
      {/* Vignette - Black */}
      <div className="fixed inset-0 z-[9998] pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)]" />
    </>
  );
};

export default GlobalEffects;