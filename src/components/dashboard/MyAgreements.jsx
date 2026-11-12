import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

/** Booking contracts, folded into one compact list. `light` draws it on a bright card. */
export default function MyAgreements({ role = 'client', light = false }) {
  const { data: allContracts = [], isLoading } = useQuery({
    queryKey: ['my-agreements', role],
    queryFn: () => base44.entities.BookingContract.list('-created_at'),
  });
  // An agreement replaced by a newer quote is kept on record but not listed.
  const contracts = allContracts.filter((contract) => contract.status !== 'superseded');

  // Nothing signed yet means nothing to show.
  if (!isLoading && !contracts.length) return null;

  const shell = light
    ? 'overflow-hidden rounded-[24px] bg-white'
    : 'glass overflow-hidden rounded-3xl';
  const row = light
    ? 'flex items-center gap-3.5 px-[18px] py-3 transition-colors hover:bg-[#f2f4f8]'
    : 'flex items-center gap-3.5 px-[18px] py-3 transition-colors hover:bg-white/[0.05]';
  const divider = light ? ' border-t border-[rgba(10,18,38,0.08)]' : ' border-t border-white/[0.08]';
  const name = light ? 'text-ink' : 'text-white';
  const meta = light ? 'wk-mute' : 'text-white/45';
  const chevron = light ? 'wk-mute' : 'text-white/35';

  return (
    <section className="mt-8">
      <div className="mb-2.5 flex items-baseline justify-between pl-1.5 pr-1.5">
        <h3 className="text-[13px] font-semibold text-white/50">Agreements</h3>
        {contracts.length > 0 && <span className="text-[12px] text-white/35">{contracts.length} signed</span>}
      </div>

      {isLoading ? (
        <div className={`${light ? 'bg-white' : 'glass'} h-[58px] animate-pulse rounded-3xl`} />
      ) : (
        <div className={shell}>
          {contracts.map((contract, i) => (
            <Link
              key={contract.id}
              to={`/agreements/${contract.id}`}
              className={`${row}${i ? divider : ''}`}
            >
              <span className="min-w-0 flex-1">
                <b className={`block truncate text-[15px] font-medium ${name}`}>
                  {role === 'client' ? contract.creator_name : contract.client_name}
                </b>
                <small className={`mt-0.5 block truncate text-[12.5px] ${meta}`}>
                  {contract.shoot_date || 'Date pending'} · {contract.format_name}
                </small>
              </span>
              <ChevronRight className={`h-4 w-4 shrink-0 ${chevron}`} strokeWidth={2.4} />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}