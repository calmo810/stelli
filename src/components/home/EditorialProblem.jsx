import React from 'react';
import { motion } from 'framer-motion';

// Full-bleed editorial — one word per beat, massive type, image behind
export default function EditorialProblem() {
  return (
    <>
      {/* Cinematic full-bleed image break */}
      <section className="relative h-[70vh] overflow-hidden">
        <motion.img
          initial={{ scale: 1.06 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2, ease: 'easeOut' }}
          src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1800&h=1000&fit=crop&q=85"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#1a2a6c]/55" />
        <div className="absolute inset-0 flex flex-col justify-end px-8 md:px-14 pb-14 max-w-[1400px] mx-auto w-full">
          <p className="text-[8px] font-body tracking-[0.4em] uppercase text-white/30 mb-4">A Night, Uncaught</p>
          <p className="font-body text-sm text-white/50 max-w-xs leading-relaxed">
            Last Friday in New York. Hundreds of perfect moments — and almost no one walked away with a photo worth keeping.
          </p>
        </div>
      </section>

      {/* The Problem — massive editorial type */}
      <section className="py-28 px-8 md:px-14 bg-[#F5F4EF]">
        <div className="max-w-[1400px] mx-auto">
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="text-[8px] font-body tracking-[0.5em] uppercase text-[#1a2a6c]/30 mb-20">
            The Problem
          </motion.p>

          <div>
            {[
              { word: 'Ghosted.', detail: 'The photographer you found in your DMs simply stops replying.' },
              { word: 'Blurry.', detail: 'So the night lives on as forty dark, shaky phone photos.' },
              { word: 'Gone.', detail: 'The moment passes — unrecorded, unrepeatable, lost for good.' },
            ].map((p, i) => (
              <motion.div
                key={p.word}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ delay: i * 0.1, duration: 0.8 }}
                className="flex flex-col md:flex-row md:items-baseline md:justify-between border-b border-[#1a2a6c]/8 py-10 gap-3"
              >
                <h2 className="font-display font-semibold text-[#1a2a6c] leading-none" style={{ fontSize: 'clamp(60px, 8vw, 110px)' }}>
                  {p.word}
                </h2>
                <p className="font-body text-sm text-[#aaa] leading-relaxed max-w-xs md:text-right">{p.detail}</p>
              </motion.div>
            ))}
          </div>

          {/* Solution — clean statement */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-32 max-w-[900px]"
          >
            <p className="text-[8px] font-body tracking-[0.5em] uppercase text-[#1a2a6c]/30 mb-10">What We Built</p>
            <h2 className="font-display font-semibold text-[#1a2a6c] leading-[0.92]" style={{ fontSize: 'clamp(36px, 5vw, 76px)' }}>
              Stelli is how New York <em>remembers</em> its best nights.
            </h2>
            <p className="font-body text-sm text-[#aaa] mt-8 max-w-sm leading-relaxed">
              The booking platform for the city's best photographers and filmmakers.<br />
              Pick the moment. Book in three minutes. Keep it forever.
            </p>
          </motion.div>
        </div>
      </section>
    </>
  );
}