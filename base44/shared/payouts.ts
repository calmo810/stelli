import { secrets } from 'base44:runtime';
import { creatorPayout, stripePost, HOLD_HOURS } from './stripe.ts';
import { sendEmail } from './notify.ts';

/**
 * Money leaving the hold.
 *
 * Charges are made on Stelli's balance and the creator is paid by a separate
 * transfer, so every payout goes through here — the automatic sweep, a founder
 * decision, and a client confirming delivery all use the same guarded path.
 */

export async function releaseBooking(base44, booking, releasedBy = 'auto') {
  if (!booking) return { released: false, reason: 'not-found' };
  if (booking.released_at || booking.payment_status === 'released') {
    return { released: false, reason: 'already-released' };
  }
  if (booking.flagged_for_review) return { released: false, reason: 'flagged' };
  if (booking.payment_status !== 'held') return { released: false, reason: 'nothing-held' };

  const lensman = booking.lensman_id
    ? await base44.asServiceRole.entities.Lensman.get(booking.lensman_id).catch(() => null)
    : null;

  const destination = lensman?.stripe_account_id;
  const amount = creatorPayout(booking.total_price);

  // Fail safe: no connected account means the money simply stays held.
  if (!destination || !lensman?.payouts_enabled) {
    await base44.asServiceRole.entities.Booking.update(booking.id, {
      needs_payout_setup: true,
      flagged_for_review: true,
      flag_reason: 'Creator has no payout account set up — funds still held by Stelli.',
    });
    return { released: false, reason: 'no-payout-account' };
  }

  const params = new URLSearchParams();
  params.set('amount', String(Math.round(amount * 100)));
  params.set('currency', 'usd');
  params.set('destination', destination);
  params.set('transfer_group', booking.transfer_group || `booking_${booking.id}`);
  params.set('metadata[booking_id]', booking.id);
  params.set('metadata[base44_app_id]', secrets.get('BASE44_APP_ID') || '');

  // The idempotency key makes a re-run of the sweep or a duplicate webhook
  // unable to pay the same booking twice.
  const transfer = await stripePost('transfers', params, `payout-${booking.id}`);

  const now = new Date().toISOString();

  await base44.asServiceRole.entities.Booking.update(booking.id, {
    released_at: now,
    released_by: releasedBy,
    stripe_transfer_id: transfer.id,
    payment_status: 'released',
    status: 'completed',
    needs_payout_setup: false,
    flagged_for_review: false,
  });

  await sendEmail(
    base44,
    booking.creator_email || booking.lensman_email,
    'Payment released',
    `$${amount.toLocaleString()} is on its way for the ${booking.event_date} shoot.`
  );

  return { released: true, transferId: transfer.id, amount };
}

export async function refundBooking(base44, booking, amount, note) {
  if (!booking) return { refunded: false, reason: 'not-found' };
  if (booking.refunded_at) return { refunded: false, reason: 'already-refunded' };

  const reference = booking.stripe_payment_intent_id || booking.stripe_charge_id;
  if (!reference) return { refunded: false, reason: 'no-charge' };

  const refundAmount = Number(amount || 0) > 0 ? Number(amount) : Number(booking.total_price || 0) * 1.14;
  const params = new URLSearchParams();
  params.set(booking.stripe_payment_intent_id ? 'payment_intent' : 'charge', reference);
  params.set('amount', String(Math.round(refundAmount * 100)));
  params.set('metadata[booking_id]', booking.id);
  params.set('metadata[base44_app_id]', secrets.get('BASE44_APP_ID') || '');

  const refund = await stripePost('refunds', params, `refund-${booking.id}`);

  const now = new Date().toISOString();

  await base44.asServiceRole.entities.Booking.update(booking.id, {
    refund_amount: refundAmount,
    refunded_at: now,
    payment_status: 'refunded',
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

/** When the 48 hour window closes on a delivered booking. */
export function releaseDueFrom(deliveredAt) {
  return new Date(new Date(deliveredAt).getTime() + HOLD_HOURS * 3600000).toISOString();
}