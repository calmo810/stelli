import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const EVENT_TYPES = [
  'Birthday',
  'Dinner',
  'Rooftop Hang',
  'Music Video',
  'Restaurant Opening',
  'Content Day',
  'Proposal',
  'Wedding',
  'Corporate',
  'Custom',
];

const NEIGHBORHOODS = [
  'Anywhere in NYC',
  'Williamsburg',
  'Bushwick',
  'DUMBO',
  'Lower East Side',
  'Harlem',
  'Park Slope',
  'Midtown',
  'SoHo',
  'Astoria',
];

export default function HeroSection() {
  const navigate = useNavigate();
  const [moment, setMoment] = useState('');
  const [when, setWhen] = useState('');
  const [where, setWhere] = useState('');
  const [showMomentDropdown, setShowMomentDropdown] = useState(false);
  const [showWhereDropdown, setShowWhereDropdown] = useState(false);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (moment) params.set('event_type', moment.toLowerCase().replace(/ /g, '_'));
    if (where && where !== 'Anywhere in NYC') params.set('neighborhood', where);
    navigate(`/browse?${params.toString()}`);
  };

  return (
    <section className="relative min-h-[85vh] bg-[#F9F8F5] flex flex-col overflow-hidden">
      {/* Decorative crosses */}
      <span className="absolute top-24 right-[8%] text-gray-300 text-2xl font-light select-none">+</span>
      <span className="absolute top-[45%] right-[20%] text-[#c8b98a] text-lg font-light select-none opacity-60">+</span>
      <span className="absolute bottom-20 right-[6%] text-gray-300 text-xl font-light select-none">+</span>

      {/* Subtle warm gradient blob top-left */}
      <div className="absolute top-0 left-0 w-[400px] h-[300px] bg-gradient-to-br from-[#f5e9d0]/40 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 pt-28 pb-16 max-w-[1400px] mx-auto w-full">
        {/* Breadcrumb label */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs font-body tracking-[0.2em] text-gray-400 uppercase mb-8 flex items-center gap-3"
        >
          <span className="inline-block w-6 h-px bg-gray-300" />
          THE BRIEF · STELLI · 2026
        </motion.p>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display text-[clamp(40px,6vw,72px)] leading-[1.1] text-[#1a1a1a] mb-8 max-w-[700px]"
        >
          You're the star —{' '}
          <em className="italic font-display">we just bring the camera.</em>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="font-body text-[17px] text-gray-500 max-w-[560px] leading-relaxed mb-12"
        >
          Stelli is the booking platform for New York's best photographers and filmmakers. Pick the moment, book in three minutes, get back content the internet asks about.
        </motion.p>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative max-w-[640px]"
        >
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex items-stretch divide-x divide-gray-100 pr-3">
            {/* Moment */}
            <div className="relative flex-1 px-5 py-4 cursor-pointer" onClick={() => { setShowMomentDropdown(!showMomentDropdown); setShowWhereDropdown(false); }}>
              <p className="text-[11px] font-semibold font-body text-[#1a1a1a] mb-1">Moment</p>
              <p className="text-sm font-body text-gray-400 truncate">{moment || 'Restaurant opening...'}</p>
              {showMomentDropdown && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1.5 overflow-hidden">
                  {EVENT_TYPES.map((type) => (
                    <button
                      key={type}
                      className="w-full text-left px-4 py-2.5 text-sm font-body text-[#1a1a1a] hover:bg-gray-50 transition-colors"
                      onClick={(e) => { e.stopPropagation(); setMoment(type); setShowMomentDropdown(false); }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* When */}
            <div className="flex-1 px-5 py-4">
              <p className="text-[11px] font-semibold font-body text-[#1a1a1a] mb-1">When</p>
              <input
                type="date"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                className="text-sm font-body text-gray-400 bg-transparent border-none outline-none w-full cursor-pointer"
                placeholder="Add a night"
              />
            </div>

            {/* Where */}
            <div className="relative flex-1 px-5 py-4 cursor-pointer" onClick={() => { setShowWhereDropdown(!showWhereDropdown); setShowMomentDropdown(false); }}>
              <p className="text-[11px] font-semibold font-body text-[#1a1a1a] mb-1">Where</p>
              <p className="text-sm font-body text-gray-400 truncate">{where || 'Anywhere in NYC'}</p>
              {showWhereDropdown && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1.5 overflow-hidden">
                  {NEIGHBORHOODS.map((n) => (
                    <button
                      key={n}
                      className="w-full text-left px-4 py-2.5 text-sm font-body text-[#1a1a1a] hover:bg-gray-50 transition-colors"
                      onClick={(e) => { e.stopPropagation(); setWhere(n); setShowWhereDropdown(false); }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search button */}
            <div className="flex items-center pl-3">
              <button
                onClick={handleSearch}
                className="w-11 h-11 rounded-full bg-[#1a2a4a] flex items-center justify-center hover:bg-[#243557] hover:scale-105 transition-all duration-150"
              >
                <Plus className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-6"
        >
          {[
            { bold: 'Vetted', rest: 'creators only' },
            { bold: 'Fixed', rest: 'upfront prices' },
            { bold: 'Payment held', rest: 'until delivery' },
            { bold: 'Contracts', rest: 'built in' },
          ].map((item, i) => (
            <React.Fragment key={item.bold}>
              <span className="text-[13px] font-body text-gray-500">
                <span className="font-semibold text-[#1a1a1a]">{item.bold}</span> {item.rest}
              </span>
              {i < 3 && <span className="hidden sm:inline text-gray-200 text-sm">|</span>}
            </React.Fragment>
          ))}
        </motion.div>
      </div>
    </section>
  );
}