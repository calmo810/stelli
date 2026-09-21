import React from 'react';
import { Link } from 'react-router-dom';

export default function PageNotFound() {
  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <p className="label-mono text-[9px] text-white/35 mb-5">404</p>
        <h1 className="font-heading font-semibold text-white leading-[0.95] mb-5" style={{ fontSize: 'clamp(36px, 6vw, 68px)' }}>
          Nothing here.
        </h1>
        <p className="font-body text-[15px] leading-relaxed text-white/50 mb-10">
          This page moved or never existed. The creators are still where you left them.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/creators" className="label-mono text-[11px] font-semibold px-7 py-4"
            style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', borderRadius: 4 }}>
            Browse creators
          </Link>
          <Link to="/" className="label-mono text-[11px] px-7 py-4 border border-white/15 text-white/70" style={{ borderRadius: 4 }}>
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
