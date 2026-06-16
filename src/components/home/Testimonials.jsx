import React from 'react';
import { motion } from 'framer-motion';

const T = [
  { quote: 'I forgot I was being photographed. When I got the gallery I literally cried.', name: 'Alicia M.', event: 'Birthday · Williamsburg', scribble: '"favorite"', rot: '6deg' },
  { quote: 'We co-booked it for our friend\'s birthday. Three of us splitting it was seamless. She had no idea.', name: 'Jordan & Maya', event: 'Surprise shoot · DUMBO', scribble: '"perfect"', rot: '-4deg' },
  { quote: 'The album was ready in a week. I shared the link with my whole family — no one had to create an account.', name: 'Rafael C.', event: 'Dinner party · West Village', scribble: '"golden hour"', rot: '5deg' },
];

export default function Testimonials() {
  return (
    <section className="py-28 px-8 md:px-14 bg-white">
      <div className="max-w-[1400px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-20">
          <p className="text-[8px] font-body tracking-[0.5em] uppercase text-[#1a2a6c]/30 mb-5">What They Said</p>
          <h2 className="font-display font-semibold text-[#1a2a6c] leading-[0.92] max-w-[600px]" style={{ fontSize: 'clamp(32px, 4vw, 60px)' }}>
            The best photos are the ones you forgot were being taken.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#1a2a6c]/5">
          {T.map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white px-10 py-12 relative">
              <span className="absolute top-8 right-8 font-display italic text-[10px] text-[#1a2a6c]/15 pointer-events-none select-none"
                style={{ transform: `rotate(${t.rot})`, display: 'inline-block' }}>{t.scribble}</span>
              <p className="font-display text-[17px] italic leading-relaxed text-[#1a2a6c] mb-10">"{t.quote}"</p>
              <div className="border-t border-[#1a2a6c]/6 pt-5">
                <p className="font-body text-[13px] font-semibold text-[#1a2a6c]">{t.name}</p>
                <p className="font-body text-[11px] text-[#bbb] mt-1">{t.event}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}