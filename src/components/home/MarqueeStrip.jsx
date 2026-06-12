import React from 'react';
import { Star } from 'lucide-react';

const items = [
  'Birthdays', 'Dinners', 'Rooftop Hangs', 'Music Videos',
  'Restaurant Launches', 'Content Days', 'Proposals', 'Weddings',
  'Corporate Events', 'Fragrance Lines', 'Pop-Ups', 'Album Covers',
];

export default function MarqueeStrip() {
  return (
    <div className="py-6 border-y border-border overflow-hidden bg-background">
      <div className="animate-marquee whitespace-nowrap flex items-center">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="inline-flex items-center gap-3 mx-6">
            <Star className="w-2.5 h-2.5 text-gold/40 fill-gold/30 flex-shrink-0" />
            <span className="text-sm font-medium text-muted-foreground tracking-wide">{item}</span>
          </span>
        ))}
      </div>
    </div>
  );
}