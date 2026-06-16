import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

export default function GroupBookingFeature() {
  return (
    <section className="py-24 px-8 md:px-14 border-t" style={{ background: '#f0ede6', borderColor: 'rgba(26,39,68,0.1)' }}>
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-16 lg:gap-24 items-center">

          <div>
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="text-[8px] font-body tracking-[0.5em] uppercase mb-8" style={{ color: 'rgba(26,39,68,0.3)' }}>
              New · Group Booking
            </motion.p>
            <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="font-display font-semibold leading-[0.92] mb-7" style={{ fontSize: 'clamp(28px, 4vw, 56px)', color: '#1a2744' }}>
              Split the moment.<br /><em className="italic">Share the memory.</em>
            </motion.h2>
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="font-body text-[12px] leading-relaxed mb-10 max-w-sm" style={{ color: 'rgba(26,39,68,0.4)' }}>
              Two of you booking for a third person's birthday? Co-book it. Split the price. Everyone gets the final gallery — no account required.
            </motion.p>

            <div className="space-y-6 mb-10">
              {[
                { n: '01', t: 'One person books', d: 'Find your creator, pick the moment, lock the date.' },
                { n: '02', t: 'Invite friends to chip in', d: 'Each person pays their share via a payment link.' },
                { n: '03', t: 'Everyone gets the album', d: 'Full gallery shared with the group after delivery.' },
              ].map(s => (
                <div key={s.n} className="flex gap-5 items-start">
                  <span className="text-[8px] font-body tracking-[0.3em] mt-1 w-5 shrink-0" style={{ color: 'rgba(26,39,68,0.25)' }}>{s.n}</span>
                  <div>
                    <p className="font-body text-[12px] font-semibold mb-0.5" style={{ color: 'rgba(26,39,68,0.7)' }}>{s.t}</p>
                    <p className="font-body text-[11px] leading-relaxed" style={{ color: 'rgba(26,39,68,0.35)' }}>{s.d}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/browse" className="text-[10px] font-body tracking-[0.08em] uppercase border-b pb-px transition-all"
              style={{ color: 'rgba(26,39,68,0.4)', borderColor: 'rgba(26,39,68,0.2)' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#1a2744'; e.currentTarget.style.borderColor = '#1a2744'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(26,39,68,0.4)'; e.currentTarget.style.borderColor = 'rgba(26,39,68,0.2)'; }}>
              Book as a group
            </Link>
          </div>

          {/* Card mock — cream with navy border */}
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="p-7 border" style={{ background: '#ece9e2', borderColor: 'rgba(26,39,68,0.12)' }}>
            <p className="text-[7px] font-body tracking-[0.4em] uppercase mb-5" style={{ color: 'rgba(26,39,68,0.3)' }}>Collecting contributions</p>
            <p className="font-display text-[18px] font-semibold mb-0.5" style={{ color: '#1a2744' }}>Zara's Birthday Shoot</p>
            <p className="font-body text-[11px] mb-7" style={{ color: 'rgba(26,39,68,0.35)' }}>Williamsburg · June 28</p>

            <div className="space-y-2.5 mb-7">
              {[{ name: 'Maya', paid: true, amt: '$133' }, { name: 'Jordan', paid: true, amt: '$133' }, { name: 'You', paid: false, amt: '$134' }].map((c, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'rgba(26,39,68,0.08)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold"
                      style={{ background: c.paid ? '#1a2744' : 'rgba(26,39,68,0.1)', color: c.paid ? '#f0ede6' : 'rgba(26,39,68,0.4)' }}>{c.name[0]}</div>
                    <span className="font-body text-[12px]" style={{ color: 'rgba(26,39,68,0.5)' }}>{c.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-body text-[12px] font-medium" style={{ color: 'rgba(26,39,68,0.6)' }}>{c.amt}</span>
                    {c.paid && <Check className="w-3 h-3" style={{ color: 'rgba(26,39,68,0.3)' }} />}
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-5">
              <div className="flex justify-between text-[9px] font-body mb-2" style={{ color: 'rgba(26,39,68,0.3)' }}><span>$266 raised</span><span>$400 total</span></div>
              <div className="h-px relative" style={{ background: 'rgba(26,39,68,0.1)' }}>
                <motion.div initial={{ width: 0 }} whileInView={{ width: '66%' }} viewport={{ once: true }} transition={{ duration: 1.5, delay: 0.3 }}
                  className="h-px absolute top-0 left-0" style={{ background: '#1a2744' }} />
              </div>
            </div>

            <button className="w-full py-2.5 border text-[11px] font-body tracking-[0.05em] transition-all"
              style={{ borderColor: 'rgba(26,39,68,0.2)', color: 'rgba(26,39,68,0.6)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a2744'; e.currentTarget.style.color = '#1a2744'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(26,39,68,0.2)'; e.currentTarget.style.color = 'rgba(26,39,68,0.6)'; }}>
              Add your share — $134
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}