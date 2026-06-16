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
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'border-b' : ''}`}
      style={{
        background: scrolled ? 'rgba(240,237,230,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderColor: 'rgba(26,39,68,0.08)',
      }}>
      <div className="max-w-[1400px] mx-auto px-8 md:px-14 h-16 flex items-center justify-between">
        {/* Wordmark */}
        <Link to="/" className="select-none">
          <span className="font-display font-semibold" style={{ fontSize: 22, color: '#1a2744' }}>Stelli</span>
        </Link>

        <div className="hidden md:flex items-center gap-9">
          <Link to="/browse" className="text-[10px] font-body tracking-[0.1em] uppercase transition-colors"
            style={{ color: 'rgba(26,39,68,0.4)' }}
            onMouseEnter={e => e.currentTarget.style.color = '#1a2744'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(26,39,68,0.4)'}>Browse</Link>
          <Link to="/for-creators" className="text-[10px] font-body tracking-[0.1em] uppercase transition-colors"
            style={{ color: 'rgba(26,39,68,0.4)' }}
            onMouseEnter={e => e.currentTarget.style.color = '#1a2744'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(26,39,68,0.4)'}>Creators</Link>
          <Link to="/how-it-works" className="text-[10px] font-body tracking-[0.1em] uppercase transition-colors"
            style={{ color: 'rgba(26,39,68,0.4)' }}
            onMouseEnter={e => e.currentTarget.style.color = '#1a2744'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(26,39,68,0.4)'}>How it works</Link>
        </div>

        <div className="hidden md:flex items-center gap-5">
          <Link to="/apply" className="text-[10px] font-body tracking-[0.06em] uppercase border-b pb-px transition-all"
            style={{ color: 'rgba(26,39,68,0.4)', borderColor: 'rgba(26,39,68,0.2)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#1a2744'; e.currentTarget.style.borderColor = '#1a2744'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(26,39,68,0.4)'; e.currentTarget.style.borderColor = 'rgba(26,39,68,0.2)'; }}>
            Join the collective
          </Link>
          <Link to="/browse" className="text-[10px] font-body tracking-[0.06em] uppercase px-5 py-2.5 rounded-full font-semibold transition-all"
            style={{ background: '#1a2744', color: '#f0ede6' }}
            onMouseEnter={e => e.currentTarget.style.background = '#253560'}
            onMouseLeave={e => e.currentTarget.style.background = '#1a2744'}>
            Book a shoot
          </Link>
        </div>

        <button className="md:hidden p-2" onClick={() => setOpen(!open)} style={{ color: 'rgba(26,39,68,0.6)' }}>
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
            className="md:hidden border-b overflow-hidden"
            style={{ background: '#f0ede6', borderColor: 'rgba(26,39,68,0.08)' }}>
            <div className="px-8 py-8 space-y-5">
              <Link to="/browse" onClick={() => setOpen(false)} className="block text-[12px] font-body tracking-[0.1em] uppercase" style={{ color: 'rgba(26,39,68,0.5)' }}>Browse</Link>
              <Link to="/for-creators" onClick={() => setOpen(false)} className="block text-[12px] font-body tracking-[0.1em] uppercase" style={{ color: 'rgba(26,39,68,0.5)' }}>Creators</Link>
              <Link to="/how-it-works" onClick={() => setOpen(false)} className="block text-[12px] font-body tracking-[0.1em] uppercase" style={{ color: 'rgba(26,39,68,0.5)' }}>How it works</Link>
              <div className="pt-4 border-t" style={{ borderColor: 'rgba(26,39,68,0.08)' }}>
                <Link to="/apply" onClick={() => setOpen(false)} className="block text-[12px] font-body tracking-[0.06em] uppercase" style={{ color: 'rgba(26,39,68,0.5)' }}>Join the collective</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}