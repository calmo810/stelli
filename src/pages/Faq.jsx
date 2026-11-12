import React from 'react';
import FaqThread from '@/components/faq/FaqThread';

export default function Faq() {
  return (
    <section
      aria-labelledby="askTitle"
      className="st-page st-ink overflow-x-clip px-4 pb-20 pt-4 md:px-10 md:pb-28 md:pt-6"
    >
      <div className="text-center">
        <h1
          id="askTitle"
          className="st-display !text-[clamp(34px,5vw,66px)]"
        >
          Questions?{' '}
          <span className="mt-[.14em] inline-block -rotate-[1.5deg]">
            <span className="st-serif inline rounded-xl bg-neon-lime px-[.22em] pb-[.06em] pt-[.02em] text-ink">
              Ask away.
            </span>
          </span>
        </h1>
        <p className="st-lede mx-auto mt-4">Tap a question or type your own. Stelli texts you back.</p>
      </div>

      <FaqThread />

      <p className="mt-2 text-center text-[14px] text-fg-3">
        Something else?{' '}
        <a
          href="mailto:getstelli@gmail.com"
          className="st-link"
        >
          Email getstelli@gmail.com
        </a>
      </p>
    </section>
  );
}