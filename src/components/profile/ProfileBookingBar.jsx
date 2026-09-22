import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/** Mobile-only fixed booking bar. Desktop keeps the booking area pinned in its own column. */
export default function ProfileBookingBar({ creatorId, label }) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-4 py-3 border-t border-white/10 bg-ink/95 backdrop-blur">
      <Link
        to={`/book/${creatorId}`}
        className="flex items-center justify-center gap-2 w-full py-3.5 label-mono text-[11px] font-semibold"
        style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', borderRadius: 4 }}
      >
        {label} <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}