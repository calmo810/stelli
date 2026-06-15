import React from 'react';

const items = [
  'Birthdays', 'Dinners', 'Rooftop Hangs', 'Music Videos',
  'Restaurant Launches', 'Content Days', 'Proposals', 'Weddings',
  'Corporate Events', 'Pop-Ups', 'Album Covers', 'Fragrance Lines',
];

export default function MarqueeStrip() {
  return (
    <div className="py-4 border-y border-[#1a2a6c]/10 overflow-hidden bg-[#1a2a6c]">
      <div className="animate-marquee whitespace-nowrap flex items-center">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="inline-flex items-center gap-4 mx-8">
            <span className="text-[11px] font-body font-medium tracking-[0.2em] uppercase text-white/80">{item}</span>
            <span className="text-white/30 text-xs">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}