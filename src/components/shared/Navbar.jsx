import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

const editorialLinks = [
  { label: 'The Collective', to: '/browse' },
  { label: 'For Creators', to: '/for-creators' },
  { label: 'Apply', to: '/apply' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isHomeTop = location.pathname === '/' && !scrolled;
  const ink = '#1a2744';
  const mutedInk = 'rgba(26,39,68,0.48)';

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${scrolled ? 'border-b' : ''}`}
      style={{
        background: isHomeTop ? 'transparent' : 'rgba(240,237,230,0.88)',
        backdropFilter: isHomeTop ? 'none' : 'blur(18px) saturate(1.08)',
        borderColor: 'rgba(26,39,68,0.1)',
      }}
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-14 h-[74px] grid grid-cols-3 items-center">
        <div className="hidden md:block text-[7px] font-body tracking-[0.42em] uppercase" style={{ color: mutedInk }}>
          NYC · Flash Editorial
        </div>

        <Link to="/" className="justify-self-start md:justify-self-center select-none group" aria-label="Stelli home">
          <span className="font-display font-semibold tracking-[-0.04em] transition-colors duration-700" style={{ fontSize: 26, color: ink }}>
            Stelli
          </span>
        </Link>

        <div className="hidden md:flex justify-self-end items-center gap-7">
          {editorialLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-[9px] font-body tracking-[0.18em] uppercase transition-colors duration-700"
              style={{ color: mutedInk }}
              onMouseEnter={e => e.currentTarget.style.color = ink}
              onMouseLeave={e => e.currentTarget.style.color = mutedInk}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/browse"
            className="text-[9px] font-body tracking-[0.18em] uppercase px-5 py-2.5 rounded-full font-semibold transition-all duration-700"
            style={{ background: ink, color: '#f0ede6', boxShadow: '0 18px 50px rgba(26,39,68,0.12)' }}
          >
            Book a Shoot
          </Link>
        </div>

        <button
          className="md:hidden justify-self-end p-2 -mr-2"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          aria-expanded={open}
          style={{ color: ink }}
        >
          <div className="space-y-1.5 w-5">
            <span className={`block h-px bg-current transition-all duration-500 ${open ? 'rotate-45 translate-y-[7px]' : ''}`} />
            <span className={`block h-px bg-current transition-all duration-500 ${open ? 'opacity-0' : ''}`} />
            <span className={`block h-px bg-current transition-all duration-500 ${open ? '-rotate-45 -translate-y-[7px]' : ''}`} />
          </div>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden border-y overflow-hidden"
            style={{ background: '#f0ede6', borderColor: 'rgba(26,39,68,0.1)' }}
          >
            <div className="px-6 py-8 space-y-6">
              <p className="text-[7px] font-body tracking-[0.42em] uppercase" style={{ color: 'rgba(26,39,68,0.32)' }}>
                NYC · Flash Editorial
              </p>
              {editorialLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="block font-display text-[34px] leading-none tracking-[-0.04em]"
                  style={{ color: '#1a2744' }}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/browse"
                onClick={() => setOpen(false)}
                className="inline-flex mt-3 text-[10px] font-body tracking-[0.18em] uppercase px-5 py-3 rounded-full font-semibold"
                style={{ background: '#1a2744', color: '#f0ede6' }}
              >
                Book a Shoot
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}