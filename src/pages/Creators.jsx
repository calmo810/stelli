import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { SearchX } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Btn, EmptyState, ErrorState } from '@/components/system';
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
    <div className="st-page st-ink overflow-x-hidden">
      <div className="st-wrap relative z-[1] pb-20 pt-6 md:pb-28 md:pt-9">
        {/* The layout already clears the fixed nav, so the header starts right under it. */}
        <div className="mb-6">
          <BrowseFilters
            filters={BROWSE_FILTERS}
            value={filter}
            onChange={setFilter}
            count={isLoading ? 0 : results.length}
          />
        </div>

        {isError ? (
          <ErrorState title="We couldn’t load creators." onRetry={() => refetch()} />
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
          <EmptyState
            icon={SearchX}
            title="No one here yet."
            body="Nobody matches that filter right now."
            action={<Btn variant="outline" size="sm" onClick={() => setFilter('all')}>Show everyone</Btn>}
          />
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