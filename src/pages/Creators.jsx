import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import RatingDisplay from '@/components/RatingDisplay';
import { Skeleton } from '@/components/ui/skeleton';
import MarketSwitcher from '@/components/shared/MarketSwitcher';
import { useMarket, filterByMarket } from '@/lib/market';
import { tagsForMarket, displayNameOf } from '@/lib/profilePresets';

export default function Creators() {
  const { market, activeMarket } = useMarket();
  const [selectedTags, setSelectedTags] = useState([]);

  const { data: creators = [], isLoading } = useQuery({
    queryKey: ['creators'],
    queryFn: () => base44.entities.Lensman.filter({ status: 'approved' }),
  });

  useEffect(() => { setSelectedTags([]); }, [market]);

  const marketTags = tagsForMarket(market, false);
  const scoped = filterByMarket(creators, market);

  const results = selectedTags.length === 0
    ? [...scoped].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0))
    : scoped
      .map((creator) => ({
        creator,
        matches: (creator.style_tags || [])
          .filter((tag) => selectedTags.includes(String(tag || '').toLowerCase())).length,
      }))
      .filter((entry) => entry.matches > 0)
      .sort((a, b) => b.matches - a.matches || (b.creator.avg_rating || 0) - (a.creator.avg_rating || 0))
      .map((entry) => entry.creator);

  const toggleTag = (tag) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

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
        <div className="flex flex-wrap gap-2 mb-8">
          {marketTags.map((tag) => {
            const active = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className="label-mono text-[9px] px-3 py-2 border transition-colors duration-200"
                style={{
                  borderColor: active ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.14)',
                  color: active ? 'hsl(var(--white))' : 'rgba(255,255,255,0.45)',
                  borderRadius: 999,
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" aria-label="Loading creators">
            {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-[420px]" />)}
          </div>
        ) : results.length === 0 ? (
          <div className="border border-white/10 py-20 text-center" style={{ borderRadius: 4 }}>
            <p className="font-heading text-3xl text-white">
              {selectedTags.length ? 'Nobody yet — try fewer tags.' : 'No creators yet.'}
            </p>
            <p className="font-body text-[13px] text-white/40 mt-2">
              {selectedTags.length ? 'Loosen the filters to see more work.' : 'Try the other market.'}
            </p>
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="label-mono text-[10px] px-6 py-3 mt-7"
                style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', borderRadius: 4 }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {results.map((c, i) => (
              <Link
                key={c.id}
                to={`/creators/${c.slug || c.id}`}
                className="group border border-white/10 overflow-hidden transition-colors duration-300 hover:border-white/30"
                style={{ background: 'hsl(var(--surface))', borderRadius: 4 }}
              >
                <div className="relative h-[320px] overflow-hidden">
                  <img
                    src={c.profile_image || c.portfolio_images?.[0] || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80'}
                    alt={displayNameOf(c)}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  {selectedTags.length === 0 && i < 3 && (
                    <span
                      className="absolute top-3 left-3 label-mono text-[8px] font-semibold px-2.5 py-1.5"
                      style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', borderRadius: 3 }}
                    >
                      Top rated
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <p className="font-heading text-[22px] font-semibold text-white leading-tight">{displayNameOf(c)}</p>
                  <p className="label-mono text-[9px] text-white/40 mt-2">
                    {(c.neighborhoods?.[0] || activeMarket.short)} · {c.specialties?.slice(0, 2).join(' / ') || 'Photography'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-4">
                    <RatingDisplay rating={c.avg_rating} reviewCount={c.review_count} />
                    {c.review_count > 0 && (
                      <span className="font-body text-[11px] text-white/30">
                        ({c.review_count} · {c.completed_shoots || 0} shoots)
                      </span>
                    )}
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