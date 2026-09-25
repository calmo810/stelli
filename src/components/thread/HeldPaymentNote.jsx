import React from 'react';
import { format } from 'date-fns';
import { ShieldCheck } from 'lucide-react';
import { creatorPayout } from '@/lib/threadPricing';

/** The held-payment line that sits quietly in the thread once it is paid. */
export default function HeldPaymentNote({ booking, role }) {
  if (booking?.payment_status !== 'held') return null;

  const payout = creatorPayout(booking.total_price);

  return (
    <div className="glass flex items-start gap-3 rounded-[22px] px-[18px] py-4">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'hsl(var(--neon-lime))' }} />
      <div>
        <p className="text-[14px] leading-relaxed text-white/75">
          {role === 'lensman'
            ? `Payment held by Stelli until the photos are delivered. $${payout.toLocaleString()} is released to you after the 48 hour window closes.`
            : 'Payment held by Stelli until your photos are delivered.'}
        </p>
        {booking.paid_at && (
          <p className="mt-2 text-[11px] text-white/35">
            Paid {format(new Date(booking.paid_at), 'MMM d, yyyy')}
          </p>
        )}
      </div>
    </div>
  );
}