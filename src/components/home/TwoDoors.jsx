import React from 'react';
import { Link } from 'react-router-dom';

const TILES = [
  {
    to: '/creators',
    tone: 'neon-lime',
    word: 'I need photos.',
    line: 'Pick a creator. Get a private quote.',
    cta: 'Find a creator',
    delay: '0s',
  },
  {
    to: '/register?role=creator',
    tone: 'neon-cyan',
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
            className="group relative isolate overflow-hidden flex flex-col items-center justify-center text-center min-h-[260px] md:min-h-[360px] px-[10px] py-9 md:px-6 md:py-12 transition-transform duration-500 hover:-translate-y-1"
            style={{
              borderRadius: 'clamp(18px, 2vw, 24px)',
              background: `radial-gradient(120% 85% at 50% 118%, hsl(var(--${tile.tone}) / 0.5), hsl(var(--surface)) 68%)`,
            }}
          >
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