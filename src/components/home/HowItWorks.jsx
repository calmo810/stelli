import React from 'react';
import { motion } from 'framer-motion';
import WorkflowStep from './WorkflowStep';

const STEPS = [
  {
    number: '1',
    mini: '01 / request',
    title: 'Request.',
    body: "Pick a creator and a date. Tell them what you're making.",
  },
  {
    number: '2',
    mini: '02 / quote',
    title: 'Quote.',
    body: 'They send you a private price. No mystery. No marketplace circus.',
  },
  {
    number: '3',
    mini: '03 / shoot',
    title: 'Shoot.',
    body: 'Show up. They handle the rest. Be in the moment for once.',
  },
  {
    number: '4',
    mini: '04 / delivered',
    title: 'Photos.',
    body: 'In your inbox a few days later. Ready to post, print, frame, repeat.',
    final: true,
  },
];

const RISE = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.12 },
  transition: { duration: 0.8, ease: [0.2, 0.8, 0.2, 1] },
};

export default function HowItWorks() {
  return (
    <section className="relative w-[calc(100%-28px)] md:w-[min(1380px,calc(100%-48px))] mx-auto py-[60px] md:py-[98px]">
      <motion.div
        {...RISE}
        className="relative flex items-center justify-center gap-3 mb-5 label-mono text-[10px] text-white/45"
      >
        <span className="w-[6px] h-[6px] rounded-full bg-neon-lime shadow-[0_0_18px_hsl(var(--neon-lime))]" />
        <span>the Stelli way</span>
        <span className="w-[6px] h-[6px] rounded-full bg-neon-lime shadow-[0_0_18px_hsl(var(--neon-lime))]" />
      </motion.div>

      <motion.h2
        {...RISE}
        className="relative max-w-[760px] mx-auto text-center font-display font-normal text-white"
        style={{ fontSize: 'clamp(36px, 6vw, 84px)', lineHeight: 0.9, letterSpacing: '-0.03em' }}
      >
        How it{' '}
        <span
          className="relative inline-block italic text-ink px-[.24em] pb-[.07em] ml-[.08em]"
          style={{ transform: 'rotate(-1.7deg)' }}
        >
          <span
            aria-hidden
            className="absolute -z-10"
            style={{
              inset: '-.02em -.08em -.02em',
              background: 'hsl(var(--neon-lime))',
              borderRadius: '.14em .11em .16em .08em',
              transform: 'skewX(-4deg)',
            }}
          />
          works.
        </span>
      </motion.h2>

      <motion.p
        {...RISE}
        className="relative max-w-[470px] mx-auto mt-6 text-center font-body text-[14px] md:text-[15px] leading-[1.6] text-white/45"
      >
        No chasing. No awkward back-and-forth. No wondering what happens next. Pick your person, show up, and let
        Stelli handle the rest.
      </motion.p>

      <div className="relative mt-[41px] md:mt-[58px] grid grid-cols-1 md:grid-cols-2 gap-2.5 md:gap-[13px]">
        <div
          aria-hidden
          className="hidden md:block absolute left-1/2 top-[34px] bottom-[34px] w-px bg-neon-lime/45 z-0"
        />
        <div
          aria-hidden
          className="hidden md:block absolute top-1/2 left-[34px] right-[34px] h-px bg-neon-lime/45 z-0"
        />
        {STEPS.map((step, i) => (
          <WorkflowStep key={step.mini} step={step} index={i} />
        ))}
      </div>

      <motion.div
        {...RISE}
        className="relative flex items-center justify-center gap-3 mt-7 label-mono text-[10px] text-white/30 text-center"
      >
        <span className="w-[28px] h-px bg-white/10" />
        <span>you bring the moment · we bring the camera</span>
        <span className="w-[28px] h-px bg-white/10" />
      </motion.div>
    </section>
  );
}