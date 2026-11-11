import React from 'react';
import { format } from 'date-fns';
import { ShieldCheck } from 'lucide-react';
import { creatorPayout } from '@/lib/threadPricing';
import { money } from '@/lib/bookingNextStep';

/** The held-payment line that sits quietly in the thread once it is paid. */
export default function HeldPaymentNote({ booking, role }) {
  if (booking?.payment_status !== 'held') return null;

  // What the creator is actually owed, as recorded when the payment landed.
  const payout = Number(booking.creator_payout) > 0 ? Number(booking.creator_payout) : creatorPayout(booking.total_price);

  return (
    <div className="glass flex items-start gap-3 rounded-[22px] px-[18px] py-4">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'hsl(var(--neon-lime))' }} />
      <div>
        <p className="text-[14px] leading-relaxed text-white/75">
          {role === 'lensman'
            ? `The client has paid. ${money(payout)} is held for you and released 48 hours after you deliver the final edits.`
            : 'Your payment is held safely by Stelli until your photos arrive. Your creator is paid 48 hours after delivery, unless you report a problem.'}
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