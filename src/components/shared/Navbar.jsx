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
        className={`st-ink ${inFlow ? 'relative' : 'fixed top-0'} inset-x-0 z-50 transition-[background-color,border-color] duration-500`}
        style={{
          paddingTop: 'var(--safe-top)',
          background: solid ? 'hsl(var(--ink) / 0.86)' : 'transparent',
          backdropFilter: solid ? 'blur(16px) saturate(1.4)' : 'none',
          WebkitBackdropFilter: solid ? 'blur(16px) saturate(1.4)' : 'none',
          borderBottom: solid ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
        }}
      >
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-4 md:px-8">
          <Link to="/" aria-label="Stelli home" className="shrink-0 rounded-lg">
            <StelliWordmark />
          </Link>

          {/* With room to spare, the main doors sit in the bar itself. */}
          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `inline-flex min-h-[40px] items-center rounded-full px-4 text-[14px] font-semibold transition-colors ${
                    isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/[0.06] hover:text-white'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
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
