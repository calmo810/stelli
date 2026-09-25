import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram } from 'lucide-react';
import StelliWordmark from './StelliWordmark';

const LINKS = [
  { to: '/creators', text: 'Browse creators' },
  { to: '/how-it-works', text: 'How it works' },
  { to: '/faq', text: 'FAQ' },
  { to: '/register?role=client', text: 'Sign up' },
  { to: '/register?role=creator', text: 'Shoot with Stelli' },
  { to: '/portal', text: 'Your portal' },
  { to: '/terms', text: 'Terms' },
  { to: '/privacy', text: 'Privacy' },
];

const PANEL = {
  borderRadius: 28,
  background: 'rgba(255,255,255,0.055)',
  border: '1px solid rgba(255,255,255,0.12)',
  backdropFilter: 'blur(24px) saturate(170%)',
  WebkitBackdropFilter: 'blur(24px) saturate(170%)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 30px 70px -34px rgba(0,0,0,0.95)',
};

const LINK = 'font-body text-[13px] text-white/60 hover:text-white transition-colors whitespace-nowrap';

/** The footer: one floating sheet of liquid glass, and very little else. */
export default function Footer() {
  return (
    <footer className="relative bg-ink px-4 md:px-10 pb-6 md:pb-8 pt-2 overflow-hidden">
      {/* the light the glass refracts */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div
          className="absolute rounded-full"
          style={{
            width: 460,
            height: 300,
            left: '-6%',
            bottom: '-55%',
            background: 'hsl(var(--neon-cyan) / 0.3)',
            filter: 'blur(90px)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 560,
            height: 320,
            right: '-4%',
            bottom: '-60%',
            background: 'hsl(var(--neon-lime) / 0.32)',
            filter: 'blur(90px)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 380,
            height: 240,
            left: '42%',
            bottom: '-58%',
            background: 'hsl(var(--neon-magenta) / 0.16)',
            filter: 'blur(100px)',
          }}
        />
      </div>

      <div className="relative max-w-[1500px] mx-auto" style={PANEL}>
        <div
          aria-hidden
          className="absolute left-6 right-6 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)' }}
        />

        <div className="px-6 md:px-10 py-9 md:py-11">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <StelliWordmark />
              <p className="mt-4 font-body text-[13px] leading-relaxed text-white/50 max-w-[230px]">
                You're the star — we just bring the camera.
              </p>
            </div>

            <nav className="flex flex-wrap gap-x-6 gap-y-3 md:justify-end md:max-w-[560px]">
              {LINKS.map((link) => (
                <Link key={link.text} to={link.to} className={LINK}>
                  {link.text}
                </Link>
              ))}
            </nav>
          </div>

          <div
            className="mt-9 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
          >
            <p className="label-mono text-[9px] text-white/30">© {new Date().getFullYear()} Stelli · Elon, NC</p>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <a href="mailto:hello@getstelli.com" className={LINK}>
                hello@getstelli.com
              </a>
              <a
                href="https://instagram.com/getstelli"
                target="_blank"
                rel="noreferrer"
                aria-label="Stelli on Instagram"
                className="text-white/55 hover:text-neon-lime transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <p className="font-hand text-[17px] text-neon-lime/75">一期一会 — one time, one meeting</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}