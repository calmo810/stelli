import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#F5F4EF]/95 backdrop-blur-sm border-b border-[#1a2a6c]/6' : 'bg-transparent'}`}>
      <div className="max-w-[1400px] mx-auto px-8 md:px-14 h-16 flex items-center justify-between">
        <Link to="/" className="select-none flex items-center">
          <img
            src="https://media.base44.com/images/public/6a2c4e448e7fec52fb6d322a/b178af09a_Screenshot2026-06-14at105757PM.png"
            alt="Stelli"
            className="h-8 w-auto object-contain"
          />
        </Link>

        <div className="hidden md:flex items-center gap-10">
          <Link to="/browse" className="text-[11px] font-body tracking-[0.08em] text-[#1a2a6c]/60 hover:text-[#1a2a6c] transition-colors uppercase">Browse</Link>
          <Link to="/for-creators" className="text-[11px] font-body tracking-[0.08em] text-[#1a2a6c]/60 hover:text-[#1a2a6c] transition-colors uppercase">Creators</Link>
          <Link to="/how-it-works" className="text-[11px] font-body tracking-[0.08em] text-[#1a2a6c]/60 hover:text-[#1a2a6c] transition-colors uppercase">How it works</Link>
        </div>

        <div className="hidden md:flex items-center gap-5">
          <Link to="/apply" className="text-[11px] font-body tracking-[0.06em] uppercase text-[#1a2a6c] border-b border-[#1a2a6c]/30 pb-px hover:border-[#1a2a6c] transition-all">
            Join the collective
          </Link>
          <Link to="/browse" className="text-[11px] font-body tracking-[0.06em] uppercase bg-[#1a2a6c] text-white px-5 py-2.5 rounded-full hover:bg-[#22337a] transition-all">
            Book a shoot
          </Link>
        </div>

        <button className="md:hidden p-2 text-[#1a2a6c]" onClick={() => setOpen(!open)}>
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
            className="md:hidden bg-[#F5F4EF] border-b border-[#1a2a6c]/8 overflow-hidden">
            <div className="px-8 py-8 space-y-5">
              <Link to="/browse" onClick={() => setOpen(false)} className="block text-[13px] font-body tracking-[0.1em] uppercase text-[#1a2a6c]/70">Browse</Link>
              <Link to="/for-creators" onClick={() => setOpen(false)} className="block text-[13px] font-body tracking-[0.1em] uppercase text-[#1a2a6c]/70">Creators</Link>
              <Link to="/how-it-works" onClick={() => setOpen(false)} className="block text-[13px] font-body tracking-[0.1em] uppercase text-[#1a2a6c]/70">How it works</Link>
              <div className="pt-4 border-t border-[#1a2a6c]/10">
                <Link to="/apply" onClick={() => setOpen(false)} className="block text-[13px] font-semibold font-body tracking-[0.06em] uppercase text-[#1a2a6c]">Join the collective</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}