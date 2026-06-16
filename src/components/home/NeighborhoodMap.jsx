import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// Pitch deck slide 10 — "A constellation over New York"
const NEIGHBORHOODS = [
  { name: 'West Village', x: 35, y: 28, count: 4 },
  { name: 'Greenpoint', x: 18, y: 38, count: 2 },
  { name: 'SoHo', x: 48, y: 50, count: 6 },
  { name: 'Chelsea', x: 68, y: 32, count: 3 },
  { name: 'Bushwick', x: 38, y: 68, count: 5, note: 'THE STUDIO +' },
  { name: 'DUMBO', x: 58, y: 72, count: 3 },
  { name: 'Williamsburg', x: 82, y: 56, count: 7 },
];

const CONNECTIONS = [
  [0, 1], [0, 2], [2, 3], [3, 6], [1, 4], [4, 5], [5, 6],
];

export default function NeighborhoodMap() {
  const [hovered, setHovered] = useState(null);

  return (
    <section className="py-32 px-8 md:px-16 lg:px-28 bg-[#F5F4EF]">
      <div className="max-w-[1300px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
          <p className="text-[9px] font-body tracking-[0.4em] uppercase text-[#1a2a6c]/35 mb-6">The City</p>
          <h2 className="font-display text-[clamp(32px,4.5vw,64px)] leading-[0.95] font-semibold text-[#1a2a6c]">
            A constellation over <em>New York.</em>
          </h2>
        </motion.div>

        {/* SVG Map */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative bg-white rounded-3xl border border-[#1a2a6c]/8 overflow-hidden"
          style={{ height: 420 }}
        >
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Connection lines */}
            {CONNECTIONS.map(([a, b], i) => (
              <line
                key={i}
                x1={NEIGHBORHOODS[a].x} y1={NEIGHBORHOODS[a].y}
                x2={NEIGHBORHOODS[b].x} y2={NEIGHBORHOODS[b].y}
                stroke="#1a2a6c" strokeOpacity="0.12" strokeWidth="0.3"
              />
            ))}
          </svg>

          {/* Nodes */}
          {NEIGHBORHOODS.map((n, i) => (
            <motion.div
              key={n.name}
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, type: 'spring' }}
              className="absolute cursor-pointer group"
              style={{ left: `${n.x}%`, top: `${n.y}%`, transform: 'translate(-50%, -50%)' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className={`w-2.5 h-2.5 rounded-full bg-[#1a2a6c] border-2 border-white shadow-md transition-all duration-300 ${hovered === i ? 'scale-150 bg-[#c9a84c]' : ''}`} />
              <div className={`absolute left-4 top-1/2 -translate-y-1/2 whitespace-nowrap transition-all duration-200 ${hovered === i ? 'opacity-100' : 'opacity-80'}`}>
                <p className="font-display text-[13px] font-semibold text-[#1a2a6c]">{n.name}</p>
                {n.note && <p className="text-[8px] font-body tracking-[0.2em] uppercase text-[#1a2a6c]/40">{n.note}</p>}
              </div>
              {hovered === i && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-[#1a2a6c] text-white text-[10px] font-body rounded-full px-2.5 py-1 whitespace-nowrap">
                  {n.count} creators
                </motion.div>
              )}
            </motion.div>
          ))}
        </motion.div>

        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="mt-8 font-body text-xs text-[#999] max-w-lg leading-relaxed">
          We launch dense — a handful of neighborhoods, a tight collective of vetted creators — and let the map fill in, star by star.
        </motion.p>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-8">
          <Link to="/browse"
            className="inline-flex items-center gap-2 text-[13px] font-body font-semibold text-[#1a2a6c] border border-[#1a2a6c]/30 rounded-full px-5 py-2 hover:bg-[#1a2a6c] hover:text-white transition-all">
            Explore the constellation
          </Link>
        </motion.div>
      </div>
    </section>
  );
}