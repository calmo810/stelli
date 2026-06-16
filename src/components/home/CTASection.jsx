import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// Pitch slide 12 — dark dancing crowd with navy overlay, white headline
const PLAN_IMAGE = 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1800&h=1000&fit=crop&q=85';

export default function CTASection() {
  return (
    <>
      {/* Full-bleed — "We're not pitching a plan. We're running it." — pitch slide 12 */}
      <section className="relative overflow-hidden" style={{ height: 'clamp(400px, 55vw, 680px)' }}>
        <motion.img
          initial={{ scale: 1.05 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2.5, ease: 'easeOut' }}
          src={PLAN_IMAGE}
          alt=""
          className="w-full h-full object-cover"
          style={{ filter: 'contrast(1.06) saturate(0.8) brightness(0.5)' }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(16,24,48,0.85) 0%, rgba(16,24,48,0.4) 60%, rgba(16,24,48,0.2) 100%)' }} />

        <div className="absolute top-4 left-6 text-[7px] font-body tracking-[0.3em] uppercase" style={{ color: 'rgba(255,255,255,0.2)' }}>
          The Plan
        </div>

        <div className="absolute inset-0 flex flex-col justify-end px-8 md:px-14 pb-16 max-w-[1400px] mx-auto w-full">
          <h2 className="font-display font-semibold text-white leading-[0.9]" style={{ fontSize: 'clamp(36px, 5.5vw, 80px)', textShadow: '0 2px 40px rgba(0,0,0,0.3)' }}>
            We're not pitching a plan.<br />We're <em className="italic">running</em> it.
          </h2>
          <p className="font-body text-[13px] mt-5 max-w-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Real shoots, real bookings pushed through the platform — so we learn what breaks before we spend a dollar scaling it.
          </p>
        </div>
      </section>

      {/* Final CTA — cream, pitch slide 15 style */}
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
    </>
  );
}