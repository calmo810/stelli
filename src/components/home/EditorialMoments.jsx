import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// Pitch slide 7: "Built for the way the city celebrates." — cream bg, navy type, table layout
const MOMENTS = [
  {
    tag: '01',
    name: 'The Moment',
    desc: 'A surprise shoot of you and your people — the birthday, the hang, the main-character night.',
    price: 'from $390',
    img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&h=1100&fit=crop&q=88',
  },
  {
    tag: '02',
    name: 'The Event Film',
    desc: 'Your night, cut for the feed — the party, the launch, the show, edited into reels ready to post.',
    price: 'from $420',
    img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=900&h=1100&fit=crop&q=88',
  },
  {
    tag: '03',
    name: 'The Content Day',
    desc: 'A month of content in one afternoon — 30+ photos and a handful of reels for your business.',
    price: '~$1,000',
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&h=1100&fit=crop&q=88',
  },
];

export default function EditorialMoments() {
  return (
    <section style={{ background: '#f0ede6' }}>
      {/* Header */}
      <div className="px-8 md:px-14 pt-24 pb-0 max-w-[1400px] mx-auto">
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="text-[8px] font-body tracking-[0.5em] uppercase mb-8" style={{ color: 'rgba(26,39,68,0.3)' }}>
          What You Can Book
        </motion.p>
        <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="font-display font-semibold leading-[0.9]" style={{ fontSize: 'clamp(32px, 5.5vw, 76px)', color: '#1a2744' }}>
          Built for the way<br />the city <em className="italic">celebrates.</em>
        </motion.h2>
      </div>

      {/* Product table — editorial rows like pitch slide 7 */}
      <div className="max-w-[1400px] mx-auto px-8 md:px-14 mt-16">
        {MOMENTS.map((m, i) => (
          <motion.div
            key={m.name}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ delay: i * 0.07 }}
            className="flex flex-col md:flex-row md:items-center justify-between py-10 border-t gap-6 group"
            style={{ borderColor: 'rgba(26,39,68,0.12)' }}
          >
            <div className="flex items-baseline gap-8 md:w-[35%]">
              <span className="text-[10px] font-body" style={{ color: 'rgba(26,39,68,0.25)' }}>{m.tag}</span>
              <h3 className="font-display font-semibold" style={{ fontSize: 'clamp(26px, 3vw, 44px)', color: '#1a2744' }}>{m.name}</h3>
            </div>
            <p className="font-body text-[13px] leading-relaxed md:w-[40%]" style={{ color: 'rgba(26,39,68,0.45)' }}>{m.desc}</p>
            <div className="flex items-center justify-between md:justify-end gap-8 md:w-[20%]">
              <span className="font-body text-[13px] italic" style={{ color: 'rgba(26,39,68,0.4)' }}>{m.price}</span>
              <Link to="/browse"
                className="text-[10px] font-body tracking-[0.08em] uppercase transition-all border-b pb-px"
                style={{ color: 'rgba(26,39,68,0.4)', borderColor: 'rgba(26,39,68,0.2)' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#1a2744'; e.currentTarget.style.borderColor = '#1a2744'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(26,39,68,0.4)'; e.currentTarget.style.borderColor = 'rgba(26,39,68,0.2)'; }}
              >
                Book →
              </Link>
            </div>
          </motion.div>
        ))}
        <div className="border-t" style={{ borderColor: 'rgba(26,39,68,0.12)' }} />
      </div>
    </section>
  );
}