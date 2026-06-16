import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';

const DANCE_VIDEO = 'https://media.base44.com/videos/public/6a2c4e448e7fec52fb6d322a/d61a65b85_generated_video.mp4';

export default function PhoneMockup() {
  return (
    <section className="py-28 px-8 md:px-14 bg-[#0a0a0a] flex flex-col items-center">
      {/* Section label */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="text-[8px] font-body tracking-[0.5em] uppercase mb-16 text-center"
        style={{ color: 'rgba(255,255,255,0.15)' }}
      >
        The Product
      </motion.p>

      {/* Phone frame */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        className="relative"
        style={{ width: 300 }}
      >
        {/* Outer phone shell */}
        <div
          className="relative overflow-hidden"
          style={{
            width: 300,
            height: 600,
            borderRadius: 44,
            background: '#0f1520',
            border: '2.5px solid #1e2d4a',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 40px 100px rgba(0,0,0,0.8), 0 0 60px rgba(30,45,74,0.3)',
          }}
        >
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20"
            style={{ width: 90, height: 26, background: '#0f1520', borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }} />

          {/* Video fills top ~60% */}
          <div className="absolute inset-x-0 top-0 overflow-hidden" style={{ height: '62%' }}>
            <video
              src={DANCE_VIDEO}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{ filter: 'contrast(1.08) saturate(1.1)' }}
            />
            {/* Color wash over video */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(to bottom, rgba(15,21,32,0.3) 0%, rgba(15,21,32,0) 40%, rgba(15,21,32,0.6) 100%)' }} />
            {/* THE MOMENT badge */}
            <div className="absolute top-10 left-4 z-10">
              <span className="text-[9px] font-body font-semibold tracking-[0.15em] uppercase px-3 py-1.5"
                style={{ background: '#fff', color: '#0f1520', borderRadius: 999 }}>
                The Moment
              </span>
            </div>
          </div>

          {/* Card panel — bottom 40% */}
          <div className="absolute bottom-0 inset-x-0 px-5 pt-5 pb-6"
            style={{ height: '42%', background: '#fff', borderTopLeftRadius: 2, borderTopRightRadius: 2 }}>
            <p className="font-display font-semibold text-[#0f1520] leading-tight mb-1"
              style={{ fontSize: 22 }}>
              Rooftop, Saturday.
            </p>
            <p className="text-[10px] font-body leading-relaxed mb-4"
              style={{ color: 'rgba(15,21,32,0.45)', borderBottom: '1px solid rgba(15,21,32,0.1)', paddingBottom: 12 }}>
              vetted creator · fixed price · held<br />until your gallery lands
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" style={{ color: '#0f1520' }} />
                <span className="text-[12px] font-body font-semibold" style={{ color: '#0f1520' }}>4.98</span>
              </div>
              <Link to="/browse"
                className="text-[11px] font-body font-semibold tracking-[0.04em] px-5 py-2 transition-all"
                style={{ background: '#0f1520', color: '#fff', borderRadius: 999 }}>
                Book
              </Link>
            </div>
          </div>
        </div>

        {/* Floating glow beneath */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ width: 200, height: 60, background: 'rgba(30,45,74,0.4)', filter: 'blur(30px)', borderRadius: '50%' }} />
      </motion.div>

      {/* Caption */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4, duration: 1 }}
        className="mt-16 text-center font-body text-[12px]"
        style={{ color: 'rgba(255,255,255,0.2)' }}
      >
        Browse. Book in three minutes. Keep it forever.
      </motion.p>
    </section>
  );
}