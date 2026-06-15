import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';

const HOURLY_RATE = 200; // base per hour
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
    <div className="min-h-screen bg-[#F5F4EF]">
      {/* Hero */}
      <section className="pt-28 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-[10px] font-body tracking-[0.3em] text-[#1a2a6c]/40 uppercase mb-5 flex items-center justify-center gap-3">
              <span className="inline-block w-6 h-px bg-[#1a2a6c]/20" />
              Content Day
              <span className="inline-block w-6 h-px bg-[#1a2a6c]/20" />
            </p>
            <h1 className="font-heading text-4xl sm:text-5xl font-semibold text-[#1a1a1a] mb-4 leading-tight">
              Build your Content Day.<br />See the real cost.
            </h1>
            <p className="text-[15px] font-body text-[#555] max-w-lg mx-auto leading-relaxed">
              Stack what you need — hours, deliverables, turnaround — and watch the price update live against what in-house talent actually costs.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Configurator */}
      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* Left: Controls */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm"
          >
            <h2 className="font-heading text-xl font-semibold text-[#1a1a1a] mb-8">Configure your day</h2>

            {/* Hours */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-body font-semibold text-[#1a1a1a]">Shoot duration</label>
                <span className="text-sm font-body font-semibold text-[#1a2a6c]">{hours} hours</span>
              </div>
              <input
                type="range" min={2} max={10} step={1} value={hours}
                onChange={e => setHours(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-gray-200 accent-[#1a2a6c] cursor-pointer"
              />
              <div className="flex justify-between mt-1.5 text-[10px] font-body text-gray-400">
                <span>2 hrs</span><span>4 hrs</span><span>6 hrs</span><span>8 hrs</span><span>10 hrs</span>
              </div>
            </div>

            {/* Deliverable count */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-body font-semibold text-[#1a1a1a]">Deliverable count</label>
                <span className="text-sm font-body font-semibold text-[#1a2a6c]">{deliverableCount} assets</span>
              </div>
              <input
                type="range" min={5} max={50} step={5} value={deliverableCount}
                onChange={e => setDeliverableCount(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-gray-200 accent-[#1a2a6c] cursor-pointer"
              />
              <div className="flex justify-between mt-1.5 text-[10px] font-body text-gray-400">
                <span>5</span><span>10</span><span>20</span><span>35</span><span>50</span>
              </div>
            </div>

            {/* Content types */}
            <div className="mb-8">
              <label className="text-sm font-body font-semibold text-[#1a1a1a] block mb-3">Content types</label>
              <div className="space-y-2">
                {DELIVERABLES.map(d => (
                  <button
                    key={d.id}
                    onClick={() => toggleDeliverable(d.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-body transition-all ${
                      selectedDeliverables.includes(d.id)
                        ? 'border-[#1a2a6c] bg-[#1a2a6c]/5 text-[#1a2a6c]'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                        selectedDeliverables.includes(d.id)
                          ? 'border-[#1a2a6c] bg-[#1a2a6c]'
                          : 'border-gray-300'
                      }`}>
                        {selectedDeliverables.includes(d.id) && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                      </span>
                      {d.label}
                    </span>
                    {d.premium && (
                      <span className="text-[11px] text-[#1a2a6c]/60">+${d.premium}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Add-ons */}
            <div className="mb-2">
              <label className="text-sm font-body font-semibold text-[#1a1a1a] block mb-3">Add-ons</label>
              <div className="space-y-2">
                {[
                  { id: 'rush', label: '48-hour rush delivery', cost: RUSH_ADDON, state: rushDelivery, set: setRushDelivery },
                  { id: 'edits', label: 'Extra edit round', cost: EXTRA_EDIT_ADDON, state: extraEdits, set: setExtraEdits },
                ].map(addon => (
                  <button
                    key={addon.id}
                    onClick={() => addon.set(!addon.state)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-body transition-all ${
                      addon.state
                        ? 'border-[#1a2a6c] bg-[#1a2a6c]/5 text-[#1a2a6c]'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                        addon.state ? 'border-[#1a2a6c] bg-[#1a2a6c]' : 'border-gray-300'
                      }`}>
                        {addon.state && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                      </span>
                      {addon.label}
                    </span>
                    <span className="text-[11px] text-[#1a2a6c]/60">+${addon.cost}</span>
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
            className="space-y-6"
          >
            {/* Price card */}
            <div className="bg-[#1a2a6c] rounded-3xl p-8 text-white">
              <p className="text-[11px] font-body tracking-[0.25em] uppercase text-white/50 mb-2">Your Content Day</p>
              <motion.div
                key={price}
                initial={{ scale: 1.04, opacity: 0.7 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="text-6xl font-heading font-semibold mb-1"
              >
                ${price.toLocaleString()}
              </motion.div>
              <p className="text-sm font-body text-white/60 mb-6">one-time · no subscription</p>

              <div className="space-y-2 text-sm font-body text-white/70 border-t border-white/10 pt-4">
                <div className="flex justify-between"><span>{hours}-hour shoot</span><span className="text-white">${hours * HOURLY_RATE}</span></div>
                {selectedDeliverables.includes('reels') && <div className="flex justify-between"><span>Reels premium</span><span className="text-white">+${REEL_PREMIUM}</span></div>}
                {selectedDeliverables.includes('bts') && <div className="flex justify-between"><span>BTS content</span><span className="text-white">+$100</span></div>}
                {rushDelivery && <div className="flex justify-between"><span>Rush delivery</span><span className="text-white">+${RUSH_ADDON}</span></div>}
                {extraEdits && <div className="flex justify-between"><span>Extra edit round</span><span className="text-white">+${EXTRA_EDIT_ADDON}</span></div>}
                <div className="flex justify-between pt-2 border-t border-white/10 font-semibold text-white">
                  <span>Total</span><span>${price.toLocaleString()}</span>
                </div>
              </div>

              <Link to="/browse">
                <button className="mt-6 w-full flex items-center justify-center gap-2 bg-white text-[#1a2a6c] font-body font-semibold py-3 rounded-2xl hover:bg-white/90 transition-all">
                  Book a Content Day <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>

            {/* Benchmark comparison */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <p className="text-sm font-body font-semibold text-[#1a1a1a] mb-1">vs. annual equivalent</p>
              <p className="text-[11px] font-body text-gray-400 mb-6">If you booked one Content Day per month: <strong className="text-[#1a2a6c]">${annualEquiv.toLocaleString()}/yr</strong></p>

              <div className="space-y-4">
                {/* Stelli bar */}
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[12px] font-body font-semibold text-[#1a2a6c]">Stelli (monthly)</span>
                    <span className="text-[12px] font-body font-semibold text-[#1a2a6c]">${annualEquiv.toLocaleString()}/yr</span>
                  </div>
                  <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-[#1a2a6c]"
                      animate={{ width: `${(annualEquiv / barMax) * 100}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                {BENCHMARKS.map(b => (
                  <div key={b.label}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[11px] font-body text-gray-500">{b.label}</span>
                      <span className="text-[11px] font-body text-gray-500">${b.annual.toLocaleString()}/yr</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gray-300"
                        animate={{ width: `${(b.annual / barMax) * 100}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[10px] font-body text-gray-400 mt-4">
                *Benchmark estimates based on industry averages. Stelli pricing is per-engagement with no overhead.
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}