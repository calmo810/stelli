import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { releaseBooking } from '../../shared/payouts.ts';
import { pullBackPayout, refundBooking, refundStrayPayment } from '../../shared/refunds.ts';
import { money } from '../../shared/money.ts';

/**
 * A founder's decision on a booking in the queue.
 *
 *   release        pay the held money to the creator
 *   refund         refund the client — everything left, or `amount` dollars
 *   pull_back      pull the creator's payout back (or retry a failed attempt)
 *   refund_stray   send back a payment that did not match the booking
 *   mark_reviewed  take a settled booking out of the queue
 *
 * Every action answers with what actually happened, in a sentence, and only
 * changes the booking when money really moved. `actionId` comes from the
 * confirmation dialog: the same decision sent twice does the thing once.
 */
const ACTIONS = ['release', 'refund', 'pull_back', 'retry_reversal', 'refund_stray', 'mark_reviewed'];

const RELEASE_REASONS = {
  'already-paid': 'The creator has already been paid for this booking.',
  'nothing-held': 'There is no held money on this booking to release.',
  disputed: 'A card dispute is open (or was lost) on this payment, so it can’t be released.',
  'test-payment': 'This booking was paid in Stripe test mode. It can’t be paid out with real money.',
  'no-payout-account': 'The creator hasn’t finished payout setup. The money stays held until they do, then goes out on its own.',
  'nothing-owed': 'Nothing is owed to the creator on this booking.',
  'stripe-unreachable': 'Stripe couldn’t be reached. Nothing moved. Try again in a minute.',
  busy: 'Something else is updating this booking right now. Nothing moved. Try again in a moment.',
};

const REFUND_REASONS = {
  'no-charge': 'There is no payment on this booking to refund.',
  'nothing-paid': 'There is no settled payment on this booking to refund.',
  disputed: 'A card dispute is open on this payment. The bank already holds the money, so a refund would pay the client twice.',
  'already-refunded': 'This payment has already been refunded in full.',
  'stripe-unreachable': 'Stripe couldn’t be reached. Nothing moved. Try again in a minute.',
  busy: 'Something else is updating this booking right now. Nothing moved. Try again in a moment.',
  'no-stray-payment': 'There is no unmatched payment on this booking.',
  'refund-in-stripe': 'This payment has to be refunded from the Stripe dashboard.',
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { bookingId, action, note, amount, actionId } = await req.json();
    if (!bookingId || !ACTIONS.includes(action)) {
      return Response.json({ error: 'A booking and an action are required.' }, { status: 400 });
    }

    const Booking = base44.asServiceRole.entities.Booking;
    const booking = await Booking.get(bookingId).catch(() => null);
    if (!booking) return Response.json({ error: 'Booking not found.' }, { status: 404 });

    const reason = String(note || '').trim().slice(0, 500);
    const key = String(actionId || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);

    if (action === 'release') {
      // Runs through the same lock and rules as every payout: never twice,
      // never through an open card dispute. Clears the flag once money moved.
      const result = await releaseBooking(base44, bookingId, 'founder');
      const message = result.released
        ? `${money(result.amount)} is on its way to ${booking.lensman_name || 'the creator'}.`
        : result.reason === 'transfer-failed'
          ? `Stripe refused the payout: ${result.error}`
          : RELEASE_REASONS[result.reason] || 'Nothing was released.';
      return Response.json({ ok: Boolean(result.released), message, result });
    }

    if (action === 'refund') {
      const dollars = Number(amount) > 0 ? Math.round(Number(amount) * 100) / 100 : 0;
      const result = await refundBooking(base44, bookingId, dollars, reason || 'Refunded by a founder.', {
        key: key ? `admin-${key}` : '',
      });

      // The booking only changes when the client really has all their money back.
      if (result.fullyRefunded && booking.status !== 'cancelled') {
        await Booking.update(bookingId, {
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason || 'Refunded by a founder.',
          cancellation_payout_due: false,
        });
      }

      let message;
      if (result.refunded) {
        message = `${money(result.amount)} refunded to ${booking.client_name || 'the client'}.`;
        if (result.reversal?.status === 'done') message += ' The creator’s payout was pulled back.';
        if (result.reversal?.status === 'failed') {
          message += ` The creator’s payout could not be pulled back (${result.reversal.error}). It stays in the queue with a retry.`;
        }
      } else if (result.reason === 'refund-failed') {
        message = `Stripe refused the refund: ${result.error}`;
      } else if (result.reason === 'already-refunded' && result.reversal?.status === 'failed') {
        message = `Already refunded. The creator’s payout still could not be pulled back (${result.reversal.error}).`;
      } else {
        message = REFUND_REASONS[result.reason] || 'Nothing was refunded.';
      }
      return Response.json({ ok: Boolean(result.refunded), message, result });
    }

    if (action === 'pull_back' || action === 'retry_reversal') {
      // A founder may pull the whole payout back during a card dispute; a
      // retry only finishes what an earlier refund left undone.
      const all = action === 'pull_back' && !['needed', 'failed'].includes(booking.reversal_status);
      const result = await pullBackPayout(base44, bookingId, { all });
      const message =
        result.status === 'done'
          ? `${money(result.reversed)} pulled back from ${booking.lensman_name || 'the creator'}.`
          : result.status === 'failed'
            ? `The payout could not be pulled back: ${result.error}`
            : result.status === 'busy'
              ? REFUND_REASONS.busy
              : 'There is nothing to pull back on this booking.';
      return Response.json({ ok: result.status === 'done', message, result });
    }

    if (action === 'refund_stray') {
      const result = await refundStrayPayment(base44, bookingId);
      const message = result.refunded
        ? `${money(result.amount)} sent back to ${booking.client_name || 'the client'}. The booking itself is unchanged.`
        : result.reason === 'refund-failed'
          ? `Stripe refused the refund: ${result.error}`
          : REFUND_REASONS[result.reason] || 'Nothing was refunded.';
      return Response.json({ ok: Boolean(result.refunded), message, result });
    }

    // mark_reviewed: only for bookings where no money decision is still open.
    const fresh = await Booking.get(bookingId);
    const stillOpen =
      (fresh.payment_status === 'held' && (fresh.problem_reported_at || fresh.payout_error)) ||
      fresh.stray_payment_intent_id ||
      ['needed', 'failed'].includes(fresh.reversal_status) ||
      (fresh.dispute_status && !['won', 'lost', 'warning_closed'].includes(fresh.dispute_status));
    if (stillOpen) {
      return Response.json({
        ok: false,
        message: 'This booking still has money to decide on. Release, refund or pull back first.',
      });
    }
    await Booking.update(bookingId, {
      flagged_for_review: false,
      flag_reason: reason || fresh.flag_reason || '',
    });
    return Response.json({ ok: true, message: 'Marked as reviewed.' });
  } catch (error) {
    console.error('releasePayout error:', error.message);
    return Response.json({ error: 'That did not go through. Nothing was changed.' }, { status: 500 });
  }
}
