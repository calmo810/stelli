import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const NODES = [
  { name: 'West Village', x: 32, y: 26 },
  { name: 'Greenpoint', x: 15, y: 38 },
  { name: 'SoHo', x: 46, y: 52 },
  { name: 'Chelsea', x: 67, y: 30 },
  { name: 'Bushwick', x: 35, y: 70 },
  { name: 'DUMBO', x: 57, y: 76 },
  { name: 'Williamsburg', x: 81, y: 58 },
];
const LINES = [[0,1],[0,2],[2,3],[3,6],[1,4],[4,5],[5,6]];

export default function NeighborhoodMap() {
  const [hovered, setHovered] = useState(null);

  return (
    <section className="py-24 px-8 md:px-14 bg-[#0a0a0a] border-t border-white/5">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-[8px] font-body tracking-[0.5em] uppercase text-white/20 mb-4">Coverage</p>
            <h2 className="font-display font-semibold text-white leading-[0.92]" style={{ fontSize: 'clamp(28px, 4.5vw, 60px)' }}>
              A constellation<br />over <em>New York.</em>
            </h2>
          </motion.div>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="font-body text-[11px] text-white/20 max-w-[200px] leading-relaxed md:text-right">
            A tight collective of vetted creators — dense, not sprawling. The map fills in, star by star.
          </motion.p>
        </div>

        {/* Dark map canvas */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
          className="relative bg-[#0d0d0d] border border-white/5 overflow-hidden" style={{ height: 400 }}>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {LINES.map(([a, b], i) => (
              <motion.line key={i} x1={NODES[a].x} y1={NODES[a].y} x2={NODES[b].x} y2={NODES[b].y}
                stroke="white" strokeOpacity="0.06" strokeWidth="0.2"
                initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.7 }} />
            ))}
          </svg>

          {NODES.map((n, i) => (
            <motion.div key={n.name} initial={{ opacity: 0, scale: 0 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1, type: 'spring', stiffness: 180 }}
              className="absolute cursor-pointer group"
              style={{ left: `${n.x}%`, top: `${n.y}%`, transform: 'translate(-50%,-50%)' }}
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${hovered === i ? 'bg-white scale-[2.5] shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'bg-white/40'}`} />
              <div className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-200 ${hovered === i ? 'opacity-100' : 'opacity-30'}`}>
                <p className="font-body text-[11px] font-medium text-white whitespace-nowrap tracking-[0.02em]">{n.name}</p>
              </div>
            </motion.div>
          ))}

          {/* Corner metadata */}
          <div className="absolute top-3 left-4 text-[7px] font-body tracking-[0.25em] text-white/10">40.7128° N, 74.0060° W</div>
          <div className="absolute bottom-3 right-4 text-[7px] font-body tracking-[0.25em] text-white/10 uppercase">NYC · 2026</div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-6">
          <Link to="/browse" className="text-[10px] font-body tracking-[0.08em] uppercase text-white/25 border-b border-white/10 pb-px hover:text-white/50 hover:border-white/25 transition-all">
            Explore by neighborhood
          </Link>
        </motion.div>
      </div>
    </section>
  );
}