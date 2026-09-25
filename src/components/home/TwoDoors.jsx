import React from 'react';
import { Link } from 'react-router-dom';
import Surface from '@/components/shared/Surface';

// A soft highlighter stroke behind the lower half of a word.
const MARK = {
  backgroundImage: 'linear-gradient(hsl(var(--neon-lime) / 0.35), hsl(var(--neon-lime) / 0.35))',
  backgroundSize: '100% .34em',
  backgroundPosition: '0 74%',
  backgroundRepeat: 'no-repeat',
  padding: '0 .06em',
};

const TILES = [
  {
    to: '/creators',
    word: (
      <>
        I <span style={MARK}>need</span> photos.
      </>
    ),
    line: 'Pick a creator. Get a private quote.',
    cta: 'Find a creator',
    tint: 'linear-gradient(180deg, hsl(var(--surface)) 0%, hsl(var(--surface-2)) 45%, hsl(var(--neon-lime) / 0.13) 100%)',
    button: { background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))' },
  },
  {
    to: '/register?role=creator',
    word: 'I take photos.',
    line: 'Get booked. Get paid on delivery.',
    cta: 'Apply to join',
    tint: 'linear-gradient(180deg, hsl(var(--surface)) 0%, hsl(var(--surface-2)) 45%, hsl(var(--neon-cyan) / 0.13) 100%)',
    button: { background: 'hsl(var(--neon-cyan))', color: 'hsl(var(--ink))' },
  },
];

/** Two doors, said plainly: one line each, one way through. */
export default function TwoDoors() {
  return (
    <section className="max-w-[1240px] mx-auto px-5 md:px-10 py-[88px] md:py-[120px]">
      <h2
        className="text-center font-display text-white/50"
        style={{ fontSize: 'clamp(20px, 2.4vw, 28px)' }}
      >
        Which one are you?
      </h2>

      <div className="mt-10 md:mt-14 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {TILES.map((tile) => (
          <Surface
            as={Link}
            key={tile.to}
            to={tile.to}
            hover
            className="group flex flex-col justify-between min-h-[240px] md:min-h-[300px] p-7 md:p-10"
            style={{ background: tile.tint, borderRadius: 20 }}
          >
            <p
              className="font-display font-normal leading-[1.02] tracking-[-0.02em] text-white"
              style={{ fontSize: 'clamp(28px, 4vw, 46px)' }}
            >
              {tile.word}
            </p>

            <div className="mt-8">
              <p className="text-[14px] md:text-[15px] leading-relaxed text-white/45 max-w-[300px]">{tile.line}</p>
              <span
                className="mt-6 inline-flex items-center rounded-full px-6 py-3 text-[13px] font-semibold transition-transform duration-300 group-hover:-translate-y-0.5"
                style={tile.button}
              >
                {tile.cta}
              </span>
            </div>
          </Surface>
        ))}
      </div>
    </section>
  );
}