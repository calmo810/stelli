import React from 'react';
import { FileText } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { mediumDate } from '@/lib/format';
import { Row, Skeleton } from '@/components/system';

/** Booking contracts, folded into one compact list. Reads right on ink or on paper. */
export default function MyAgreements({ role = 'client', userId = null, title = 'Agreements' }) {
  const creatorScope = role === 'lensman' && userId ? { creator_user_id: userId } : null;
  const { data: allContracts = [], isLoading } = useQuery({
    queryKey: ['my-agreements', role, userId || 'current'],
    enabled: role !== 'lensman' || !!userId,
    queryFn: () =>
      creatorScope
        ? base44.entities.BookingContract.filter(creatorScope, '-created_at')
        : base44.entities.BookingContract.list('-created_at'),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  // An agreement replaced by a newer quote is kept on record but not listed.
  const contracts = allContracts.filter((contract) => contract.status !== 'superseded');

  // Nothing signed yet means nothing to show.
  if (!isLoading && !contracts.length) return null;

  return (
    <section aria-label={title}>
      <div className="mb-2.5 flex items-baseline justify-between px-1">
        <h2 className="st-kicker">{title}</h2>
        {contracts.length > 0 && <span className="st-small">{contracts.length} on record</span>}
      </div>

      {isLoading ? (
        <Skeleton className="h-[64px] !rounded-st-md" />
      ) : (
        <div className="st-list">
          {contracts.map((contract) => (
            <Row
              key={contract.id}
              to={`/agreements/${contract.id}`}
              leading={
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-tint-butter text-[var(--tint-butter-ink)]" aria-hidden>
                  <FileText className="h-[18px] w-[18px]" />
                </span>
              }
              title={role === 'client' ? contract.creator_name : contract.client_name}
              meta={[contract.format_name, contract.shoot_date ? mediumDate(contract.shoot_date) : 'Date to be set'].filter(Boolean).join(' · ')}
            />
          ))}
        </div>
      )}
    </section>
  );
}
