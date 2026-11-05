import React from 'react';
import { ArrowDown } from 'lucide-react';
import { cssUrl } from '@/lib/creatorBrowse';
import { displayNameOf } from '@/lib/profilePresets';

const EASE_OUT = 'cubic-bezier(.2,.7,.2,1)';

const LINE = {
  display: 'block',
  overflow: 'hidden',
  paddingRight: '.04em',
  paddingBottom: '.12em',
  marginBottom: '-.12em',
};

const RISE = (delay) => ({
  display: 'inline-block',
  transform: 'translateY(115%)',
  animation: `stelliRise 1.05s ${EASE_OUT} ${delay}s forwards`,
});

const FADE = (delay) => ({
  opacity: 0,
  animation: `stelliFade .9s ${EASE_OUT} ${delay}s forwards`,
});

/**
 * The browse page's opening. Same shape as SectionHeader (quiet eyebrow, big
 * statement, short line under it) so it reads like every other page, with the
 * line-rise entrance and one lime word on top.
 */
export default function BrowseHero({ creators = [], onFind }) {
  // Each creator's own profile photo, never a portfolio shot. No photo yet: their initial.
  const faces = creators.slice(0, 5).map((creator) => ({
    id: creator.id,
    photo: creator.profile_image || '',
    initial: (displayNameOf(creator) || '?').trim().charAt(0).toUpperCase(),
  }));

  return (
    <header>
      <p className="label-mono text-[10px] text-white/40 mb-5" style={FADE(0)}>
        Browse creators · Elon
      </p>

      <h1
        className="font-semibold leading-[0.98] tracking-[-0.02em] text-white"
        style={{ fontSize: 'clamp(38px, 7vw, 84px)' }}
      >
        <span style={LINE}>
          <span style={RISE(0)}>Creators worth</span>
        </span>
        <span style={LINE}>
          <span style={RISE(0.12)}>
            putting in your{' '}
            <span className="font-display font-medium italic text-neon-lime">calendar.</span>
          </span>
        </span>
      </h1>

      <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <p className="max-w-[460px] text-[15px] leading-relaxed text-white/45" style={FADE(0.6)}>
          Senior portraits, headshots, campus shoots and events, from creators you can book safely
          through Stelli.
        </p>

        {faces.length > 0 && (
          <div className="flex items-center gap-4" style={FADE(0.8)}>
            <div className="flex">
              {faces.map((face, i) => (
                <span
                  key={face.id}
                  aria-hidden="true"
                  className="grid h-[38px] w-[38px] place-items-center rounded-full border-2 border-ink bg-surface-2 bg-cover bg-center text-[14px] font-semibold text-white/70 first:ml-0 -ml-3"
                  style={{
                    backgroundImage: face.photo ? cssUrl(face.photo) : undefined,
                    transform: 'scale(0)',
                    animation: `stelliPop .5s cubic-bezier(.34,1.56,.64,1) ${0.9 + i * 0.08}s forwards`,
                  }}
                >
                  {!face.photo && face.initial}
                </span>
              ))}
            </div>
            <p className="text-[13px] leading-[1.35] text-white/45">
              <b className="block font-semibold text-white">
                {creators.length} creator{creators.length === 1 ? '' : 's'}
              </b>
              booking at Elon now
            </p>
          </div>
        )}
      </div>

      <div className="mt-10" style={FADE(1)}>
        <button
          type="button"
          onClick={onFind}
          className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 label-mono text-[11px] font-semibold transition-transform duration-300 hover:-translate-y-0.5"
          style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))' }}
        >
          Find your creator
          <ArrowDown className="h-4 w-4" style={{ animation: 'stelliNudge 1.6s infinite' }} />
        </button>
      </div>
    </header>
  );
}
