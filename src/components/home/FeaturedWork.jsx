import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const images = [
  { url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop', caption: 'Birthday celebration', location: 'Bushwick' },
  { url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=1000&fit=crop', caption: 'Rooftop dinner', location: 'Williamsburg' },
  { url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop', caption: 'Music video shoot', location: 'Ridgewood' },
  { url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=700&fit=crop', caption: 'Corporate event', location: 'Manhattan' },
  { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', caption: 'Proposal shoot', location: 'Central Park' },
  { url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=800&fit=crop', caption: 'Concert photography', location: 'Brooklyn' },
];

export default function FeaturedWork() {
  return (
    <section className="py-28 px-8 md:px-16 lg:px-24 bg-white">
      <div className="max-w-[1300px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12"
        >
          <div>
            <p className="text-[10px] font-body tracking-[0.3em] uppercase text-[#1a2a6c]/40 mb-3">Portfolio</p>
            <h2 className="font-display text-[clamp(28px,3.5vw,48px)] font-semibold leading-tight text-[#1a1a1a]">
              Moments captured.
            </h2>
          </div>
          <Link to="/browse" className="flex items-center gap-2 text-[13px] font-body font-semibold text-[#1a2a6c] hover:opacity-70 transition-opacity shrink-0">
            Browse all lensmen <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>

        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {images.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="break-inside-avoid group relative overflow-hidden rounded-2xl"
            >
              <img
                src={img.url}
                alt={img.caption}
                className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                <p className="text-white text-sm font-semibold font-body">{img.caption}</p>
                <p className="text-white/60 text-xs font-body">{img.location}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}