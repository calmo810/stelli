import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const MOMENTS = ['Birthday', 'Dinner', 'Rooftop Hang', 'Music Video', 'Restaurant Opening', 'Content Day', 'Proposal', 'Wedding'];
const NEIGHBORHOODS = ['Williamsburg', 'Bushwick', 'DUMBO', 'West Village', 'SoHo', 'Chelsea', 'Greenpoint', 'Harlem'];

export default function HeroSection() {
  const navigate = useNavigate();
  const [momentOpen, setMomentOpen] = useState(false);
  const [neighborhoodOpen, setNeighborhoodOpen] = useState(false);
  const [selectedMoment, setSelectedMoment] = useState(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setMomentOpen(false);
        setNeighborhoodOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedMoment) params.set('event_type', selectedMoment.toLowerCase().replace(/ /g, '_'));
    if (selectedNeighborhood) params.set('neighborhood', selectedNeighborhood);
    navigate(`/browse?${params.toString()}`);
  };

  return (
    <section className="min-h-screen flex flex-col justify-between px-8 md:px-14 pt-28 pb-16" style={{ background: '#f0ede6' }}>

      {/* Top meta strip */}
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-body tracking-[0.4em] uppercase" style={{ color: 'rgba(26,39,68,0.3)' }}>N.Y.C — 2026</p>
        <p className="text-[9px] font-body tracking-[0.4em] uppercase" style={{ color: 'rgba(26,39,68,0.3)' }}>VOL. 01</p>
      </div>

      {/* Headline block — center of page, maximum scale */}
      <div className="flex-1 flex flex-col justify-center max-w-[1200px] pt-12 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* "keep forever" handwritten annotation */}
          <div className="relative inline-block mb-2">
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="absolute -top-7 right-0 text-[13px]"
              style={{ fontFamily: "'Dancing Script', cursive", color: 'rgba(26,39,68,0.45)', fontWeight: 600 }}
            >
              keep forever
            </motion.span>
            <h1 className="font-display font-semibold leading-[0.9]"
              style={{ fontSize: 'clamp(56px, 9.5vw, 136px)', color: '#1a2744' }}>
              Some moments
            </h1>
          </div>
          <h1 className="font-display font-semibold leading-[0.9]"
            style={{ fontSize: 'clamp(56px, 9.5vw, 136px)', color: '#1a2744' }}>
            only happen <em className="italic">once.</em>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.9 }}
          className="font-body text-[14px] leading-relaxed mt-8 max-w-sm"
          style={{ color: 'rgba(26,39,68,0.5)' }}
        >
          And the best ones never wait for you to be ready — the toast,<br className="hidden md:block" />
          the hug, the light at 8 p.m. They arrive, and then they're gone.
        </motion.p>
      </div>

      {/* Search + CTA — bottom of hero */}
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="flex flex-wrap items-center gap-3"
      >
        {/* Moment pill */}
        <div className="relative">
          <button
            onClick={() => { setMomentOpen(v => !v); setNeighborhoodOpen(false); }}
            className="flex items-center gap-2 text-[12px] font-body px-6 py-3.5 transition-all"
            style={{
              borderRadius: '999px',
              border: '1px solid rgba(26,39,68,0.2)',
              background: selectedMoment ? 'rgba(26,39,68,0.08)' : 'rgba(26,39,68,0.04)',
              color: selectedMoment ? '#1a2744' : 'rgba(26,39,68,0.5)',
            }}
          >
            {selectedMoment || "What's the moment?"}
            <ChevronDown className="w-3.5 h-3.5 opacity-40" />
          </button>
          <AnimatePresence>
            {momentOpen && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                className="absolute bottom-full mb-2 left-0 w-52 z-50 py-2 overflow-hidden"
                style={{ background: '#f8f5ef', border: '1px solid rgba(26,39,68,0.1)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(26,39,68,0.12)' }}>
                {MOMENTS.map(m => (
                  <button key={m} onMouseDown={e => { e.preventDefault(); setSelectedMoment(m); setMomentOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-[12px] font-body transition-colors"
                    style={{ color: 'rgba(26,39,68,0.5)' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#1a2744'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(26,39,68,0.5)'}>
                    {m}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Neighborhood pill */}
        <div className="relative">
          <button
            onClick={() => { setNeighborhoodOpen(v => !v); setMomentOpen(false); }}
            className="flex items-center gap-2 text-[12px] font-body px-6 py-3.5 transition-all"
            style={{
              borderRadius: '999px',
              border: '1px solid rgba(26,39,68,0.2)',
              background: selectedNeighborhood ? 'rgba(26,39,68,0.08)' : 'rgba(26,39,68,0.04)',
              color: selectedNeighborhood ? '#1a2744' : 'rgba(26,39,68,0.5)',
            }}
          >
            {selectedNeighborhood || 'Where in NYC?'}
            <ChevronDown className="w-3.5 h-3.5 opacity-40" />
          </button>
          <AnimatePresence>
            {neighborhoodOpen && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                className="absolute bottom-full mb-2 left-0 w-48 z-50 py-2 overflow-hidden"
                style={{ background: '#f8f5ef', border: '1px solid rgba(26,39,68,0.1)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(26,39,68,0.12)' }}>
                {NEIGHBORHOODS.map(n => (
                  <button key={n} onMouseDown={e => { e.preventDefault(); setSelectedNeighborhood(n); setNeighborhoodOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-[12px] font-body transition-colors"
                    style={{ color: 'rgba(26,39,68,0.5)' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#1a2744'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(26,39,68,0.5)'}>
                    {n}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={handleSearch}
          className="text-[11px] font-body tracking-[0.08em] uppercase px-7 py-3.5 font-semibold transition-all"
          style={{ borderRadius: '999px', background: '#1a2744', color: '#f0ede6' }}
          onMouseEnter={e => e.currentTarget.style.background = '#253560'}
          onMouseLeave={e => e.currentTarget.style.background = '#1a2744'}
        >
          Find your creator
        </button>

        {(selectedMoment || selectedNeighborhood) && (
          <button onClick={() => { setSelectedMoment(null); setSelectedNeighborhood(null); }}
            className="text-[10px] font-body transition-colors"
            style={{ color: 'rgba(26,39,68,0.25)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(26,39,68,0.6)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(26,39,68,0.25)'}>
            Clear
          </button>
        )}
      </motion.div>

      {/* Trust strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-6"
      >
        {['Vetted creators', 'Fixed prices', 'Payment held until delivery'].map((t, i) => (
          <span key={t} className="flex items-center gap-2 text-[9px] font-body tracking-[0.3em] uppercase" style={{ color: 'rgba(26,39,68,0.3)' }}>
            {i > 0 && <span style={{ color: 'rgba(26,39,68,0.15)' }}>·</span>}
            {t}
          </span>
        ))}
      </motion.div>
    </section>
  );
}