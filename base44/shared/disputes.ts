import { fromCents, money, toCents } from './money.ts';
import { withBookingLock } from './bookingLock.ts';
import { syncStrayDispute } from './strayPayments.ts';
import { pullBackHeld } from './refunds.ts';
import { emailAdmins } from './notify.ts';

/**
 * Card disputes (chargebacks).
 *
 * When a client disputes a charge with their bank, Stripe takes the money back
 * from Stelli straight away and returns it only if the dispute is won. So:
 *
 *  - opened: the booking is frozen. Nothing can be paid out (the payout rules
 *    refuse a booking with an open dispute, even for a founder). If the
 *    creator was already paid, the founder queue says so and offers to pull
 *    the payout back.
 *  - won: the freeze lifts. If the dispute was the only reason the booking
 *    was flagged, it leaves the queue and carries on as normal.
 *  - lost: the money is gone. The booking is marked refunded, and if the
 *    creator was already paid their payout is pulled back automatically (and
 *    lands in the queue with a retry if that fails).
 */

const DISPUTE_FLAG = 'Card dispute';

async function bookingForDispute(base44, dispute) {
  if (!dispute?.payment_intent) return null;
  const matches = await base44.asServiceRole.entities.Booking.filter({
    stripe_payment_intent_id: dispute.payment_intent,
  });
  return matches[0] || null;
}

export async function disputeOpened(base44, dispute) {
  const found = await bookingForDispute(base44, dispute);
  // Not a booking's own payment: maybe one of the unmatched ones.
  if (!found) return syncStrayDispute(base44, dispute, false);

  // Taken under the lock so it can't slip in beside a payout.
  const outcome = await withBookingLock(
    base44,
    found.id,
    'review',
    async (booking) => {
      const paidOut = Boolean(booking.stripe_transfer_id);
      const reason = paidOut
        ? `${DISPUTE_FLAG} opened after the creator was paid ${money(booking.creator_payout)}. Respond in Stripe before the deadline. You can pull the payout back from here.`
        : `${DISPUTE_FLAG} opened. The payout is frozen. Respond in Stripe before the deadline.`;
      await base44.asServiceRole.entities.Booking.update(booking.id, {
        dispute_status: dispute.status || 'needs_response',
        flagged_for_review: true,
        flag_reason: booking.flagged_for_review && booking.flag_reason && !booking.flag_reason.startsWith(DISPUTE_FLAG)
          ? `${reason} (Earlier: ${booking.flag_reason})`
          : reason,
      });
    },
    { waitMs: 6000 }
  );
  if (!outcome.locked) {
    // Could not get the booking to ourselves. The freeze still has to land.
    await base44.asServiceRole.entities.Booking.update(found.id, {
      dispute_status: dispute.status || 'needs_response',
      flagged_for_review: true,
      flag_reason: `${DISPUTE_FLAG} opened. Respond in Stripe before the deadline.`,
    });
  }

  await emailAdmins(
    base44,
    'Card dispute opened',
    `A client opened a card dispute on the ${found.event_date} shoot (${found.client_name || 'client'} with ${found.lensman_name || 'creator'}), for ${money(Number(dispute.amount || 0) / 100)}.\n\n${
      found.stripe_transfer_id
        ? 'The creator has already been paid. You can pull the payout back from the admin page.'
        : 'The payout is frozen.'
    }\n\nRespond in Stripe before the deadline.`
  );

  return { handled: true };
}

export async function disputeClosed(base44, dispute) {
  const found = await bookingForDispute(base44, dispute);
  if (!found) return syncStrayDispute(base44, dispute, true);
  const status = dispute.status || '';
  const Booking = base44.asServiceRole.entities.Booking;

  const outcome = await withBookingLock(
    base44,
    found.id,
    'refund',
    async (booking) => {
      if (status === 'lost') {
        const paidOut = Boolean(booking.stripe_transfer_id);
        const payoutCents =
          toCents(booking.creator_payout_original) > 0
            ? toCents(booking.creator_payout_original)
            : toCents(booking.creator_payout);

        await Booking.update(booking.id, {
          dispute_status: 'lost',
          // The bank returned the payment to the client.
          payment_status: 'refunded',
          refund_amount: Number(booking.amount_charged || booking.refund_amount || 0),
          refunded_at: booking.refunded_at || new Date().toISOString(),
          cancellation_payout_due: false,
          flagged_for_review: true,
          flag_reason: paidOut
            ? `${DISPUTE_FLAG} lost: the bank returned the payment to the client. Pulling the creator's payout back.`
            : `${DISPUTE_FLAG} lost: the bank returned the payment to the client. Nothing is owed to the creator.`,
          ...(paidOut ? { reversal_amount_due: fromCents(payoutCents), reversal_status: 'needed' } : {}),
        });

        if (!paidOut) return { lost: true, reversal: { status: 'none' } };
        const reversal = await pullBackHeld(base44, {
          ...booking,
          payment_status: 'refunded',
          reversal_amount_due: fromCents(payoutCents),
          reversal_status: 'needed',
        });
        return { lost: true, reversal };
      }

      // Won (or an early warning that was closed): the freeze lifts.
      const onlyTheDispute =
        String(booking.flag_reason || '').startsWith(DISPUTE_FLAG) &&
        !booking.problem_reported_at &&
        !booking.stray_payment_intent_id &&
        booking.reversal_status !== 'failed' &&
        booking.reversal_status !== 'needed';
      await Booking.update(booking.id, {
        dispute_status: status || 'won',
        ...(onlyTheDispute ? { flagged_for_review: false, flag_reason: '' } : {}),
      });
      return { lost: false };
    },
    { waitMs: 6000 }
  );

  const result = outcome.locked ? outcome.result : null;
  if (!result) {
    // Could not get the booking to ourselves; at least record the outcome.
    await Booking.update(found.id, { dispute_status: status });
  }

  await emailAdmins(
    base44,
    status === 'lost' ? 'Card dispute lost' : 'Card dispute closed',
    status === 'lost'
      ? `The card dispute on the ${found.event_date} shoot was lost. The bank returned the payment to the client.${
          result?.reversal?.status === 'done'
            ? " The creator's payout was pulled back."
            : result?.reversal?.status === 'failed'
              ? " The creator's payout could NOT be pulled back. It is in your queue with a retry button."
              : ''
        }`
      : `The card dispute on the ${found.event_date} shoot closed in your favor (${status}). The booking carries on as normal.`
  );

  return { handled: true, ...(result || {}) };
}
