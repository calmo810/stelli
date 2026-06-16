import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, Share2, Check } from 'lucide-react';

// Group booking / cost split feature explainer section
const STEPS = [
  {
    icon: '✦',
    title: 'One person books',
    desc: 'Find your lensman, pick the moment, lock the date. Takes three minutes.',
  },
  {
    icon: '✦',
    title: 'Split the cost',
    desc: 'Invite friends to chip in. Each pays their share — the booking confirms when the total is met.',
  },
  {
    icon: '✦',
    title: 'Everyone gets the memories',
    desc: 'After delivery, the full album is shared with everyone in the group. No one misses out.',
  },
];

export default function GroupBookingFeature() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section className="py-32 px-8 md:px-16 lg:px-28 bg-white">
      <div className="max-w-[1300px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

          {/* Left: text */}
          <div>
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="text-[9px] font-body tracking-[0.4em] uppercase text-[#1a2a6c]/35 mb-6">
              New · Group Booking
            </motion.p>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="font-display text-[clamp(32px,4vw,56px)] leading-[0.95] font-semibold text-[#1a2a6c] mb-6">
              Split the moment.<br /><em>Share the memory.</em>
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="font-body text-sm text-[#888] leading-relaxed mb-10 max-w-sm">
              Two of you commissioning a shoot for a third person's birthday? Co-book it. Split the price. Everyone gets the gallery.
            </motion.p>

            <div className="space-y-4">
              {STEPS.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setActiveStep(i)}
                  className={`flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all border ${activeStep === i ? 'border-[#1a2a6c]/20 bg-[#f5f4ef]' : 'border-transparent hover:border-[#1a2a6c]/10'}`}
                >
                  <span className="text-[#1a2a6c]/30 text-lg mt-0.5 w-5 shrink-0">{s.icon}</span>
                  <div>
                    <p className="font-body text-sm font-semibold text-[#1a2a6c] mb-1">{s.title}</p>
                    <p className="font-body text-xs text-[#999] leading-relaxed">{s.desc}</p>
                  </div>
                  {activeStep === i && <Check className="w-4 h-4 text-[#1a2a6c]/40 ml-auto shrink-0 mt-0.5" />}
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-10">
              <Link to="/browse"
                className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-[#1a2a6c] text-[#1a2a6c] text-[13px] font-body font-semibold hover:bg-[#1a2a6c] hover:text-white transition-all">
                <Users className="w-4 h-4" /> Book as a group
              </Link>
            </motion.div>
          </div>

          {/* Right: visual mock */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="relative">
            {/* Main card */}
            <div className="bg-[#f5f4ef] rounded-3xl p-8 border border-[#1a2a6c]/8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="font-display text-lg font-semibold text-[#1a2a6c]">Zara's Birthday Shoot</p>
                  <p className="font-body text-xs text-[#999] mt-1">Williamsburg · June 28</p>
                </div>
                <span className="text-[9px] font-body tracking-[0.2em] uppercase bg-[#1a2a6c]/8 text-[#1a2a6c] px-3 py-1.5 rounded-full">Collecting</span>
              </div>

              {/* Contributors */}
              <div className="space-y-3 mb-6">
                {[
                  { name: 'Maya', paid: true, amount: '$133' },
                  { name: 'Jordan', paid: true, amount: '$133' },
                  { name: 'You', paid: false, amount: '$134' },
                ].map((c, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-[#1a2a6c]/8">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold ${c.paid ? 'bg-[#1a2a6c] text-white' : 'bg-[#1a2a6c]/10 text-[#1a2a6c]'}`}>
                        {c.name[0]}
                      </div>
                      <span className="font-body text-sm text-[#333]">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-body text-sm font-medium text-[#1a2a6c]">{c.amount}</span>
                      {c.paid && <Check className="w-3.5 h-3.5 text-green-500" />}
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-[11px] font-body text-[#999] mb-2">
                  <span>$266 raised</span>
                  <span>$400 total</span>
                </div>
                <div className="h-1.5 bg-[#1a2a6c]/10 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} whileInView={{ width: '66%' }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.3 }}
                    className="h-full bg-[#1a2a6c] rounded-full" />
                </div>
              </div>

              <button className="w-full py-3 rounded-xl bg-[#1a2a6c] text-white text-[13px] font-body font-semibold hover:bg-[#22337a] transition-colors">
                Add your share — $134
              </button>
            </div>

            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, type: 'spring' }}
              className="absolute -bottom-4 -right-4 bg-white border border-[#1a2a6c]/10 rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3"
            >
              <Share2 className="w-4 h-4 text-[#1a2a6c]" />
              <div>
                <p className="font-body text-[11px] font-semibold text-[#1a2a6c]">Album shared</p>
                <p className="font-body text-[10px] text-[#999]">3 people have access</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}