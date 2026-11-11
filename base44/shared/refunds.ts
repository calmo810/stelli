import { secrets } from 'base44:runtime';
import { stripeGet, stripePost } from './stripe.ts';
import { creatorPayoutCents, fromCents, money, reversalShareCents, toCents } from './money.ts';
import { disputeOpen } from './bookingRules.ts';
import { withBookingLock } from './bookingLock.ts';
import { emailAdmins, sendEmail } from './notify.ts';
import { STRAY_OPEN, adoptBookingStray, refundStrayRecord, straysFor, syncStrayRefund } from './strayPayments.ts';

/**
 * Money going back.
 *
 * Refunding a client and pulling a payout back from a creator are two separate
 * things at Stripe, and the second can fail when the first succeeds (the
 * creator has already withdrawn the money, say). They used to be done in one
 * breath and written down only if both worked, so a failed pull-back left a
 * booking that read "refunded" with Stelli out of pocket and no way to retry.
 *
 * Now they are two steps, each saved the moment it happens:
 *
 *   1. the refund  -> refund_amount, refunded_at, payment_status
 *   2. the pull-back -> reversal_status (needed / done / failed),
 *                       reversal_amount_due, reversal_amount_done
 *
 * Before either step, Stripe is asked how much has already been refunded or
 * reversed, so a retry only ever does what is still missing. An unfinished
 * pull-back flags the booking for a founder, who can retry it.
 */

const PAID_STATES = ['held', 'released', 'partially_refunded', 'refunded'];

function metadataFor(booking) {
  return {
    'metadata[booking_id]': booking.id,
    'metadata[base44_app_id]': secrets.get('BASE44_APP_ID') || '',
  };
}

async function loadCharge(booking) {
  let chargeId = booking.stripe_charge_id || '';
  if (!chargeId && booking.stripe_payment_intent_id) {
    const intent = await stripeGet(`payment_intents/${booking.stripe_payment_intent_id}`);
    chargeId = typeof intent?.latest_charge === 'string' ? intent.latest_charge : intent?.latest_charge?.id || '';
  }
  if (!chargeId) return null;
  return stripeGet(`charges/${chargeId}`);
}

/**
 * Refunds a booking's payment.
 *
 * `amount` is in dollars; 0 (or nothing) means "everything that is left".
 * `key` makes one decision safe to send twice: the same key never refunds a
 * second time. Takes a booking ID; the decision is made on a fresh read under
 * the booking's lock.
 */
export async function refundBooking(base44, bookingRef, amount = 0, note = '', options = {}) {
  const bookingId = typeof bookingRef === 'string' ? bookingRef : bookingRef?.id;
  if (!bookingId) return { refunded: false, reason: 'not-found' };

  const outcome = await withBookingLock(
    base44,
    bookingId,
    'refund',
    (booking) => refundHeld(base44, booking, { ...options, amountCents: toCents(amount), note }),
    { waitMs: 4000 }
  );
  if (!outcome.locked) return { refunded: false, reason: outcome.reason };
  return outcome.result;
}

/**
 * The refund itself. The caller must hold the booking's lock and pass the
 * booking it read after taking it.
 *
 * Options:
 *   amountCents           how much to refund now; 0 = all that is left
 *   note                  why, stored as the flag reason once settled
 *   key                   idempotency label for this decision
 *   clearFlag             take the booking out of the founder queue once the
 *                         refund (and any pull-back) is complete. Default true.
 *   setCreatorPayoutCents what the creator is still owed after this refund,
 *                         when the caller knows (a cancellation tier). Otherwise
 *                         an unpaid creator's payout shrinks in proportion.
 */
export async function refundHeld(base44, booking, options = {}) {
  const { amountCents = 0, note = '', key = '', clearFlag = true, setCreatorPayoutCents = null } = options;
  const Booking = base44.asServiceRole.entities.Booking;

  if (!booking.stripe_payment_intent_id && !booking.stripe_charge_id) {
    return { refunded: false, reason: 'no-charge' };
  }
  if (!PAID_STATES.includes(booking.payment_status)) {
    return { refunded: false, reason: 'nothing-paid' };
  }
  // The bank already holds the money while a dispute is open; a refund on top
  // would pay the client twice.
  if (disputeOpen(booking)) return { refunded: false, reason: 'disputed' };

  // What Stripe says, not what we remember.
  let charge;
  try {
    charge = await loadCharge(booking);
  } catch (error) {
    console.error('Could not read the charge for booking', booking.id, '-', error.message);
    return { refunded: false, reason: 'stripe-unreachable' };
  }
  if (!charge) return { refunded: false, reason: 'no-charge' };

  const chargedCents = Number(charge.amount || 0);
  const alreadyCents = Number(charge.amount_refunded || 0);
  const remainingCents = Math.max(0, chargedCents - alreadyCents);
  const thisCents = amountCents > 0 ? Math.min(amountCents, remainingCents) : remainingCents;

  let refundId = '';
  if (thisCents > 0) {
    const params = new URLSearchParams({ charge: charge.id, amount: String(thisCents), ...metadataFor(booking) });
    try {
      // The same decision sent twice shares a key and refunds once.
      const refund = await stripePost(
        'refunds',
        params,
        `refund-${booking.id}-${key || `from-${alreadyCents}-by-${thisCents}`}`
      );
      refundId = refund.id;
    } catch (error) {
      return { refunded: false, reason: 'refund-failed', error: String(error.message).slice(0, 300) };
    }
  }

  // Ask Stripe again rather than adding up: if this was a repeat of a refund
  // already made (same key), nothing new happened and the total says so.
  let totalRefundedCents = alreadyCents + thisCents;
  if (thisCents > 0) {
    try {
      const after = await stripeGet(`charges/${charge.id}`);
      totalRefundedCents = Number(after.amount_refunded || 0);
    } catch (error) {
      console.error('Could not re-read the charge for booking', booking.id, '-', error.message);
    }
  }
  const newlyRefundedCents = Math.max(0, totalRefundedCents - alreadyCents);
  const fullyRefunded = chargedCents > 0 && totalRefundedCents >= chargedCents;
  const paidOut = Boolean(booking.stripe_transfer_id);
  const now = new Date().toISOString();

  // ---- Step 1: the refund is written down the moment it exists.
  const patch = {
    refund_amount: fromCents(totalRefundedCents),
    ...(totalRefundedCents > 0 ? { refunded_at: booking.refunded_at || now } : {}),
    payment_status: fullyRefunded
      ? 'refunded'
      : totalRefundedCents > 0 && booking.payment_status === 'held'
        ? 'partially_refunded'
        : booking.payment_status,
  };

  // The creator's payout as it was before any refund or cancellation cut it.
  const originalPayoutCents =
    toCents(booking.creator_payout_original) > 0
      ? toCents(booking.creator_payout_original)
      : toCents(booking.total_price) > 0
        ? creatorPayoutCents(toCents(booking.total_price))
        : toCents(booking.creator_payout);

  let reversalDueCents = 0;
  if (paidOut) {
    // The creator returns the same share of their payout as the client got back.
    reversalDueCents = reversalShareCents({
      payoutCents: originalPayoutCents,
      chargedCents,
      refundedTotalCents: totalRefundedCents,
    });
    patch.reversal_amount_due = fromCents(reversalDueCents);
    if (reversalDueCents > toCents(booking.reversal_amount_done)) patch.reversal_status = 'needed';
  } else if (totalRefundedCents > 0 && !fullyRefunded) {
    // Not paid out yet: what the creator will receive shrinks with the refund.
    patch.creator_payout_original = fromCents(originalPayoutCents);
    patch.creator_payout = fromCents(
      setCreatorPayoutCents !== null
        ? setCreatorPayoutCents
        : originalPayoutCents - reversalShareCents({
            payoutCents: originalPayoutCents,
            chargedCents,
            refundedTotalCents: totalRefundedCents,
          })
    );
  }

  await Booking.update(booking.id, patch);

  if (newlyRefundedCents > 0) {
    await sendEmail(
      base44,
      booking.client_email,
      'Refund issued',
      `${money(fromCents(newlyRefundedCents))} has been refunded for the ${booking.event_date} shoot. It reaches your card in a few business days.`
    );
  }

  // ---- Step 2: pull the creator's share back, if they were already paid.
  let reversal = { status: paidOut ? 'done' : 'none' };
  if (patch.reversal_status === 'needed') {
    reversal = await pullBackHeld(base44, { ...booking, ...patch });
  }

  // ---- Settled: leave the founder queue, unless the pull-back is still open.
  if (reversal.status !== 'failed' && clearFlag) {
    await Booking.update(booking.id, {
      flagged_for_review: false,
      flag_reason: note || booking.flag_reason || '',
    });
  }

  return {
    refunded: thisCents > 0,
    reason: thisCents > 0 ? '' : 'already-refunded',
    refundId,
    amount: fromCents(thisCents),
    totalRefunded: fromCents(totalRefundedCents),
    fullyRefunded,
    reversal,
  };
}

/** Pulls a creator's payout back (or retries doing so). Takes a booking ID. */
export async function pullBackPayout(base44, bookingRef, options = {}) {
  const bookingId = typeof bookingRef === 'string' ? bookingRef : bookingRef?.id;
  if (!bookingId) return { status: 'failed', error: 'Booking not found.' };

  const outcome = await withBookingLock(
    base44,
    bookingId,
    'refund',
    async (booking) => {
      let current = booking;
      // A founder asking to pull the whole payout back (a card dispute).
      if (options.all && booking.stripe_transfer_id) {
        const dueCents =
          toCents(booking.creator_payout_original) > 0
            ? toCents(booking.creator_payout_original)
            : toCents(booking.creator_payout);
        await base44.asServiceRole.entities.Booking.update(booking.id, {
          reversal_amount_due: fromCents(dueCents),
          reversal_status: 'needed',
        });
        current = { ...booking, reversal_amount_due: fromCents(dueCents), reversal_status: 'needed' };
      }
      return pullBackHeld(base44, current);
    },
    { waitMs: 4000 }
  );
  if (!outcome.locked) return { status: 'busy' };
  return outcome.result;
}

/**
 * The pull-back itself. The caller holds the lock. Asks Stripe how much of the
 * transfer has already been reversed and only reverses the rest, so it is safe
 * to run as many times as it takes.
 */
export async function pullBackHeld(base44, booking) {
  const Booking = base44.asServiceRole.entities.Booking;
  const transferId = booking.stripe_transfer_id;
  if (!transferId) return { status: 'none' };

  const dueCents = toCents(booking.reversal_amount_due);
  if (dueCents <= 0) return { status: 'none' };

  const failed = async (message) => {
    const attempts = Number(booking.reversal_attempts || 0) + 1;
    const text = String(message || 'Stripe refused the reversal.').slice(0, 300);
    const owed = money(fromCents(dueCents - toCents(booking.reversal_amount_done)));
    await Booking.update(booking.id, {
      reversal_status: 'failed',
      reversal_error: text,
      reversal_attempts: attempts,
      flagged_for_review: true,
      flag_reason: `The client was refunded, but ${owed} could not be pulled back from the creator. Stripe said: ${text} Retry it from the admin page.`,
    });
    if (attempts === 1) {
      await emailAdmins(
        base44,
        'A payout could not be pulled back',
        `The client on the ${booking.event_date} shoot (${booking.client_name || 'client'} with ${booking.lensman_name || 'creator'}) was refunded, but ${owed} could not be pulled back from the creator.\n\nStripe said: ${text}\n\nIt is in your queue on the admin page, with a retry button.`
      );
    }
    return { status: 'failed', error: text, owed: fromCents(dueCents - toCents(booking.reversal_amount_done)) };
  };

  let transfer;
  try {
    transfer = await stripeGet(`transfers/${transferId}`);
  } catch (error) {
    return failed(`Stripe could not be reached (${error.message}).`);
  }

  const doneCents = Number(transfer.amount_reversed || 0);
  const needCents = Math.min(dueCents, Number(transfer.amount || 0)) - doneCents;

  let reversalId = booking.stripe_transfer_reversal_id || '';
  if (needCents > 0) {
    const params = new URLSearchParams({ amount: String(needCents), ...metadataFor(booking) });
    try {
      const reversal = await stripePost(
        `transfers/${transferId}/reversals`,
        params,
        `reversal-${booking.id}-from-${doneCents}-by-${needCents}-try-${Number(booking.reversal_attempts || 0)}`
      );
      reversalId = reversal.id;
    } catch (error) {
      return failed(error.message);
    }
  }

  const reversedCents = Math.max(doneCents, 0) + Math.max(needCents, 0);
  const settled = booking.payment_status === 'refunded';

  await Booking.update(booking.id, {
    reversal_status: 'done',
    reversal_amount_done: fromCents(reversedCents),
    stripe_transfer_reversal_id: reversalId,
    reversal_error: '',
    // Fully refunded and fully pulled back, with no dispute still open:
    // nothing is left for a founder to decide.
    ...(settled && ['failed', 'needed'].includes(booking.reversal_status) && !disputeOpen(booking)
      ? { flagged_for_review: false }
      : {}),
  });

  return { status: 'done', reversed: fromCents(reversedCents), reversalId };
}

/**
 * Refunds one stray payment in full. `strayId` names which; without it the
 * booking must have exactly one open, so a founder never refunds the wrong
 * one by accident. The booking's own payment, and any other stray payment on
 * it, are not touched.
 */
export async function refundStrayPayment(base44, bookingRef, strayId = '') {
  const bookingId = typeof bookingRef === 'string' ? bookingRef : bookingRef?.id;
  const booking = await base44.asServiceRole.entities.Booking.get(bookingId).catch(() => null);
  if (!booking) return { refunded: false, reason: 'no-stray-payment' };
  await adoptBookingStray(base44, booking);

  const all = await straysFor(base44, bookingId);
  let target = null;
  if (strayId) {
    target = all.find((row) => row.id === strayId) || null;
    if (!target) return { refunded: false, reason: 'no-stray-payment' };
  } else {
    const open = all.filter((row) => STRAY_OPEN.includes(row.status || 'open'));
    if (open.length > 1) return { refunded: false, reason: 'which-stray', count: open.length };
    target = open[0] || all.find((row) => row.status === 'refunded') || null;
    if (!target) return { refunded: false, reason: 'no-stray-payment' };
  }
  return refundStrayRecord(base44, target.id);
}

/**
 * Stripe telling us a charge was refunded — by the code above, or by a founder
 * straight from the Stripe dashboard. Keeps the booking in step either way,
 * and notices a refund that leaves a paid creator still holding the money.
 */
export async function syncRefundFromStripe(base44, charge) {
  const Booking = base44.asServiceRole.entities.Booking;
  if (!charge?.payment_intent) return { synced: false };

  const [mine] = await Booking.filter({ stripe_payment_intent_id: charge.payment_intent });
  if (!mine) {
    // A stray payment refunded in the dashboard is simply no longer open.
    // Matched by its own PaymentIntent, so the other ones on the booking stay.
    return syncStrayRefund(base44, charge);
  }

  const chargedCents = Number(charge.amount || 0);
  const refundedCents = Number(charge.amount_refunded || 0);
  const full = charge.refunded === true || (chargedCents > 0 && refundedCents >= chargedCents);

  const patch = {
    refund_amount: fromCents(refundedCents),
    refunded_at: mine.refunded_at || new Date().toISOString(),
    ...(full
      ? { payment_status: 'refunded' }
      : mine.payment_status === 'held'
        ? { payment_status: 'partially_refunded' }
        : {}),
  };

  // Our own refund is in progress and will deal with the pull-back itself.
  const ourRefundInFlight = /^(refund|cancel):/.test(String(mine.payout_lock || ''));

  if (mine.stripe_transfer_id && !ourRefundInFlight) {
    const payoutCents =
      toCents(mine.creator_payout_original) > 0 ? toCents(mine.creator_payout_original) : toCents(mine.creator_payout);
    const dueCents = reversalShareCents({ payoutCents, chargedCents, refundedTotalCents: refundedCents });
    if (dueCents > toCents(mine.reversal_amount_done) && !['needed', 'failed'].includes(mine.reversal_status)) {
      const owed = money(fromCents(dueCents - toCents(mine.reversal_amount_done)));
      Object.assign(patch, {
        reversal_amount_due: fromCents(dueCents),
        reversal_status: 'needed',
        flagged_for_review: true,
        flag_reason: `A refund was made in Stripe after the creator was paid. ${owed} of their payout has not been pulled back. Do it from the admin page.`,
      });
      await emailAdmins(
        base44,
        'A refund left a payout to pull back',
        `A refund on the ${mine.event_date} shoot was made after the creator was paid. ${owed} of their payout has not been pulled back.\n\nIt is in your queue on the admin page.`
      );
    }
  }

  await Booking.update(mine.id, patch);
  return { synced: true };
}

/** Stripe telling us a transfer was reversed, wherever that was done. */
export async function syncReversalFromStripe(base44, transfer) {
  const Booking = base44.asServiceRole.entities.Booking;
  if (!transfer?.id) return { synced: false };
  const [booking] = await Booking.filter({ stripe_transfer_id: transfer.id });
  if (!booking) return { synced: false };

  const reversedCents = Number(transfer.amount_reversed || 0);
  const dueCents = toCents(booking.reversal_amount_due);
  await Booking.update(booking.id, {
    reversal_amount_done: fromCents(reversedCents),
    ...(dueCents > 0 && reversedCents >= dueCents ? { reversal_status: 'done', reversal_error: '' } : {}),
  });
  return { synced: true };
}
