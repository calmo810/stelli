import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';


export default function CTASection() {
  return (
    <section className="py-36 px-8 md:px-14" style={{ background: '#f0ede6' }}>
        <div className="max-w-[1400px] mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            {/* Stelli wordmark */}
            <p className="font-display font-semibold mb-14" style={{ fontSize: 36, color: '#1a2744' }}>Stelli</p>

            <h2 className="font-display font-semibold leading-[0.9] max-w-[640px] mx-auto" style={{ fontSize: 'clamp(36px, 6vw, 84px)', color: '#1a2744' }}>
              Every moment deserves<br />to be <em className="italic">remembered.</em>
            </h2>
            <p className="font-body text-[12px] mt-7 mx-auto leading-relaxed tracking-[0.03em]" style={{ color: 'rgba(26,39,68,0.35)' }}>
              for the moments that only happen once.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-12">
              <Link to="/browse" className="px-8 py-3.5 text-[10px] font-body tracking-[0.08em] uppercase rounded-full font-semibold transition-all"
                style={{ background: '#1a2744', color: '#f0ede6' }}
                onMouseEnter={e => e.currentTarget.style.background = '#253560'}
                onMouseLeave={e => e.currentTarget.style.background = '#1a2744'}>
                Book a shoot
              </Link>
              <Link to="/apply" className="px-8 py-3.5 text-[10px] font-body tracking-[0.08em] uppercase border rounded-full transition-all"
                style={{ borderColor: 'rgba(26,39,68,0.2)', color: 'rgba(26,39,68,0.5)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(26,39,68,0.5)'; e.currentTarget.style.color = '#1a2744'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(26,39,68,0.2)'; e.currentTarget.style.color = 'rgba(26,39,68,0.5)'; }}>
                Become a creator
              </Link>
            </div>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }}
            className="mt-20 text-[7px] font-body tracking-[0.45em] uppercase" style={{ color: 'rgba(26,39,68,0.2)' }}>
            N.Y.C — 2026 · Stelli · New York Creative Collective
          </motion.p>
        </div>
    </section>
  );
}