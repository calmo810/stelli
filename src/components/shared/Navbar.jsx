import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Menu } from 'lucide-react';
import MenuOverlay from './MenuOverlay';
import StelliWordmark from './StelliWordmark';

// inFlow: the bar scrolls away with the page instead of hovering over it. App
// screens (the creator workspace) use this so nothing is ever covered by it.
export default function Navbar({ inFlow = false }) {
  const [open, setOpen] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const headerRef = useRef(null);
  const location = useLocation();

  // Over the home hero the bar stays clear; it turns solid once the photo is
  // gone and only the solid page sits behind it.
  useEffect(() => {
    if (location.pathname !== '/') {
      setPastHero(false);
      return undefined;
    }
    const onScroll = () => {
      const hero = document.querySelector('[data-hero]');
      if (!hero) return;
      const barH = headerRef.current?.offsetHeight || 64;
      setPastHero(hero.getBoundingClientRect().bottom <= barH);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [location.pathname]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const isHome = location.pathname === '/';
  const solid = !isHome || pastHero;

  return (
    <>
      <header
        ref={headerRef}
        className={`${inFlow ? 'relative' : 'fixed top-0'} inset-x-0 z-50 transition-colors duration-500`}
        style={{
          paddingTop: 'var(--safe-top)',
          background: solid ? 'hsl(var(--ink) / 0.88)' : 'transparent',
          backdropFilter: solid ? 'blur(14px)' : 'none',
          borderBottom: solid ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
        }}
      >
        <div className="max-w-[1500px] mx-auto px-5 md:px-10 h-16 flex items-center justify-between">
          <Link to="/" aria-label="Stelli — home" className="shrink-0">
            <StelliWordmark />
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="text-white/80 hover:text-neon-lime transition-colors p-1"
            >
              <Menu className="w-7 h-7" />
            </button>
          </div>
        </div>

      </header>

      <AnimatePresence>
        {open && <MenuOverlay onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
}