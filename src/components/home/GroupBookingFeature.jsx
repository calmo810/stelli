import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, Share2, Check } from 'lucide-react';

export default function GroupBookingFeature() {
  return (
    <section className="bg-white py-28 px-8 md:px-14">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-16 lg:gap-24 items-center">

          {/* Left */}
          <div>
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="text-[8px] font-body tracking-[0.5em] uppercase text-[#1a2a6c]/30 mb-10">
              New · Group Booking
            </motion.p>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="font-display font-semibold text-[#1a2a6c] leading-[0.92] mb-8" style={{ fontSize: 'clamp(32px, 4vw, 60px)' }}>
              Split the moment.<br /><em>Share the memory.</em>
            </motion.h2>
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="font-body text-sm text-[#aaa] leading-relaxed mb-12 max-w-sm">
              Two of you commissioning a shoot for a third person's birthday? Co-book it. Split the price evenly. Everyone receives access to the final gallery — no account required.
            </motion.p>

            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="space-y-8">
              {[
                { n: '01', title: 'One person books', desc: 'Find your lensman, pick the moment, lock the date.' },
                { n: '02', title: 'Invite friends to chip in', desc: 'Share a payment link. Each person covers their share.' },
                { n: '03', title: 'Everyone gets the album', desc: 'After delivery, the full gallery is shared with the group.' },
              ].map(s => (
                <div key={s.n} className="flex gap-6 items-start">
                  <span className="text-[9px] font-body tracking-[0.3em] text-[#1a2a6c]/25 mt-1 w-5 shrink-0">{s.n}</span>
                  <div>
                    <p className="font-body text-sm font-semibold text-[#1a2a6c] mb-1">{s.title}</p>
                    <p className="font-body text-xs text-[#bbb] leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-12">
              <Link to="/browse" className="inline-flex items-center gap-2 text-[11px] font-body tracking-[0.06em] uppercase text-[#1a2a6c] border-b border-[#1a2a6c]/25 pb-px hover:border-[#1a2a6c] transition-all">
                <Users className="w-3.5 h-3.5" /> Book as a group
              </Link>
            </motion.div>
          </div>

          {/* Right — minimal card mock */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative">
            <div className="bg-[#F5F4EF] p-8 border border-[#1a2a6c]/6" style={{ borderRadius: '4px' }}>
              <p className="text-[8px] font-body tracking-[0.4em] uppercase text-[#1a2a6c]/35 mb-6">Collecting contributions</p>
              <p className="font-display text-xl font-semibold text-[#1a2a6c] mb-1">Zara's Birthday Shoot</p>
              <p className="font-body text-xs text-[#bbb] mb-8">Williamsburg · June 28</p>

              <div className="space-y-3 mb-8">
                {[{ name: 'Maya', paid: true, amt: '$133' }, { name: 'Jordan', paid: true, amt: '$133' }, { name: 'You', paid: false, amt: '$134' }].map((c, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 border-b border-[#1a2a6c]/6">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold ${c.paid ? 'bg-[#1a2a6c] text-white' : 'bg-[#1a2a6c]/8 text-[#1a2a6c]'}`}>{c.name[0]}</div>
                      <span className="font-body text-[13px] text-[#333]">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-body text-[13px] font-medium text-[#1a2a6c]">{c.amt}</span>
                      {c.paid && <Check className="w-3 h-3 text-green-500" />}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-6">
                <div className="flex justify-between text-[10px] font-body text-[#bbb] mb-2"><span>$266 raised</span><span>$400 total</span></div>
                <div className="h-px bg-[#1a2a6c]/8 relative">
                  <motion.div initial={{ width: 0 }} whileInView={{ width: '66%' }} viewport={{ once: true }} transition={{ duration: 1.5, delay: 0.3 }}
                    className="h-px bg-[#1a2a6c] absolute top-0 left-0" />
                </div>
              </div>

              <button className="w-full py-3 bg-[#1a2a6c] text-white text-[12px] font-body tracking-[0.05em] rounded-full hover:bg-[#22337a] transition-colors">
                Add your share — $134
              </button>
            </div>

            {/* Floating album access note */}
            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.5 }}
              className="absolute -bottom-5 -right-5 bg-white border border-[#1a2a6c]/8 px-4 py-3 shadow-sm flex items-center gap-3" style={{ borderRadius: '4px' }}>
              <Share2 className="w-3.5 h-3.5 text-[#1a2a6c]" />
              <div>
                <p className="font-body text-[11px] font-semibold text-[#1a2a6c]">Album shared with all 3</p>
                <p className="font-body text-[9px] text-[#bbb]">No account required</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}