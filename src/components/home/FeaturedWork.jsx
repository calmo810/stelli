import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// Scrapbook / Polaroid editorial gallery — unexpected layout, film borders
const IMAGES = [
  { url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=1000&fit=crop', caption: 'Birthday, Williamsburg', date: 'Jun 14', w: 'col-span-1', h: 'h-[380px] md:h-[520px]' },
  { url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop', caption: 'Proposal, Central Park', date: 'May 30', w: 'col-span-1', h: 'h-[260px] md:h-[340px]' },
  { url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=800&fit=crop', caption: 'Concert, Brooklyn', date: 'Jun 1', w: 'col-span-2 md:col-span-1', h: 'h-[280px] md:h-[360px] md:mt-20' },
  { url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop', caption: 'Rooftop, Bushwick', date: 'Jun 7', w: 'col-span-1', h: 'h-[260px] md:h-[300px]' },
  { url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop', caption: 'Launch night', date: 'Jun 9', w: 'col-span-2 md:col-span-2', h: 'h-[300px] md:h-[380px]' },
];

export default function FeaturedWork() {
  return (
    <section className="py-28 px-8 md:px-14 bg-[#F5F4EF]">
      <div className="max-w-[1400px] mx-auto">
        {/* Editorial header — left + right split */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-[8px] font-body tracking-[0.5em] uppercase text-[#1a2a6c]/30 mb-5">Recent Memories</p>
            <h2 className="font-display font-semibold text-[#1a2a6c] leading-[0.92]" style={{ fontSize: 'clamp(32px, 4vw, 60px)' }}>
              Every shot feels<br />like a <em>memory.</em>
            </h2>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="md:text-right">
            <p className="font-body text-[11px] text-[#aaa] leading-relaxed max-w-[200px] md:ml-auto mb-4">
              Shot in New York, 2026.<br />Real moments, real people.
            </p>
            <Link to="/browse" className="text-[11px] font-body tracking-[0.06em] uppercase text-[#1a2a6c] border-b border-[#1a2a6c]/25 pb-px hover:border-[#1a2a6c] transition-all">
              Browse all creators
            </Link>
          </motion.div>
        </div>

        {/* Asymmetric grid — art-directed, not generated */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {IMAGES.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.7 }}
              className={`group relative overflow-hidden ${img.w} ${img.h} bg-[#e8e6e0]`}
              style={{ borderRadius: '4px' }}
            >
              <motion.img
                src={img.url}
                alt={img.caption}
                className="w-full h-full object-cover"
                whileHover={{ scale: 1.04 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                loading="lazy"
              />
              {/* Film grain texture */}
              <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
              {/* Caption */}
              <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-black/50 to-transparent">
                <p className="text-white text-[11px] font-body">{img.caption}</p>
                <p className="text-white/40 text-[9px] font-body mt-0.5">{img.date}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Handwritten margin note */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-10 flex justify-end">
          <span className="font-display italic text-[12px] text-[#1a2a6c]/20 rotate-2 inline-block">"worth remembering"</span>
        </motion.div>
      </div>
    </section>
  );
}