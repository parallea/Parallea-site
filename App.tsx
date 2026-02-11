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
                    <a href="https://www.linkedin.com/in/ayushkumarbhardwaj" className="linkedin-link"></a>
                </div>
                <div className="team-member">
                    <div className="team-photo director" style={{ backgroundImage: 'url(/images/profiles/manish.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                    <h3>Manish<br />Kumar</h3>
                    <p>Director, Head of Design</p>
                    <a href="https://www.linkedin.com/in/manishkr369" className="linkedin-link"></a>
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