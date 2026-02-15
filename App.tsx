import React, { useLayoutEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Components
import IntroSection from './components/IntroSection';
import HeroAnimation from './components/HeroAnimation';
import TextReveal from './components/TextReveal';
import VerticalBookSlider from './components/VerticalBookSlider';
import GlobalEffects from './components/GlobalEffects';

gsap.registerPlugin(ScrollTrigger);

const App: React.FC = () => {
  
  useLayoutEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical', 
      smoothWheel: true,
      touchMultiplier: 2,
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(lenis.raf);
    };
  }, []);

  return (
    <main className="bg-black text-white w-full relative cursor-none">
      <GlobalEffects />
      
      {/* Intro Section - High Z-Index to fade out over content */}
      <div className="relative z-20">
        <IntroSection />
      </div>
      
      {/* Main Content - Lower Z-Index to be revealed */}
      <div className="relative z-10 bg-black -mt-[100vh]">
        <HeroAnimation />
        <TextReveal />
        <VerticalBookSlider />

<section className="team">
  <div className="container">
    <div className="team-grid">
        <div className="team-member">
            <div className="team-photo founder" style={{ backgroundImage: 'url(/images/profiles/ayush.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
            <h3>Ayush Kumar<br />Bhardwaj</h3>
            <p>Founder</p>
            <a href="https://www.linkedin.com/in/ayushkumarbhardwaj" className="linkedin-link" target="_blank" rel="noopener noreferrer">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
        </div>
        <div className="team-member">
            <div className="team-photo director" style={{ backgroundImage: 'url(/images/profiles/manish.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
            <h3>Manish<br />Kumar</h3>
            <p>Director, Head of Design</p>
            <a href="https://www.linkedin.com/in/manishkr369" className="linkedin-link" target="_blank" rel="noopener noreferrer">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
        </div>
    </div>
  </div>
</section>
        <footer className="py-20 md:py-32 flex flex-col items-center bg-black border-t border-white/20 px-4 relative overflow-hidden">
          {/* Footer Glow - White */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-1 bg-white blur-[100px] opacity-40"></div>
          
          <h1 className="text-5xl md:text-9xl tracking-[0.2em] font-bold font-['Rajdhani'] text-center break-all relative z-10 text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-800">
            PARALLEA
          </h1>
          <p className="mt-6 md:mt-8 text-sm md:text-xl text-zinc-500 uppercase tracking-widest dot-matrix text-center">
            COMING SOON
          </p>
          <div className="mt-12 md:mt-20 text-[10px] md:text-xs text-zinc-700 uppercase">
            © 2026 Parallea Tech Labs
          </div>
        </footer>
      </div>
    </main>
  );
};

export default App;
