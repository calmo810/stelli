import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function CTASection() {
  return (
    <section className="py-40 px-8 md:px-16 lg:px-28 bg-[#1a2a6c] relative overflow-hidden">
      {/* Subtle star texture */}
      <div className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(1px 1px at 20% 30%, white 50%, transparent 50%), radial-gradient(1px 1px at 60% 70%, white 50%, transparent 50%), radial-gradient(1px 1px at 80% 20%, white 50%, transparent 50%), radial-gradient(2px 2px at 40% 60%, white 50%, transparent 50%)' }} />

      <div className="max-w-[1300px] mx-auto text-center relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <p className="text-[9px] font-body tracking-[0.4em] uppercase text-white/30 mb-10">For the moments that only happen once</p>

          <h2 className="font-display text-[clamp(48px,7vw,100px)] leading-[0.92] font-semibold text-white mb-8">
            Every moment deserves<br />to be <em>remembered.</em>
          </h2>

          <p className="font-body text-sm text-white/40 max-w-sm mx-auto leading-relaxed mb-14">
            And the best ones never wait for you to be ready — the toast, the hug, the light at 8 p.m.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/browse"
              className="px-8 py-3.5 rounded-full bg-white text-[#1a2a6c] text-[13px] font-body font-semibold hover:bg-white/90 transition-all">
              Book a shoot
            </Link>
            <Link to="/apply"
              className="px-8 py-3.5 rounded-full border border-white/25 text-white text-[13px] font-body font-semibold hover:border-white/50 transition-all">
              Become a creator
            </Link>
          </div>
        </motion.div>

        {/* Bottom editorial note */}
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }}
          className="mt-20 font-body text-[10px] tracking-[0.3em] uppercase text-white/20">
          N.Y.C — 2026 · Stelli · New York Creative Collective
        </motion.p>
      </div>
    </section>
  );
}