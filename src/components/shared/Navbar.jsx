import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-white/5' : 'bg-transparent'}`}>
      <div className="max-w-[1400px] mx-auto px-8 md:px-14 h-16 flex items-center justify-between">
        <Link to="/" className="select-none">
          <img
            src="https://media.base44.com/images/public/6a2c4e448e7fec52fb6d322a/b178af09a_Screenshot2026-06-14at105757PM.png"
            alt="Stelli"
            className="h-7 w-auto object-contain brightness-0 invert opacity-80 hover:opacity-100 transition-opacity"
          />
        </Link>

        <div className="hidden md:flex items-center gap-9">
          <Link to="/browse" className="text-[10px] font-body tracking-[0.1em] uppercase text-white/35 hover:text-white/70 transition-colors">Browse</Link>
          <Link to="/for-creators" className="text-[10px] font-body tracking-[0.1em] uppercase text-white/35 hover:text-white/70 transition-colors">Creators</Link>
          <Link to="/how-it-works" className="text-[10px] font-body tracking-[0.1em] uppercase text-white/35 hover:text-white/70 transition-colors">How it works</Link>
        </div>

        <div className="hidden md:flex items-center gap-5">
          <Link to="/apply" className="text-[10px] font-body tracking-[0.06em] uppercase text-white/35 border-b border-white/15 pb-px hover:text-white/60 hover:border-white/30 transition-all">
            Join the collective
          </Link>
          <Link to="/browse" className="text-[10px] font-body tracking-[0.06em] uppercase bg-white text-[#0a0a0a] px-5 py-2.5 rounded-full hover:bg-white/90 transition-all font-medium">
            Book a shoot
          </Link>
        </div>

        <button className="md:hidden p-2 text-white/50" onClick={() => setOpen(!open)}>
          <div className="space-y-1.5 w-5">
            <span className={`block h-px bg-current transition-all duration-300 ${open ? 'rotate-45 translate-y-[7px]' : ''}`} />
            <span className={`block h-px bg-current transition-all duration-300 ${open ? 'opacity-0' : ''}`} />
            <span className={`block h-px bg-current transition-all duration-300 ${open ? '-rotate-45 -translate-y-[7px]' : ''}`} />
          </div>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#0a0a0a] border-b border-white/5 overflow-hidden">
            <div className="px-8 py-8 space-y-5">
              <Link to="/browse" onClick={() => setOpen(false)} className="block text-[12px] font-body tracking-[0.1em] uppercase text-white/40">Browse</Link>
              <Link to="/for-creators" onClick={() => setOpen(false)} className="block text-[12px] font-body tracking-[0.1em] uppercase text-white/40">Creators</Link>
              <Link to="/how-it-works" onClick={() => setOpen(false)} className="block text-[12px] font-body tracking-[0.1em] uppercase text-white/40">How it works</Link>
              <div className="pt-4 border-t border-white/5">
                <Link to="/apply" onClick={() => setOpen(false)} className="block text-[12px] font-body tracking-[0.06em] uppercase text-white/60">Join the collective</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}