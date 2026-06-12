import React from 'react';
import { Camera, Users, Shield, Image } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
  {
    icon: Camera,
    title: 'Pick a moment',
    desc: "Birthday, dinner party, music video, content day — tell us what you're capturing.",
  },
  {
    icon: Users,
    title: 'Meet your creator',
    desc: 'Browse curated lensmen in your neighborhood. Every one is vetted and reviewed.',
  },
  {
    icon: Shield,
    title: 'We hold the money safely',
    desc: "Your payment is held in escrow until the job is done. No surprises, no risk.",
  },
  {
    icon: Image,
    title: 'Get your photos',
    desc: 'Edited photos and video delivered to you within days. Download, share, keep forever.',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground mb-3">How it works</p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
            Four steps to your perfect shoot
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-cream-dark flex items-center justify-center mx-auto mb-5">
                <step.icon className="w-6 h-6 text-foreground" strokeWidth={1.5} />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-gold mb-2 block">
                Step {i + 1}
              </span>
              <h3 className="font-display text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}