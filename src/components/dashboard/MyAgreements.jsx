import React from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

export default function MyAgreements({ role = 'client' }) {
  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['my-agreements', role],
    queryFn: () => base44.entities.BookingContract.list('-created_at'),
  });

  return (
    <section className="border p-5 md:p-6" style={{ background: 'hsl(var(--surface))', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 4 }}>
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <p className="label-mono text-[9px] text-white/30 mb-2">Legal Archive</p>
          <h2 className="font-heading text-2xl font-semibold text-white">My Agreements</h2>
        </div>
        <span className="label-mono text-[9px] text-white/35">{contracts.length} saved</span>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : contracts.length ? (
        <div className="space-y-2">
          {contracts.map((contract) => (
            <div key={contract.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-white/10 p-4" style={{ background: 'hsl(var(--surface-2))', borderRadius: 4 }}>
              <div>
                <p className="font-body text-sm font-semibold text-white">
                  {role === 'client' ? contract.creator_name : contract.client_name}
                </p>
                <p className="font-body text-[11px] text-white/45">
                  {contract.shoot_date || 'Date pending'} · {contract.format_name}
                </p>
              </div>
              <Link
                to={`/agreements/${contract.id}`}
                className="inline-flex px-4 py-2 label-mono text-[9px] border border-white/15 text-white/70 hover:text-white transition-colors self-start sm:self-auto"
                style={{ borderRadius: 4 }}
              >
                View
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <p className="font-body text-[13px] text-white/45">Booking contracts will appear here after agreement review.</p>
      )}
    </section>
  );
}