import React from 'react';
import { motion } from 'framer-motion';

const T = [
  { quote: 'I forgot I was being photographed. When I got the gallery I literally cried.', name: 'Alicia M.', event: 'Birthday · Williamsburg' },
  { quote: 'We co-booked it for our friend\'s birthday. She had no idea. The photos came back in a week.', name: 'Jordan & Maya', event: 'Surprise shoot · DUMBO' },
  { quote: 'The album was shared with my whole family instantly. No one had to make an account.', name: 'Rafael C.', event: 'Dinner party · West Village' },
];

export default function Testimonials() {
  return (
    <section className="py-24 px-8 md:px-14 bg-[#0a0a0a]">
      <div className="max-w-[1400px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
          <p className="text-[8px] font-body tracking-[0.5em] uppercase text-white/20 mb-5">What They Said</p>
          <h2 className="font-display font-semibold text-white leading-[0.92] max-w-[560px]" style={{ fontSize: 'clamp(28px, 4vw, 56px)' }}>
            The best photos are<br />the ones you forgot<br />were being taken.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5">
          {T.map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-[#0a0a0a] px-8 py-10">
              <p className="font-display text-[16px] italic leading-relaxed text-white/70 mb-8">"{t.quote}"</p>
              <div className="border-t border-white/6 pt-4">
                <p className="font-body text-[12px] font-medium text-white/50">{t.name}</p>
                <p className="font-body text-[10px] text-white/20 mt-0.5 tracking-[0.05em]">{t.event}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}