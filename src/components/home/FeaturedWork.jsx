import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

// Editorial asymmetric masonry — film-flash aesthetic
const images = [
  { url: 'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=700&h=900&fit=crop', caption: 'Birthday, Williamsburg', orientation: 'tall' },
  { url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=500&fit=crop', caption: 'Launch night, Manhattan', orientation: 'wide' },
  { url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=700&h=700&fit=crop', caption: 'Rooftop, Bushwick', orientation: 'square' },
  { url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=700&h=900&fit=crop', caption: 'Dinner party, West Village', orientation: 'tall' },
  { url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=500&fit=crop', caption: 'Concert, Brooklyn', orientation: 'wide' },
  { url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=700&h=700&fit=crop', caption: 'Proposal, Central Park', orientation: 'square' },
];

export default function FeaturedWork() {
  return (
    <section className="py-32 px-8 md:px-16 lg:px-28 bg-[#F5F4EF]">
      <div className="max-w-[1300px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-16">
          <div>
            <p className="text-[9px] font-body tracking-[0.4em] uppercase text-[#1a2a6c]/35 mb-5">Recent Memories</p>
            <h2 className="font-display text-[clamp(32px,4vw,56px)] leading-[0.95] font-semibold text-[#1a2a6c]">
              Every shot feels like<br />a memory.
            </h2>
          </div>
          <Link to="/browse" className="flex items-center gap-2 text-[12px] font-body font-semibold text-[#1a2a6c]/60 hover:text-[#1a2a6c] transition-colors shrink-0 mb-1">
            Browse creators <ArrowRight className="w-3 h-3" />
          </Link>
        </motion.div>

        {/* Asymmetric editorial grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {images.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className={`group relative overflow-hidden rounded-2xl cursor-pointer ${
                i === 0 || i === 3 ? 'row-span-2' : ''
              }`}
              style={{ height: (i === 0 || i === 3) ? 520 : 240 }}
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.4 }}
            >
              <img src={img.url} alt={img.caption} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
              {/* Film grain overlay */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 flex flex-col justify-end p-5">
                <p className="text-white text-[12px] font-body font-medium">{img.caption}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}