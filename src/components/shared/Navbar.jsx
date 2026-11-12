import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Menu } from 'lucide-react';
import MenuOverlay from './MenuOverlay';
import StelliWordmark from './StelliWordmark';

// inFlow: the bar scrolls away with the page instead of hovering over it. App
// screens (the creator workspace) use this so nothing is ever covered by it.
export default function Navbar({ inFlow = false }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 12);
      // Fade out on the way down, back in on the way up. Small moves are
      // ignored so the bar does not flicker while the page settles.
      if (Math.abs(y - last) > 6) {
        setHidden(y > last && y > 120);
        last = y;
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const isHome = location.pathname === '/';
  const solid = scrolled || !isHome;
  const faded = hidden && !inFlow && !open;

  return (
    <>
      <header
        className={`${inFlow ? 'relative' : 'fixed top-0'} inset-x-0 z-50 transition-[background-color,border-color,opacity,transform] duration-500 ease-out`}
        style={{
          paddingTop: 'var(--safe-top)',
          background: solid ? 'hsl(var(--ink) / 0.88)' : 'transparent',
          backdropFilter: solid ? 'blur(14px)' : 'none',
          borderBottom: solid ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
          opacity: faded ? 0 : 1,
          transform: faded ? 'translateY(-100%)' : 'none',
          pointerEvents: faded ? 'none' : 'auto',
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