import React, { useMemo, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import BrowseHero from '@/components/browse/BrowseHero';
import BrowseFilters from '@/components/browse/BrowseFilters';
import CreatorCard from '@/components/browse/CreatorCard';
import QuickViewSheet from '@/components/browse/QuickViewSheet';
import { BROWSE_FILTERS, matchesFilter } from '@/lib/creatorBrowse';

export default function Creators() {
  const [filter, setFilter] = useState('all');
  const [openCreator, setOpenCreator] = useState(null);
  const browseRef = useRef(null);

  const { data: creators = [], isLoading } = useQuery({
    queryKey: ['creators'],
    queryFn: () => base44.entities.Lensman.filter({ status: 'approved' }),
  });

  const results = useMemo(
    () => creators.filter((creator) => matchesFilter(creator, filter)),
    [creators, filter]
  );

  const scrollToBrowse = () =>
    browseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="min-h-screen overflow-x-hidden bg-ink text-white">
      <div className="relative z-[1] mx-auto max-w-[1240px] px-5 pb-32 md:px-10">
        <BrowseHero creators={creators} onFind={scrollToBrowse} />

        <div ref={browseRef} className="mb-7 mt-12 scroll-mt-6 md:mt-14">
          <BrowseFilters
            filters={BROWSE_FILTERS}
            value={filter}
            onChange={setFilter}
            count={isLoading ? 0 : results.length}
          />
        </div>

        {isLoading ? (
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