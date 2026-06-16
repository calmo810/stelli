import React from 'react';
import { motion } from 'framer-motion';

const TESTIMONIALS = [
  {
    quote: 'I forgot I was being photographed. When I got the gallery I literally cried.',
    name: 'Alicia M.',
    event: 'Birthday · Williamsburg',
    scribble: '"favorite"',
  },
  {
    quote: 'We co-booked it for our friend\'s birthday — three of us splitting it was seamless. She had no idea.',
    name: 'Jordan & Maya',
    event: 'Surprise shoot · DUMBO',
    scribble: '"perfect"',
  },
  {
    quote: 'The album was ready in a week. I shared it with the whole family — they didn\'t even need an account.',
    name: 'Rafael C.',
    event: 'Dinner party · West Village',
    scribble: '"golden hour"',
  },
];

export default function Testimonials() {
  return (
    <section className="py-32 px-8 md:px-16 lg:px-28 bg-white">
      <div className="max-w-[1300px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-20">
          <p className="text-[9px] font-body tracking-[0.4em] uppercase text-[#1a2a6c]/35 mb-6">What they said</p>
          <h2 className="font-display text-[clamp(32px,4vw,56px)] leading-[0.95] font-semibold text-[#1a2a6c]">
            Human stories create<br />connections that <em>last.</em>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#1a2a6c]/8 rounded-2xl overflow-hidden">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-10 relative"
            >
              {/* Scribble annotation */}
              <span className="absolute top-6 right-8 font-display italic text-[10px] text-[#1a2a6c]/20 rotate-6 pointer-events-none select-none">
                {t.scribble}
              </span>

              <p className="font-display text-[17px] italic leading-relaxed text-[#1a2a6c] mb-8">
                "{t.quote}"
              </p>

              <div className="border-t border-[#1a2a6c]/8 pt-5">
                <p className="font-body text-sm font-semibold text-[#1a2a6c]">{t.name}</p>
                <p className="font-body text-xs text-[#999] mt-1">{t.event}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}