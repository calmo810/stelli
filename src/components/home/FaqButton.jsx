import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function FaqButton() {
  return (
    <section className="border-t border-white/10 py-24 md:py-32">
      <div className="max-w-[1500px] mx-auto px-5 md:px-10 flex flex-col items-center text-center">
        <p className="font-hand text-[26px] mb-4" style={{ color: 'hsl(var(--neon-lime))' }}>still wondering?</p>
        <h2 className="font-heading font-semibold text-white leading-[0.95] mb-9" style={{ fontSize: 'clamp(38px, 6vw, 88px)' }}>
          Questions?
        </h2>
        <Link
          to="/faq"
          className="inline-flex items-center gap-3 label-mono text-[11px] font-semibold px-9 py-4 transition-transform duration-300 hover:-translate-y-0.5"
          style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', borderRadius: 4 }}
        >
          Read the FAQ <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}