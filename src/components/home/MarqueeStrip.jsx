import React from 'react';

const items = ['Birthdays', 'Dinners', 'Rooftop Hangs', 'Music Videos', 'Restaurant Launches', 'Content Days', 'Proposals', 'Weddings', 'Corporate Events', 'Pop-Ups', 'Album Covers'];

export default function MarqueeStrip() {
  return (
    <div className="py-3 border-y border-white/5 overflow-hidden bg-[#0a0a0a]">
      <div className="animate-marquee whitespace-nowrap flex items-center">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="inline-flex items-center gap-5 mx-6">
            <span className="text-[8px] font-body font-normal tracking-[0.4em] uppercase text-white/20">{item}</span>
            <span className="text-white/8 text-[7px]">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}