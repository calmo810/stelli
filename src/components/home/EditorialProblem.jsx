import React from 'react';
import { motion } from 'framer-motion';

// Pitch deck slide 3 — "Ghosted. Blurry. Gone."
const PROBLEMS = [
  { word: 'Ghosted.', detail: 'The photographer you found in your DMs simply stops replying.' },
  { word: 'Blurry.', detail: 'So the night lives on as forty dark, shaky phone photos.' },
  { word: 'Gone.', detail: 'The moment passes — unrecorded, unrepeatable, lost for good.' },
];

export default function EditorialProblem() {
  return (
    <section className="py-32 px-8 md:px-16 lg:px-28 bg-white">
      <div className="max-w-[1300px] mx-auto">
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="text-[9px] font-body tracking-[0.4em] uppercase text-[#1a2a6c]/35 mb-20">
          The Problem
        </motion.p>

        <div className="space-y-0">
          {PROBLEMS.map((p, i) => (
            <motion.div
              key={p.word}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-b border-[#1a2a6c]/8 py-12"
            >
              <h2 className="font-display text-[clamp(56px,7vw,100px)] leading-none font-semibold text-[#1a2a6c]">
                {p.word}
              </h2>
              <p className="font-body text-sm text-[#999] leading-relaxed max-w-sm">
                {p.detail}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Solution bridge */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-28"
        >
          <p className="text-[9px] font-body tracking-[0.4em] uppercase text-[#1a2a6c]/35 mb-8">What We Built</p>
          <h2 className="font-display text-[clamp(36px,5vw,72px)] leading-[0.95] font-semibold text-[#1a2a6c] max-w-[900px]">
            Stelli is how New York <em>remembers</em> its best nights.
          </h2>
          <p className="font-body text-sm text-[#999] mt-6 max-w-sm leading-relaxed">
            The booking platform for the city's best photographers and filmmakers. Pick the moment. Book in three minutes. Keep it forever.
          </p>
        </motion.div>
      </div>
    </section>
  );
}