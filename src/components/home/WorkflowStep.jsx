import React from 'react';
import { motion } from 'framer-motion';

const CARD_BASE =
  'group relative z-[1] overflow-hidden min-h-[310px] md:min-h-[390px] p-[30px] md:p-[42px] ' +
  'transition-[transform,border-color,box-shadow] duration-500 ease-out hover:-translate-y-2';
const CARD_NORMAL =
  CARD_BASE +
  ' border border-white/[0.09] hover:border-neon-lime/30 hover:shadow-[0_30px_70px_rgba(0,0,0,0.28)]';
const CARD_FINAL = CARD_BASE + ' border border-neon-lime bg-neon-lime';

const PANEL_BG =
  'radial-gradient(circle at var(--mx,50%) var(--my,50%), rgba(255,255,255,0.065), transparent 13rem), ' +
  'linear-gradient(145deg, rgba(255,255,255,0.025), transparent 45%), hsl(var(--surface))';

/** One card of the four-step workflow. The pointer sets where the glow sits. */
export default function WorkflowStep({ step, index }) {
  const track = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--mx', `${((event.clientX - rect.left) / rect.width) * 100}%`);
    event.currentTarget.style.setProperty('--my', `${((event.clientY - rect.top) / rect.height) * 100}%`);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.8, delay: index * 0.07, ease: [0.2, 0.8, 0.2, 1] }}
      onPointerMove={track}
      className={step.final ? CARD_FINAL : CARD_NORMAL}
      style={{ borderRadius: 30, background: step.final ? undefined : PANEL_BG }}
    >
      <span
        aria-hidden
        className="absolute w-[220px] h-[220px] rounded-full border transition-transform duration-700 ease-out -right-[110px] -bottom-[120px] group-hover:scale-150"
        style={{ borderColor: step.final ? 'rgba(8,13,28,0.18)' : 'rgba(196,248,42,0.12)' }}
      />

      <div
        className={`relative grid place-items-center w-[62px] h-[62px] rounded-full border font-heading italic text-[42px] leading-none transition-all duration-500 group-hover:-rotate-6 group-hover:scale-110 ${
          step.final
            ? 'border-ink/20 text-ink group-hover:bg-ink group-hover:text-neon-lime'
            : 'border-neon-lime/30 text-neon-lime group-hover:bg-neon-lime group-hover:text-ink'
        }`}
      >
        {step.number}
      </div>

      <p
        className={`absolute top-[33px] md:top-[45px] right-[30px] md:right-[42px] label-mono text-[10px] ${
          step.final ? 'text-ink/45' : 'text-white/25'
        }`}
      >
        {step.mini}
      </p>

      <div className="absolute left-[30px] right-[30px] md:left-[42px] md:right-[42px] bottom-[30px] md:bottom-[40px]">
        <h3
          className={`m-0 font-heading font-normal tracking-[-0.035em] ${step.final ? 'text-ink' : 'text-white'}`}
          style={{ fontSize: 'clamp(35px, 4vw, 54px)', lineHeight: 0.92 }}
        >
          {step.title}
        </h3>
        <p
          className={`mt-[13px] font-body text-[15px] leading-normal max-w-[310px] ${
            step.final ? 'text-ink/60' : 'text-white/45'
          }`}
        >
          {step.body}
        </p>
      </div>

      <span
        aria-hidden
        className={`absolute right-[27px] md:right-[38px] bottom-[27px] md:bottom-[38px] grid place-items-center w-12 h-12 rounded-full border transition-all duration-300 group-hover:-rotate-45 group-hover:bg-neon-lime group-hover:border-neon-lime group-hover:text-ink ${
          step.final ? 'border-ink/20 text-ink group-hover:bg-ink group-hover:text-neon-lime' : 'border-white/10 text-white/40'
        }`}
      >
        <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M7 17 17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </motion.article>
  );
}