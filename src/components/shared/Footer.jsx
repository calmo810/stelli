import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram } from 'lucide-react';
import StelliWordmark from './StelliWordmark';
import IchigoPopup from './IchigoPopup';
import { Btn } from '@/components/system';

const COLUMNS = [
  {
    title: 'Book',
    links: [
      { to: '/creators', text: 'Browse creators' },
      { to: '/register?role=client', text: 'Sign up' },
      { to: '/faq', text: 'FAQ' },
    ],
  },
  {
    title: 'Shoot',
    links: [
      { to: '/for-creators', text: 'For creators' },
      { to: '/register?role=creator', text: 'Shoot with Stelli' },
    ],
  },
  {
    title: 'Account',
    links: [
      { to: '/portal', text: 'Your portal' },
      { to: '/messages', text: 'Messages' },
      { to: '/terms', text: 'Terms & Conditions' },
    ],
  },
];

const LINK = 'inline-flex min-h-[36px] items-center text-[14px] text-white/70 transition-colors hover:text-white';

/** The footer: one ink card with the wordmark, three short columns and the small print. */
export default function Footer() {
  return (
    <footer className="st-ink relative bg-ink px-3 pb-4 pt-2 sm:px-5 md:pb-8 lg:px-8">
      <div className="st-card st-card--ink st-card--lg relative mx-auto max-w-[1400px] overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -right-24 h-[380px] w-[380px] rounded-full opacity-60"
          style={{ background: 'radial-gradient(closest-side, hsl(var(--neon-lime) / 0.16), transparent)' }}
        />
        <div className="relative px-5 py-9 sm:px-8 md:px-12 md:py-12">
          <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
            <div className="max-w-[340px]">
              <StelliWordmark />
              <p className="mt-5 text-[22px] font-extrabold leading-[1.1] tracking-[-0.035em] text-white">
                You're the star.
                <span className="st-serif block text-neon-lime">We just bring the camera.</span>
              </p>
              <Btn to="/creators" variant="lime" arrow="end" className="mt-6">
                Find a creator
              </Btn>
            </div>

            <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3 lg:gap-x-16">
              {COLUMNS.map((column) => (
                <div key={column.title}>
                  <p className="st-kicker mb-2">{column.title}</p>
                  <ul>
                    {column.links.map((link) => (
                      <li key={link.text}>
                        <Link to={link.to} className={LINK}>
                          {link.text}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>

          <div className="mt-10 flex flex-col justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
            <p className="text-[12.5px] text-white/55">© {new Date().getFullYear()} Stelli · Elon, NC</p>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <a href="mailto:getstelli@gmail.com" className={LINK}>
                getstelli@gmail.com
              </a>
              <a
                href="https://instagram.com/getstelli"
                target="_blank"
                rel="noreferrer"
                aria-label="Stelli on Instagram (opens in a new tab)"
                className="grid h-10 w-10 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-neon-lime"
              >
                <Instagram className="h-[18px] w-[18px]" aria-hidden />
              </a>
              <IchigoPopup />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
