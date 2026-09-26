import React from 'react';
import Typewriter from '@/components/fancy/text/typewriter';

const MOMENTS = [
  'experience',
  'dance',
  'love',
  'be alive',
  'create things that make the world a better place',
];

const LONGEST = MOMENTS.reduce((a, b) => (b.length > a.length ? b : a));

export default function BornTo() {
  return (
    <section className="relative overflow-hidden border-b border-white/10">
      {/* soft lime glow behind the line */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(60% 70% at 15% 40%, hsl(var(--neon-lime) / 0.07), transparent 70%)' }}
      />

      <div className="relative max-w-[1500px] mx-auto px-5 md:px-10 py-24 md:py-36">
        <p className="label-mono text-[9px] text-white/35 mb-8">Why we shoot</p>

        {/* An invisible copy of the longest line holds the space, so the page
            never jumps while the words type out, at any screen width. */}
        <div
          className="grid font-display font-medium text-white leading-[1.05] max-w-5xl"
          style={{ fontSize: 'clamp(34px, 6vw, 88px)' }}
        >
          <p aria-hidden="true" className="invisible [grid-area:1/1]">
            {"We're born 🌞 to "}
            <span className="italic text-pretty">{LONGEST}</span>
            <span className="ml-1">_</span>
          </p>
          <p className="[grid-area:1/1]">
            <span>{"We're born 🌞 to "}</span>
            <Typewriter
              text={MOMENTS}
              speed={70}
              waitTime={1500}
              deleteSpeed={40}
              cursorChar="_"
              startOnVisible
              className="text-pretty italic"
              style={{ color: 'hsl(var(--neon-lime))' }}
              cursorClassName="ml-1 not-italic"
            />
          </p>
        </div>

        <p className="font-body text-[14px] text-white/50 max-w-md leading-relaxed mt-10">
          Every one of those deserves to be remembered. Stelli puts a creator behind the camera, so
          you can stay in the moment.
        </p>
      </div>
    </section>
  );
}
