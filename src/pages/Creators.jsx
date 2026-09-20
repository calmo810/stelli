import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import MarketSwitcher from '@/components/shared/MarketSwitcher';
import { useMarket, filterByMarket } from '@/lib/market';

export default function Creators() {
  const { market, activeMarket } = useMarket();

  const { data: creators = [], isLoading } = useQuery({
    queryKey: ['creators'],
    queryFn: () => base44.entities.Lensman.filter({ status: 'approved' }),
  });

  const scoped = filterByMarket(creators, market)
    .sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));

  return (
    <div className="min-h-screen bg-ink">
      <section className="max-w-[1500px] mx-auto px-5 md:px-10 pt-32 pb-10">
        <p className="label-mono text-[9px] text-white/35 mb-5">Browse creators</p>
        <h1 className="font-heading font-semibold text-white leading-[0.95] mb-6" style={{ fontSize: 'clamp(40px, 7vw, 92px)' }}>
          Creators worth<br />putting in your calendar.
        </h1>
        <p className="font-body text-[14px] leading-relaxed text-white/45 max-w-md mb-9">
          {activeMarket.blurb}
        </p>
        <MarketSwitcher />
      </section>

      <section className="max-w-[1500px] mx-auto px-5 md:px-10 pb-24">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" aria-label="Loading creators">
            {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-[420px]" />)}
          </div>
        ) : scoped.length === 0 ? (
          <div className="border border-white/10 py-20 text-center" style={{ borderRadius: 4 }}>
            <p className="font-heading text-3xl text-white">No creators yet.</p>
            <p className="font-body text-[13px] text-white/40 mt-2">Try the other market.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {scoped.map((c, i) => (
              <Link
                key={c.id}
                to={`/creators/${c.id}`}
                className="group border border-white/10 overflow-hidden transition-colors duration-300 hover:border-white/30"
                style={{ background: 'hsl(var(--surface))', borderRadius: 4 }}
              >
                <div className="relative h-[320px] overflow-hidden">
                  <img
                    src={c.profile_image || c.portfolio_images?.[0] || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80'}
                    alt={c.full_name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  {i < 3 && (
                    <span
                      className="absolute top-3 left-3 label-mono text-[8px] font-semibold px-2.5 py-1.5"
                      style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', borderRadius: 3 }}
                    >
                      Top rated
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <p className="font-heading text-[22px] font-semibold text-white leading-tight">{c.full_name}</p>
                  <p className="label-mono text-[9px] text-white/40 mt-2">
                    {(c.neighborhoods?.[0] || activeMarket.short)} · {c.specialties?.slice(0, 2).join(' / ') || 'Photography'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-4">
                    <Star className="w-3.5 h-3.5" style={{ color: 'hsl(var(--neon-magenta))' }} fill="hsl(var(--neon-magenta))" />
                    <span className="font-body text-[12px] text-white/70">{(c.avg_rating || 0).toFixed(1)}</span>
                    <span className="font-body text-[11px] text-white/30">
                      ({c.review_count || 0} · {c.completed_shoots || 0} shoots)
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}