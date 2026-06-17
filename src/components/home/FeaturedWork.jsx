import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const WORK = [
  { url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=900&h=1100&fit=crop&q=85', title: 'Show night', meta: 'Brooklyn · Jun 1' },
  { url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=900&h=1100&fit=crop&q=85', title: 'After midnight', meta: 'LES · Jun 9' },
  { url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&h=1100&fit=crop&q=85', title: 'The room', meta: 'Williamsburg · Jun 14' },
];

export default function FeaturedWork() {
  return (
    <section className="py-24 px-8 md:px-14" style={{ background: '#f0ede6' }}>
      <div className="max-w-[1180px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-[8px] font-body tracking-[0.5em] uppercase mb-4" style={{ color: 'rgba(26,39,68,0.3)' }}>Selected Work</p>
            <h2 className="font-display font-semibold leading-[0.9]" style={{ fontSize: 'clamp(32px, 4.5vw, 64px)', color: '#1a2744' }}>
              Real nights.<br />Real proof.
            </h2>
          </motion.div>
          <Link to="/browse" className="text-[10px] font-body tracking-[0.08em] uppercase border-b pb-px transition-all self-start md:self-auto" style={{ color: 'rgba(26,39,68,0.42)', borderColor: 'rgba(26,39,68,0.2)' }}>
            Browse creators
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {WORK.map((item, i) => (
            <motion.div key={item.title} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="relative overflow-hidden h-[420px] md:h-[520px] editorial-card">
              <img src={item.url} alt={item.title} className="w-full h-full object-cover" loading="lazy" decoding="async" sizes="(min-width: 768px) 33vw, 100vw" style={{ filter: 'contrast(1.04) saturate(0.86)' }} />
              <div className="absolute inset-x-3 bottom-3 p-4 flex justify-between items-end glass-panel" style={{ background: 'linear-gradient(to top, rgba(26,39,68,0.62), rgba(26,39,68,0.18))' }}>
                <p className="text-[10px] font-body text-white/75">{item.title}</p>
                <p className="text-[7px] font-body tracking-[0.25em] uppercase text-white/45">{item.meta}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}