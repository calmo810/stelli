import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LOGO_URL } from '@/components/shared/StelliWordmark';
import ConstellationBridge from '@/components/home/ConstellationBridge';

/* Homepage "how it works" section: the headline, then the constellation bridge
   (each DM booking problem carried by a shooting star to the Stelli fix), then the CTA.
   Background is transparent so it sits on the page's ink navy with no seams. */

const RISE = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.12 },
  transition: { duration: 0.8, ease: [0.2, 0.8, 0.2, 1] },
};

export default function CaseStudy() {
  return (
    <section
      id="how-it-works"
      className="cs relative w-[calc(100%-28px)] md:w-[min(1380px,calc(100%-48px))] mx-auto py-[60px] md:py-[100px]"
    >
      {/* Header */}
      <motion.div {...RISE} className="flex items-center justify-center gap-3 mb-5 label-mono text-[13px] text-white/60">
        <span className="w-[8px] h-[8px] rounded-full bg-neon-lime shadow-[0_0_18px_hsl(var(--neon-lime))]" />
        <span className="inline-flex items-center gap-[.7em]">
          <span>the</span>
          <img src={LOGO_URL} alt="Stelli" className="h-[29px] w-auto -mt-[5px]" />
          <span>way</span>
        </span>
        <span className="w-[8px] h-[8px] rounded-full bg-neon-lime shadow-[0_0_18px_hsl(var(--neon-lime))]" />
      </motion.div>

      <motion.h2
        {...RISE}
        className="max-w-[980px] mx-auto text-center font-display font-normal text-white"
        style={{ fontSize: 'clamp(36px, 6.4vw, 88px)', lineHeight: 0.95, letterSpacing: '-0.03em' }}
      >
        From <em className="relative z-10 mr-[.14em]" style={{ color: '#7a7e88' }}>“wait, are you free?”</em>
        <br />
        to{' '}
        <span className="relative inline-block italic text-ink px-[.26em] pb-[.07em] ml-[.34em]" style={{ transform: 'rotate(-1.7deg)' }}>
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
          it’s handled.
        </span>
      </motion.h2>

      {/* The constellation bridge: problem → fix */}
      <motion.div {...RISE} className="max-w-[1240px] mx-auto mt-[48px] md:mt-[80px]">
        <ConstellationBridge />
      </motion.div>

      <div className="max-w-[980px] mx-auto mt-[70px] md:mt-[110px]">
        <motion.div {...RISE} className="flex flex-col items-center gap-7">
          <Link
            to="/creators"
            className="inline-flex items-center justify-center rounded-full px-8 py-4 label-mono text-[11px] font-semibold transition-transform duration-300 hover:-translate-y-0.5"
            style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', boxShadow: '0 0 40px hsl(var(--neon-lime) / .25)' }}
          >
            Book a creator →
          </Link>
          <div className="flex items-center justify-center gap-3 label-mono text-[10px] text-white/30 text-center">
            <span className="w-[28px] h-px bg-white/10" />
            <span>you bring the moment · we bring the camera</span>
            <span className="w-[28px] h-px bg-white/10" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}