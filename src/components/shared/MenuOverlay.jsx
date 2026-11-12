import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, LogOut, X } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import useCurrentUser from '@/hooks/useCurrentUser';
import { LOGO_URL } from '@/components/shared/StelliWordmark';
import { IconBtn } from '@/components/system';

const SIGNED_OUT = [
  { label: 'Sign up as a client', to: '/register?role=client' },
  { label: 'Sign up as a creator', to: '/register?role=creator' },
  { label: 'Log in', to: '/login' },
];

const SIGNED_IN = [
  { label: 'Your portal', to: '/portal' },
  { label: 'Messages', to: '/messages' },
  { label: 'Account', to: '/account-settings' },
];

const EVERYONE = [
  { label: 'Browse creators', to: '/creators' },
  { label: 'For creators', to: '/for-creators' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Terms & Conditions', to: '/terms' },
];

/** The whole site on one screen: every door, in big type. */
export default function MenuOverlay({ onClose }) {
  const { logout } = useAuth();
  // Read from the shared account, so the menu is right the moment someone
  // signs in or out without a page reload.
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const panel = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    closeRef.current?.focus();
    const onKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      // Keep the Tab key inside the menu while it is open.
      if (event.key !== 'Tab' || !panel.current) return;
      const items = [...panel.current.querySelectorAll('a[href], button:not([disabled])')];
      if (!items.length) return;
      const [first, last] = [items[0], items[items.length - 1]];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [onClose]);

  const go = (to) => {
    onClose();
    navigate(to);
  };

  const handleLogout = () => {
    onClose();
    logout('/');
  };

  const links = [...(user ? SIGNED_IN : SIGNED_OUT), ...EVERYONE];
  const enter = (i) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.04 + i * 0.035 },
        };

  return (
    <motion.div
      ref={panel}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="st-ink fixed inset-0 z-[60] overflow-y-auto bg-ink/[0.97] backdrop-blur-xl"
      style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}
    >
      <div className="mx-auto flex min-h-full max-w-[1400px] flex-col px-4 md:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" onClick={onClose} aria-label="Stelli home" className="block rounded-lg">
            <img src={LOGO_URL} alt="Stelli" className="h-[34px] w-auto" />
          </Link>
          <IconBtn ref={closeRef} label="Close menu" onClick={onClose}>
            <X />
          </IconBtn>
        </div>

        <nav aria-label="Menu" className="flex flex-1 flex-col justify-center py-8">
          <ul className="max-w-4xl">
            {links.map((link, i) => (
              <motion.li key={link.to} {...enter(i)}>
                <button
                  type="button"
                  onClick={() => go(link.to)}
                  className="group flex w-full items-center gap-3 rounded-2xl py-1.5 text-left font-heading font-extrabold tracking-[-0.04em] text-white/90 transition-colors duration-200 hover:text-neon-lime"
                  style={{ fontSize: 'clamp(30px, 5.2vw, 60px)', lineHeight: 1.08 }}
                >
                  {link.label}
                  <ArrowUpRight
                    aria-hidden
                    className="h-[0.55em] w-[0.55em] -translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                    strokeWidth={2.6}
                  />
                </button>
              </motion.li>
            ))}
            {user && (
              <motion.li {...enter(links.length)}>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-4 inline-flex min-h-[48px] items-center gap-2.5 rounded-full border border-white/20 px-5 text-[15px] font-semibold text-white/75 transition-colors hover:border-white/50 hover:text-white"
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                  Log out
                </button>
              </motion.li>
            )}
          </ul>
        </nav>

        <div className="border-t border-white/10 py-5">
          <p className="st-kicker" lang="ja">
            一期一会 <span lang="en">· one time, one meeting</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
