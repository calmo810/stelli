import React from 'react';
import { motion } from 'framer-motion';

const steps = [
  { num: '01', title: 'Pick your moment', desc: "Birthday, dinner, content day, music video — tell us what you're capturing." },
  { num: '02', title: 'Meet your lensman', desc: 'Browse curated creators in your neighborhood. Every one is vetted and reviewed.' },
  { num: '03', title: 'We hold the payment', desc: "Your payment is held safely in escrow until the job is done. Zero risk." },
  { num: '04', title: 'Get your content', desc: 'Edited photos and video delivered within days. Yours forever.' },
];

export default function HowItWorks() {
  return (
    <section className="py-28 px-8 md:px-16 lg:px-24 bg-[#F5F4EF]">
      <div className="max-w-[1300px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <p className="text-[10px] font-body tracking-[0.3em] uppercase text-[#1a2a6c]/40 mb-3">The Process</p>
          <h2 className="font-display text-[clamp(32px,4vw,56px)] font-semibold leading-tight text-[#1a1a1a] max-w-lg">
            Four steps to your perfect shoot.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border border-[#1a2a6c]/10 rounded-3xl overflow-hidden">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`p-8 flex flex-col gap-4 ${i < 3 ? 'border-r border-[#1a2a6c]/10' : ''} ${i >= 2 ? 'border-t border-[#1a2a6c]/10 md:border-t-0 lg:border-t-0' : ''} bg-white hover:bg-[#f5f4ef] transition-colors`}
            >
              <span className="text-[clamp(40px,4vw,56px)] font-display font-bold text-[#1a2a6c]/10 leading-none">{step.num}</span>
              <h3 className="font-display text-lg font-semibold text-[#1a1a1a]">{step.title}</h3>
              <p className="text-sm font-body text-[#666] leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}