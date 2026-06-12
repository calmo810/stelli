import React from 'react';
import { motion } from 'framer-motion';

const images = [
  { url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop', caption: 'Birthday celebration, Bushwick' },
  { url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&h=800&fit=crop', caption: 'Rooftop dinner, Williamsburg' },
  { url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop', caption: 'Music video shoot, Ridgewood' },
  { url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=500&fit=crop', caption: 'Corporate event, Manhattan' },
  { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop', caption: 'Proposal shoot, Central Park' },
  { url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=600&fit=crop', caption: 'Concert photography' },
];

export default function FeaturedWork() {
  return (
    <section className="py-24 px-6 bg-cream">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground mb-3">Featured work</p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
            Moments captured by our lensmen
          </h2>
        </motion.div>

        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {images.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="break-inside-avoid group relative overflow-hidden rounded-xl"
            >
              <img
                src={img.url}
                alt={img.caption}
                className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="absolute bottom-4 left-4 text-white text-sm font-medium">{img.caption}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}