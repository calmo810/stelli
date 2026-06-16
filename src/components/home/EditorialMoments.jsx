import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const MOMENTS = [
  { name: 'The Moment', desc: 'A surprise shoot of you and your people — the birthday, the hang, the main-character night.', price: 'from $39', img: 'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=700&h=900&fit=crop', tag: 'Personal' },
  { name: 'The Event Film', desc: 'Your night, cut for the feed — the party, the launch, the show, edited into reels ready to post.', price: 'from $420', img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=700&h=900&fit=crop', tag: 'Events' },
  { name: 'The Content Day', desc: 'A month of content in one afternoon — 30+ photos and a handful of reels for your business.', price: '~$1,000', img: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=700&h=900&fit=crop', tag: 'Business' },
];

export default function EditorialMoments() {
  return (
    <section className="bg-white overflow-hidden">
      {/* Header */}
      <div className="px-8 md:px-14 pt-28 pb-20 max-w-[1400px] mx-auto">
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="text-[8px] font-body tracking-[0.5em] uppercase text-[#1a2a6c]/30 mb-10">
          What You Can Book
        </motion.p>
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="font-display font-semibold text-[#1a2a6c] leading-[0.9] max-w-[800px]" style={{ fontSize: 'clamp(36px, 5.5vw, 80px)' }}>
          Built for the way<br />the city <em>celebrates.</em>
        </motion.h2>
      </div>

      {/* Asymmetric image + text pairs */}
      {MOMENTS.map((m, i) => (
        <motion.div
          key={m.name}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} border-t border-[#1a2a6c]/6`}
        >
          {/* Image — takes 55% on desktop */}
          <div className="md:w-[55%] relative overflow-hidden" style={{ height: 'clamp(300px, 45vw, 580px)' }}>
            <motion.img
              src={m.img}
              alt={m.name}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
            {/* Film-stamp overlay */}
            <div className="absolute bottom-4 left-4 text-[8px] font-body tracking-[0.3em] uppercase text-white/30">{m.tag}</div>
          </div>

          {/* Text — editorial, left-aligned, lots of air */}
          <div className={`md:w-[45%] flex flex-col justify-center px-10 md:px-16 lg:px-20 py-16 ${i % 2 === 0 ? '' : ''}`}>
            <span className="text-[8px] font-body tracking-[0.4em] uppercase text-[#1a2a6c]/30 mb-6">0{i + 1}</span>
            <h3 className="font-display text-[#1a2a6c] font-semibold leading-none mb-6" style={{ fontSize: 'clamp(32px, 4vw, 56px)' }}>{m.name}</h3>
            <p className="font-body text-sm text-[#aaa] leading-relaxed max-w-xs mb-8">{m.desc}</p>
            <div className="flex items-center justify-between border-t border-[#1a2a6c]/8 pt-6 max-w-xs">
              <span className="font-body text-xs text-[#1a2a6c]/50 tracking-wide">{m.price}</span>
              <Link to="/browse" className="text-[11px] font-body tracking-[0.06em] uppercase text-[#1a2a6c] border-b border-[#1a2a6c]/25 pb-px hover:border-[#1a2a6c] transition-all">
                Book this →
              </Link>
            </div>
          </div>
        </motion.div>
      ))}
    </section>
  );
}