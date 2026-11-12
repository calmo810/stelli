import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/** The quiet close of the home page: the last question, then the footer. */
export default function FaqButton() {
  return (
    <section className="px-5 md:px-10 pt-2 pb-10 md:pt-4 md:pb-12">
      <div
        className="max-w-[1440px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-5 pt-8 md:pt-10"
        style={{ borderTop: '1px solid var(--line)' }}
      >
        <p className="text-[14px] text-fg-3">
          Still weighing it up? The answers are short.
        </p>
        <Link
          to="/faq"
          className="inline-flex shrink-0 items-center gap-3 rounded-full px-7 py-3.5 st-kicker font-semibold transition-transform duration-300 hover:-translate-y-0.5"
          style={{ background: 'var(--st-primary)', color: 'var(--st-on-primary)' }}
        >
          Read the FAQ <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}