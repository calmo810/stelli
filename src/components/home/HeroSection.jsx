import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const MOMENTS = ['Birthday', 'Dinner', 'Rooftop Hang', 'Music Video', 'Restaurant Opening', 'Content Day', 'Proposal', 'Wedding'];
const NEIGHBORHOODS = ['Williamsburg', 'Bushwick', 'DUMBO', 'West Village', 'SoHo', 'Chelsea', 'Greenpoint', 'Harlem'];

// Full-bleed editorial hero — image dominates, type overlaid
export default function HeroSection() {
  const navigate = useNavigate();
  const [momentOpen, setMomentOpen] = useState(false);
  const [neighborhoodOpen, setNeighborhoodOpen] = useState(false);
  const [selectedMoment, setSelectedMoment] = useState(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) { setMomentOpen(false); setNeighborhoodOpen(false); } };
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
    <section className="relative min-h-screen bg-[#F5F4EF] overflow-hidden flex flex-col">
      {/* Full-bleed background image — subtle parallax feel */}
      <motion.div
        initial={{ scale: 1.04 }}
        animate={{ scale: 1 }}
        transition={{ duration: 2.5, ease: 'easeOut' }}
        className="absolute inset-0"
      >
        <img
          src="https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=1800&h=1200&fit=crop&q=90"
          alt=""
          className="w-full h-full object-cover"
        />
        {/* Warm cream vignette — not a gradient, an overlay that keeps the cream palette */}
        <div className="absolute inset-0 bg-[#F5F4EF]/30" />
        <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-[#F5F4EF] via-[#F5F4EF]/60 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-[#F5F4EF]/40 to-transparent" />
      </motion.div>

      {/* Top-right film metadata */}
      <div className="absolute top-20 right-8 md:right-14 text-right pointer-events-none">
        <p className="text-[8px] font-body tracking-[0.4em] uppercase text-[#1a2a6c]/30">N.Y.C — 2026</p>
        <p className="text-[8px] font-body tracking-[0.4em] uppercase text-[#1a2a6c]/20 mt-0.5">Vol. 01</p>
      </div>

      {/* Main content — bottom-anchored editorial layout */}
      <div className="relative z-10 flex-1 flex flex-col justify-end px-8 md:px-14 pb-16 md:pb-20 max-w-[1400px] mx-auto w-full pt-24">

        {/* Micro label */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 1 }}
          className="text-[9px] font-body tracking-[0.5em] uppercase text-[#1a2a6c]/40 mb-8 flex items-center gap-3"
        >
          <span className="w-8 h-px bg-[#1a2a6c]/25 inline-block" />
          New York Creative Collective
        </motion.p>

        {/* Cinematic headline */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10"
        >
          <h1 className="font-display font-semibold text-[#1a2a6c] leading-[0.88] tracking-tight" style={{ fontSize: 'clamp(56px, 9vw, 130px)' }}>
            Some moments
          </h1>
          <h1 className="font-display font-semibold text-[#1a2a6c] leading-[0.88] tracking-tight" style={{ fontSize: 'clamp(56px, 9vw, 130px)' }}>
            only happen{' '}
            <em className="italic">once.</em>
          </h1>

          {/* Handwritten annotation */}
          <div className="flex items-center gap-3 mt-5 ml-1">
            <span className="font-display italic text-[#1a2a6c]/35 text-[13px]">keep forever</span>
            <svg width="80" height="10" viewBox="0 0 80 10" fill="none">
              <path d="M2 7 Q20 2 40 6 Q60 10 78 4" stroke="#1a2a6c" strokeWidth="0.8" strokeOpacity="0.2" fill="none" strokeLinecap="round"/>
            </svg>
          </div>
        </motion.div>

        {/* Minimal search — inline, editorial */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="flex flex-wrap items-center gap-2"
        >
          {/* Moment selector */}
          <div className="relative">
            <button
              onClick={() => { setMomentOpen(v => !v); setNeighborhoodOpen(false); }}
              className={`text-[12px] font-body tracking-[0.05em] px-5 py-2.5 rounded-full border transition-all ${selectedMoment ? 'border-[#1a2a6c] bg-[#1a2a6c] text-white' : 'border-[#1a2a6c]/20 bg-white/60 text-[#1a2a6c] hover:border-[#1a2a6c]/50 backdrop-blur-sm'}`}
            >
              {selectedMoment || 'What\'s the moment?'}
            </button>
            <AnimatePresence>
              {momentOpen && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  className="absolute bottom-full mb-2 left-0 w-52 bg-white border border-[#1a2a6c]/8 rounded-2xl shadow-xl z-50 py-2 overflow-hidden">
                  {MOMENTS.map(m => (
                    <button key={m} onMouseDown={e => { e.preventDefault(); setSelectedMoment(m); setMomentOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-[13px] font-body text-[#1a2a6c] hover:bg-[#f5f4ef] transition-colors">
                      {m}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Neighborhood selector */}
          <div className="relative">
            <button
              onClick={() => { setNeighborhoodOpen(v => !v); setMomentOpen(false); }}
              className={`text-[12px] font-body tracking-[0.05em] px-5 py-2.5 rounded-full border transition-all ${selectedNeighborhood ? 'border-[#1a2a6c] bg-[#1a2a6c] text-white' : 'border-[#1a2a6c]/20 bg-white/60 text-[#1a2a6c] hover:border-[#1a2a6c]/50 backdrop-blur-sm'}`}
            >
              {selectedNeighborhood || 'Where in NYC?'}
            </button>
            <AnimatePresence>
              {neighborhoodOpen && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  className="absolute bottom-full mb-2 left-0 w-48 bg-white border border-[#1a2a6c]/8 rounded-2xl shadow-xl z-50 py-2 overflow-hidden">
                  {NEIGHBORHOODS.map(n => (
                    <button key={n} onMouseDown={e => { e.preventDefault(); setSelectedNeighborhood(n); setNeighborhoodOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-[13px] font-body text-[#1a2a6c] hover:bg-[#f5f4ef] transition-colors">
                      {n}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={handleSearch}
            className="text-[12px] font-body tracking-[0.06em] uppercase px-6 py-2.5 rounded-full bg-[#1a2a6c] text-white hover:bg-[#22337a] transition-all"
          >
            Find your creator
          </button>

          {(selectedMoment || selectedNeighborhood) && (
            <button onClick={() => { setSelectedMoment(null); setSelectedNeighborhood(null); }}
              className="text-[10px] font-body text-[#1a2a6c]/30 hover:text-[#1a2a6c]/60 transition-colors">
              Clear
            </button>
          )}
        </motion.div>

        {/* Bottom metadata strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-8"
        >
          {['Vetted creators', 'Fixed prices', 'Payment held until delivery'].map((t, i) => (
            <span key={t} className="text-[9px] font-body tracking-[0.25em] uppercase text-[#1a2a6c]/35 flex items-center gap-2">
              {i > 0 && <span className="text-[#1a2a6c]/15">·</span>}
              {t}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-6 right-8 md:right-14 flex flex-col items-center gap-2"
      >
        <div className="w-px h-10 bg-[#1a2a6c]/15 relative overflow-hidden rounded-full">
          <motion.div animate={{ y: ['-100%', '200%'] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
            className="absolute w-full h-1/2 bg-[#1a2a6c]/40 rounded-full" />
        </div>
        <span className="text-[8px] font-body tracking-[0.3em] uppercase text-[#1a2a6c]/25 rotate-90 origin-center" style={{ writingMode: 'vertical-rl' }}>Scroll</span>
      </motion.div>
    </section>
  );
}