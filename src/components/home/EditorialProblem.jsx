import React from 'react';
import { motion } from 'framer-motion';

// Club crowd — from pitch deck slide 4
const CROWD_IMAGE = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1800&h=1000&fit=crop&q=85';

export default function EditorialProblem() {
  return (
    <>
      {/* Full-bleed crowd image — from pitch slide 4 */}
      <section className="relative overflow-hidden" style={{ height: 'clamp(400px, 55vw, 680px)' }}>
        <motion.img
          initial={{ scale: 1.04 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2.5, ease: 'easeOut' }}
          src={CROWD_IMAGE}
          alt=""
          className="w-full h-full object-cover"
          style={{ filter: 'contrast(1.1) saturate(0.7) brightness(0.55)' }}
        />
        {/* Navy blue overlay — matches pitch deck slide 4's blue-black treatment */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(16,24,48,0.96) 0%, rgba(16,24,48,0.4) 50%, rgba(16,24,48,0.1) 100%)' }} />

        {/* Contact-sheet stamps */}
        <div className="absolute top-5 left-7 text-[7px] font-body tracking-[0.3em] uppercase" style={{ color: 'rgba(255,255,255,0.18)' }}>
          A Night, Uncaught
        </div>
        <div className="absolute bottom-8 left-7 max-w-md">
          <p className="font-body text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Last Friday in New York. Hundreds of perfect moments —<br />
            and almost no one walked away with a photo worth keeping.
          </p>
        </div>
        <div className="absolute bottom-8 right-7 text-[8px] font-body tracking-[0.3em] uppercase" style={{ color: 'rgba(255,255,255,0.2)' }}>
          A NIGHT, UNCAUGHT
        </div>
      </section>

      {/* THE PROBLEM — cream bg, massive navy type — pitch slide 3 */}
      <section className="py-24 px-8 md:px-14" style={{ background: '#f0ede6' }}>
        <div className="max-w-[1400px] mx-auto">
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="text-[8px] font-body tracking-[0.5em] uppercase mb-16" style={{ color: 'rgba(26,39,68,0.3)' }}>
            The Problem
          </motion.p>

          {[
            { word: 'Ghosted.', detail: 'The photographer you found in your DMs stops replying.' },
            { word: 'Blurry.', detail: 'So the night lives on as forty dark, shaky phone photos.' },
            { word: 'Gone.', detail: 'The moment passes — unrecorded, unrepeatable, lost for good.' },
          ].map((p, i) => (
            <motion.div
              key={p.word}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.08, duration: 0.8 }}
              className="flex flex-col md:flex-row md:items-baseline justify-between py-10 border-b"
              style={{ borderColor: 'rgba(26,39,68,0.1)' }}
            >
              <h2 className="font-display font-semibold leading-none" style={{ fontSize: 'clamp(56px, 8vw, 112px)', color: '#1a2744' }}>
                {p.word}
              </h2>
              <p className="font-body text-[13px] leading-relaxed max-w-xs mt-3 md:mt-0 md:ml-12 self-center" style={{ color: 'rgba(26,39,68,0.45)' }}>
                {p.detail}
              </p>
            </motion.div>
          ))}

          {/* The answer — pitch slide 5 */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-28 max-w-[900px]"
          >
            <p className="text-[8px] font-body tracking-[0.5em] uppercase mb-8" style={{ color: 'rgba(26,39,68,0.3)' }}>What We Built</p>
            <h2 className="font-display font-semibold leading-[0.9] relative inline-block" style={{ fontSize: 'clamp(32px, 5vw, 76px)', color: '#1a2744' }}>
              Stelli is how New York{' '}
              <em className="italic">remembers</em> its best nights.
            </h2>
            <p className="font-body text-[13px] mt-8 max-w-sm leading-relaxed" style={{ color: 'rgba(26,39,68,0.4)' }}>
              The booking platform for the city's best photographers and filmmakers.<br />
              Pick the moment. Book in three minutes. Keep it forever.
            </p>
          </motion.div>
        </div>
      </section>
    </>
  );
}