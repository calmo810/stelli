import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Menu } from 'lucide-react';
import MenuOverlay from './MenuOverlay';
import StelliWordmark from './StelliWordmark';
import BackButton from './BackButton';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const isHome = location.pathname === '/';
  const solid = scrolled || !isHome;

  return (
    <>
      <header
        className="fixed top-0 inset-x-0 z-50 transition-colors duration-500"
        style={{
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

        {!isHome && (
          <div className="border-t border-white/[0.06]">
            <div className="mx-auto flex h-[52px] max-w-[1240px] items-center px-5 md:px-10">
              <BackButton />
            </div>
          </div>
        )}
      </header>

      <AnimatePresence>
        {open && <MenuOverlay onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
}