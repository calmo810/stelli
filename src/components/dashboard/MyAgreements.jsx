import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

/** Booking contracts, folded into one compact glass list. */
export default function MyAgreements({ role = 'client' }) {
  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['my-agreements', role],
    queryFn: () => base44.entities.BookingContract.list('-created_at'),
  });

  return (
    <section>
      <div className="mb-2.5 flex items-baseline justify-between pl-1.5 pr-1.5">
        <h3 className="text-[13px] font-semibold text-white/50">Agreements</h3>
        {contracts.length > 0 && <span className="text-[12px] text-white/35">{contracts.length} signed</span>}
      </div>

      {isLoading ? (
        <div className="glass h-[58px] animate-pulse rounded-3xl" />
      ) : contracts.length ? (
        <div className="glass overflow-hidden rounded-3xl">
          {contracts.map((contract, i) => (
            <Link
              key={contract.id}
              to={`/agreements/${contract.id}`}
              className={`flex items-center gap-3.5 px-[18px] py-3 transition-colors hover:bg-white/[0.05]${
                i ? ' border-t border-white/[0.08]' : ''
              }`}
            >
              <span className="min-w-0 flex-1">
                <b className="block truncate text-[15px] font-medium text-white">
                  {role === 'client' ? contract.creator_name : contract.client_name}
                </b>
                <small className="mt-0.5 block truncate text-[12.5px] text-white/45">
                  {contract.shoot_date || 'Date pending'} · {contract.format_name}
                </small>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-white/35" strokeWidth={2.4} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="glass rounded-3xl px-[18px] py-3.5">
          <p className="text-[14px] text-white/50">Booking contracts will appear here after agreement review.</p>
        </div>
      )}
    </section>
  );
}