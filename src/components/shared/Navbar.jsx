import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Menu } from 'lucide-react';
import MenuOverlay from './MenuOverlay';
import StelliWordmark from './StelliWordmark';
import { Btn, IconBtn } from '@/components/system';
import useCurrentUser from '@/hooks/useCurrentUser';

const LINKS = [
  { to: '/creators', label: 'Browse creators' },
  { to: '/for-creators', label: 'For creators' },
  { to: '/faq', label: 'FAQ' },
];

// inFlow: the bar scrolls away with the page instead of hovering over it. App
// screens (the creator workspace) use this so nothing is ever covered by it.
export default function Navbar({ inFlow = false }) {
  const [open, setOpen] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const headerRef = useRef(null);
  const location = useLocation();
  const { user } = useCurrentUser();

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
        className={`st-ink ${inFlow ? 'relative' : 'fixed top-0'} inset-x-0 z-50 transition-[padding] duration-500`}
        style={{ paddingTop: 'var(--safe-top)' }}
      >
        <div
          className="relative mx-auto flex h-16 w-[calc(100%-16px)] max-w-[1400px] items-center justify-between gap-4 overflow-hidden rounded-[22px] px-4 md:w-[calc(100%-32px)] md:px-8"
          style={{
            background: solid
              ? 'linear-gradient(115deg, hsl(var(--ink) / .97), hsl(var(--surface) / .94))'
              : 'linear-gradient(115deg, hsl(var(--ink) / .80), hsl(var(--surface) / .52))',
            border: '1px solid rgba(255,255,255,.12)',
            boxShadow: solid
              ? '0 18px 38px -27px rgba(0,0,0,.92), inset 0 1px 0 rgba(255,255,255,.11)'
              : '0 16px 34px -24px rgba(0,0,0,.8), inset 0 1px 0 rgba(255,255,255,.16)',
            backdropFilter: 'blur(18px) saturate(1.35)',
            WebkitBackdropFilter: 'blur(18px) saturate(1.35)',
          }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-90"
            style={{
              background: 'radial-gradient(30% 150% at 0% 50%, hsl(var(--neon-lime) / .20), transparent 75%), radial-gradient(28% 150% at 100% 0%, hsl(var(--neon-cyan) / .17), transparent 72%)',
            }}
          />
          <Link to="/" aria-label="Stelli home" className="relative z-[1] shrink-0 rounded-lg transition-transform duration-300 hover:-rotate-2">
            <StelliWordmark />
          </Link>

          {/* With room to spare, the main doors sit in the bar itself. */}
          <nav aria-label="Primary" className="relative z-[1] hidden items-center gap-1 lg:flex">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `inline-flex min-h-[40px] items-center rounded-full px-4 text-[14px] font-semibold transition-[background-color,color,transform] ${
                    isActive
                      ? 'bg-neon-lime text-ink shadow-lg'
                      : 'text-fg-2 hover:bg-white/10 hover:text-fg hover:-translate-y-px'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="relative z-[1] flex items-center gap-2">
            {user ? (
              <>
                <Btn to="/messages" variant="ghost" size="sm" className="hidden md:inline-flex">
                  Messages
                </Btn>
                <Btn to="/portal" variant="lime" size="sm" className="hidden md:inline-flex">
                  Your portal
                </Btn>
              </>
            ) : (
              <>
                <Btn to="/login" variant="ghost" size="sm" className="hidden md:inline-flex">
                  Log in
                </Btn>
                <Btn to="/register" variant="lime" size="sm" className="hidden md:inline-flex">
                  Sign up
                </Btn>
              </>
            )}
            <IconBtn label="Open menu" aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen(true)}>
              <Menu />
            </IconBtn>
          </div>
        </div>
      </header>

      <AnimatePresence>{open && <MenuOverlay onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
}
