import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import RatingDisplay from '@/components/RatingDisplay';
import { Skeleton } from '@/components/ui/skeleton';
import { useMarket, filterByMarket } from '@/lib/market';

export default function TopRatedRail() {
  const { market, activeMarket } = useMarket();

  const { data: creators = [], isLoading } = useQuery({
    queryKey: ['top-rated-creators'],
    queryFn: () => base44.entities.Lensman.filter({ status: 'approved' }),
  });

  const ranked = [...filterByMarket(creators, market)]
    .sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0) || (b.review_count || 0) - (a.review_count || 0))
    .slice(0, 8);

  return (
    <section className="py-20 md:py-28 border-t border-white/10">
      <div className="max-w-[1500px] mx-auto px-5 md:px-10">
        <div className="flex items-end justify-between gap-6 mb-10">
          <div>
            <p className="label-mono text-[9px] text-white/35 mb-3">{activeMarket.short} market</p>
            <h2 className="font-heading font-semibold text-white leading-[1]" style={{ fontSize: 'clamp(30px, 4.4vw, 62px)' }}>
              Top-rated creators
            </h2>
          </div>
          <Link to="/creators" className="hidden sm:block label-mono text-[10px] text-neon-lime neon-underline shrink-0">
            See all
          </Link>
        </div>

        {isLoading ? (
          <div className="flex gap-5" aria-label="Loading creators">
            {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-[420px] w-[280px] shrink-0" />)}
          </div>
        ) : ranked.length === 0 ? (
          <p className="font-body text-[13px] text-white/40">No creators in this market yet.</p>
        ) : (
          <div className="flex gap-5 overflow-x-auto no-scrollbar pb-2">
            {ranked.map((c, i) => (
              <Link
                key={c.id}
                to={`/creators/${c.id}`}
                className="group shrink-0 w-[260px] md:w-[280px] border border-white/10 overflow-hidden transition-colors duration-300 hover:border-white/30"
                style={{ background: 'hsl(var(--surface))', borderRadius: 4 }}
              >
                <div className="relative h-[300px] overflow-hidden">
                  <img
                    src={c.profile_image || c.portfolio_images?.[0] || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80'}
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
                <div className="p-4">
                  <p className="font-heading text-[19px] font-semibold text-white leading-tight">{c.full_name}</p>
                  <p className="label-mono text-[9px] text-white/40 mt-1.5">
                    {(c.neighborhoods?.[0] || activeMarket.short)} · {c.specialties?.[0] || 'Photography'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-3">
                    <RatingDisplay rating={c.avg_rating} reviewCount={c.review_count} />
                    {c.review_count > 0 && (
                      <span className="font-body text-[11px] text-white/30">({c.review_count})</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}