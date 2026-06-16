import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// Pitch slide 10: cream bg, navy dots + lines, serif headline
const NODES = [
  { name: 'West Village', x: 32, y: 26 },
  { name: 'Greenpoint', x: 15, y: 38 },
  { name: 'SoHo', x: 46, y: 52 },
  { name: 'Chelsea', x: 67, y: 30 },
  { name: 'Bushwick', x: 35, y: 70, sub: 'The Studio +' },
  { name: 'DUMBO', x: 57, y: 76 },
  { name: 'Williamsburg', x: 81, y: 58 },
];
const LINES = [[0,1],[0,2],[2,3],[3,6],[1,4],[4,5],[5,6]];

export default function NeighborhoodMap() {
  const [hovered, setHovered] = useState(null);

  return (
    <section className="py-24 px-8 md:px-14 border-t" style={{ background: '#f0ede6', borderColor: 'rgba(26,39,68,0.1)' }}>
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-[8px] font-body tracking-[0.5em] uppercase mb-4" style={{ color: 'rgba(26,39,68,0.3)' }}>The City</p>
            <h2 className="font-display font-semibold leading-[0.92]" style={{ fontSize: 'clamp(28px, 4.5vw, 60px)', color: '#1a2744' }}>
              A constellation<br />over <em className="italic">New York.</em>
            </h2>
          </motion.div>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="font-body text-[11px] max-w-[240px] leading-relaxed md:text-right" style={{ color: 'rgba(26,39,68,0.4)' }}>
            We launch dense — a handful of neighborhoods, a tight collective of vetted creators — and let the map fill in, star by star.
          </motion.p>
        </div>

        {/* Map canvas — cream with navy dots, matches slide 10 */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
          className="relative overflow-hidden border" style={{ height: 420, background: '#ece9e2', borderColor: 'rgba(26,39,68,0.08)' }}>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {LINES.map(([a, b], i) => (
              <motion.line key={i} x1={NODES[a].x} y1={NODES[a].y} x2={NODES[b].x} y2={NODES[b].y}
                stroke="#1a2744" strokeOpacity="0.15" strokeWidth="0.2"
                initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.7 }} />
            ))}
          </svg>

          {NODES.map((n, i) => (
            <motion.div key={n.name} initial={{ opacity: 0, scale: 0 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1, type: 'spring', stiffness: 180 }}
              className="absolute cursor-pointer"
              style={{ left: `${n.x}%`, top: `${n.y}%`, transform: 'translate(-50%,-50%)' }}
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              <div className="w-2 h-2 rounded-full transition-all duration-300"
                style={{
                  background: hovered === i ? '#1a2744' : '#1a2744',
                  opacity: hovered === i ? 1 : 0.6,
                  boxShadow: hovered === i ? '0 0 0 4px rgba(26,39,68,0.1)' : 'none',
                  transform: hovered === i ? 'scale(1.4)' : 'scale(1)',
                }} />
              <div className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-200 ${hovered === i ? 'opacity-100' : 'opacity-60'}`}>
                <p className="font-display text-[12px] font-semibold whitespace-nowrap" style={{ color: '#1a2744' }}>{n.name}</p>
                {n.sub && <p className="text-[7px] font-body tracking-[0.2em] uppercase mt-0.5" style={{ color: 'rgba(26,39,68,0.4)' }}>{n.sub}</p>}
              </div>
            </motion.div>
          ))}

          <div className="absolute top-4 left-5 text-[7px] font-body tracking-[0.25em] uppercase" style={{ color: 'rgba(26,39,68,0.2)' }}>40.7128° N</div>
          <div className="absolute bottom-4 right-5 text-[7px] font-body tracking-[0.25em] uppercase" style={{ color: 'rgba(26,39,68,0.2)' }}>NYC · 2026</div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-6">
          <Link to="/browse"
            className="text-[10px] font-body tracking-[0.08em] uppercase border-b pb-px transition-all"
            style={{ color: 'rgba(26,39,68,0.4)', borderColor: 'rgba(26,39,68,0.2)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#1a2744'; e.currentTarget.style.borderColor = '#1a2744'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(26,39,68,0.4)'; e.currentTarget.style.borderColor = 'rgba(26,39,68,0.2)'; }}
          >
            Explore by neighborhood →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}