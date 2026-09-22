import React from 'react';
import { format } from 'date-fns';
import { ShieldCheck } from 'lucide-react';
import { creatorPayout } from '@/lib/threadPricing';

/** The held-payment line that sits quietly in the thread once it is paid. */
export default function HeldPaymentNote({ booking, role }) {
  if (booking?.payment_status !== 'held') return null;

  const payout = creatorPayout(booking.total_price);

  return (
    <div className="border border-white/10 bg-white/[0.03] px-5 py-4 flex items-start gap-3" style={{ borderRadius: 4 }}>
      <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'hsl(var(--neon-lime))' }} />
      <div>
        <p className="font-body text-[13px] text-white/70 leading-relaxed">
          {role === 'lensman'
            ? `Payment held by Stelli until the photos are delivered. $${payout.toLocaleString()} is released to you after the 48 hour window closes.`
            : 'Payment held by Stelli until your photos are delivered.'}
        </p>
        {booking.paid_at && (
          <p className="label-mono text-[9px] text-white/30 mt-2">
            PAID {format(new Date(booking.paid_at), 'MMM d, yyyy')}
          </p>
        )}
      </div>
    </div>
  );
}