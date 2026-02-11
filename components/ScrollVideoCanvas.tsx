import React, { useRef, useEffect } from 'react';

interface ScrollVideoCanvasProps {
  progress: number;
}

const ScrollVideoCanvas: React.FC<ScrollVideoCanvasProps> = ({ progress }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
      
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const isMobile = w < 768;
      const numShapes = isMobile ? 25 : 40;

      // Black background
      ctx.fillStyle = 'rgb(143, 8, 8)';
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = 'lighter';

      const tunnelSpeed = progress * 2500; 

      for (let i = 0; i < numShapes; i++) {
          let z = (i * 150 - tunnelSpeed) % 3000;
          if (z < 10) z += 3000;

          const focalLength = isMobile ? 300 : 400;
          const scale = focalLength / z;

          if (z <= 10 || scale > 20) continue;

          const angle = i * 0.2 + progress * Math.PI * 4 + (z * 0.0005); 
          const radius = (isMobile ? 300 : 600);
          
          const x3d = Math.cos(angle) * radius;
          const y3d = Math.sin(angle) * radius;

          const x2d = cx + x3d * scale;
          const y2d = cy + y3d * scale;
          
          const size = (isMobile ? 60 : 120) * scale;
          
          const alpha = Math.min(1, Math.max(0, (3000 - z) / 1000)) * (scale * 0.8);

          ctx.save();
          ctx.translate(x2d, y2d);
          ctx.rotate(angle + progress);
          
          // B&W THEME: White/Gray
          const color = `hsla(0, 0%, 100%, ${alpha})`;
          
          ctx.strokeStyle = color;
          ctx.lineWidth = (isMobile ? 1 : 2) * scale;
          ctx.strokeRect(-size/2, -size/2, size, size);

          // Inner fill
          ctx.fillStyle = `hsla(0, 0%, 50%, ${alpha * 0.1})`;
          ctx.fillRect(-size/2, -size/2, size, size);
          
          ctx.restore();
      }

      ctx.globalCompositeOperation = 'source-over';

      if (progress > 0.05) {
          ctx.save();
          ctx.shadowBlur = 5;
          ctx.shadowColor = '#ffffff';
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, progress * 2)})`;
          ctx.font = isMobile ? '14px "DotGothic16"' : '18px "DotGothic16"';
          ctx.textAlign = 'center';
          ctx.fillText(`SYSTEM_ARCHIVE_LOADED [${Math.floor(progress * 100)}%]`, cx, h - 80);
          ctx.restore();
      }
    };

    let frameId = requestAnimationFrame(render);
    const loop = () => {
        render();
        frameId = requestAnimationFrame(loop);
    }
    loop();

    return () => cancelAnimationFrame(frameId);
  }, [progress]);

  return <canvas ref={canvasRef} className="w-full h-full object-cover" />;
};

export default ScrollVideoCanvas;