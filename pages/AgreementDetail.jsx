import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { prettyDate } from '@/lib/stelli';

export default function AgreementDetail() {
  const { contractId } = useParams();

  const { data: contract, isLoading } = useQuery({
    queryKey: ['booking-contract', contractId],
    queryFn: () => base44.entities.BookingContract.get(contractId),
  });

  return (
    <div className="min-h-screen bg-ink">
      <div className="max-w-3xl mx-auto px-5 md:px-10 pt-28 pb-24">
        <Link to="/portal" className="inline-flex items-center gap-2 label-mono text-[10px] text-white/35 hover:text-neon-lime transition-colors mb-10">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
        </Link>

        <p className="label-mono text-[9px] text-white/35 mb-4">Booking agreement</p>
        <h1 className="font-heading font-semibold text-white leading-[0.95] mb-8" style={{ fontSize: 'clamp(34px, 5.5vw, 60px)' }}>
          Your agreement.
        </h1>

        {isLoading ? (
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'hsl(var(--neon-lime))' }} />
        ) : !contract ? (
          <p className="font-body text-[14px] text-white/45">This agreement isn't available.</p>
        ) : (
          <>
            <article className="border border-white/10 p-6 md:p-8 space-y-3" style={{ background: 'hsl(var(--surface))', borderRadius: 4 }}>
              {(contract.contract_text || '').split('\n').filter(Boolean).map((line, i) => (
                <p key={i} className="font-body text-[14px] leading-[1.9]" style={{ color: i === 0 ? '#fff' : 'rgba(255,255,255,0.65)' }}>{line}</p>
              ))}
            </article>
            <div className="mt-6 grid sm:grid-cols-2 gap-3">
              <Accepted label="Client accepted" at={contract.client_accepted_at} />
              <Accepted label="Creator accepted" at={contract.creator_accepted_at} />
            </div>
            <p className="font-body text-[12px] text-white/35 mt-6 leading-relaxed">
              Both sides agreed to this when the quote was sent and accepted. Shoot date {prettyDate(contract.shoot_date)}.
              Keep this for your records — it's the written agreement the NYC Freelance Isn't Free Act asks for.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Accepted({ label, at }) {
  return (
    <div className="border border-white/10 p-4" style={{ borderRadius: 4 }}>
      <p className="label-mono text-[9px] text-white/35 mb-2">{label}</p>
      <p className="font-body text-[13px]" style={{ color: at ? 'hsl(var(--neon-lime))' : 'rgba(255,255,255,0.4)' }}>
        {at ? new Date(at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Not yet'}
      </p>
    </div>
  );
}
