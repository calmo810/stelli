import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function AgreementDetail() {
  const { contractId } = useParams();
  const [agreed, setAgreed] = useState(false);
  const queryClient = useQueryClient();

  const { data: contract, isLoading } = useQuery({
    queryKey: ['booking-contract', contractId],
    queryFn: () => base44.entities.BookingContract.get(contractId),
  });

  const acceptContract = useMutation({
    mutationFn: () => base44.functions.invoke('acceptBookingContract', { bookingId: contract.booking_id, party: 'creator' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['booking-contract', contractId] }),
  });

  const paragraphs = contract?.contract_text?.split('\n').filter(Boolean) || [];
  const needsCreatorAcceptance = contract && !contract.creator_accepted_at;

  return (
    <div className="min-h-screen bg-[#10182d] text-[#f0ede6] px-6 md:px-14 pt-24 pb-16">
      <div className="max-w-4xl mx-auto">
        <Link to="/client-dashboard" className="text-[10px] font-body tracking-[0.18em] uppercase" style={{ color: 'rgba(242,220,169,0.6)' }}>Back to dashboard</Link>
        <div className="mt-8 mb-10">
          <p className="text-[8px] font-body tracking-[0.45em] uppercase mb-4" style={{ color: 'rgba(242,220,169,0.5)' }}>Booking Agreement</p>
          <h1 className="font-display text-4xl md:text-6xl font-semibold">Review your booking agreement</h1>
        </div>

        {isLoading ? (
          <Skeleton className="h-96 bg-white/10" />
        ) : contract ? (
          <>
            <article className="border p-6 md:p-8 space-y-4" style={{ borderColor: 'rgba(242,220,169,0.18)', background: 'rgba(255,255,255,0.04)' }}>
              {paragraphs.map((p, i) => <p key={i} className="font-body text-sm leading-[1.9]" style={{ color: i === 0 ? '#F2DCA9' : 'rgba(240,237,230,0.72)' }}>{p}</p>)}
            </article>
            {needsCreatorAcceptance ? (
              <div className="mt-8 border p-5" style={{ borderColor: 'rgba(242,220,169,0.18)' }}>
                <label className="flex items-start gap-3 cursor-pointer mb-5">
                  <Checkbox checked={agreed} onCheckedChange={setAgreed} className="mt-1 border-[#F2DCA9]" />
                  <span className="text-sm leading-relaxed" style={{ color: 'rgba(240,237,230,0.72)' }}>
                    I agree to this booking agreement and Stelli's <Link to="/terms" className="underline">Terms and Conditions</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link>.
                  </span>
                </label>
                <Button onClick={() => acceptContract.mutate()} disabled={!agreed || acceptContract.isPending} className="rounded-full bg-[#F2DCA9] text-[#10182d]">Accept agreement</Button>
              </div>
            ) : (
              <p className="mt-6 text-sm" style={{ color: 'rgba(242,220,169,0.72)' }}>This agreement has been accepted and is read-only.</p>
            )}
          </>
        ) : (
          <p>Agreement not found.</p>
        )}
      </div>
    </div>
  );
}