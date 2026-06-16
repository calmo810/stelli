import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const MOMENTS = ['Birthday', 'Dinner', 'Rooftop Hang', 'Music Video', 'Restaurant Opening', 'Content Day', 'Proposal', 'Wedding'];
const NEIGHBORHOODS = ['Williamsburg', 'Bushwick', 'DUMBO', 'West Village', 'SoHo', 'Chelsea', 'Greenpoint', 'Harlem'];

// PLACEHOLDER — swap with your actual Collective shoot once you have it.
// Dark subject, heavy negative space on left side so headline reads.
const HERO_IMAGE = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1800&h=1200&fit=crop&q=90';

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
    <section className="relative min-h-screen bg-[#080c14] overflow-hidden flex flex-col">

      {/* PHOTO LAYER */}
      <motion.div
        initial={{ scale: 1.04 }}
        animate={{ scale: 1 }}
        transition={{ duration: 3, ease: 'easeOut' }}
        className="absolute inset-0"
      >
        <img
          src={HERO_IMAGE}
          alt=""
          className="w-full h-full object-cover object-center"
          style={{ filter: 'contrast(1.05) saturate(0.85) brightness(0.75)' }}
        />
      </motion.div>

      {/* SCRIM LAYER — engineered so text reads over ANY photo */}
      {/* 1. Vertical: heavy dark top + heavy dark bottom, clear in middle */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'linear-gradient(to bottom, rgba(8,12,20,0.72) 0%, rgba(8,12,20,0.1) 38%, rgba(8,12,20,0.1) 52%, rgba(8,12,20,0.88) 100%)'
      }} />
      {/* 2. Diagonal pool: dark bottom-left where headline + search live */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 90% 70% at 0% 110%, rgba(8,12,20,0.92) 0%, rgba(8,12,20,0.55) 45%, transparent 75%)'
      }} />
      {/* 3. Subtle vignette all edges */}
      <div className="absolute inset-0 pointer-events-none" style={{
        boxShadow: 'inset 0 0 120px rgba(8,12,20,0.5)'
      }} />

      {/* VOL. stamp — top right, warm gold */}
      <div className="absolute top-20 right-8 md:right-14 text-right pointer-events-none z-10">
        <p className="text-[8px] font-body tracking-[0.45em] uppercase" style={{ color: '#F2DCA9', opacity: 0.55 }}>VOL. 01 — NYC</p>
        <p className="text-[8px] font-body tracking-[0.3em] uppercase mt-0.5" style={{ color: '#F2DCA9', opacity: 0.35 }}>2026 · EST.</p>
      </div>

      {/* CONTENT — bottom-left anchored, in the scrim pool */}
      <div className="relative z-10 flex-1 flex flex-col justify-end px-8 md:px-14 pb-14 max-w-[1400px] mx-auto w-full pt-24">

        {/* Eyebrow — gold rule + label */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 1 }}
          className="text-[8px] font-body tracking-[0.5em] uppercase mb-7 flex items-center gap-3"
          style={{ color: '#F2DCA9', opacity: 0.7 }}
        >
          <span className="w-8 h-px inline-block" style={{ background: '#F2DCA9', opacity: 0.5 }} />
          New York Creative Collective
        </motion.p>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-5"
        >
          <h1
            className="font-display font-semibold text-white leading-[0.88] tracking-tight"
            style={{
              fontSize: 'clamp(52px, 8.5vw, 124px)',
              textShadow: '0 2px 40px rgba(0,0,0,0.5)',
            }}
          >
            Some moments
          </h1>
          <h1
            className="font-display font-semibold leading-[0.88] tracking-tight"
            style={{
              fontSize: 'clamp(52px, 8.5vw, 124px)',
              textShadow: '0 2px 40px rgba(0,0,0,0.5)',
              color: '#fff',
            }}
          >
            only happen{' '}
            <em className="italic" style={{ color: '#F2DCA9' }}>once.</em>
          </h1>
        </motion.div>

        {/* Subhead */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.9 }}
          className="font-body text-[15px] leading-relaxed mb-9 max-w-sm"
          style={{ color: 'rgba(242,220,169,0.75)' }}
        >
          Vetted photographers and filmmakers across the city.<br />
          One fixed price, money held safe until the work is in your hands.
        </motion.p>

        {/* Search controls — larger, pill-shaped, from screenshot */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="flex flex-wrap items-center gap-3 mb-9"
        >
          {/* Moment */}
          <div className="relative">
            <button
              onClick={() => { setMomentOpen(v => !v); setNeighborhoodOpen(false); }}
              className="flex items-center gap-2 text-[13px] font-body px-6 py-3.5 transition-all"
              style={{
                borderRadius: '999px',
                border: '1px solid rgba(255,255,255,0.18)',
                background: selectedMoment ? 'rgba(242,220,169,0.12)' : 'rgba(255,255,255,0.06)',
                color: selectedMoment ? '#F2DCA9' : 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(8px)',
              }}
            >
              {selectedMoment || "What's the moment?"}
              <ChevronDown className="w-3.5 h-3.5 opacity-50" />
            </button>
            <AnimatePresence>
              {momentOpen && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  className="absolute bottom-full mb-2 left-0 w-52 z-50 py-2 overflow-hidden"
                  style={{ background: '#111318', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
                  {MOMENTS.map(m => (
                    <button key={m} onMouseDown={e => { e.preventDefault(); setSelectedMoment(m); setMomentOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-[13px] font-body transition-colors"
                      style={{ color: 'rgba(255,255,255,0.6)' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}>
                      {m}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Neighborhood */}
          <div className="relative">
            <button
              onClick={() => { setNeighborhoodOpen(v => !v); setMomentOpen(false); }}
              className="flex items-center gap-2 text-[13px] font-body px-6 py-3.5 transition-all"
              style={{
                borderRadius: '999px',
                border: '1px solid rgba(255,255,255,0.18)',
                background: selectedNeighborhood ? 'rgba(242,220,169,0.12)' : 'rgba(255,255,255,0.06)',
                color: selectedNeighborhood ? '#F2DCA9' : 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(8px)',
              }}
            >
              {selectedNeighborhood || 'Where in NYC?'}
              <ChevronDown className="w-3.5 h-3.5 opacity-50" />
            </button>
            <AnimatePresence>
              {neighborhoodOpen && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  className="absolute bottom-full mb-2 left-0 w-48 z-50 py-2 overflow-hidden"
                  style={{ background: '#111318', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
                  {NEIGHBORHOODS.map(n => (
                    <button key={n} onMouseDown={e => { e.preventDefault(); setSelectedNeighborhood(n); setNeighborhoodOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-[13px] font-body transition-colors"
                      style={{ color: 'rgba(255,255,255,0.6)' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}>
                      {n}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CTA */}
          <button
            onClick={handleSearch}
            className="text-[12px] font-body tracking-[0.08em] uppercase px-7 py-3.5 font-semibold transition-all"
            style={{
              borderRadius: '999px',
              background: '#F2DCA9',
              color: '#080c14',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#ede0b8'}
            onMouseLeave={e => e.currentTarget.style.background = '#F2DCA9'}
          >
            Find your creator
          </button>

          {(selectedMoment || selectedNeighborhood) && (
            <button onClick={() => { setSelectedMoment(null); setSelectedNeighborhood(null); }}
              className="text-[10px] font-body transition-colors"
              style={{ color: 'rgba(255,255,255,0.2)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}>
              Clear
            </button>
          )}
        </motion.div>

        {/* Trust strip — gold dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 1 }}
          className="flex flex-wrap items-center gap-x-5 gap-y-1"
        >
          {['Vetted creators', 'Fixed prices', 'Payment held until delivery'].map((t, i) => (
            <span key={t} className="flex items-center gap-2 text-[9px] font-body tracking-[0.3em] uppercase" style={{ color: 'rgba(242,220,169,0.4)' }}>
              {i > 0 && <span style={{ color: 'rgba(242,220,169,0.2)' }}>·</span>}
              {t}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-6 right-8 md:right-14 z-10"
      >
        <div className="w-px h-10 relative overflow-hidden rounded-full mx-auto" style={{ background: 'rgba(242,220,169,0.1)' }}>
          <motion.div animate={{ y: ['-100%', '200%'] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
            className="absolute w-full h-1/2 rounded-full" style={{ background: 'rgba(242,220,169,0.35)' }} />
        </div>
      </motion.div>
    </section>
  );
}