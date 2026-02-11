import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const TextReveal: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);

  const text =
    'We create living digital selves that grow with you, so your presence can reach further without losing what makes you real.';

  useEffect(() => {
    const textEl = textRef.current;
    if (!textEl) return;

    // Split text into characters (preserve spaces)
    const chars = text.split('').map((char, i) =>
      char === ' '
        ? `<span class="char space" data-i="${i}">&nbsp;</span>`
        : `<span class="char" data-i="${i}">${char}</span>`
    );

    textEl.innerHTML = chars.join('');
    // Use NodeListOf<HTMLElement> to preserve element typing
    const charEls = textEl.querySelectorAll<HTMLElement>('.char');

    const st = ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.5,
      onUpdate: (self) => {
        const activeCount = Math.floor(self.progress * charEls.length);

        charEls.forEach((char, i) => {
          if (i <= activeCount) {
            char.classList.add('active');
          } else {
            char.classList.remove('active');
          }
        });
      },
    });

    return () => {
      st.kill();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black"
      style={{ minHeight: '400vh' }}
    >
      <div className="sticky top-[20vh] px-6 md:px-12 lg:px-20 max-w-6xl mx-auto text-center">
        <p
          ref={textRef}
          className="
            text-2xl
            md:text-4xl
            lg:text-6xl
            leading-tight
            tracking-tight
            font-['DotGothic16']
          "
        />
      </div>

      {/* Text styles */}
      <style jsx>{`
        .char {
          display: inline-block;
          color: rgb(40, 40, 40); /* darker start like first version */
          white-space: pre;
          transition:
            color 0.25s ease,
            text-shadow 0.25s ease,
            filter 0.25s ease;
        }

        /* LIGHT-UP EFFECT (from first version, refined) */
        .char.active {
          color: #ffffff;
          text-shadow:
            0 0 8px rgba(255, 255, 255, 0.35),
            0 0 18px rgba(255, 255, 255, 0.45),
            0 0 32px rgba(255, 255, 255, 0.25);
          filter: brightness(1.2);
        }

        .space {
          width: 0.35em;
        }
      `}</style>
    </div>
  );
};

export default TextReveal;
