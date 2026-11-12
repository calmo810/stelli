/**
 * What a cancellation does to the money.
 *
 * The policy, from Stelli's Terms (section 9), measured against the shoot's
 * start time in America/New_York:
 *
 *   client cancels 72 hours or more ahead   full refund, creator gets nothing
 *   client cancels 48 to under 72 hours     half back to the client, half the
 *                                           creator's payout to the creator
 *   client cancels under 48 hours           no refund, creator is paid in full
 *   creator cancels                         full refund, creator goes to review
 *
 * Once the shoot's start time has passed there is nothing left to cancel: what
 * is left is a complaint ("they never showed", "the photos are wrong"), and
 * that goes to a founder with the money frozen. A late "cancel" must never be
 * a way to pay a creator who did not turn up.
 *
 * Pure: no secrets, no network. Tested in tests/cancellation.test.mjs.
 */
import { clientFeeCents, creatorPayoutCents, toCents } from './money.ts';
import { disputeLost, disputeOpen, effectiveStatus, hasStrayPayment } from './bookingRules.ts';
import { shootStart } from './shootTime.ts';

export const FULL_REFUND_HOURS = 72;
export const HALF_REFUND_HOURS = 48;

function blocked(message) {
  return { allowed: false, message, tier: 'blocked', refundCents: 0, creatorPayoutCents: 0, note: '' };
}

/**
 * @param role    'client' or 'lensman' — who is cancelling
 * @param booking the booking as it stands now
 * @param nowMs   the current time
 */
export function cancellationPlan({ role, booking, nowMs }): Record<string, any> {
  const status = effectiveStatus(booking);
  if (status === 'cancelled') return blocked('This booking is already cancelled.');
  if (status === 'completed') return blocked('This booking is finished, so it can no longer be cancelled.');
  if (booking?.delivered_at || status === 'delivered') {
    return blocked('The photos are already delivered. If something is wrong, report a problem instead.');
  }
  if (booking?.flagged_for_review || disputeOpen(booking) || disputeLost(booking) || hasStrayPayment(booking)) {
    return blocked('A founder is already reviewing this booking. Email getstelli@gmail.com to cancel it.');
  }

  const payment = booking?.payment_status || 'pending';

  // Nothing was charged: the booking simply closes.
  if (payment === 'pending') {
    return {
      allowed: true,
      tier: 'unpaid',
      refundCents: 0,
      creatorPayoutCents: 0,
      hoursUntil: null,
      note: 'No payment had been taken, so there is nothing to refund.',
    };
  }
  if (payment === 'processing') {
    return blocked('Your bank payment is still clearing. You can cancel once it has.');
  }
  if (payment !== 'held') {
    return blocked('The payment on this booking has already been settled. Email getstelli@gmail.com to change it.');
  }

  const start = shootStart(booking.event_date, booking.event_time);
  if (!Number.isFinite(start.ms)) {
    return blocked('We could not read the date on this booking. Email getstelli@gmail.com and a founder will cancel it for you.');
  }
  const hoursUntil = (start.ms - nowMs) / 3_600_000;
  if (hoursUntil < 0) {
    return blocked(
      role === 'client'
        ? 'The shoot time has passed, so this can no longer be cancelled. If something went wrong, report a problem and a founder will step in.'
        : 'The shoot time has passed, so this can no longer be cancelled. Message Stelli if something went wrong.'
    );
  }

  // Everything is worked out from what Stripe actually took.
  const subtotalCents = toCents(booking.total_price);
  const chargedCents =
    toCents(booking.amount_charged) > 0
      ? toCents(booking.amount_charged)
      : subtotalCents + clientFeeCents(subtotalCents);
  const payoutCents =
    toCents(booking.creator_payout) > 0 ? toCents(booking.creator_payout) : creatorPayoutCents(subtotalCents);

  if (role !== 'client') {
    return {
      allowed: true,
      tier: 'creator',
      refundCents: chargedCents,
      creatorPayoutCents: 0,
      hoursUntil,
      assumedTime: start.assumedTime,
      note: 'The creator cancelled, so the client is refunded in full.',
    };
  }
  if (hoursUntil >= FULL_REFUND_HOURS) {
    return {
      allowed: true,
      tier: 'full',
      refundCents: chargedCents,
      creatorPayoutCents: 0,
      hoursUntil,
      assumedTime: start.assumedTime,
      note: 'Cancelled 72 hours or more before the shoot, so the client is refunded in full.',
    };
  }
  if (hoursUntil >= HALF_REFUND_HOURS) {
    return {
      allowed: true,
      tier: 'half',
      refundCents: Math.round(chargedCents / 2),
      creatorPayoutCents: Math.round(payoutCents / 2),
      hoursUntil,
      assumedTime: start.assumedTime,
      note: 'Cancelled between 48 and 72 hours before the shoot, so half is refunded and the creator keeps half.',
    };
  }
  return {
    allowed: true,
    tier: 'none',
    refundCents: 0,
    creatorPayoutCents: payoutCents,
    hoursUntil,
    assumedTime: start.assumedTime,
    note: 'Cancelled less than 48 hours before the shoot, so the creator keeps the full amount.',
  };
}
