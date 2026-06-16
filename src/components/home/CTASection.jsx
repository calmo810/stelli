import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function CTASection() {
  return (
    <>
      {/* Full-bleed dark image */}
      <section className="relative h-[80vh] overflow-hidden">
        <motion.img
          initial={{ scale: 1.05 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2, ease: 'easeOut' }}
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1800&h=1000&fit=crop&q=80"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#1a2a6c]/60" />
        <div className="absolute inset-0 flex flex-col justify-end px-8 md:px-14 pb-20 max-w-[1400px] mx-auto w-full">
          <p className="text-[8px] font-body tracking-[0.5em] uppercase text-white/25 mb-8">The Plan</p>
          <h2 className="font-display font-semibold text-white leading-[0.9] max-w-[800px]" style={{ fontSize: 'clamp(40px, 6vw, 90px)' }}>
            We're not pitching a plan.<br />We're <em>running</em> it.
          </h2>
          <p className="font-body text-sm text-white/35 mt-6 max-w-xs leading-relaxed">
            Real shoots, real businesses, real bookings pushed through the platform — so we learn what breaks before we spend a dollar scaling it.
          </p>
        </div>
      </section>

      {/* Final CTA — minimal, emotional */}
      <section className="py-36 px-8 md:px-14 bg-[#1a2a6c]">
        <div className="max-w-[1400px] mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <img
              src="https://media.base44.com/images/public/6a2c4e448e7fec52fb6d322a/b178af09a_Screenshot2026-06-14at105757PM.png"
              alt="Stelli"
              className="h-12 w-auto object-contain mx-auto mb-14 opacity-80 brightness-0 invert"
            />
            <h2 className="font-display font-semibold text-white leading-[0.92] max-w-[700px] mx-auto" style={{ fontSize: 'clamp(40px, 6vw, 88px)' }}>
              Every moment deserves<br />to be <em>remembered.</em>
            </h2>
            <p className="font-body text-sm text-white/30 mt-8 max-w-xs mx-auto leading-relaxed">
              for the moments that only happen once.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-14">
              <Link to="/browse" className="px-8 py-3.5 rounded-full bg-white text-[#1a2a6c] text-[11px] font-body tracking-[0.06em] uppercase hover:bg-white/90 transition-all">
                Book a shoot
              </Link>
              <Link to="/apply" className="px-8 py-3.5 rounded-full border border-white/15 text-white text-[11px] font-body tracking-[0.06em] uppercase hover:border-white/35 transition-all">
                Become a creator
              </Link>
            </div>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.5 }}
            className="mt-24 text-[8px] font-body tracking-[0.4em] uppercase text-white/15">
            N.Y.C — 2026 · Stelli · New York Creative Collective
          </motion.p>
        </div>
      </section>
    </>
  );
}