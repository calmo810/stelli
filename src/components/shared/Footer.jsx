import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram } from 'lucide-react';

const COLUMNS = [
  {
    label: 'Stelli',
    links: [
      { to: '/creators', text: 'Browse creators' },
      { to: '/how-it-works', text: 'How it works' },
      { to: '/faq', text: 'FAQ' },
    ],
  },
  {
    label: 'Account',
    links: [
      { to: '/register?role=client', text: 'Sign up as a client' },
      { to: '/register?role=creator', text: 'Sign up as a creator' },
      { to: '/portal', text: 'Your portal' },
    ],
  },
  {
    label: 'Legal',
    links: [
      { to: '/terms', text: 'Terms & Conditions' },
      { to: '/privacy', text: 'Privacy Policy' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-ink">
      <div className="max-w-[1500px] mx-auto px-5 md:px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-14">
          <div>
            <p className="font-heading text-3xl font-semibold text-white mb-3">Stelli</p>
            <p className="font-body text-[12px] leading-relaxed text-white/40 max-w-[220px]">
              You're the star — we just bring the camera.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.label}>
              <p className="label-mono text-[9px] text-white/30 mb-5">{col.label}</p>
              <div className="space-y-3">
                {col.links.map((l) => (
                  <Link
                    key={l.text}
                    to={l.to}
                    className="block font-body text-[12px] text-white/45 hover:text-neon-lime transition-colors"
                  >
                    {l.text}
                  </Link>
                ))}
                {col.label === 'Stelli' && (
                  <a
                    href="mailto:hello@getstelli.com"
                    className="block font-body text-[12px] text-white/45 hover:text-neon-lime transition-colors"
                  >
                    hello@getstelli.com
                  </a>
                )}
                {col.label === 'Legal' && (
                  <a
                    href="https://instagram.com/getstelli"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 font-body text-[12px] text-white/45 hover:text-neon-lime transition-colors"
                  >
                    <Instagram className="w-3.5 h-3.5" /> Instagram
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="label-mono text-[9px] text-white/25">
            © {new Date().getFullYear()} Stelli · NYC · Elon, NC
          </p>
          <p className="font-hand text-[18px] text-neon-lime/70">一期一会 — one time, one meeting</p>
        </div>
      </div>
    </footer>
  );
}