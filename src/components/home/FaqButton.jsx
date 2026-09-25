import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import InstagramFeed from './InstagramFeed';

/** The quiet close of the home page: the last question, split with our feed. */
export default function FaqButton() {
  return (
    <section className="border-t border-white/10 py-14 md:py-20">
      <div className="max-w-[1240px] mx-auto px-5 md:px-10 grid gap-8 md:gap-12 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:items-center">
        <div className="flex flex-col items-start text-left">
          <h2
            className="font-display font-normal leading-[1] tracking-[-0.02em] text-white"
            style={{ fontSize: 'clamp(26px, 3.4vw, 46px)' }}
          >
            Still wondering?
          </h2>
          <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-white/45">
            Pricing, payments, delivery and cancellations — answered in one place.
          </p>
          <Link
            to="/faq"
            className="mt-7 inline-flex items-center gap-3 rounded-full px-7 py-3.5 label-mono text-[11px] font-semibold transition-transform duration-300 hover:-translate-y-0.5"
            style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))' }}
          >
            Read the FAQ <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="glass overflow-hidden rounded-[26px] p-2">
          <InstagramFeed />
        </div>
      </div>
    </section>
  );
}