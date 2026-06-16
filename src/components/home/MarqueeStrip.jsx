import React from 'react';

const items = ['Birthdays', 'Dinners', 'Rooftop Hangs', 'Music Videos', 'Restaurant Launches', 'Content Days', 'Proposals', 'Weddings', 'Corporate Events', 'Pop-Ups', 'Album Covers'];

export default function MarqueeStrip() {
  return (
    <div className="py-3.5 border-y border-[#1a2a6c]/6 overflow-hidden bg-white">
      <div className="animate-marquee whitespace-nowrap flex items-center">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="inline-flex items-center gap-5 mx-6">
            <span className="text-[9px] font-body font-normal tracking-[0.35em] uppercase text-[#1a2a6c]/35">{item}</span>
            <span className="text-[#1a2a6c]/15 text-[8px]">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}