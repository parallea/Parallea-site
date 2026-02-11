import React, { useEffect, useRef,useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const HeroAnimation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const [imagesLoaded, setImagesLoaded] = useState(0);
  
  const frameCount = 241;
  const images = useRef<HTMLImageElement[]>([]);
  const currentFrame = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to full viewport
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (images.current[currentFrame.current]?.complete) {
        drawFrame(currentFrame.current);
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Preload all frames
    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      const num = String(i).padStart(4, '0');
      img.src = `/images/frames/Parallea_header${num}.jpg`;

      img.onload = () => {
        setImagesLoaded(prev => {
          const newCount = prev + 1;
          if (newCount === 1) {
            drawFrame(0);
            console.log('✅ First frame loaded');
          }
          if (newCount === frameCount) {
            console.log(`✅ All ${frameCount} frames loaded!`);
          }
          return newCount;
        });
      };

      img.onerror = () => {
        console.error(`❌ Failed to load frame-${num}.jpg`);
      };

      images.current.push(img);
    }

    // Draw frame with COVER (no black bars!)
    const drawFrame = (index: number) => {
      const img = images.current[index];
      if (!img || !img.complete) return;

      const canvasRatio = canvas.width / canvas.height;
      const imageRatio = img.width / img.height;

      let drawWidth: number, drawHeight: number, offsetX: number, offsetY: number;

      // Cover logic - fills entire canvas
      if (canvasRatio > imageRatio) {
        drawWidth = canvas.width;
        drawHeight = canvas.width / imageRatio;
        offsetX = 0;
        offsetY = (canvas.height - drawHeight) / 2;
      } else {
        drawHeight = canvas.height;
        drawWidth = canvas.height * imageRatio;
        offsetX = (canvas.width - drawWidth) / 2;
        offsetY = 0;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    };

    // Scroll animation control: only run when sticky hero is fully visible (100% in viewport)
    let animation: any = null;
    let observer: IntersectionObserver | null = null;

    const startScrollAnimation = () => {
      if (animation) return;
      if (!containerRef.current) return;
      animation = gsap.to({}, {
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
          onUpdate: (self: any) => {
            const frameIndex = Math.floor(self.progress * (frameCount - 1));
            if (frameIndex !== currentFrame.current && images.current[frameIndex]?.complete) {
              currentFrame.current = frameIndex;
              drawFrame(frameIndex);
            }
          }
        }
      });
    };

    const stopScrollAnimation = () => {
      if (animation) {
        if (animation.scrollTrigger && typeof animation.scrollTrigger.kill === 'function') {
          animation.scrollTrigger.kill();
        }
        if (typeof animation.kill === 'function') animation.kill();
        animation = null;
      }
      // ensure first frame is shown while idle
      if (images.current[0]?.complete) {
        currentFrame.current = 0;
        drawFrame(0);
      }
    };

    // Observe the sticky element and start/stop animation when it's visible >= 30%
    if (stickyRef.current) {
      observer = new IntersectionObserver((entries) => {
        const e = entries[0];
        if (!e) return;
        if (e.intersectionRatio >= 0.3) {
          startScrollAnimation();
        } else {
          stopScrollAnimation();
        }
      }, { threshold: [0, 0.5, 1] });

      observer.observe(stickyRef.current);
    }

    // Ensure we show first frame initially if available
    if (images.current[0]?.complete) drawFrame(0);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (observer && stickyRef.current) observer.unobserve(stickyRef.current);
      if (observer) observer.disconnect();
      stopScrollAnimation();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: '450vh' }}>
      <div ref={stickyRef} className="sticky top-0 w-full h-screen overflow-hidden bg-black">
        <canvas 
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
        />
        {imagesLoaded < frameCount && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-sm font-mono">
            Loading frames... {imagesLoaded}/{frameCount}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroAnimation;
