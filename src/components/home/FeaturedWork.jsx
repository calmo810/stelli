import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const IMAGES = [
  { url: 'https://images.unsplash.com/photo-1524593166156-312f362cada0?w=700&h=900&fit=crop&q=85', caption: 'Birthday night', meta: 'Williamsburg · Jun 14', col: 'col-span-1', h: 'h-[380px] md:h-[500px]' },
  { url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=700&h=500&fit=crop&q=85', caption: 'Show night', meta: 'Brooklyn · Jun 1', col: 'col-span-1', h: 'h-[240px] md:h-[310px]' },
  { url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=700&h=500&fit=crop&q=85', caption: 'The launch', meta: 'LES · Jun 9', col: 'col-span-1', h: 'h-[260px] md:h-[340px] md:mt-16' },
  { url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=500&fit=crop&q=85', caption: 'Afternoon, park', meta: 'Central Park · Jun 7', col: 'col-span-2 md:col-span-2', h: 'h-[260px] md:h-[340px]' },
  { url: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=700&h=900&fit=crop&q=85', caption: 'Music video', meta: 'Bushwick · Jun 11', col: 'col-span-1', h: 'h-[260px] md:h-[360px]' },
];

export default function FeaturedWork() {
  return (
    <section className="py-24 px-8 md:px-14" style={{ background: '#f0ede6' }}>
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-[8px] font-body tracking-[0.5em] uppercase mb-4" style={{ color: 'rgba(26,39,68,0.3)' }}>Contact Sheet</p>
            <h2 className="font-display font-semibold leading-[0.9]" style={{ fontSize: 'clamp(28px, 4vw, 56px)', color: '#1a2744' }}>
              24 hours<br />in New York.
            </h2>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="md:text-right">
            <p className="font-body text-[11px] leading-relaxed max-w-[180px] md:ml-auto mb-4" style={{ color: 'rgba(26,39,68,0.4)' }}>
              Day and night.<br />Flash and available light.<br />Real people, real moments.
            </p>
            <Link to="/browse"
              className="text-[10px] font-body tracking-[0.08em] uppercase border-b pb-px transition-all"
              style={{ color: 'rgba(26,39,68,0.4)', borderColor: 'rgba(26,39,68,0.2)' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#1a2744'; e.currentTarget.style.borderColor = '#1a2744'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(26,39,68,0.4)'; e.currentTarget.style.borderColor = 'rgba(26,39,68,0.2)'; }}
            >
              Browse creators
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
          {IMAGES.map((img, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.8 }}
              className={`group relative overflow-hidden ${img.col} ${img.h}`}
              style={{ background: '#ddd' }}>
              <motion.img src={img.url} alt={img.caption} className="w-full h-full object-cover"
                whileHover={{ scale: 1.04 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                loading="lazy" style={{ filter: 'contrast(1.04) saturate(0.9)' }} />
              <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5 flex items-end justify-between"
                style={{ background: 'linear-gradient(to top, rgba(26,39,68,0.5) 0%, transparent 100%)' }}>
                <p className="text-[8px] font-body text-white/70">{img.caption}</p>
                <p className="text-[7px] font-body tracking-[0.2em] text-white/40 uppercase">{img.meta}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}