import { secrets } from 'base44:runtime';
import { clientTotal, stripePost } from './stripe.ts';
import { toCents } from './money.ts';
import { sendEmail } from './notify.ts';

export async function refundBooking(base44, booking, amount, note) {
  if (!booking) return { refunded: false, reason: 'not-found' };
  if (booking.refunded_at) return { refunded: false, reason: 'already-refunded' };

  const reference = booking.stripe_payment_intent_id || booking.stripe_charge_id;
  if (!reference) return { refunded: false, reason: 'no-charge' };

  // What Stripe actually took. Older bookings that predate amount_charged fall
  // back to the quote plus the service fee.
  const charged =
    Number(booking.amount_charged || 0) > 0
      ? Number(booking.amount_charged)
      : clientTotal(booking.total_price);

  const refundAmount = Number(amount || 0) > 0 ? Number(amount) : charged;
  const cents = toCents(refundAmount);

  const params = new URLSearchParams();
  params.set(booking.stripe_payment_intent_id ? 'payment_intent' : 'charge', reference);
  params.set('amount', String(cents));
  params.set('metadata[booking_id]', booking.id);
  params.set('metadata[base44_app_id]', secrets.get('BASE44_APP_ID') || '');

  // Keyed by the amount, so a second, different refund is never blocked.
  const refund = await stripePost('refunds', params, `refund-${booking.id}-${cents}`);

  // A refund after the creator was already paid pulls their share back.
  let reversalId = booking.stripe_transfer_reversal_id || '';
  if (booking.stripe_transfer_id && charged > 0) {
    const share =
      Math.round(Number(booking.creator_payout || 0) * (refundAmount / charged) * 100) / 100;
    if (share > 0) {
      const reversalCents = toCents(share);
      const reversalParams = new URLSearchParams();
      reversalParams.set('amount', String(reversalCents));
      reversalParams.set('metadata[booking_id]', booking.id);
      reversalParams.set('metadata[base44_app_id]', secrets.get('BASE44_APP_ID') || '');
      const reversal = await stripePost(
        `transfers/${booking.stripe_transfer_id}/reversals`,
        reversalParams,
        `reversal-${booking.id}-${reversalCents}`
      );
      reversalId = reversal.id;
    }
  }

  const now = new Date().toISOString();

  await base44.asServiceRole.entities.Booking.update(booking.id, {
    refund_amount: refundAmount,
    refunded_at: now,
    payment_status: cents >= toCents(charged) ? 'refunded' : 'partially_refunded',
    stripe_transfer_reversal_id: reversalId,
    flagged_for_review: false,
    flag_reason: note || '',
  });

  await sendEmail(
    base44,
    booking.client_email,
    'Refund issued',
    `$${refundAmount.toLocaleString()} has been refunded for the ${booking.event_date} shoot. It reaches your card in a few business days.`
  );

  return { refunded: true, refundId: refund.id, amount: refundAmount };
}
