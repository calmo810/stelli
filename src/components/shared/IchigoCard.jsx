import React from 'react';

const CHARACTERS = [
  { char: '一', meaning: 'one' },
  { char: '期', meaning: 'time' },
  { char: '一', meaning: 'one' },
  { char: '会', meaning: 'meeting' },
];

/** The note the little dot opens: the four characters, then why it is a Stelli idea. */
export default function IchigoCard({ pointerRight = 28 }) {
  return (
    <div
      id="ichigo-note"
      className="ichigo-card relative w-[min(330px,calc(100vw-2.5rem))] rounded-[20px] border border-white/[0.14] bg-white/[0.055] p-5 backdrop-blur-2xl backdrop-saturate-150"
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 30px 70px -34px rgba(0,0,0,0.95)' }}
    >
      <span
        aria-hidden
        className="absolute -bottom-[7px] h-3.5 w-3.5 rotate-45 rounded-[2px] border-b border-r border-white/[0.14] bg-[rgba(255,255,255,0.09)]"
        style={{ right: pointerRight }}
      />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {CHARACTERS.map((item, index) => (
          <span
            key={`${item.char}-${index}`}
            className="ichigo-char group/char inline-flex items-baseline gap-1.5"
            style={{ animationDelay: `${index * 0.12}s` }}
          >
            <span className="font-display text-[24px] leading-none text-white transition-colors group-hover/char:text-neon-lime">
              {item.char}
            </span>
            <span className="text-[11px] text-white/40">{item.meaning}</span>
          </span>
        ))}
      </div>

      <p className="mt-4 font-display text-[16px] italic text-white/85">ichigo ichie</p>

      <p className="mt-2 text-[13px] leading-relaxed text-white/55">
        A Japanese idea from the tea ceremony: this moment will only happen once, so treasure it.
      </p>

      <p className="mt-3 text-[13px] leading-relaxed text-white/70">
        No night, no smile, no group photo ever happens the same way twice. Stelli puts a creator there to catch
        it, <span className="rounded-[3px] bg-neon-lime px-1 text-ink">so you can stay in it.</span>
      </p>
    </div>
  );
}