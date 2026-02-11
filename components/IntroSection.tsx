import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ScrollVideoCanvas from './ScrollVideoCanvas';
import LedTextCanvas from './LedTextCanvas';
import Logo from './Logo';

gsap.registerPlugin(ScrollTrigger);

const IntroSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0,
        onUpdate: (self) => {
          setProgress(self.progress);
        },
      });
    });

    return () => ctx.revert();
  }, []);

  // Phase 1: Text Interaction (0 → 0.4)
  const textPhaseEnd = 0.4;
  const textAnimationProgress = Math.min(1, progress / textPhaseEnd);

  // Phase 2: Video Sequence (0.2 → 0.9)
  const videoPhaseStart = 0.2;
  const videoPhaseEnd = 0.9;
  const videoProgress = Math.max(
    0,
    Math.min(1, (progress - videoPhaseStart) / (videoPhaseEnd - videoPhaseStart))
  );

  // Phase 3: Global Fade Out (0.85 → 1.0)
  const fadeOutStart = 0.85;
  const globalOpacity =
    1 - Math.max(0, (progress - fadeOutStart) / (1 - fadeOutStart));

  // Logo Fade (0 → 0.1)
  const logoOpacity = Math.max(0, 1 - progress * 15);

  return (
    <div
      ref={containerRef}
      className="relative w-full pointer-events-none bg-red-700"
      style={{ height: '250vh' }}
    >
      <div
        className="sticky top-0 h-screen w-full overflow-hidden"
        style={{ opacity: globalOpacity }}
      >
        {/* Video Tunnel Layer */}
        <div
          className="absolute inset-0 z-0 transition-opacity duration-700 ease-out"
          style={{ opacity: videoProgress > 0.01 ? 1 : 0 }}
        >
          <ScrollVideoCanvas progress={videoProgress} />
        </div>

        {/* LED Text Layer */}
        <div
          className="absolute inset-0 z-10 transition-opacity duration-300"
          style={{ opacity: textAnimationProgress >= 1 ? 0 : 1 }}
        >
          <LedTextCanvas
            text="PARALLEA TECH"
            scrollProgress={textAnimationProgress}
          />
        </div>

        {/* Logo Layer */}
        <Logo opacity={logoOpacity} src="/images/PARALLEA.png" alt="PARALLEA" size={40} />

        {/* Hint Text */}
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/40 text-xs tracking-[0.5em] animate-pulse font-['Rajdhani'] pointer-events-none z-20"
          style={{ opacity: Math.max(0, 1 - progress * 20) }}
        >
          INITIALIZE SEQUENCE
        </div>
      </div>
    </div>
  );
};

export default IntroSection;
