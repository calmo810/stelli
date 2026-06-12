import React from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

const testimonials = [
  {
    name: 'Sarah M.',
    event: 'Birthday Party',
    text: "I found my photographer in 5 minutes and got the most amazing photos I've ever seen. The whole process was so easy.",
    rating: 5,
  },
  {
    name: 'Marcus T.',
    event: 'Music Video',
    text: "Stelli connected me with a filmmaker who totally understood my vision. The escrow system gave me peace of mind.",
    rating: 5,
  },
  {
    name: 'Jade & Co.',
    event: 'Restaurant Launch',
    text: "We booked a content day for our opening. Got 60+ photos and a reel. Worth every penny.",
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground mb-3">Kind words</p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
            What our clients say
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-2xl p-8"
            >
              <div className="flex gap-0.5 mb-4">
                {[...Array(t.rating)].map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 text-gold fill-gold" />
                ))}
              </div>
              <p className="text-sm text-foreground leading-relaxed mb-6">"{t.text}"</p>
              <div>
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.event}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}