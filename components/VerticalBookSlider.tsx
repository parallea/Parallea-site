import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface Page {
  id: string;
  image: string;
  title: string;
  description: string;
}

const pages: Page[] = [
  { id: 'p1', image: '/images/silhouette.jpeg', title: 'Origin', description: 'Where digital consciousness begins' },
  { id: 'p2', image: '/images/light-motion.jpeg', title: 'Expansion', description: 'Reaching beyond physical limits' },
  { id: 'p3', image: '/images/water-reflection.jpeg', title: 'Integration', description: 'Seamless blending of realities' },
  { id: 'p4', image: '/images/red-glow.jpeg', title: 'Security', description: 'Encrypted existence forever' }
];

const VerticalBookSlider: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: `+=${pages.length * 100}%`,
          scrub: 1,
          pin: true,
        },
      });

      pagesRef.current.forEach((page, i) => {
        if (i === 0) return;
        tl.fromTo(
          page,
          { yPercent: 100 },
          { yPercent: 0, ease: 'none', duration: 1 }
        );
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="h-screen w-full bg-black relative overflow-hidden">
      {pages.map((page, i) => (
        <div
          key={page.id}
          ref={(el) => {
            pagesRef.current[i] = el;
          }}
          className="absolute inset-0 w-full h-full flex flex-col md:flex-row bg-black"
          style={{ zIndex: i }}
        >
          {/* TEXT SIDE - LEFT */}
          <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col justify-center px-8 md:px-20 border-r border-white/20 bg-black relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

            <div className="relative z-10">
              <span className="dot-matrix text-xs tracking-widest text-zinc-500 mb-4 block">
                CHAPTER 0{i + 1}
              </span>
              <h2 className="text-4xl md:text-7xl font-bold font-['Rajdhani'] mb-6 text-white uppercase">
                {page.title}
              </h2>
              <p className="text-sm md:text-xl text-zinc-400 font-['Space Mono'] leading-relaxed">
                {page.description}
              </p>

              <div className="mt-12 h-px w-20 bg-white/50"></div>
            </div>
          </div>

          {/* IMAGE SIDE - RIGHT (FULL COLOR, NO CROP) */}
          <div className="w-full md:w-1/2 h-1/2 md:h-full relative overflow-hidden bg-black flex items-center justify-center">
            <img
              src={page.image}
              alt={page.title}
              className="
                max-w-full
                max-h-full
                object-contain
                transition-all
                duration-700
                ease-out
                saturate-125
                contrast-115
                brightness-105
              "
              loading="eager"
              decoding="async"
            />

            {/* Soft cinematic overlay (color-safe) */}
            <div className="absolute inset-0 bg-black/10 pointer-events-none" />

            {/* Scanlines overlay (kept, color-neutral) */}
            <div
              className="
                absolute inset-0
                bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%),linear-gradient(90deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015),rgba(255,255,255,0.03))]
                bg-[length:100%_2px,3px_100%]
                pointer-events-none
                z-10
              "
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default VerticalBookSlider;
