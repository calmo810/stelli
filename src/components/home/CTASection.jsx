import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CTASection() {
  return (
    <section className="py-28 px-8 md:px-16 lg:px-24 bg-[#F5F4EF] relative overflow-hidden">
      {/* Decorative large star */}
      <span className="absolute right-[6%] top-1/2 -translate-y-1/2 text-[180px] text-[#1a2a6c]/5 select-none leading-none">✦</span>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-[1300px] mx-auto relative z-10"
      >
        <p className="text-[10px] font-body tracking-[0.3em] uppercase text-[#1a2a6c]/40 mb-4">Get started</p>
        <h2 className="font-display text-[clamp(36px,5vw,72px)] font-semibold leading-[1.05] text-[#1a1a1a] max-w-2xl mb-10">
          Your next moment deserves the best lens in NYC.
        </h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/browse"
            className="inline-flex items-center gap-2 bg-[#1a2a6c] text-white text-sm font-body font-semibold rounded-full px-7 py-3.5 hover:bg-[#22337a] transition-colors"
          >
            Browse lensmen <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/apply"
            className="inline-flex items-center gap-2 border border-[#1a2a6c] text-[#1a2a6c] text-sm font-body font-semibold rounded-full px-7 py-3.5 hover:bg-[#1a2a6c] hover:text-white transition-colors"
          >
            Join as a creator
          </Link>
        </div>
      </motion.div>
    </section>
  );
}