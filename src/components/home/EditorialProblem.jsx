import React from 'react';
import { motion } from 'framer-motion';

export default function EditorialProblem() {
  return (
    <>
      {/* Full-bleed club-red image — mid-motion crowd */}
      <section className="relative overflow-hidden" style={{ height: 'clamp(420px, 60vw, 700px)' }}>
        <motion.img
          initial={{ scale: 1.05 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2.5, ease: 'easeOut' }}
          src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1800&h=1000&fit=crop&q=85&sat=-10"
          alt=""
          className="w-full h-full object-cover"
          style={{ filter: 'contrast(1.1) saturate(1.1)' }}
        />
        {/* Club-red wash */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(140,20,20,0.35) 0%, rgba(10,10,10,0.7) 70%)' }} />
        {/* grain */}
        <div className="absolute inset-0 opacity-[0.3] mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)'/%3E%3C/svg%3E")`, backgroundSize: '200px 200px' }} />

        {/* Contact-sheet overstamp */}
        <div className="absolute top-4 left-6 text-[7px] font-body tracking-[0.3em] uppercase text-white/20">Frame 001 · 35mm</div>
        <div className="absolute bottom-6 right-8 text-[7px] font-body tracking-[0.25em] uppercase text-white/20">Brooklyn, 1:00 AM</div>
      </section>

      {/* THE PROBLEM — dark bg, massive white type */}
      <section className="py-24 px-8 md:px-14 bg-[#0a0a0a]">
        <div className="max-w-[1400px] mx-auto">
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="text-[8px] font-body tracking-[0.5em] uppercase text-white/20 mb-16">
            The Problem
          </motion.p>

          {[
            { word: 'Ghosted.', detail: 'The photographer you found in your DMs stops replying.' },
            { word: 'Blurry.', detail: 'So the night lives on as forty dark, shaky phone photos.' },
            { word: 'Gone.', detail: 'The moment passes — unrecorded, unrepeatable, lost.' },
          ].map((p, i) => (
            <motion.div
              key={p.word}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.08, duration: 0.8 }}
              className="flex flex-col md:flex-row md:items-baseline md:justify-between border-b border-white/6 py-9 gap-3"
            >
              <h2 className="font-display font-semibold text-white leading-none" style={{ fontSize: 'clamp(56px, 8vw, 108px)' }}>
                {p.word}
              </h2>
              <p className="font-body text-[12px] text-white/25 leading-relaxed max-w-xs md:text-right">{p.detail}</p>
            </motion.div>
          ))}

          {/* The answer */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-28 max-w-[860px]"
          >
            <p className="text-[8px] font-body tracking-[0.5em] uppercase text-white/20 mb-8">What We Built</p>
            <h2 className="font-display font-semibold text-white leading-[0.92]" style={{ fontSize: 'clamp(32px, 5vw, 72px)' }}>
              Stelli is how New York <em>remembers</em> its best nights.
            </h2>
            <p className="font-body text-[12px] text-white/30 mt-7 max-w-xs leading-relaxed">
              The booking platform for the city's best photographers.<br />
              Pick the moment. Book in three minutes. Keep it forever.
            </p>
          </motion.div>
        </div>
      </section>
    </>
  );
}