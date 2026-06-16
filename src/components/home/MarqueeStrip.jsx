import React from 'react';

const items = ['Birthdays', 'Dinners', 'Rooftop Hangs', 'Music Videos', 'Restaurant Launches', 'Content Days', 'Proposals', 'Weddings', 'Corporate Events', 'Pop-Ups', 'Album Covers'];

export default function MarqueeStrip() {
  return (
    <div className="py-3 border-y overflow-hidden" style={{ background: '#f0ede6', borderColor: 'rgba(26,39,68,0.1)' }}>
      <div className="animate-marquee whitespace-nowrap flex items-center">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="inline-flex items-center gap-5 mx-6">
            <span className="text-[8px] font-body font-normal tracking-[0.4em] uppercase" style={{ color: 'rgba(26,39,68,0.25)' }}>{item}</span>
            <span className="text-[7px]" style={{ color: 'rgba(26,39,68,0.15)' }}>✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}