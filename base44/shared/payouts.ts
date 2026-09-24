import { secrets } from 'base44:runtime';
import { creatorPayout, money, stripePost, HOLD_HOURS } from './stripe.ts';
import { sendEmail } from './notify.ts';

const PUBLISHED_ORIGIN = 'https://getstelli.base44.app';

/**
 * Money leaving the hold.
 *
 * Charges are made on Stelli's own balance and the creator is paid by a
 * separate transfer, so every payout goes through here — the automatic sweep,
 * a founder decision, a client confirming delivery, and the catch-up run the
 * moment a creator finishes payout setup all use the same guarded path.
 */

export async function releaseBooking(base44, booking, releasedBy = 'auto') {
  if (!booking) return { released: false, reason: 'not-found' };

  // Never pay the same booking twice.
  if (booking.stripe_transfer_id || booking.released_at || booking.payment_status === 'released') {
    return { released: false, reason: 'already-paid' };
  }
  if (booking.flagged_for_review) return { released: false, reason: 'flagged' };
  if (booking.payment_status !== 'held') return { released: false, reason: 'nothing-held' };

  const lensman = booking.lensman_id
    ? await base44.asServiceRole.entities.Lensman.get(booking.lensman_id).catch(() => null)
    : null;

  const destination = lensman?.stripe_account_id;
  const amount = Number(booking.creator_payout || creatorPayout(booking.total_price));
  const creatorEmail = booking.creator_email || booking.lensman_email;

  // No payout account yet, so the money simply stays on Stelli's balance. The
  // sweep keeps seeing this booking, so only the first pass sends the notice.
  if (!destination || !lensman?.payouts_enabled) {
    const firstNotice = !booking.needs_payout_setup;
    await base44.asServiceRole.entities.Booking.update(booking.id, { needs_payout_setup: true });

    if (firstNotice) {
      await sendEmail(
        base44,
        creatorEmail,
        'You have money waiting on Stelli.',
        `Set up payouts to get the ${money(amount)} from your shoot.\n\n${PUBLISHED_ORIGIN}/lensman-dashboard`
      );
    }

    return { released: false, reason: 'no-payout-account' };
  }

  const params = new URLSearchParams();
  params.set('amount', String(Math.round(amount * 100)));
  params.set('currency', 'usd');
  params.set('destination', destination);
  params.set('transfer_group', booking.transfer_group || `booking_${booking.id}`);
  // Tying the transfer to the original charge lets it go through even while the
  // client's payment is still settling.
  if (booking.stripe_charge_id) params.set('source_transaction', booking.stripe_charge_id);
  params.set('metadata[booking_id]', booking.id);
  params.set('metadata[base44_app_id]', secrets.get('BASE44_APP_ID') || '');

  // The idempotency key makes a re-run of the sweep or a duplicate webhook
  // unable to pay the same booking twice.
  const transfer = await stripePost('transfers', params, `payout-${booking.id}`);

  await base44.asServiceRole.entities.Booking.update(booking.id, {
    released_at: new Date().toISOString(),
    released_by: releasedBy,
    stripe_transfer_id: transfer.id,
    payment_status: 'released',
    status: 'completed',
    needs_payout_setup: false,
  });

  const clientFirst = String(booking.client_name || '').trim().split(' ')[0] || 'your client';

  await sendEmail(
    base44,
    creatorEmail,
    'You got paid.',
    `${money(amount)} for your shoot with ${clientFirst} is on its way to your bank.`
  );

  return { released: true, transferId: transfer.id, amount };
}

/**
 * The catch-up run: the moment a creator can be paid, everything that was held
 * back for them goes out.
 */
export async function releaseWaitingPayouts(base44, lensman) {
  if (!lensman?.id || !lensman?.payouts_enabled) return { released: 0, results: [] };

  const waiting = await base44.asServiceRole.entities.Booking.filter({
    lensman_id: lensman.id,
    needs_payout_setup: true,
  });

  const results = [];
  for (const booking of waiting) {
    try {
      results.push({ bookingId: booking.id, ...(await releaseBooking(base44, booking, 'auto')) });
    } catch (error) {
      console.error('Waiting payout failed for booking', booking.id, '-', error.message);
      results.push({ bookingId: booking.id, released: false, reason: error.message });
    }
  }

  return { released: results.filter((result) => result.released).length, results };
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

/** When the hold window closes on a delivered booking. */
export function releaseDueFrom(deliveredAt) {
  return new Date(new Date(deliveredAt).getTime() + HOLD_HOURS * 3600000).toISOString();
}