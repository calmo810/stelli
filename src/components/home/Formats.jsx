import React from 'react';

const FORMATS = [
  {
    name: 'The Candid',
    body: 'A short, fast shoot. Built to be an easy yes.',
    accent: 'hsl(var(--neon-lime))',
  },
  {
    name: 'The Event Film',
    body: 'Full event coverage, stills and motion, start to finish.',
    accent: 'hsl(var(--neon-cyan))',
  },
  {
    name: 'The Content Day',
    body: 'A full day, built for volume. A month of content in one afternoon.',
    accent: 'hsl(var(--neon-magenta))',
  },
];

export default function Formats() {
  return (
    <section className="border-t border-white/10 py-20 md:py-28">
      <div className="max-w-[1500px] mx-auto px-5 md:px-10">
        <p className="label-mono text-[9px] text-white/35 mb-3">Three ways to shoot</p>
        <h2 className="font-heading font-semibold text-white leading-[1] mb-14" style={{ fontSize: 'clamp(30px, 4.4vw, 62px)' }}>
          The formats
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FORMATS.map((f) => (
            <div key={f.name} className="border-t pt-7" style={{ borderColor: f.accent }}>
              <h3 className="font-heading text-[26px] md:text-[30px] font-semibold text-white mb-4">{f.name}</h3>
              <p className="font-body text-[13px] leading-relaxed text-white/50 max-w-sm">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}