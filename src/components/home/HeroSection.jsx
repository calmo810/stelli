import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

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
    <section className="relative min-h-screen bg-[#0a0a0a] overflow-hidden flex flex-col">

      {/* HERO IMAGE — direct flash park shot, blown-out sun, mid-motion people */}
      <motion.div
        initial={{ scale: 1.04 }}
        animate={{ scale: 1 }}
        transition={{ duration: 3, ease: 'easeOut' }}
        className="absolute inset-0"
      >
        {/* Using the Unsplash party/crowd image most similar to the references */}
        <img
          src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1800&h=1200&fit=crop&q=90"
          alt=""
          className="w-full h-full object-cover"
          style={{ filter: 'contrast(1.08) saturate(0.9)' }}
        />
        {/* Amber color wash — from-the-room, not a filter */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.45) 45%, rgba(180,100,20,0.12) 100%)' }} />
        {/* Film grain */}
        <div className="absolute inset-0 opacity-[0.35] mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)' opacity='1'/%3E%3C/svg%3E")`, backgroundSize: '200px 200px' }} />
      </motion.div>

      {/* VOL. overstamp — top right */}
      <div className="absolute top-20 right-8 md:right-14 text-right pointer-events-none z-10">
        <p className="text-[8px] font-body tracking-[0.45em] uppercase text-white/20">VOL. 01 — NYC</p>
        <p className="text-[8px] font-body tracking-[0.3em] uppercase text-white/12 mt-0.5">2026 · EST.</p>
      </div>

      {/* Main content — bottom-anchored, dark base */}
      <div className="relative z-10 flex-1 flex flex-col justify-end px-8 md:px-14 pb-14 md:pb-18 max-w-[1400px] mx-auto w-full pt-24">

        {/* Micro label */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 1 }}
          className="text-[8px] font-body tracking-[0.5em] uppercase text-white/25 mb-7 flex items-center gap-3"
        >
          <span className="w-6 h-px bg-white/20 inline-block" />
          New York Creative Collective
        </motion.p>

        {/* Headline — large, white, serif over dark photo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10"
        >
          <h1 className="font-display font-semibold text-white leading-[0.88] tracking-tight" style={{ fontSize: 'clamp(58px, 9.5vw, 136px)' }}>
            Some moments
          </h1>
          <h1 className="font-display font-semibold text-white leading-[0.88] tracking-tight" style={{ fontSize: 'clamp(58px, 9.5vw, 136px)' }}>
            only happen <em className="italic">once.</em>
          </h1>
        </motion.div>

        {/* Search pills — minimal, white-outlined on dark */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="flex flex-wrap items-center gap-2"
        >
          <div className="relative">
            <button
              onClick={() => { setMomentOpen(v => !v); setNeighborhoodOpen(false); }}
              className={`text-[11px] font-body tracking-[0.06em] px-5 py-2.5 rounded-full border transition-all ${selectedMoment ? 'border-white bg-white text-[#0a0a0a]' : 'border-white/20 bg-white/5 text-white hover:border-white/40 backdrop-blur-sm'}`}
            >
              {selectedMoment || 'What\'s the moment?'}
            </button>
            <AnimatePresence>
              {momentOpen && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  className="absolute bottom-full mb-2 left-0 w-52 bg-[#111] border border-white/10 rounded-xl z-50 py-2">
                  {MOMENTS.map(m => (
                    <button key={m} onMouseDown={e => { e.preventDefault(); setSelectedMoment(m); setMomentOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-[12px] font-body text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                      {m}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button
              onClick={() => { setNeighborhoodOpen(v => !v); setMomentOpen(false); }}
              className={`text-[11px] font-body tracking-[0.06em] px-5 py-2.5 rounded-full border transition-all ${selectedNeighborhood ? 'border-white bg-white text-[#0a0a0a]' : 'border-white/20 bg-white/5 text-white hover:border-white/40 backdrop-blur-sm'}`}
            >
              {selectedNeighborhood || 'Where in NYC?'}
            </button>
            <AnimatePresence>
              {neighborhoodOpen && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  className="absolute bottom-full mb-2 left-0 w-48 bg-[#111] border border-white/10 rounded-xl z-50 py-2">
                  {NEIGHBORHOODS.map(n => (
                    <button key={n} onMouseDown={e => { e.preventDefault(); setSelectedNeighborhood(n); setNeighborhoodOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-[12px] font-body text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                      {n}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={handleSearch}
            className="text-[11px] font-body tracking-[0.06em] uppercase px-6 py-2.5 rounded-full bg-white text-[#0a0a0a] hover:bg-white/90 transition-all font-medium"
          >
            Find your creator
          </button>

          {(selectedMoment || selectedNeighborhood) && (
            <button onClick={() => { setSelectedMoment(null); setSelectedNeighborhood(null); }}
              className="text-[10px] font-body text-white/20 hover:text-white/50 transition-colors">
              Clear
            </button>
          )}
        </motion.div>

        {/* Metadata strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 1 }}
          className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-8"
        >
          {['Vetted creators', 'Fixed prices', 'Payment held until delivery'].map((t) => (
            <span key={t} className="text-[8px] font-body tracking-[0.3em] uppercase text-white/20">{t}</span>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 1 }}
        className="absolute bottom-6 right-8 md:right-14 flex flex-col items-center gap-1.5 z-10"
      >
        <div className="w-px h-10 bg-white/10 relative overflow-hidden rounded-full">
          <motion.div animate={{ y: ['-100%', '200%'] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
            className="absolute w-full h-1/2 bg-white/30 rounded-full" />
        </div>
      </motion.div>
    </section>
  );
}