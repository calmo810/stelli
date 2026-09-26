import React from 'react';
import FaqThread from '@/components/faq/FaqThread';

export default function Faq() {
  return (
    <section
      aria-labelledby="askTitle"
      className="min-h-screen bg-ink px-5 pb-24 pt-4 text-white md:px-10 md:pb-32 md:pt-6"
    >
      <div className="text-center">
        <h1
          id="askTitle"
          className="font-display font-medium leading-[1.08] tracking-[-0.02em]"
          style={{ fontSize: 'clamp(30px, 4.6vw, 64px)' }}
        >
          Questions?{' '}
          <span className="mt-[.14em] inline-block -rotate-[1.5deg]">
            <span className="inline rounded-md bg-neon-lime px-[.22em] pb-[.06em] pt-[.02em] italic text-ink">
              Ask away.
            </span>
          </span>
        </h1>
        <p className="mt-3 text-[15px] text-white/55">Tap a question.</p>
      </div>

      <FaqThread />

      <p className="mt-[26px] text-center text-[14px] text-white/50">
        Something else?{' '}
        <a
          href="mailto:hello@getstelli.com"
          className="font-medium text-neon-lime hover:underline hover:underline-offset-4"
        >
          Email hello@getstelli.com
        </a>
      </p>
    </section>
  );
}