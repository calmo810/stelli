import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const NODES = [
  { name: 'West Village', x: 32, y: 26 },
  { name: 'Greenpoint', x: 15, y: 38 },
  { name: 'SoHo', x: 46, y: 52 },
  { name: 'Chelsea', x: 67, y: 30, sub: '' },
  { name: 'Bushwick', x: 35, y: 70, sub: 'THE STUDIO +' },
  { name: 'DUMBO', x: 57, y: 76 },
  { name: 'Williamsburg', x: 81, y: 58 },
];
const LINES = [[0,1],[0,2],[2,3],[3,6],[1,4],[4,5],[5,6]];

export default function NeighborhoodMap() {
  const [hovered, setHovered] = useState(null);

  return (
    <section className="py-28 px-8 md:px-14 bg-[#F5F4EF]">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-[8px] font-body tracking-[0.5em] uppercase text-[#1a2a6c]/30 mb-5">The City</p>
            <h2 className="font-display font-semibold text-[#1a2a6c] leading-[0.92]" style={{ fontSize: 'clamp(32px, 4.5vw, 68px)' }}>
              A constellation<br />over <em>New York.</em>
            </h2>
          </motion.div>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="font-body text-xs text-[#bbb] max-w-[220px] leading-relaxed md:text-right">
            We launch dense — a handful of neighborhoods, a tight collective of vetted creators — and let the map fill in, star by star.
          </motion.p>
        </div>

        {/* Map canvas */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
          className="relative bg-white border border-[#1a2a6c]/6 overflow-hidden" style={{ height: 420, borderRadius: '4px' }}>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {LINES.map(([a, b], i) => (
              <motion.line key={i} x1={NODES[a].x} y1={NODES[a].y} x2={NODES[b].x} y2={NODES[b].y}
                stroke="#1a2a6c" strokeOpacity="0.1" strokeWidth="0.25"
                initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }} />
            ))}
          </svg>

          {NODES.map((n, i) => (
            <motion.div key={n.name} initial={{ opacity: 0, scale: 0 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
              className="absolute cursor-pointer group"
              style={{ left: `${n.x}%`, top: `${n.y}%`, transform: 'translate(-50%,-50%)' }}
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              <div className={`w-2 h-2 rounded-full border border-white shadow-sm transition-all duration-300 ${hovered === i ? 'bg-[#c9a84c] scale-150 shadow-md' : 'bg-[#1a2a6c]'}`} />
              <div className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-200 ${hovered === i ? 'opacity-100' : 'opacity-60'}`}>
                <p className="font-display text-[13px] font-semibold text-[#1a2a6c] whitespace-nowrap">{n.name}</p>
                {n.sub && <p className="text-[7px] font-body tracking-[0.25em] uppercase text-[#1a2a6c]/40">{n.sub}</p>}
              </div>
            </motion.div>
          ))}

          {/* Corner coordinates */}
          <div className="absolute top-3 left-4 text-[7px] font-body tracking-[0.2em] text-[#1a2a6c]/15">40.7128° N, 74.0060° W</div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-8">
          <Link to="/browse" className="text-[11px] font-body tracking-[0.06em] uppercase text-[#1a2a6c] border-b border-[#1a2a6c]/25 pb-px hover:border-[#1a2a6c] transition-all">
            Explore by neighborhood
          </Link>
        </motion.div>
      </div>
    </section>
  );
}