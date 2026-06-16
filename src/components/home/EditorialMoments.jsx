import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// Editorial "What You Can Book" section — pitch deck slide 7 style
const MOMENTS = [
  {
    name: 'The Moment',
    desc: 'A surprise shoot of you and your people — the birthday, the hang, the main-character night.',
    price: 'from $39',
    tag: 'Personal',
    img: 'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=600&h=800&fit=crop',
  },
  {
    name: 'The Event Film',
    desc: 'Your night, cut for the feed — the party, the launch, the show, edited into reels ready to post.',
    price: 'from $420',
    tag: 'Events',
    img: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=800&fit=crop',
  },
  {
    name: 'The Content Day',
    desc: 'A month of content in one afternoon — 30+ photos and a handful of reels for your business.',
    price: '~$1,000',
    tag: 'Business',
    img: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=600&h=800&fit=crop',
  },
];

export default function EditorialMoments() {
  return (
    <section className="py-32 px-8 md:px-16 lg:px-28 bg-[#F5F4EF]">
      <div className="max-w-[1300px] mx-auto">
        {/* Header — pitch deck style */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-20">
          <p className="text-[9px] font-body tracking-[0.4em] uppercase text-[#1a2a6c]/35 mb-6">What You Can Book</p>
          <h2 className="font-display text-[clamp(36px,5vw,72px)] leading-[0.9] font-semibold text-[#1a2a6c] max-w-[700px]">
            Built for the way<br />the city <em>celebrates.</em>
          </h2>
        </motion.div>

        {/* Editorial table rows — then image cards */}
        <div className="border-t border-[#1a2a6c]/10">
          {MOMENTS.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group border-b border-[#1a2a6c]/10 py-8 grid grid-cols-1 md:grid-cols-[2fr_3fr_1fr] gap-6 items-center hover:bg-white/50 transition-colors px-2 -mx-2 rounded-xl cursor-pointer"
            >
              <h3 className="font-display text-[clamp(24px,3vw,40px)] font-semibold text-[#1a2a6c]">{m.name}</h3>
              <p className="font-body text-sm text-[#888] leading-relaxed max-w-sm">{m.desc}</p>
              <p className="font-body text-sm font-semibold text-[#1a2a6c]/60 md:text-right">{m.price}</p>
            </motion.div>
          ))}
        </div>

        {/* Image trio — editorial layout */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-4">
          {MOMENTS.map((m, i) => (
            <motion.div
              key={m.name + '-img'}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className={`relative overflow-hidden rounded-2xl group ${i === 1 ? 'md:mt-10' : ''}`}
              style={{ height: i === 1 ? 480 : 380 }}
            >
              <img src={m.img} alt={m.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a2a6c]/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <span className="text-[9px] font-body tracking-[0.3em] uppercase text-white/50 block mb-1">{m.tag}</span>
                <p className="font-display text-xl text-white font-semibold">{m.name}</p>
              </div>
              {/* Scribble annotation on middle card */}
              {i === 1 && (
                <div className="absolute top-4 right-4 font-display italic text-[10px] text-white/40 rotate-3">"perfect"</div>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-12 text-center">
          <Link to="/browse"
            className="inline-flex items-center gap-3 px-8 py-3.5 rounded-full border border-[#1a2a6c] text-[#1a2a6c] text-[13px] font-body font-semibold hover:bg-[#1a2a6c] hover:text-white transition-all">
            Find your creator
          </Link>
        </motion.div>
      </div>
    </section>
  );
}