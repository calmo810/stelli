import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Deterministic pseudo-random from a seed string
function seededRand(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return ((h >>> 0) / 4294967295);
}

function getStarPosition(lensman, index) {
  const seed = lensman.id || String(index);
  const x = 5 + seededRand(seed + 'x') * 88;
  const y = 5 + seededRand(seed + 'y') * 85;
  return { x, y };
}

// Background twinkle stars (decorative)
const BG_STARS = Array.from({ length: 80 }, (_, i) => ({
  id: i,
  x: seededRand('bx' + i) * 100,
  y: seededRand('by' + i) * 100,
  size: 0.5 + seededRand('bs' + i) * 1.5,
  delay: seededRand('bd' + i) * 4,
}));

export default function ConstellationMap({ lensmen, activeFilter }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);
  const containerRef = useRef(null);

  const stars = useMemo(() =>
    lensmen.map((l, i) => ({
      ...l,
      pos: getStarPosition(l, i),
      isActive: activeFilter === 'all' || (l.specialties || []).some(s =>
        s.toLowerCase().includes(activeFilter.replace(/_/g, ' '))
      ),
    })), [lensmen, activeFilter]);

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl overflow-hidden bg-[#0a0f1e] select-none"
      style={{ minHeight: '520px', height: '60vh' }}
    >
      {/* Background twinkling stars */}
      {BG_STARS.map(s => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white/30 animate-twinkle"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}

      {/* Subtle constellation lines between nearby active stars */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        {stars.filter(s => s.isActive).map((s, i) => {
          const next = stars.filter(n => n.isActive)[i + 1];
          if (!next) return null;
          const dx = Math.abs(s.pos.x - next.pos.x);
          const dy = Math.abs(s.pos.y - next.pos.y);
          if (dx > 25 || dy > 25) return null;
          return (
            <line
              key={s.id}
              x1={`${s.pos.x}%`} y1={`${s.pos.y}%`}
              x2={`${next.pos.x}%`} y2={`${next.pos.y}%`}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
          );
        })}
      </svg>

      {/* Lensman stars */}
      {stars.map((lensman) => (
        <div
          key={lensman.id}
          className="absolute"
          style={{ left: `${lensman.pos.x}%`, top: `${lensman.pos.y}%`, zIndex: 10 }}
        >
          <button
            className="relative flex items-center justify-center focus:outline-none"
            onMouseEnter={() => setHovered(lensman.id)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(lensman.id)}
            onBlur={() => setHovered(null)}
            onClick={() => navigate(`/lensman/${lensman.id}`)}
            aria-label={lensman.display_name || lensman.full_name}
          >
            {/* Glow ring */}
            <motion.div
              className="absolute rounded-full"
              animate={lensman.isActive
                ? { scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }
                : { scale: 1, opacity: 0 }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: 28, height: 28,
                background: 'radial-gradient(circle, #c9a84c 0%, transparent 70%)',
              }}
            />
            {/* Star dot */}
            <motion.div
              animate={lensman.isActive
                ? { scale: 1, opacity: 1 }
                : { scale: 0.5, opacity: 0.2 }}
              transition={{ duration: 0.4 }}
              className="relative rounded-full z-10"
              style={{
                width: lensman.isActive ? 14 : 8,
                height: lensman.isActive ? 14 : 8,
                background: lensman.isActive
                  ? 'radial-gradient(circle, #fff 0%, #c9a84c 60%, #a07830 100%)'
                  : 'rgba(255,255,255,0.25)',
                boxShadow: lensman.isActive ? '0 0 12px 4px rgba(201,168,76,0.6)' : 'none',
                transition: 'width 0.3s, height 0.3s',
              }}
            />
          </button>

          {/* Hover card */}
          <AnimatePresence>
            {hovered === lensman.id && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 6 }}
                transition={{ duration: 0.18 }}
                className="absolute z-50 pointer-events-none"
                style={{
                  bottom: '120%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 200,
                }}
              >
                <div className="bg-[#0d1530]/95 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl text-white">
                  {/* Masked avatar */}
                  <div className="w-12 h-12 rounded-full bg-white/10 mx-auto mb-3 flex items-center justify-center border border-white/20 overflow-hidden">
                    {lensman.profile_image
                      ? <img src={lensman.profile_image} alt="" className="w-full h-full object-cover blur-sm scale-110" />
                      : <Star className="w-5 h-5 text-yellow-400/60" />
                    }
                  </div>
                  <p className="text-center text-xs font-body text-white/50 mb-2 tracking-widest uppercase">Creator</p>

                  {/* Specialties */}
                  {lensman.specialties?.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1 mb-3">
                      {lensman.specialties.slice(0, 3).map((s, i) => (
                        <span key={i} className="text-[9px] font-body px-2 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/10">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Rating */}
                  <div className="flex items-center justify-center gap-1 mb-2">
                    {[1,2,3,4,5].map(i => (
                      <Star
                        key={i}
                        className="w-3 h-3"
                        fill={i <= Math.round(lensman.avg_rating || 5) ? '#c9a84c' : 'transparent'}
                        stroke={i <= Math.round(lensman.avg_rating || 5) ? '#c9a84c' : 'rgba(255,255,255,0.3)'}
                      />
                    ))}
                    <span className="text-[10px] text-white/50 ml-1">({lensman.review_count || 0})</span>
                  </div>

                  <div className="text-center text-[10px] text-white/40 font-body">
                    from ${lensman.rate_half_day || 800}/day
                  </div>

                  <div className="mt-3 text-center text-[9px] text-white/30 tracking-widest uppercase">
                    Click to reveal
                  </div>
                </div>
                {/* Arrow */}
                <div className="w-3 h-3 bg-[#0d1530]/95 border-b border-r border-white/10 rotate-45 mx-auto -mt-1.5" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex items-center gap-3 z-20">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-white to-yellow-400" style={{ boxShadow: '0 0 6px 2px rgba(201,168,76,0.5)' }} />
          <span className="text-[10px] font-body text-white/50">Active creator</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-white/20" />
          <span className="text-[10px] font-body text-white/30">No match</span>
        </div>
      </div>

      <div className="absolute top-4 right-4 text-[10px] font-body text-white/20 tracking-widest uppercase z-20">
        Hover to preview · Click to book
      </div>
    </div>
  );
}