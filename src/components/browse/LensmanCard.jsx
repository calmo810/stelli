import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const COLOR_WASHES = [
  'rgba(180,80,10,0.22)',
  'rgba(10,10,70,0.28)',
  'rgba(120,10,10,0.22)',
  'rgba(160,100,0,0.2)',
];

export default function LensmanCard({ lensman, index = 0 }) {
  const images = lensman.portfolio_images || [];
  const heroImage = images[0];
  const wash = COLOR_WASHES[index % COLOR_WASHES.length];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.07, duration: 0.7 }}
    >
      <Link to={`/lensman/${lensman.id || lensman.slug}`} className="block group">
        <div className="relative overflow-hidden bg-[#111]" style={{ borderRadius: 2 }}>

          {/* Portrait image */}
          <div className="relative overflow-hidden" style={{ height: 'clamp(320px, 40vw, 480px)' }}>
            {heroImage ? (
              <>
                <motion.img
                  src={heroImage}
                  alt={lensman.display_name || lensman.full_name}
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.04 }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  loading="lazy"
                  style={{ filter: 'contrast(1.05) saturate(0.85) brightness(0.8)' }}
                />
                <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(135deg, ${wash} 0%, transparent 70%)` }} />
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(10,10,10,0.75) 0%, transparent 55%)' }} />
              </>
            ) : (
              <div className="w-full h-full bg-[#0d0d0d] flex items-center justify-center">
                <p className="text-[8px] font-body tracking-[0.3em] uppercase" style={{ color: 'rgba(255,255,255,0.1)' }}>
                  Photo placeholder
                </p>
              </div>
            )}

            {/* Contact-sheet frame stamp */}
            <div className="absolute top-3 left-3 text-[7px] font-body tracking-[0.25em] uppercase pointer-events-none" style={{ color: 'rgba(255,255,255,0.2)' }}>
              {String(index + 1).padStart(2, '0')} · NYC
            </div>
          </div>

          {/* Info strip */}
          <div className="px-5 py-4 flex items-end justify-between">
            <div>
              <p className="font-display text-[18px] font-semibold text-white leading-none mb-1">
                {lensman.display_name || lensman.full_name}
              </p>
              <p className="text-[9px] font-body tracking-[0.15em] uppercase" style={{ color: 'rgba(255,255,255,0.2)' }}>
                {lensman.neighborhoods?.slice(0, 2).join(' · ')}
              </p>
            </div>
            <div className="text-right">
              <p className="font-body text-[12px] font-semibold text-white">
                ${lensman.rate_half_day || 800}
              </p>
              <p className="text-[9px] font-body" style={{ color: 'rgba(255,255,255,0.2)' }}>from</p>
            </div>
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center"
            style={{ background: 'rgba(10,10,10,0.35)' }}>
            <span className="text-[10px] font-body tracking-[0.15em] uppercase border-b pb-px"
              style={{ color: '#F2DCA9', borderColor: 'rgba(242,220,169,0.4)' }}>
              View profile
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}