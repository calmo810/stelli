import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const EVENT_TYPES = [
  'Birthday', 'Dinner', 'Rooftop Hang', 'Music Video',
  'Restaurant Opening', 'Content Day', 'Proposal', 'Wedding', 'Corporate', 'Custom',
];

const NEIGHBORHOODS = [
  'Anywhere in NYC', 'Williamsburg', 'Bushwick', 'DUMBO',
  'Lower East Side', 'Harlem', 'Park Slope', 'Midtown', 'SoHo', 'Astoria',
];

function Dropdown({ options, onSelect, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1 w-52 bg-white border border-gray-200 rounded-2xl shadow-xl z-[9999] py-2 overflow-hidden"
    >
      {options.map((opt) => (
        <button
          key={opt}
          className="w-full text-left px-4 py-2.5 text-sm font-body text-[#1a1a1a] hover:bg-[#f5f4ef] transition-colors"
          onMouseDown={(e) => { e.preventDefault(); onSelect(opt); onClose(); }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

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
    <section className="relative min-h-screen bg-[#F5F4EF] flex flex-col">

      {/* Subtle star decoration */}
      <span className="absolute top-28 right-[10%] text-[#1a2a6c]/15 text-3xl select-none">✦</span>
      <span className="absolute top-[55%] right-[5%] text-[#1a2a6c]/10 text-xl select-none">✦</span>
      <span className="absolute bottom-32 left-[8%] text-[#1a2a6c]/10 text-2xl select-none">✦</span>

      <div className="relative z-10 flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 pt-24 pb-20 max-w-[1300px] mx-auto w-full">

        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-[10px] font-body tracking-[0.3em] text-[#1a2a6c]/40 uppercase mb-8 flex items-center gap-3"
        >
          <span className="inline-block w-8 h-px bg-[#1a2a6c]/20" />
          New York Creative Collective — Est. 2026
        </motion.p>

        {/* Logo as headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="mb-4"
        >
          <img
            src="https://media.base44.com/images/public/6a2c4e448e7fec52fb6d322a/b178af09a_Screenshot2026-06-14at105757PM.png"
            alt="Stelli"
            className="h-[clamp(80px,12vw,160px)] w-auto object-contain"
            style={{ imageRendering: 'crisp-edges' }}
          />
        </motion.div>

        {/* Subhead */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="font-body text-[15px] text-[#555] max-w-[460px] leading-relaxed mb-10 ml-1"
        >
          Book New York's best photographers & filmmakers — fixed prices, vetted talent, payment held until delivery.
        </motion.p>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-[620px]"
        >
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-stretch divide-y sm:divide-y-0 sm:divide-x divide-gray-100">

            {/* Moment */}
            <div
              className="relative flex-1 px-5 py-4 cursor-pointer"
              onClick={() => { setShowMomentDropdown(!showMomentDropdown); setShowWhereDropdown(false); }}
            >
              <p className="text-[10px] font-semibold font-body text-[#1a1a1a] tracking-wider uppercase mb-1">Moment</p>
              <p className="text-sm font-body text-gray-400 truncate">{moment || 'e.g. Birthday...'}</p>
              {showMomentDropdown && (
                <Dropdown
                  options={EVENT_TYPES}
                  onSelect={setMoment}
                  onClose={() => setShowMomentDropdown(false)}
                />
              )}
            </div>

            {/* When */}
            <div className="flex-1 px-5 py-4">
              <p className="text-[10px] font-semibold font-body text-[#1a1a1a] tracking-wider uppercase mb-1">When</p>
              <input
                type="date"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                className="text-sm font-body text-gray-400 bg-transparent border-none outline-none w-full cursor-pointer"
              />
            </div>

            {/* Where */}
            <div
              className="relative flex-1 px-5 py-4 cursor-pointer"
              onClick={() => { setShowWhereDropdown(!showWhereDropdown); setShowMomentDropdown(false); }}
            >
              <p className="text-[10px] font-semibold font-body text-[#1a1a1a] tracking-wider uppercase mb-1">Where</p>
              <p className="text-sm font-body text-gray-400 truncate">{where || 'Anywhere in NYC'}</p>
              {showWhereDropdown && (
                <Dropdown
                  options={NEIGHBORHOODS}
                  onSelect={setWhere}
                  onClose={() => setShowWhereDropdown(false)}
                />
              )}
            </div>

            {/* Button */}
            <div className="flex items-center px-4 py-3 sm:py-0">
              <button
                onClick={handleSearch}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 h-10 rounded-full bg-[#1a2a6c] text-white text-sm font-body font-medium hover:bg-[#22337a] transition-all"
              >
                Search <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Trust pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-wrap gap-3 mt-7 ml-1"
        >
          {['Vetted creators only', 'Fixed upfront prices', 'Payment held in escrow', 'Contracts built in'].map((label) => (
            <span key={label} className="text-[11px] font-body text-[#1a2a6c]/60 border border-[#1a2a6c]/15 rounded-full px-3 py-1">
              {label}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}