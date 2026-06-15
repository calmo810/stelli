import React from 'react';
import { motion } from 'framer-motion';

const testimonials = [
  {
    name: 'Sarah M.',
    event: 'Birthday Party · Bushwick',
    text: "I found my photographer in 5 minutes and got the most amazing photos I've ever seen. The whole process was so easy.",
  },
  {
    name: 'Marcus T.',
    event: 'Music Video · Williamsburg',
    text: "Stelli connected me with a filmmaker who totally understood my vision. The escrow system gave me complete peace of mind.",
  },
  {
    name: 'Jade & Co.',
    event: 'Restaurant Launch · SoHo',
    text: "We booked a content day for our opening. Got 60+ photos and a reel. Worth every single penny.",
  },
];

export default function Testimonials() {
  return (
    <section className="py-28 px-8 md:px-16 lg:px-24 bg-[#1a2a6c]">
      <div className="max-w-[1300px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <p className="text-[10px] font-body tracking-[0.3em] uppercase text-white/30 mb-3">Kind words</p>
          <h2 className="font-display text-[clamp(28px,3.5vw,48px)] font-semibold leading-tight text-white max-w-md">
            People love their moments.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="border border-white/10 rounded-2xl p-8 flex flex-col gap-6 hover:border-white/25 transition-colors"
            >
              <p className="text-white/80 font-body text-[15px] leading-relaxed flex-1">"{t.text}"</p>
              <div>
                <p className="text-white text-sm font-semibold font-body">{t.name}</p>
                <p className="text-white/40 text-xs font-body mt-0.5">{t.event}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}