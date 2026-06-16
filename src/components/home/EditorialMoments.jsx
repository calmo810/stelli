import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// Each image has its own color wash from the reference photos
const MOMENTS = [
  {
    name: 'The Moment',
    desc: 'A candid shoot of you and your people — the birthday, the hang, the main-character night.',
    price: 'from $390',
    // Blown-out sun / daytime street — amber wash
    img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&h=1100&fit=crop&q=88',
    wash: 'rgba(180,100,10,0.18)',
    stamp: 'Personal · Day',
    tag: '01',
  },
  {
    name: 'The Event Film',
    desc: 'Your night, cut for the feed — the launch, the show, edited and ready to post.',
    price: 'from $420',
    // Club-red — mid-motion crowd
    img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=900&h=1100&fit=crop&q=88',
    wash: 'rgba(120,15,15,0.22)',
    stamp: 'Events · Night',
    tag: '02',
  },
  {
    name: 'The Content Day',
    desc: 'A month of content in one afternoon — 30+ photos and reels for your business.',
    price: '~$1,000',
    // Blue-black — direct flash, dark background
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&h=1100&fit=crop&q=88',
    wash: 'rgba(10,20,60,0.28)',
    stamp: 'Business · Studio',
    tag: '03',
  },
];

export default function EditorialMoments() {
  return (
    <section className="bg-[#0a0a0a]">
      {/* Header */}
      <div className="px-8 md:px-14 pt-24 pb-16 max-w-[1400px] mx-auto">
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="text-[8px] font-body tracking-[0.5em] uppercase text-white/20 mb-8">
          What You Can Book
        </motion.p>
        <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="font-display font-semibold text-white leading-[0.9]" style={{ fontSize: 'clamp(32px, 5.5vw, 76px)' }}>
          Built for the way<br />the city <em>moves.</em>
        </motion.h2>
      </div>

      {/* Full-bleed alternating panels */}
      {MOMENTS.map((m, i) => (
        <motion.div
          key={m.name}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} border-t border-white/5`}
        >
          {/* Image */}
          <div className="md:w-[58%] relative overflow-hidden" style={{ height: 'clamp(280px, 42vw, 560px)' }}>
            <motion.img
              src={m.img}
              alt={m.name}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              style={{ filter: 'contrast(1.06) saturate(0.95)' }}
            />
            {/* Saturated color wash from the room */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(135deg, ${m.wash} 0%, rgba(10,10,10,0.15) 100%)` }} />
            {/* Grain */}
            <div className="absolute inset-0 opacity-25 mix-blend-overlay pointer-events-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`, backgroundSize: '180px 180px' }} />
            {/* Contact-sheet stamp */}
            <div className="absolute bottom-4 left-5 text-[7px] font-body tracking-[0.3em] uppercase text-white/25">{m.stamp}</div>
          </div>

          {/* Text — dark, sparse */}
          <div className={`md:w-[42%] flex flex-col justify-center px-10 md:px-14 lg:px-18 py-14 bg-[#0a0a0a]`}>
            <span className="text-[8px] font-body tracking-[0.4em] uppercase text-white/20 mb-5">{m.tag}</span>
            <h3 className="font-display text-white font-semibold leading-none mb-5" style={{ fontSize: 'clamp(28px, 3.5vw, 50px)' }}>{m.name}</h3>
            <p className="font-body text-[12px] text-white/35 leading-relaxed max-w-xs mb-8">{m.desc}</p>
            <div className="flex items-center justify-between border-t border-white/6 pt-5 max-w-xs">
              <span className="font-body text-[11px] text-white/25 tracking-wide">{m.price}</span>
              <Link to="/browse" className="text-[10px] font-body tracking-[0.08em] uppercase text-white/50 border-b border-white/15 pb-px hover:text-white hover:border-white/40 transition-all">
                Book this →
              </Link>
            </div>
          </div>
        </motion.div>
      ))}
    </section>
  );
}