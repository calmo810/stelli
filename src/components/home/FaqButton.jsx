import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/** The quiet close of the home page: one question, one link. */
export default function FaqButton() {
  return (
    <section className="border-t border-white/10 py-14 md:py-20">
      <div className="max-w-[1240px] mx-auto px-5 md:px-10 flex flex-col items-center text-center">
        <h2
          className="font-display font-normal leading-[0.98] tracking-[-0.02em] text-white"
          style={{ fontSize: 'clamp(34px, 6vw, 72px)' }}
        >
          Still wondering?
        </h2>
        <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/45">
          Pricing, payments, delivery and cancellations — answered in one place.
        </p>
        <Link
          to="/faq"
          className="mt-9 inline-flex items-center gap-3 rounded-full px-8 py-4 label-mono text-[11px] font-semibold transition-transform duration-300 hover:-translate-y-0.5"
          style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))' }}
        >
          Read the FAQ <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}