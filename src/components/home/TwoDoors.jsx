import React from 'react';
import { Link } from 'react-router-dom';

const TILES = [
  {
    to: '/creators',
    word: 'I need photos.',
    line: 'Pick a creator. Get a private quote.',
    cta: 'Find a creator',
    hi: 'hsl(var(--neon-lime))',
    glow: 'hsl(var(--neon-lime) / 0.35)',
    delay: '0s',
  },
  {
    to: '/register?role=creator',
    word: 'I take photos.',
    line: 'Get booked. Get paid on delivery.',
    cta: 'Apply to join',
    hi: 'hsl(var(--neon-cyan))',
    glow: 'hsl(var(--neon-cyan) / 0.35)',
    delay: '1.3s',
  },
];

/** Two doors: a lime tile and a cyan tile, lit from the bottom edge. */
export default function TwoDoors() {
  return (
    <section className="max-w-[1040px] mx-auto px-3 sm:px-5 md:px-10 py-[40px] md:py-[56px]">
      <h2
        className="text-center font-display font-medium leading-[1.08] tracking-[-0.02em] text-white/70"
        style={{ fontSize: 'clamp(22px, 2.6vw, 34px)' }}
      >
        Which one are you?
      </h2>

      <div className="mt-6 md:mt-7 grid grid-cols-2 gap-2 md:gap-[14px]">
        {TILES.map((tile) => (
          <Link
            key={tile.to}
            to={tile.to}
            className="group flex flex-col items-center text-center overflow-hidden rounded-[18px] md:rounded-3xl px-2.5 pt-6 pb-6 md:px-6 md:pt-8 md:pb-8 min-h-[210px] md:min-h-[290px] transition-transform duration-300 hover:-translate-y-1"
            style={{ background: `radial-gradient(80% 60% at 50% 100%, ${tile.glow}, hsl(var(--surface)) 70%)` }}
          >
            <p
              className="stelli-shimmer font-display font-medium tracking-[-0.03em] leading-[1.05] pb-[.06em]"
              style={{
                fontSize: 'clamp(26px, 4vw, 56px)',
                '--shimmer-hi': tile.hi,
                '--shimmer-spread': '30px',
                animationDelay: tile.delay,
              }}
            >
              {tile.word}
            </p>

            <p
              className="mt-2.5 text-white/85 max-w-[300px] leading-[1.4]"
              style={{ fontSize: 'clamp(13px, 1.3vw, 17px)' }}
            >
              {tile.line}
            </p>

            <span
              className="mt-4 inline-flex items-center rounded-[980px] font-medium text-ink whitespace-nowrap text-[12px] px-3.5 py-2 md:text-[14px] md:px-[18px] md:py-[9px] transition-transform duration-300 group-hover:scale-[1.04]"
              style={{ background: tile.hi }}
            >
              {tile.cta}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}