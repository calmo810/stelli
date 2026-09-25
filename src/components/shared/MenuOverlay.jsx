import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const PUBLIC_LINKS = [
  { label: 'Sign up as a Client', to: '/register?role=client', accent: 'lime' },
  { label: 'Sign up as a Creator', to: '/register?role=creator', accent: 'cyan' },
  { label: 'Log in', to: '/login' },
];

const SHARED_LINKS = [
  { label: 'Browse creators', to: '/creators' },
  { label: 'How it works', to: '/how-it-works' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Terms & Conditions', to: '/terms' },
  { label: 'Privacy Policy', to: '/privacy' },
];

export default function MenuOverlay({ onClose }) {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
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

  const links = isAuthenticated
    ? [{ label: 'Portal', to: '/portal', accent: 'lime' }, ...SHARED_LINKS]
    : [...PUBLIC_LINKS, ...SHARED_LINKS];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed inset-0 z-[60] bg-ink/98 backdrop-blur-xl overflow-y-auto"
    >
      <div className="min-h-full flex flex-col px-6 md:px-14 py-6">
        <div className="flex items-center justify-between">
          <Link to="/" onClick={onClose} className="font-heading text-2xl font-semibold text-white">Stelli</Link>
          <button onClick={onClose} aria-label="Close menu" className="text-white/70 hover:text-neon-lime transition-colors">
            <X className="w-7 h-7" />
          </button>
        </div>

        <nav className="flex-1 flex flex-col justify-center py-10 max-w-4xl">
          {links.map((link, i) => (
            <motion.div
              key={link.to}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: 0.05 + i * 0.04 }}
            >
              <button
                onClick={() => go(link.to)}
                className="group block w-full text-left font-heading font-semibold text-white transition-colors duration-300 hover:text-neon-lime py-2"
                style={{ fontSize: 'clamp(26px, 4.4vw, 52px)', lineHeight: 1.15 }}
              >
                {link.label}
              </button>
            </motion.div>
          ))}
          {isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: 0.05 + links.length * 0.04 }}
            >
              <button
                onClick={handleLogout}
                className="group flex items-center gap-3 w-full text-left font-heading font-semibold text-white/75 transition-colors duration-300 hover:text-neon-lime py-2"
                style={{ fontSize: 'clamp(26px, 4.4vw, 52px)', lineHeight: 1.15 }}
              >
                <LogOut className="w-7 h-7" />
                Log out
              </button>
            </motion.div>
          )}
        </nav>

        <div className="pt-6 border-t border-white/10">
          <p className="label-mono text-[9px] text-white/25">一期一会 — one time, one meeting</p>
        </div>
      </div>
    </motion.div>
  );
}