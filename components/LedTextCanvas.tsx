import React, { useRef, useEffect } from 'react';

interface LedTextCanvasProps {
  text: string;
  scrollProgress: number; // 0 to 1
}

interface Particle {
  x: number;
  y: number;
  z: number;
  originX: number;
  originY: number;
  originZ: number;
  size: number;
}

const LedTextCanvas: React.FC<LedTextCanvasProps> = ({ text, scrollProgress }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const targetRotationRef = useRef({ x: 0, y: 0 });
  const currentRotationRef = useRef({ x: 0, y: 0 });
  const configRef = useRef({
    spacing: 5,
    fontSize: 120,
    dimRadius: 180,
    focalLength: 600
  });

  useEffect(() => {
    const handleMouseMove = (clientX: number, clientY: number) => {
      mouseRef.current = { x: clientX, y: clientY };
      const nx = (clientX / window.innerWidth) * 2 - 1;
      const ny = (clientY / window.innerHeight) * 2 - 1;
      targetRotationRef.current = { x: -ny * 0.3, y: nx * 0.3 };
    };

    const onMouseMove = (e: MouseEvent) => handleMouseMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMouseMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  useEffect(() => {
    const initParticles = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      const isMobile = width < 768;
      
      let lines = [text];
      if (isMobile && text.includes(' ')) {
        lines = text.split(' ');
      }

      const maxCharCount = Math.max(...lines.map(l => l.length));
      
      const charAspectRatio = 0.6;
      const screenPadding = 0.9;
      
      let calculatedFontSize = (width * screenPadding) / (maxCharCount * charAspectRatio);
      
      const fontSize = isMobile 
        ? Math.min(90, Math.floor(calculatedFontSize)) 
        : Math.min(150, Math.floor(calculatedFontSize));
      
      const spacing = isMobile
        ? Math.max(2, Math.floor(fontSize / 30))
        : Math.max(3, Math.floor(fontSize / 25));

      configRef.current = {
        fontSize,
        spacing,
        dimRadius: isMobile ? 120 : 180,
        focalLength: isMobile ? 400 : 600
      };

      ctx.font = `bold ${fontSize}px "DotGothic16", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'white';
      
      const lineHeight = fontSize * 1.1;
      
      lines.forEach((line, i) => {
        const offset = (i - (lines.length - 1) / 2) * lineHeight;
        ctx.fillText(line, width / 2, height / 2 + offset);
      });

      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      const particles: Particle[] = [];

      for (let y = 0; y < height; y += spacing) {
        for (let x = 0; x < width; x += spacing) {
          const index = (y * width + x) * 4;
          if (data[index + 3] > 128) {
            const ox = x - width / 2;
            const oy = y - height / 2;
              particles.push({
              x: ox,
              y: oy,
              z: 0,
              originX: ox,
              originY: oy,
              originZ: 0,
                // size proportional to spacing for a tight, round dot
                size: Math.max(1.5, spacing * 0.9)
            });
          }
        }
      }
      particlesRef.current = particles;
    };

    initParticles();
    window.addEventListener('resize', initParticles);
    return () => window.removeEventListener('resize', initParticles);
  }, [text]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      const { width, height } = canvas;
      const cx = width / 2;
      const cy = height / 2;
      const { focalLength, dimRadius } = configRef.current;

      ctx.clearRect(0, 0, width, height);

      currentRotationRef.current.x += (targetRotationRef.current.x - currentRotationRef.current.x) * 0.1;
      currentRotationRef.current.y += (targetRotationRef.current.y - currentRotationRef.current.y) * 0.1;

      const rotX = currentRotationRef.current.x;
      const rotY = currentRotationRef.current.y;
      
      const zScrollShift = scrollProgress * 1500; 
      const opacityScroll = Math.max(0, 1 - scrollProgress * 2);

      if (opacityScroll <= 0.01) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const mouseX = mouseRef.current.x;
      const mouseY = mouseRef.current.y;
      const hasMouse = mouseX > -500;

      const particles = particlesRef.current;
      const len = particles.length;

      // WHITE THEME COLOR
      ctx.fillStyle = `rgba(255, 255, 255, ${opacityScroll})`;

      for (let i = 0; i < len; i++) {
        const p = particles[i];
        
        let x1 = p.originX * Math.cos(rotY) - p.originZ * Math.sin(rotY);
        let z1 = p.originZ * Math.cos(rotY) + p.originX * Math.sin(rotY);
        
        let y1 = p.originY * Math.cos(rotX) - z1 * Math.sin(rotX);
        let z2 = z1 * Math.cos(rotX) + p.originY * Math.sin(rotX);

        let zFinal = z2 - zScrollShift;
        
        const scale = focalLength / (focalLength + zFinal);

        if (scale < 0 || zFinal < -focalLength + 10) continue;

        const projectedX = cx + x1 * scale;
        const projectedY = cy + y1 * scale;

        // Default fill (bright)
        let alpha = opacityScroll;
        let r = 255, g = 255, b = 255;

        if (hasMouse) {
          const dx = projectedX - mouseX;
          const dy = projectedY - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const outer = dimRadius;
          const inner = dimRadius * 0.25;

          if (dist < outer) {
            // Inner core -> black
            if (dist < inner) {
              r = g = b = 0;
              alpha = 1;
            } else {
              // Surrounding ring -> grey gradient (nearer = darker)
              const t = (dist - inner) / (outer - inner);
              const grey = Math.round(80 + t * 120); // 80..200
              r = g = b = grey;
              alpha = 1;
            }
          }
        }

        const s = p.size * scale * 1.1;
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        // draw round pixel
        ctx.beginPath();
        ctx.arc(projectedX, projectedY, s / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [scrollProgress]);

  return <canvas ref={canvasRef} className="block w-full h-full" />;
};

export default LedTextCanvas;