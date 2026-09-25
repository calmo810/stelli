import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Surface from '@/components/shared/Surface';

const TILES = [
  {
    to: '/creators',
    word: 'I need photos.',
    line: 'Pick a creator. Send a date. Get a private quote.',
    cta: 'Find a creator',
  },
  {
    to: '/register?role=creator',
    word: 'I take photos.',
    line: 'Get booked, get paid on delivery, stop working out of DMs.',
    cta: 'Apply to join',
  },
];

/** Two doors, said plainly: one line each, one way through. */
export default function TwoDoors() {
  return (
    <section className="max-w-[1240px] mx-auto px-5 md:px-10 py-[88px] md:py-[120px]">
      <h2 className="text-center text-white/45" style={{ fontSize: 'clamp(18px, 2vw, 24px)' }}>
        Which one are you?
      </h2>

      <div className="mt-10 md:mt-14 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {TILES.map((tile) => (
          <Surface
            as={Link}
            key={tile.to}
            to={tile.to}
            hover
            className="group flex flex-col justify-between min-h-[220px] md:min-h-[280px] p-7 md:p-10"
          >
            <p
              className="font-display font-normal leading-[1.02] tracking-[-0.02em] text-white"
              style={{ fontSize: 'clamp(26px, 3.4vw, 44px)' }}
            >
              {tile.word}
            </p>

            <div className="mt-8 flex items-end justify-between gap-5">
              <p className="text-[14px] md:text-[15px] leading-relaxed text-white/45 max-w-[300px]">{tile.line}</p>
              <span className="shrink-0 inline-flex items-center gap-2 text-[14px] font-medium text-white/70 group-hover:text-neon-lime transition-colors">
                {tile.cta}
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Surface>
        ))}
      </div>
    </section>
  );
}