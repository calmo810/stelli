import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// Contact-sheet editorial — each with its own color cast, mid-motion
const IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1524593166156-312f362cada0?w=700&h=900&fit=crop&q=85',
    caption: 'Birthday night',
    meta: 'Williamsburg · Jun 14',
    wash: 'rgba(180,80,10,0.2)',
    col: 'col-span-1',
    h: 'h-[380px] md:h-[500px]',
  },
  {
    url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=700&h=500&fit=crop&q=85',
    caption: 'Show night',
    meta: 'Brooklyn · Jun 1',
    wash: 'rgba(10,10,80,0.3)',
    col: 'col-span-1',
    h: 'h-[240px] md:h-[310px]',
  },
  {
    url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=700&h=500&fit=crop&q=85',
    caption: 'The launch',
    meta: 'LES · Jun 9',
    wash: 'rgba(120,10,10,0.25)',
    col: 'col-span-1',
    h: 'h-[260px] md:h-[340px] md:mt-16',
  },
  {
    url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=500&fit=crop&q=85',
    caption: 'Afternoon, park',
    meta: 'Central Park · Jun 7',
    wash: 'rgba(160,100,0,0.18)',
    col: 'col-span-2 md:col-span-2',
    h: 'h-[260px] md:h-[340px]',
  },
  {
    url: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=700&h=900&fit=crop&q=85',
    caption: 'Music video',
    meta: 'Bushwick · Jun 11',
    wash: 'rgba(10,10,10,0.15)',
    col: 'col-span-1',
    h: 'h-[260px] md:h-[360px]',
  },
];

export default function FeaturedWork() {
  return (
    <section className="py-24 px-8 md:px-14 bg-[#0a0a0a]">
      <div className="max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-[8px] font-body tracking-[0.5em] uppercase text-white/20 mb-4">Contact Sheet</p>
            <h2 className="font-display font-semibold text-white leading-[0.9]" style={{ fontSize: 'clamp(28px, 4vw, 56px)' }}>
              24 hours<br />in New York.
            </h2>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="md:text-right">
            <p className="font-body text-[11px] text-white/20 leading-relaxed max-w-[180px] md:ml-auto mb-4">
              Day and night.<br />Flash and available light.<br />Real people, real moments.
            </p>
            <Link to="/browse" className="text-[10px] font-body tracking-[0.08em] uppercase text-white/40 border-b border-white/15 pb-px hover:text-white hover:border-white/40 transition-all">
              Browse creators
            </Link>
          </motion.div>
        </div>

        {/* Asymmetric contact sheet grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
          {IMAGES.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.8 }}
              className={`group relative overflow-hidden ${img.col} ${img.h} bg-[#111]`}
            >
              <motion.img
                src={img.url}
                alt={img.caption}
                className="w-full h-full object-cover"
                whileHover={{ scale: 1.04 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                loading="lazy"
                style={{ filter: 'contrast(1.05) saturate(0.9)' }}
              />
              {/* Color wash from the room */}
              <div className="absolute inset-0 pointer-events-none transition-opacity duration-700"
                style={{ background: `linear-gradient(135deg, ${img.wash} 0%, rgba(10,10,10,0.08) 100%)` }} />
              {/* Grain */}
              <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`, backgroundSize: '160px 160px' }} />
              {/* Contact-sheet caption — always visible, not just on hover */}
              <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5 flex items-end justify-between">
                <p className="text-[8px] font-body text-white/40">{img.caption}</p>
                <p className="text-[7px] font-body tracking-[0.2em] text-white/20 uppercase">{img.meta}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}