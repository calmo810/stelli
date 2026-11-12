import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram } from 'lucide-react';
import StelliWordmark from './StelliWordmark';
import IchigoPopup from './IchigoPopup';

const LINKS = [
  { to: '/creators', text: 'Browse creators' },
  { to: '/faq', text: 'FAQ' },
  { to: '/register?role=client', text: 'Sign up' },
  { to: '/register?role=creator', text: 'Shoot with Stelli' },
  { to: '/portal', text: 'Your portal' },
  { to: '/terms', text: 'Terms & Conditions' },
];

const PANEL = {
  borderRadius: 28,
  // Solid surface + a static gradient tint. No backdrop-filter or blurred
  // glow behind it — that combination repainted on scroll and flickered.
  background:
    'radial-gradient(120% 140% at 85% 120%, hsl(var(--neon-lime) / 0.07), transparent 55%), #10162a',
  border: '1px solid rgba(255,255,255,0.09)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
};

const LINK = 'font-body text-[13px] text-white/60 hover:text-white transition-colors whitespace-nowrap';

/** The footer: one floating sheet of liquid glass, and very little else. */
export default function Footer() {
  return (
    <footer className="relative bg-ink px-4 md:px-10 pb-6 md:pb-8 pt-2">
      <div className="relative max-w-[1500px] mx-auto" style={PANEL}>
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
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="label-mono text-[9px] text-white/30">© {new Date().getFullYear()} Stelli · Elon, NC</p>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <a href="mailto:getstelli@gmail.com" className={LINK}>
                getstelli@gmail.com
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
              <IchigoPopup />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}