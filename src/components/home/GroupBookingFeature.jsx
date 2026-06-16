import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

export default function GroupBookingFeature() {
  return (
    <section className="bg-[#0d0d0d] py-24 px-8 md:px-14 border-t border-white/5">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-16 lg:gap-24 items-center">

          <div>
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="text-[8px] font-body tracking-[0.5em] uppercase text-white/20 mb-8">
              New · Group Booking
            </motion.p>
            <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="font-display font-semibold text-white leading-[0.92] mb-7" style={{ fontSize: 'clamp(28px, 4vw, 56px)' }}>
              Split the moment.<br /><em>Share the memory.</em>
            </motion.h2>
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="font-body text-[12px] text-white/30 leading-relaxed mb-10 max-w-sm">
              Two of you booking for a third person's birthday? Co-book it. Split the price. Everyone gets the final gallery — no account required.
            </motion.p>

            <div className="space-y-6 mb-10">
              {[
                { n: '01', t: 'One person books', d: 'Find your creator, pick the moment, lock the date.' },
                { n: '02', t: 'Invite friends to chip in', d: 'Each person pays their share via a payment link.' },
                { n: '03', t: 'Everyone gets the album', d: 'Full gallery shared with the group after delivery.' },
              ].map(s => (
                <div key={s.n} className="flex gap-5 items-start">
                  <span className="text-[8px] font-body tracking-[0.3em] text-white/15 mt-1 w-5 shrink-0">{s.n}</span>
                  <div>
                    <p className="font-body text-[12px] font-semibold text-white/60 mb-0.5">{s.t}</p>
                    <p className="font-body text-[11px] text-white/20 leading-relaxed">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/browse" className="text-[10px] font-body tracking-[0.08em] uppercase text-white/35 border-b border-white/12 pb-px hover:text-white/70 hover:border-white/35 transition-all">
              Book as a group
            </Link>
          </div>

          {/* Card mock — dark, minimal */}
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-[#111] border border-white/6 p-7">
            <p className="text-[7px] font-body tracking-[0.4em] uppercase text-white/20 mb-5">Collecting contributions</p>
            <p className="font-display text-[18px] font-semibold text-white mb-0.5">Zara's Birthday Shoot</p>
            <p className="font-body text-[11px] text-white/25 mb-7">Williamsburg · June 28</p>

            <div className="space-y-2.5 mb-7">
              {[{ name: 'Maya', paid: true, amt: '$133' }, { name: 'Jordan', paid: true, amt: '$133' }, { name: 'You', paid: false, amt: '$134' }].map((c, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold ${c.paid ? 'bg-white text-[#0a0a0a]' : 'bg-white/8 text-white/50'}`}>{c.name[0]}</div>
                    <span className="font-body text-[12px] text-white/50">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-body text-[12px] font-medium text-white/60">{c.amt}</span>
                    {c.paid && <Check className="w-3 h-3 text-white/30" />}
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-5">
              <div className="flex justify-between text-[9px] font-body text-white/20 mb-2"><span>$266 raised</span><span>$400 total</span></div>
              <div className="h-px bg-white/6 relative">
                <motion.div initial={{ width: 0 }} whileInView={{ width: '66%' }} viewport={{ once: true }} transition={{ duration: 1.5, delay: 0.3 }}
                  className="h-px bg-white/40 absolute top-0 left-0" />
              </div>
            </div>

            <button className="w-full py-2.5 border border-white/12 text-white/60 text-[11px] font-body tracking-[0.05em] hover:border-white/25 hover:text-white/80 transition-all">
              Add your share — $134
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}