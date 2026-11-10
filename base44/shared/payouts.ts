import { secrets } from 'base44:runtime';
import { stripeGet, stripeMode, stripePost } from './stripe.ts';
import { creatorPayoutCents, fromCents, money, toCents } from './money.ts';
import { effectiveStatus, releaseBlocker } from './bookingRules.ts';
import { withBookingLock } from './bookingLock.ts';
import { emailAdmins, sendEmail } from './notify.ts';
import { sendWaitingManualPayouts } from './manualPayouts.ts';
import { SITE_ORIGIN } from './origins.ts';

export { releaseDueFrom } from './bookingRules.ts';

/**
 * Money leaving the hold.
 *
 * Charges are made on Stelli's own balance and the creator is paid by a
 * separate transfer, so every payout goes through here — the automatic sweep,
 * a founder decision, a client confirming delivery, the share a late
 * cancellation still owes the creator, and the catch-up run the moment a
 * creator finishes payout setup all use the same guarded path.
 *
 * Three things keep a booking from being paid wrongly or twice:
 *
 *  1. The lock (bookingLock.ts). A payout first claims the booking; a problem
 *     report, a refund and a cancellation claim the same lock. Only one of
 *     them runs at a time, and each decides on a fresh read, never on a copy
 *     made before it held the lock.
 *  2. The rules (bookingRules.releaseBlocker): delivered and past the window
 *     with nothing reported, or a founder's decision — and never through a
 *     card dispute, never for a test payment, never twice.
 *  3. Stripe itself: the transfer carries a fixed idempotency key per booking,
 *     and before sending we ask Stripe whether this booking's transfer group
 *     already holds a transfer.
 */

/** After this many failed transfers the booking goes to the founder queue. */
const FLAG_AFTER_FAILURES = 3;

function transferGroupOf(booking) {
  return booking.transfer_group || `booking_${booking.id}`;
}

/**
 * Pays the creator for a booking, if it is due.
 *
 * `releasedBy` is 'auto' (sweep, client confirmation, cancellation share,
 * payout-setup catch-up) or 'founder' (an explicit decision on the admin page,
 * which may release a flagged booking and does not wait for the window).
 *
 * Takes a booking ID. A booking object is accepted for older callers, but only
 * its ID is used: the decision is always made on a fresh read under the lock.
 */
export async function releaseBooking(base44, bookingRef, releasedBy = 'auto') {
  const bookingId = typeof bookingRef === 'string' ? bookingRef : bookingRef?.id;
  if (!bookingId) return { released: false, reason: 'not-found' };

  const outcome = await withBookingLock(base44, bookingId, 'payout', (booking) =>
    releaseHeld(base44, booking, releasedBy)
  );
  if (!outcome.locked) return { released: false, reason: outcome.reason };
  return outcome.result;
}

/**
 * The payout itself. The caller must hold the booking's lock and pass the
 * booking it read after taking it.
 */
export async function releaseHeld(base44, booking, releasedBy = 'auto') {
  const Booking = base44.asServiceRole.entities.Booking;
  const founder = releasedBy === 'founder';

  const blocker = releaseBlocker(booking, {
    nowMs: Date.now(),
    founder,
    liveMode: stripeMode() === 'live',
  });
  if (blocker) return { released: false, reason: blocker };

  const lensman = booking.lensman_id
    ? await base44.asServiceRole.entities.Lensman.get(booking.lensman_id).catch(() => null)
    : null;

  const destination = lensman?.stripe_account_id;
  const amountCents =
    toCents(booking.creator_payout) > 0
      ? toCents(booking.creator_payout)
      : creatorPayoutCents(toCents(booking.total_price));
  const amount = fromCents(amountCents);
  const creatorEmail = booking.creator_email || booking.lensman_email;

  if (amountCents <= 0) return { released: false, reason: 'nothing-owed' };

  // No payout account yet, so the money simply stays on Stelli's balance. The
  // sweep keeps seeing this booking, so only the first pass sends the notice.
  if (!destination || !lensman?.payouts_enabled) {
    if (!booking.needs_payout_setup) {
      await Booking.update(booking.id, { needs_payout_setup: true });
      await sendEmail(
        base44,
        creatorEmail,
        'You have money waiting on Stelli.',
        `Set up payouts to get the ${money(amount)} from your shoot.\n\n${SITE_ORIGIN}/lensman-dashboard`
      );
    }
    return { released: false, reason: 'no-payout-account' };
  }

  const group = transferGroupOf(booking);

  // Has this booking already been paid at Stripe — by an earlier run that died
  // before it could write the result down, or by a founder's manual payout for
  // this booking? If so, record that transfer instead of sending another.
  let transfer = null;
  try {
    const existing = await stripeGet(`transfers?transfer_group=${encodeURIComponent(group)}&limit=10`);
    transfer = (existing?.data || []).find((t) => t.destination === destination && !t.reversed) || null;
  } catch (error) {
    console.error('Could not check earlier transfers for booking', booking.id, '-', error.message);
    return { released: false, reason: 'stripe-unreachable' };
  }

  if (!transfer) {
    // Tying the transfer to the original charge lets it go through even while
    // the client's payment is still settling.
    let chargeId = booking.stripe_charge_id || '';
    if (!chargeId && booking.stripe_payment_intent_id) {
      try {
        const intent = await stripeGet(`payment_intents/${booking.stripe_payment_intent_id}`);
        chargeId = typeof intent?.latest_charge === 'string' ? intent.latest_charge : intent?.latest_charge?.id || '';
      } catch (error) {
        console.error('Could not read the charge for booking', booking.id, '-', error.message);
      }
    }

    const params = new URLSearchParams();
    params.set('amount', String(amountCents));
    params.set('currency', 'usd');
    params.set('destination', destination);
    params.set('transfer_group', group);
    if (chargeId) params.set('source_transaction', chargeId);
    params.set('metadata[booking_id]', booking.id);
    params.set('metadata[base44_app_id]', secrets.get('BASE44_APP_ID') || '');

    try {
      // One idempotency key per booking: Stripe will not create a second
      // transfer under it, whatever retries or reruns happen. The key only
      // changes after Stripe has definitively refused the transfer (see
      // recordPayoutFailure) — a refusal creates nothing, and Stripe would
      // otherwise keep replaying the same refusal for a day.
      const version = Number(booking.payout_key_version || 0);
      const key = `payout-${booking.id}${version ? `-v${version}` : ''}`;
      transfer = await stripePost('transfers', params, key);
    } catch (error) {
      return recordPayoutFailure(base44, booking, error);
    }
  }

  const now = new Date().toISOString();
  const cancelled = effectiveStatus(booking) === 'cancelled';

  await Booking.update(booking.id, {
    released_at: now,
    released_by: founder ? 'founder' : 'auto',
    stripe_transfer_id: transfer.id,
    payment_status: 'released',
    needs_payout_setup: false,
    cancellation_payout_due: false,
    payout_error: '',
    // A cancelled booking stays cancelled — the payout does not reopen it.
    ...(cancelled ? {} : { status: 'completed', completed_at: now }),
    // A founder's release is the decision the flag was waiting for.
    ...(founder ? { flagged_for_review: false } : {}),
  });

  if (!cancelled && lensman) {
    await base44.asServiceRole.entities.Lensman.update(lensman.id, {
      completed_shoots: Number(lensman.completed_shoots || 0) + 1,
    }).catch((error) => console.error('Shoot count not updated for', lensman.id, '-', error.message));
  }

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
 * A transfer Stripe refused. It is written on the booking so it shows on the
 * admin page, retried by the next sweep, and handed to a founder if it keeps
 * failing — instead of failing quietly every hour.
 */
async function recordPayoutFailure(base44, booking, error) {
  const attempts = Number(booking.payout_attempts || 0) + 1;
  const giveUp = attempts >= FLAG_AFTER_FAILURES;
  const text = String(error?.message || 'Stripe refused the transfer.').slice(0, 300);

  await base44.asServiceRole.entities.Booking.update(booking.id, {
    payout_error: text,
    payout_attempts: attempts,
    payout_failed_at: new Date().toISOString(),
    // A definite "no" from Stripe created nothing, so the next try gets a new
    // key. An unclear failure (timeout, 5xx) keeps the key: if the transfer did
    // go through, the retry returns it instead of sending a second one.
    ...(error?.definitive
      ? { payout_key_version: Number(booking.payout_key_version || 0) + 1 }
      : {}),
    ...(giveUp && !booking.flagged_for_review
      ? {
          flagged_for_review: true,
          flag_reason: `The payout to the creator failed ${attempts} times. Stripe said: ${text}`,
        }
      : {}),
  });

  if (attempts === FLAG_AFTER_FAILURES) {
    await emailAdmins(
      base44,
      'A creator payout keeps failing',
      `The payout for the ${booking.event_date} shoot (${booking.client_name || 'client'} with ${booking.lensman_name || 'creator'}) has failed ${attempts} times.\n\nStripe said: ${text}\n\nIt is in your queue on the admin page.`
    );
  }

  return { released: false, reason: 'transfer-failed', error: text };
}

/**
 * The catch-up run: the moment a creator can be paid, everything that was held
 * back for them goes out. Each booking still has to pass the same rules.
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
      results.push({ bookingId: booking.id, ...(await releaseBooking(base44, booking.id, 'auto')) });
    } catch (error) {
      console.error('Waiting payout failed for booking', booking.id, '-', error.message);
      results.push({ bookingId: booking.id, released: false, reason: error.message });
    }
  }

  // Founder payouts made outside a booking go out at the same moment.
  let manualSent = 0;
  try {
    manualSent = (await sendWaitingManualPayouts(base44, lensman)).sent;
  } catch (error) {
    console.error('Waiting manual payouts failed for', lensman.id, '-', error.message);
  }

  return {
    released: results.filter((result) => result.released).length + manualSent,
    results,
  };
}
