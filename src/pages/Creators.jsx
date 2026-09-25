import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import RatingDisplay from '@/components/RatingDisplay';
import { Skeleton } from '@/components/ui/skeleton';
import { tagsForMarket, displayNameOf } from '@/lib/profilePresets';
import PageShell from '@/components/shared/PageShell';
import SectionHeader from '@/components/shared/SectionHeader';
import Surface from '@/components/shared/Surface';
import Chip from '@/components/shared/Chip';
import EmptyState from '@/components/shared/EmptyState';

export default function Creators() {
  const [selectedTags, setSelectedTags] = useState([]);

  const { data: creators = [], isLoading } = useQuery({
    queryKey: ['creators'],
    queryFn: () => base44.entities.Lensman.filter({ status: 'approved' }),
  });

  const marketTags = tagsForMarket();
  const scoped = creators;

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
    <PageShell>
      <SectionHeader
        eyebrow="Browse creators"
        title="Creators worth putting in your calendar."
        intro="Elon University senior portraits, campus shoots and everything in between."
      />

      <div className="mt-12 flex flex-wrap gap-2">
        {marketTags.map((tag) => (
          <Chip key={tag} active={selectedTags.includes(tag)} onClick={() => toggleTag(tag)}>
            {tag}
          </Chip>
        ))}
      </div>

      <div className="mt-10">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-label="Loading creators">
            {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-[400px] rounded-[18px]" />)}
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            title={selectedTags.length ? 'Nobody matches those tags yet.' : 'No creators yet.'}
            line={selectedTags.length ? 'Loosen the filters and more work will show up.' : 'Check back soon — new creators are joining.'}
            action={
              selectedTags.length > 0 ? (
                <button
                  onClick={() => setSelectedTags([])}
                  className="rounded-full px-6 py-3 label-mono text-[10px] font-semibold"
                  style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))' }}
                >
                  Clear filters
                </button>
              ) : null
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((c, i) => (
              <Surface
                as={Link}
                key={c.id}
                to={`/creators/${c.slug || c.id}`}
                hover
                className="group overflow-hidden"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img
                    src={c.profile_image || c.portfolio_images?.[0] || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80'}
                    alt={displayNameOf(c)}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  {selectedTags.length === 0 && i < 3 && (
                    <span
                      className="absolute top-3 left-3 rounded-full px-2.5 py-1.5 label-mono text-[8px] font-semibold"
                      style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))' }}
                    >
                      Top rated
                    </span>
                  )}
                </div>

                <div className="p-5">
                  <p className="text-[19px] font-semibold leading-tight text-white">{displayNameOf(c)}</p>
                  <p className="label-mono text-[9px] text-white/40 mt-2.5">
                    {c.neighborhoods?.[0] || 'Elon'} · {c.specialties?.slice(0, 2).join(' / ') || 'Photography'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-4">
                    <RatingDisplay rating={c.avg_rating} reviewCount={c.review_count} />
                    {c.review_count > 0 && (
                      <span className="text-[12px] text-white/30">
                        ({c.review_count} · {c.completed_shoots || 0} shoots)
                      </span>
                    )}
                  </div>
                </div>
              </Surface>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}