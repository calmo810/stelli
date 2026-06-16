import React from 'react';
import { motion } from 'framer-motion';

const T = [
  { quote: 'I forgot I was being photographed. When I got the gallery I literally cried.', name: 'Alicia M.', event: 'Birthday · Williamsburg' },
  { quote: "We co-booked it for our friend's birthday. She had no idea. The photos came back in a week.", name: 'Jordan & Maya', event: 'Surprise shoot · DUMBO' },
  { quote: 'The album was shared with my whole family instantly. No one had to make an account.', name: 'Rafael C.', event: 'Dinner party · West Village' },
];

export default function Testimonials() {
  return (
    <section className="py-24 px-8 md:px-14" style={{ background: '#f0ede6' }}>
      <div className="max-w-[1400px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
          <p className="text-[8px] font-body tracking-[0.5em] uppercase mb-5" style={{ color: 'rgba(26,39,68,0.3)' }}>What They Said</p>
          <h2 className="font-display font-semibold leading-[0.92] max-w-[560px]" style={{ fontSize: 'clamp(28px, 4vw, 56px)', color: '#1a2744' }}>
            The best photos are<br />the ones you forgot<br />were being taken.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t" style={{ borderColor: 'rgba(26,39,68,0.1)' }}>
          {T.map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="px-0 md:px-8 py-10 border-b md:border-b-0 md:border-r first:md:pl-0 last:md:border-r-0"
              style={{ borderColor: 'rgba(26,39,68,0.1)' }}>
              <p className="font-display text-[16px] italic leading-relaxed mb-8" style={{ color: 'rgba(26,39,68,0.65)' }}>"{t.quote}"</p>
              <div className="border-t pt-4" style={{ borderColor: 'rgba(26,39,68,0.1)' }}>
                <p className="font-body text-[12px] font-medium" style={{ color: 'rgba(26,39,68,0.6)' }}>{t.name}</p>
                <p className="font-body text-[10px] mt-0.5 tracking-[0.05em]" style={{ color: 'rgba(26,39,68,0.3)' }}>{t.event}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}