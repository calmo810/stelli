import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';

const HOURLY_RATE = 200;
const REEL_PREMIUM = 300;
const RUSH_ADDON = 250;
const EXTRA_EDIT_ADDON = 150;

const BENCHMARKS = [
  { label: 'Full-time Social Manager', annual: 72000 },
  { label: 'Freelance Retainer (monthly)', annual: 36000 },
  { label: 'Agency Retainer', annual: 96000 },
];

const DELIVERABLES = [
  { id: 'stills', label: 'Edited stills', base: 0 },
  { id: 'reels', label: 'Short-form reels', premium: REEL_PREMIUM },
  { id: 'bts', label: 'BTS content', premium: 100 },
];

export default function ContentDay() {
  const [hours, setHours] = useState(4);
  const [deliverableCount, setDeliverableCount] = useState(10);
  const [selectedDeliverables, setSelectedDeliverables] = useState(['stills']);
  const [rushDelivery, setRushDelivery] = useState(false);
  const [extraEdits, setExtraEdits] = useState(false);

  const toggleDeliverable = (id) => {
    setSelectedDeliverables(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const price = (() => {
    let total = hours * HOURLY_RATE;
    if (selectedDeliverables.includes('reels')) total += REEL_PREMIUM;
    if (selectedDeliverables.includes('bts')) total += 100;
    if (rushDelivery) total += RUSH_ADDON;
    if (extraEdits) total += EXTRA_EDIT_ADDON;
    return total;
  })();

  const annualEquiv = price * 12;
  const maxBenchmark = Math.max(...BENCHMARKS.map(b => b.annual));
  const barMax = Math.max(maxBenchmark, annualEquiv);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* HERO — PinPost-style: centered, clear value prop, scroll-in images below */}
      <section className="pt-32 pb-20 px-8 md:px-14 text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16,1,0.3,1] }}>
          <p className="text-[8px] font-body tracking-[0.5em] uppercase mb-6 flex items-center justify-center gap-3" style={{ color: 'rgba(242,220,169,0.5)' }}>
            <span className="w-6 h-px inline-block" style={{ background: 'rgba(242,220,169,0.3)' }} />
            Content Day
            <span className="w-6 h-px inline-block" style={{ background: 'rgba(242,220,169,0.3)' }} />
          </p>
          <h1 className="font-display font-semibold text-white leading-[0.9] mb-6" style={{ fontSize: 'clamp(42px, 6.5vw, 96px)' }}>
            A month of content.<br /><em className="italic" style={{ color: '#F2DCA9' }}>One afternoon.</em>
          </h1>
          <p className="font-body text-[15px] max-w-lg mx-auto leading-relaxed mb-10" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Build your exact day — hours, deliverables, turnaround — and see the real price before you book.
            No subscriptions. No overhead. We hold your money safe until the work is done.
          </p>
          <p className="text-[9px] font-body tracking-[0.3em] uppercase" style={{ color: 'rgba(242,220,169,0.3)' }}>↓ configure below</p>
        </motion.div>
      </section>

      {/* Scrolling preview strip — content types shown like PinPost's phone mockups */}
      <section className="overflow-hidden mb-20">
        <div className="flex gap-3 px-8 md:px-14 pb-2">
          {[
            { label: 'Product Stills', img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=500&fit=crop&q=80' },
            { label: 'Short-Form Reels', img: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&h=500&fit=crop&q=80' },
            { label: 'Brand Content', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=500&fit=crop&q=80' },
            { label: 'Event Coverage', img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=500&fit=crop&q=80' },
            { label: 'BTS Content', img: 'https://images.unsplash.com/photo-1524593166156-312f362cada0?w=400&h=500&fit=crop&q=80' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07, duration: 0.7, ease: [0.16,1,0.3,1] }}
              className="relative flex-shrink-0 overflow-hidden"
              style={{ width: 180, height: 240, borderRadius: 12 }}
            >
              <img src={item.img} alt={item.label} className="w-full h-full object-cover" style={{ filter: 'contrast(1.05) saturate(0.8) brightness(0.7)' }} />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,10,10,0.8) 0%, transparent 60%)' }} />
              <p className="absolute bottom-3 left-3 text-[9px] font-body tracking-[0.15em] uppercase" style={{ color: 'rgba(242,220,169,0.7)' }}>{item.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Configurator */}
      <section className="pb-32 px-8 md:px-14">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* Left: Controls */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="border border-white/6 p-8"
            style={{ borderRadius: 2 }}
          >
            <p className="text-[8px] font-body tracking-[0.4em] uppercase mb-8" style={{ color: 'rgba(242,220,169,0.4)' }}>Configure your day</p>

            {/* Hours */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <label className="text-[12px] font-body uppercase tracking-[0.1em] text-white/50">Shoot duration</label>
                <span className="font-display text-[22px] font-semibold text-white">{hours}<span className="text-[13px] ml-1 text-white/40">hrs</span></span>
              </div>
              <input
                type="range" min={2} max={10} step={1} value={hours}
                onChange={e => setHours(Number(e.target.value))}
                className="w-full h-px appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, #F2DCA9 ${((hours-2)/8)*100}%, rgba(255,255,255,0.1) ${((hours-2)/8)*100}%)`, accentColor: '#F2DCA9' }}
              />
              <div className="flex justify-between mt-2 text-[9px] font-body text-white/20">
                <span>2 hrs</span><span>6 hrs</span><span>10 hrs</span>
              </div>
            </div>

            {/* Deliverable count */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <label className="text-[12px] font-body uppercase tracking-[0.1em] text-white/50">Deliverable count</label>
                <span className="font-display text-[22px] font-semibold text-white">{deliverableCount}<span className="text-[13px] ml-1 text-white/40">assets</span></span>
              </div>
              <input
                type="range" min={5} max={50} step={5} value={deliverableCount}
                onChange={e => setDeliverableCount(Number(e.target.value))}
                className="w-full h-px appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, #F2DCA9 ${((deliverableCount-5)/45)*100}%, rgba(255,255,255,0.1) ${((deliverableCount-5)/45)*100}%)` }}
              />
              <div className="flex justify-between mt-2 text-[9px] font-body text-white/20">
                <span>5</span><span>25</span><span>50</span>
              </div>
            </div>

            {/* Content types */}
            <div className="mb-8">
              <p className="text-[12px] font-body uppercase tracking-[0.1em] text-white/50 mb-4">Content types</p>
              <div className="space-y-2">
                {DELIVERABLES.map(d => (
                  <button
                    key={d.id}
                    onClick={() => toggleDeliverable(d.id)}
                    className="w-full flex items-center justify-between px-4 py-3 border text-[12px] font-body transition-all text-left"
                    style={{
                      borderColor: selectedDeliverables.includes(d.id) ? 'rgba(242,220,169,0.4)' : 'rgba(255,255,255,0.06)',
                      background: selectedDeliverables.includes(d.id) ? 'rgba(242,220,169,0.05)' : 'transparent',
                      color: selectedDeliverables.includes(d.id) ? '#F2DCA9' : 'rgba(255,255,255,0.4)',
                      borderRadius: 2,
                    }}
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-3.5 h-3.5 border flex items-center justify-center flex-shrink-0"
                        style={{ borderColor: selectedDeliverables.includes(d.id) ? '#F2DCA9' : 'rgba(255,255,255,0.15)', background: selectedDeliverables.includes(d.id) ? '#F2DCA9' : 'transparent' }}>
                        {selectedDeliverables.includes(d.id) && <Check className="w-2.5 h-2.5" style={{ color: '#0a0a0a' }} strokeWidth={3} />}
                      </span>
                      {d.label}
                    </span>
                    {d.premium && <span className="text-[10px] opacity-60">+${d.premium}</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Add-ons */}
            <div>
              <p className="text-[12px] font-body uppercase tracking-[0.1em] text-white/50 mb-4">Add-ons</p>
              <div className="space-y-2">
                {[
                  { id: 'rush', label: '48-hour rush delivery', cost: RUSH_ADDON, state: rushDelivery, set: setRushDelivery },
                  { id: 'edits', label: 'Extra edit round', cost: EXTRA_EDIT_ADDON, state: extraEdits, set: setExtraEdits },
                ].map(addon => (
                  <button
                    key={addon.id}
                    onClick={() => addon.set(!addon.state)}
                    className="w-full flex items-center justify-between px-4 py-3 border text-[12px] font-body transition-all text-left"
                    style={{
                      borderColor: addon.state ? 'rgba(242,220,169,0.4)' : 'rgba(255,255,255,0.06)',
                      background: addon.state ? 'rgba(242,220,169,0.05)' : 'transparent',
                      color: addon.state ? '#F2DCA9' : 'rgba(255,255,255,0.4)',
                      borderRadius: 2,
                    }}
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-3.5 h-3.5 border flex items-center justify-center flex-shrink-0"
                        style={{ borderColor: addon.state ? '#F2DCA9' : 'rgba(255,255,255,0.15)', background: addon.state ? '#F2DCA9' : 'transparent' }}>
                        {addon.state && <Check className="w-2.5 h-2.5" style={{ color: '#0a0a0a' }} strokeWidth={3} />}
                      </span>
                      {addon.label}
                    </span>
                    <span className="text-[10px] opacity-60">+${addon.cost}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right: Price + Benchmark */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            {/* Price card */}
            <div className="border border-white/6 p-8" style={{ borderRadius: 2 }}>
              <p className="text-[8px] font-body tracking-[0.4em] uppercase mb-4" style={{ color: 'rgba(242,220,169,0.4)' }}>Your Content Day</p>
              <motion.div
                key={price}
                initial={{ opacity: 0.6 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="font-display font-semibold text-white mb-1"
                style={{ fontSize: 'clamp(52px, 7vw, 84px)', lineHeight: 1 }}
              >
                ${price.toLocaleString()}
              </motion.div>
              <p className="text-[11px] font-body mb-8" style={{ color: 'rgba(255,255,255,0.25)' }}>one-time · no subscription</p>

              <div className="space-y-2.5 text-[12px] font-body border-t pt-5" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex justify-between"><span style={{ color: 'rgba(255,255,255,0.35)' }}>{hours}-hour shoot</span><span className="text-white">${hours * HOURLY_RATE}</span></div>
                {selectedDeliverables.includes('reels') && <div className="flex justify-between"><span style={{ color: 'rgba(255,255,255,0.35)' }}>Reels premium</span><span className="text-white">+${REEL_PREMIUM}</span></div>}
                {selectedDeliverables.includes('bts') && <div className="flex justify-between"><span style={{ color: 'rgba(255,255,255,0.35)' }}>BTS content</span><span className="text-white">+$100</span></div>}
                {rushDelivery && <div className="flex justify-between"><span style={{ color: 'rgba(255,255,255,0.35)' }}>Rush delivery</span><span className="text-white">+${RUSH_ADDON}</span></div>}
                {extraEdits && <div className="flex justify-between"><span style={{ color: 'rgba(255,255,255,0.35)' }}>Extra edit round</span><span className="text-white">+${EXTRA_EDIT_ADDON}</span></div>}
                <div className="flex justify-between pt-3 font-semibold text-white border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <span>Total</span><span>${price.toLocaleString()}</span>
                </div>
              </div>

              <Link to="/browse">
                <button className="mt-7 w-full flex items-center justify-center gap-2 py-3.5 text-[11px] font-body tracking-[0.08em] uppercase font-semibold transition-all"
                  style={{ background: '#F2DCA9', color: '#0a0a0a', borderRadius: 2 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#ede0b8'}
                  onMouseLeave={e => e.currentTarget.style.background = '#F2DCA9'}>
                  Book a Content Day <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            </div>

            {/* Benchmark */}
            <div className="border border-white/6 p-8" style={{ borderRadius: 2 }}>
              <p className="text-[12px] font-body font-semibold text-white mb-1">vs. annual equivalent</p>
              <p className="text-[11px] font-body mb-7" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Monthly bookings annualized: <strong style={{ color: '#F2DCA9' }}>${annualEquiv.toLocaleString()}/yr</strong>
              </p>

              <div className="space-y-5">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-[11px] font-body font-semibold" style={{ color: '#F2DCA9' }}>Stelli (monthly)</span>
                    <span className="text-[11px] font-body" style={{ color: '#F2DCA9' }}>${annualEquiv.toLocaleString()}/yr</span>
                  </div>
                  <div className="h-px relative" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <motion.div
                      className="h-px absolute top-0 left-0"
                      style={{ background: '#F2DCA9' }}
                      animate={{ width: `${(annualEquiv / barMax) * 100}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                {BENCHMARKS.map(b => (
                  <div key={b.label}>
                    <div className="flex justify-between mb-2">
                      <span className="text-[11px] font-body" style={{ color: 'rgba(255,255,255,0.3)' }}>{b.label}</span>
                      <span className="text-[11px] font-body" style={{ color: 'rgba(255,255,255,0.3)' }}>${b.annual.toLocaleString()}/yr</span>
                    </div>
                    <div className="h-px relative" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div
                        className="h-px absolute top-0 left-0"
                        style={{ background: 'rgba(255,255,255,0.15)' }}
                        animate={{ width: `${(b.annual / barMax) * 100}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[9px] font-body mt-6" style={{ color: 'rgba(255,255,255,0.15)' }}>
                *Benchmark estimates based on industry averages. Stelli pricing is per-engagement with no overhead.
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}