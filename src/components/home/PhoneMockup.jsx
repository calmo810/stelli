import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';

const DANCE_VIDEO = 'https://media.base44.com/videos/public/6a2c4e448e7fec52fb6d322a/d61a65b85_generated_video.mp4';

export default function PhoneMockup() {
  return (
    <section className="py-28 px-8 md:px-14 flex flex-col items-center" style={{ background: '#f0ede6' }}>
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="text-[8px] font-body tracking-[0.5em] uppercase mb-16 text-center"
        style={{ color: 'rgba(26,39,68,0.3)' }}
      >
        The Product
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        className="relative"
        style={{ width: 300 }}
      >
        {/* Phone shell — navy blue like pitch deck */}
        <div
          className="relative overflow-hidden"
          style={{
            width: 300,
            height: 600,
            borderRadius: 44,
            background: '#fff',
            border: '3px solid #1a2744',
            boxShadow: '0 40px 80px rgba(26,39,68,0.18), 0 0 0 1px rgba(26,39,68,0.06)',
          }}
        >
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20"
            style={{ width: 90, height: 26, background: '#1a2744', borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }} />

          {/* Video */}
          <div className="absolute inset-x-0 top-0 overflow-hidden" style={{ height: '62%' }}>
            <video
              src={DANCE_VIDEO}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(to bottom, rgba(26,39,68,0.2) 0%, rgba(26,39,68,0) 40%, rgba(255,255,255,0.5) 100%)' }} />
            {/* THE MOMENT badge */}
            <div className="absolute top-10 left-4 z-10">
              <span className="text-[9px] font-body font-semibold tracking-[0.15em] uppercase px-3 py-1.5"
                style={{ background: '#fff', color: '#1a2744', borderRadius: 999 }}>
                The Moment
              </span>
            </div>
          </div>

          {/* Card panel */}
          <div className="absolute bottom-0 inset-x-0 px-5 pt-5 pb-6 bg-white"
            style={{ height: '42%' }}>
            <p className="font-display font-semibold leading-tight mb-1" style={{ fontSize: 22, color: '#1a2744' }}>
              Rooftop, Saturday.
            </p>
            <p className="text-[10px] font-body leading-relaxed mb-4"
              style={{ color: 'rgba(26,39,68,0.4)', borderBottom: '1px solid rgba(26,39,68,0.08)', paddingBottom: 12 }}>
              vetted creator · fixed price · held<br />until your gallery lands
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" style={{ color: '#1a2744' }} />
                <span className="text-[12px] font-body font-semibold" style={{ color: '#1a2744' }}>4.98</span>
              </div>
              <Link to="/browse"
                className="text-[11px] font-body font-semibold tracking-[0.04em] px-5 py-2 transition-all"
                style={{ background: '#1a2744', color: '#fff', borderRadius: 999 }}>
                Book
              </Link>
            </div>
          </div>
        </div>

        {/* Shadow */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ width: 200, height: 40, background: 'rgba(26,39,68,0.12)', filter: 'blur(24px)', borderRadius: '50%' }} />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4, duration: 1 }}
        className="mt-16 text-center font-body text-[12px]"
        style={{ color: 'rgba(26,39,68,0.3)' }}
      >
        Browse. Book in three minutes. Keep it forever.
      </motion.p>
    </section>
  );
}