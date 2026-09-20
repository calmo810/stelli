import React from 'react';

const STEPS = [
  { n: '01', title: 'Request', body: 'Tell us the moment, the date, and where it is happening.' },
  { n: '02', title: 'Get quoted', body: 'The creator sends you a private quote — no public price tags.' },
  { n: '03', title: 'Shoot', body: 'You show up. They shoot. Payment is held safely the whole time.' },
  { n: '04', title: 'Get your photos', body: 'Your delivery link lands the moment the work is done.' },
];

export default function HowItWorks() {
  return (
    <section className="border-t border-white/10 py-20 md:py-28">
      <div className="max-w-[1500px] mx-auto px-5 md:px-10">
        <p className="label-mono text-[9px] text-white/35 mb-3">The process</p>
        <h2 className="font-heading font-semibold text-white leading-[1] mb-14" style={{ fontSize: 'clamp(30px, 4.4vw, 62px)' }}>
          How it works
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: 'rgba(255,255,255,0.08)' }}>
          {STEPS.map((s) => (
            <div key={s.n} className="p-7 md:p-9" style={{ background: 'hsl(var(--ink))' }}>
              <p className="font-mono text-[11px] mb-6" style={{ color: 'hsl(var(--neon-lime))' }}>{s.n}</p>
              <h3 className="font-heading text-[24px] font-semibold text-white mb-3">{s.title}</h3>
              <p className="font-body text-[13px] leading-relaxed text-white/45">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}