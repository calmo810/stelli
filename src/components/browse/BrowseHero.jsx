import React from 'react';

/**
 * The browse page's opening: one short title, then straight to the creators.
 * Kept small on purpose so the cards sit in the first screen.
 */
export default function BrowseHero() {
  return (
    <header>
      <h1
        className="font-semibold leading-[1.05] tracking-[-0.025em] text-white"
        style={{ fontSize: 'clamp(28px, 3.6vw, 44px)' }}
      >
        Creators at Elon
      </h1>
      <p className="mt-2 max-w-[520px] text-[14px] leading-relaxed text-white/45">
        Portraits, headshots, campus shoots and events. Tap anyone to see their work.
      </p>
    </header>
  );
}
