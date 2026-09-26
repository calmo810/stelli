import React from 'react';
import { ArrowDown } from 'lucide-react';
import { cardImages, cssUrl } from '@/lib/creatorBrowse';

const EASE_OUT = 'cubic-bezier(.2,.7,.2,1)';

const LINE = {
  display: 'block',
  overflow: 'hidden',
  paddingRight: '.04em',
  paddingBottom: '.16em',
  marginBottom: '-.16em',
};

const RISE = (delay) => ({
  display: 'inline-block',
  transform: 'translateY(115%)',
  animation: `stelliRise 1.05s ${EASE_OUT} ${delay}s forwards`,
});

/** The browse page's opening: one long line, one lime word, one way down. */
export default function BrowseHero({ creators = [], onFind }) {
  const faces = creators.slice(0, 5).map((creator) => cardImages(creator)[0]).filter(Boolean);

  return (
    <header className="pt-2 md:pt-4">
      <div
        className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.02] px-3.5 py-2 label-mono text-[11px] text-white/50"
        style={{ opacity: 0, animation: `stelliFade .8s ${EASE_OUT} forwards` }}
      >
        <span
          className="h-[7px] w-[7px] rounded-full bg-neon-lime"
          style={{ animation: 'stelliPing 2s infinite' }}
        />
        Browse creators · Elon
      </div>

      <h1
        className="mt-6 font-heading font-bold leading-[0.98] tracking-[-0.045em] text-white"
        style={{ fontSize: 'clamp(46px, 8.2vw, 116px)' }}
      >
        <span style={LINE}>
          <span style={RISE(0)}>Creators worth</span>
        </span>
        <span style={LINE}>
          <span style={RISE(0.12)}>putting in your</span>
        </span>
        <span style={{ ...LINE, paddingBottom: '.42em', marginBottom: '-.2em' }}>
          <span style={RISE(0.24)}>
            <span className="relative inline-block pr-[.04em] font-display italic tracking-[-0.01em] text-neon-lime">
              calendar.
              <svg
                viewBox="0 0 200 20"
                preserveAspectRatio="none"
                aria-hidden="true"
                className="absolute left-[-1%] right-[-3%] bottom-[-.12em] h-[.2em] w-[104%] overflow-visible"
                style={{
                  clipPath: 'inset(-60% 100% -60% -4%)',
                  animation: 'stelliWipe .9s cubic-bezier(.6,0,.2,1) 1.05s forwards',
                }}
              >
                <path
                  d="M3 15 C 45 5, 110 3, 197 9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </span>
          </span>
        </span>
      </h1>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-8">
        <p
          className="max-w-[42ch] text-[16px] leading-[1.55] text-white/45 md:text-[19px]"
          style={{ opacity: 0, animation: `stelliFade .9s ${EASE_OUT} .7s forwards` }}
        >
          Senior portraits, headshots, campus shoots and events, from creators you can book safely
          through Stelli.
        </p>

        {faces.length > 0 && (
          <div
            className="flex items-center gap-4"
            style={{ opacity: 0, animation: `stelliFade .9s ${EASE_OUT} .9s forwards` }}
          >
            <div className="flex">
              {faces.map((url, i) => (
                <span
                  key={url}
                  className="h-[42px] w-[42px] rounded-full border-2 border-ink bg-surface-2 bg-cover bg-center first:ml-0 -ml-3"
                  style={{
                    backgroundImage: cssUrl(url),
                    transform: 'scale(0)',
                    animation: `stelliPop .5s cubic-bezier(.34,1.56,.64,1) ${1 + i * 0.08}s forwards`,
                  }}
                />
              ))}
            </div>
            <p className="text-[14px] leading-[1.35] text-white/45">
              <b className="block font-semibold text-white">{creators.length} creators</b>
              booking at Elon now
            </p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onFind}
        className="mt-9 inline-flex items-center gap-2.5 rounded-full bg-neon-lime px-[22px] py-3.5 text-[15px] font-semibold text-ink transition-transform duration-300 hover:-translate-y-0.5"
        style={{ opacity: 0, animation: `stelliFade .9s ${EASE_OUT} 1.1s forwards` }}
      >
        Find your creator
        <ArrowDown className="h-4 w-4" style={{ animation: 'stelliNudge 1.6s infinite' }} />
      </button>
    </header>
  );
}