import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

function seededRand(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  return ((h >>> 0) / 4294967295);
}

function slugifyName(name = '') {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function getPosition(lensman, index) {
  const seed = lensman.id || String(index);
  return { x: 10 + seededRand(seed + 'x') * 78, y: 12 + seededRand(seed + 'y') * 72 };
}

export default function ConstellationMap({ lensmen, activeFilter }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);
  const stars = useMemo(() => lensmen.map((l, i) => ({ ...l, pos: getPosition(l, i), active: activeFilter === 'all' || (l.specialties || []).some(s => s.toLowerCase().includes(activeFilter.replace(/_/g, ' '))) })), [lensmen, activeFilter]);

  return (
    <div className="relative w-full overflow-hidden border" style={{ minHeight: 520, height: '60vh', background: '#ece9e2', borderColor: 'rgba(26,39,68,0.12)' }}>
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {stars.filter(s => s.active).map((s, i, arr) => {
          const next = arr[i + 1];
          if (!next) return null;
          return <motion.line key={s.id || i} x1={`${s.pos.x}%`} y1={`${s.pos.y}%`} x2={`${next.pos.x}%`} y2={`${next.pos.y}%`} stroke="#1a2744" strokeOpacity="0.12" strokeWidth="1" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, delay: i * 0.08 }} />;
        })}
      </svg>

      {stars.map((lensman) => {
        const slug = lensman.slug || slugifyName(lensman.display_name || lensman.full_name) || lensman.id;
        return (
          <div key={lensman.id || slug} className="absolute" style={{ left: `${lensman.pos.x}%`, top: `${lensman.pos.y}%`, zIndex: 10 }}>
            <button onMouseEnter={() => setHovered(slug)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(slug)} onBlur={() => setHovered(null)} onClick={() => navigate(`/creators/${slug}`)} className="relative flex items-center justify-center focus:outline-none">
              <motion.div animate={{ scale: lensman.active ? 1 : 0.75, opacity: lensman.active ? 1 : 0.28 }} className="rounded-full" style={{ width: 9, height: 9, background: '#1a2744', boxShadow: lensman.active ? '0 0 0 5px rgba(26,39,68,0.08)' : 'none' }} />
            </button>
            <AnimatePresence>
              {hovered === slug && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="absolute pointer-events-none" style={{ bottom: '160%', left: '50%', transform: 'translateX(-50%)', width: 190 }}>
                  <div className="border p-4" style={{ background: '#f0ede6', borderColor: 'rgba(26,39,68,0.16)', boxShadow: '0 18px 42px rgba(26,39,68,0.12)' }}>
                    <p className="font-display text-[22px] font-semibold leading-none text-center" style={{ color: '#1a2744' }}>{lensman.display_name || lensman.full_name}</p>
                    <p className="text-[9px] font-body tracking-[0.16em] uppercase text-center mt-2" style={{ color: 'rgba(26,39,68,0.35)' }}>{lensman.neighborhoods?.slice(0, 2).join(' · ')}</p>
                    <p className="text-[10px] font-body text-center mt-4" style={{ color: 'rgba(26,39,68,0.45)' }}>from ${lensman.rate_half_day || 800}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      <div className="absolute top-4 left-5 text-[7px] font-body tracking-[0.3em] uppercase" style={{ color: 'rgba(26,39,68,0.2)' }}>Constellation Collective</div>
      <div className="absolute bottom-4 right-5 text-[7px] font-body tracking-[0.3em] uppercase" style={{ color: 'rgba(26,39,68,0.2)' }}>Click a creator profile</div>
    </div>
  );
}