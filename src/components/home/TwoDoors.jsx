import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function TwoDoors() {
  return (
    <section className="max-w-[1500px] mx-auto px-5 md:px-10 py-20 md:py-28">
      <p className="label-mono text-[9px] text-white/35 mb-8">Two ways in</p>
      <div className="grid md:grid-cols-2 gap-5">
        <Link
          to="/creators"
          className="group relative overflow-hidden border p-8 md:p-12 min-h-[300px] flex flex-col justify-between transition-colors duration-300"
          style={{ borderColor: 'rgba(196,248,42,0.35)', background: 'hsl(var(--surface))', borderRadius: 4 }}
        >
          <p className="label-mono text-[10px]" style={{ color: 'hsl(var(--neon-lime))' }}>For clients</p>
          <div>
            <h3 className="font-heading font-semibold text-white leading-[1] mb-4" style={{ fontSize: 'clamp(30px, 4vw, 54px)' }}>
              Book a creator
            </h3>
            <p className="font-body text-[13px] text-white/50 max-w-xs leading-relaxed">
              Find a vetted photographer or filmmaker, send a request, and get a private quote.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 label-mono text-[10px]" style={{ color: 'hsl(var(--neon-lime))' }}>
            Browse creators <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </Link>

        <Link
          to="/register?role=creator"
          className="group relative overflow-hidden border p-8 md:p-12 min-h-[300px] flex flex-col justify-between transition-colors duration-300"
          style={{ borderColor: 'rgba(42,232,248,0.35)', background: 'hsl(var(--surface))', borderRadius: 4 }}
        >
          <p className="label-mono text-[10px]" style={{ color: 'hsl(var(--neon-cyan))' }}>For creators</p>
          <div>
            <h3 className="font-heading font-semibold text-white leading-[1] mb-4" style={{ fontSize: 'clamp(30px, 4vw, 54px)' }}>
              Shoot with Stelli
            </h3>
            <p className="font-body text-[13px] text-white/50 max-w-xs leading-relaxed">
              Get a public profile, quote your own work, and get paid on delivery.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 label-mono text-[10px]" style={{ color: 'hsl(var(--neon-cyan))' }}>
            Apply to join <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </Link>
      </div>
    </section>
  );
}