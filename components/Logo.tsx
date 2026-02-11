import React from 'react';

interface LogoProps {
  opacity: number;
  src?: string; // optional image source for the logo
  alt?: string;
  size?: number; // pixel size for the square container (defaults to 32)
}

const Logo: React.FC<LogoProps> = ({ opacity, src, alt = '/images/PARALLEA.svg', size = 32 }) => {
  const containerSize = `${size}px`;

  return (
    <div
      className="fixed top-6 left-6 md:top-8 md:left-10 z-50 pointer-events-none transition-opacity duration-100 mix-blend-difference"
      style={{ opacity }}
    >
      <div className="flex items-center gap-3">
        <div
          className="border border-white flex items-center justify-center relative backdrop-blur-md overflow-hidden"
          style={{ width: containerSize, height: containerSize }}
        >
          {src ? (
            <img src='/images/PARALLEA.svg' alt={alt} className="w-full h-full object-cover" />
          ) : (
            <div className="w-4 h-4 bg-white" />
          )}
        </div>
        <span className="font-['Rajdhani'] font-bold text-xl tracking-[0.2em] text-white">
          PARALLEA
        </span>
      </div>
    </div>
  );
};

export default Logo;