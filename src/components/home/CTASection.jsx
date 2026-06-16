import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function CTASection() {
  return (
    <>
      {/* Full-bleed mid-motion concert image — amber wash */}
      <section className="relative overflow-hidden" style={{ height: 'clamp(400px, 55vw, 680px)' }}>
        <motion.img
          initial={{ scale: 1.05 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2.5, ease: 'easeOut' }}
          src="https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1800&h=1000&fit=crop&q=85"
          alt=""
          className="w-full h-full object-cover"
          style={{ filter: 'contrast(1.06) saturate(0.95)' }}
        />
        {/* Amber wash */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,10,10,0.90) 0%, rgba(10,10,10,0.3) 50%, rgba(160,80,10,0.15) 100%)' }} />
        {/* Grain */}
        <div className="absolute inset-0 opacity-25 mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`, backgroundSize: '200px 200px' }} />

        {/* Contact-sheet overstamp */}
        <div className="absolute top-4 left-6 text-[7px] font-body tracking-[0.3em] uppercase text-white/15">Frame 048 · 35mm</div>

        <div className="absolute inset-0 flex flex-col justify-end px-8 md:px-14 pb-16 max-w-[1400px] mx-auto w-full">
          <p className="text-[8px] font-body tracking-[0.5em] uppercase text-white/20 mb-6">Every Night</p>
          <h2 className="font-display font-semibold text-white leading-[0.9]" style={{ fontSize: 'clamp(36px, 5.5vw, 80px)' }}>
            We're not pitching a plan.<br />We're <em>running</em> it.
          </h2>
        </div>
      </section>

      {/* Final CTA — pure black */}
      <section className="py-32 px-8 md:px-14 bg-[#0a0a0a]">
        <div className="max-w-[1400px] mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <img
              src="https://media.base44.com/images/public/6a2c4e448e7fec52fb6d322a/b178af09a_Screenshot2026-06-14at105757PM.png"
              alt="Stelli"
              className="h-10 w-auto object-contain mx-auto mb-12 opacity-60 brightness-0 invert"
            />
            <h2 className="font-display font-semibold text-white leading-[0.9] max-w-[640px] mx-auto" style={{ fontSize: 'clamp(36px, 6vw, 84px)' }}>
              Every moment deserves<br />to be <em>remembered.</em>
            </h2>
            <p className="font-body text-[11px] text-white/20 mt-7 mx-auto leading-relaxed tracking-[0.03em]">
              for the moments that only happen once.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-12">
              <Link to="/browse" className="px-8 py-3 text-[10px] font-body tracking-[0.08em] uppercase bg-white text-[#0a0a0a] rounded-full hover:bg-white/90 transition-all font-medium">
                Book a shoot
              </Link>
              <Link to="/apply" className="px-8 py-3 text-[10px] font-body tracking-[0.08em] uppercase border border-white/10 text-white/50 rounded-full hover:border-white/20 hover:text-white/70 transition-all">
                Become a creator
              </Link>
            </div>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }}
            className="mt-20 text-[7px] font-body tracking-[0.45em] uppercase text-white/10">
            N.Y.C — 2026 · Stelli · New York Creative Collective
          </motion.p>
        </div>
      </section>
    </>
  );
}