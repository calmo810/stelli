import React from 'react';
import { Link } from 'react-router-dom';

const TILES = [
  {
    to: '/creators',
    tone: 'neon-lime',
    image:
      'https://base44.app/api/apps/6a2c4e448e7fec52fb6d322a/files/mp/public/6a2c4e448e7fec52fb6d322a/8054474cf_IMG_8072.jpeg',
    word: 'I need photos.',
    line: 'Pick a creator. Get a private quote.',
    cta: 'Find a creator',
    delay: '0s',
  },
  {
    to: '/register?role=creator',
    tone: 'neon-cyan',
    image:
      'https://base44.app/api/apps/6a2c4e448e7fec52fb6d322a/files/mp/public/6a2c4e448e7fec52fb6d322a/d1bf8121f_IMG_7699.jpeg',
    word: 'I take photos.',
    line: 'Get booked. Get paid on delivery.',
    cta: 'Apply to join',
    delay: '1.3s',
  },
];

export default function TwoDoors() {
  return (
    <section className="max-w-[1040px] mx-auto px-3 md:px-10 py-[88px] md:py-[120px]">
      <h2
        className="text-center font-heading font-medium text-white/70 leading-[1.08] tracking-[-0.02em]"
        style={{ fontSize: 'clamp(22px, 2.6vw, 34px)' }}
      >
        Which one are you?
      </h2>

      <div className="mt-10 md:mt-8 grid grid-cols-2 gap-2 md:gap-3.5">
        {TILES.map((tile) => (
          <Link
            key={tile.to}
            to={tile.to}
            className="group relative isolate overflow-hidden flex flex-col items-center text-center min-h-[300px] md:min-h-[420px] px-[10px] py-7 md:px-6 md:py-11"
            style={{
              borderRadius: 'clamp(18px, 2vw, 24px)',
              background: `radial-gradient(80% 60% at 50% 100%, hsl(var(--${tile.tone}) / 0.35), hsl(var(--surface)) 70%)`,
            }}
          >
            <img
              src={tile.image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105"
              style={{ zIndex: -2, transition: 'transform 1.2s cubic-bezier(.16,1,.3,1)' }}
            />
            <span
              aria-hidden
              className="absolute inset-0"
              style={{
                zIndex: -1,
                background:
                  'linear-gradient(to bottom, hsl(var(--ink) / 0.88) 0%, hsl(var(--ink) / 0.35) 50%, hsl(var(--ink) / 0.1) 100%)',
              }}
            />

            <p
              className="stelli-shimmer font-heading font-medium"
              style={{
                '--shimmer-hi': `hsl(var(--${tile.tone}))`,
                animationDelay: tile.delay,
                fontSize: 'clamp(26px, 4vw, 56px)',
                letterSpacing: '-0.03em',
                lineHeight: 1.05,
                paddingBottom: '.06em',
              }}
            >
              {tile.word}
            </p>

            <p className="mt-2.5 text-[13px] md:text-[17px] leading-snug text-white/85 max-w-[300px]">{tile.line}</p>

            <span
              className="mt-4 md:mt-5 inline-flex items-center whitespace-nowrap font-medium text-[12px] md:text-[14px] px-3.5 py-2 md:px-[18px] md:py-[9px] transition-transform duration-300 group-hover:scale-[1.04]"
              style={{ background: `hsl(var(--${tile.tone}))`, color: 'hsl(var(--ink))', borderRadius: 980 }}
            >
              {tile.cta}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}