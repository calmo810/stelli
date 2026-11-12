import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import BrowseHero from '@/components/browse/BrowseHero';
import BrowseFilters from '@/components/browse/BrowseFilters';
import CreatorCard from '@/components/browse/CreatorCard';
import QuickViewSheet from '@/components/browse/QuickViewSheet';
import { APPROVED_CREATORS_QUERY_KEY, BROWSE_FILTERS, matchesFilter } from '@/lib/creatorBrowse';

export default function Creators() {
  const [filter, setFilter] = useState('all');
  const [openCreator, setOpenCreator] = useState(null);

  const { data: creators = [], isLoading, isError, refetch } = useQuery({
    queryKey: APPROVED_CREATORS_QUERY_KEY,
    // A creator on hold (under review) is not listed while a founder looks.
    queryFn: async () => (await base44.entities.Lensman.filter({ status: 'approved' })).filter((c) => !c.under_review),
  });

  const results = useMemo(
    () => creators.filter((creator) => matchesFilter(creator, filter)),
    [creators, filter]
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-ink text-white">
      <div className="relative z-[1] mx-auto max-w-[1240px] px-5 pt-24 pb-24 md:px-10 md:pt-28 md:pb-32">
        <BrowseHero />

        <div className="mb-6 mt-6">
          <BrowseFilters
            filters={BROWSE_FILTERS}
            value={filter}
            onChange={setFilter}
            count={isLoading ? 0 : results.length}
          />
        </div>

        {isError ? (
          <div role="alert" className="py-16 text-center">
            <p className="text-white/70">We couldn’t load creators. Please try again.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 rounded-full border border-white/25 px-5 py-2 text-sm text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-lime"
            >
              Try again
            </button>
          </div>
        ) : isLoading ? (
          <div
            className="grid grid-cols-1 gap-[22px] pb-8 sm:grid-cols-2 lg:grid-cols-3"
            aria-label="Loading creators"
          >
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="aspect-[4/5] rounded-[22px]" />
              ))}
          </div>
        ) : results.length === 0 ? (
          <p className="py-20 text-center text-white/45">No one here yet. Try another filter.</p>
        ) : (
          <div
            className="grid grid-cols-1 gap-[22px] sm:grid-cols-2 lg:grid-cols-3"
            aria-label="Creators"
          >
            {results.map((creator, i) => (
              <CreatorCard key={creator.id} creator={creator} index={i} onOpen={setOpenCreator} />
            ))}
          </div>
        )}
      </div>

      {openCreator && (
        <QuickViewSheet
          key={openCreator.id}
          creator={openCreator}
          onClose={() => setOpenCreator(null)}
        />
      )}
    </div>
  );
}