import React from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function MyAgreements({ role = 'client' }) {
  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['my-agreements', role],
    queryFn: () => base44.entities.BookingContract.list('-created_at'),
  });

  return (
    <section className="border p-5 md:p-6" style={{ background: '#ece9e2', borderColor: 'rgba(26,39,68,0.12)' }}>
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <p className="text-[8px] font-body tracking-[0.4em] uppercase mb-2" style={{ color: 'rgba(26,39,68,0.3)' }}>Legal Archive</p>
          <h2 className="font-display text-2xl font-semibold" style={{ color: '#1a2744' }}>My Agreements</h2>
        </div>
        <span className="text-[10px] font-body" style={{ color: 'rgba(26,39,68,0.35)' }}>{contracts.length} saved</span>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-16" />)}</div>
      ) : contracts.length ? (
        <div className="space-y-2">
          {contracts.map(contract => (
            <div key={contract.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border p-4" style={{ borderColor: 'rgba(26,39,68,0.1)', background: '#f0ede6' }}>
              <div>
                <p className="font-body text-sm font-semibold" style={{ color: '#1a2744' }}>{role === 'client' ? contract.creator_name : contract.client_name}</p>
                <p className="text-[11px] font-body" style={{ color: 'rgba(26,39,68,0.45)' }}>
                  {contract.shoot_date || 'Date pending'} · {contract.format_name}
                </p>
              </div>
              <Link to={`/agreements/${contract.id}`}>
                <Button size="sm" variant="outline" className="rounded-full text-xs">View</Button>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm" style={{ color: 'rgba(26,39,68,0.45)' }}>Booking contracts will appear here after agreement review.</p>
      )}
    </section>
  );
}