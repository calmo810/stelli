import { secrets } from 'base44:runtime';
import { stripeGet, stripeMode, stripePost } from './stripe.ts';
import { money, toCents } from './money.ts';
import { effectiveStatus, releaseBlocker } from './bookingRules.ts';
import { withBookingLock } from './bookingLock.ts';
import { sendEmail } from './notify.ts';
import { resolveCreatorOwner } from './creatorOwner.ts';
import { SITE_ORIGIN } from './origins.ts';

/** Guards against a typo like 5000 instead of 50. */
export const MANUAL_PAYOUT_MAX = 2000;

const NO_SETUP = 'Creator has not finished payout setup.';

/**
 * Founder-initiated payouts: any amount, to any creator.
 *
 * The money comes out of Stelli's available Stripe balance. If the creator has
 * not finished payout setup — or the balance has not cleared yet — the payout
 * simply waits as "waiting" and goes out on its own later: the moment the
 * creator finishes setup, and on every hourly sweep.
 *
 * A manual payout can be FOR a booking (payout.booking_id). Then it is that
 * booking's payout, and the automatic path must never pay the same booking as
 * well. That is guaranteed three ways:
 *
 *  1. It runs under the same lock on the booking as the automatic payout, and
 *     decides on a fresh read. If the booking is already paid, it refuses.
 *  2. When it goes through, the booking is marked released with this transfer
 *     on it — exactly what the automatic path checks before paying.
 *  3. It uses the booking's own Stripe transfer group, and both paths ask
 *     Stripe whether that group already holds a transfer before sending one.
 *
 * A manual payout with no booking is separate money: a bonus, a correction, a
 * shoot that never went through Stelli's checkout. The admin page asks which
 * it is whenever the creator has a held booking.
 */
export async function sendManualPayout(base44, payout, { notify = true } = {}) {
  if (!payout || payout.status === 'sent' || payout.stripe_transfer_id) {
    return { sent: false, reason: 'already-sent' };
  }
  if (payout.status === 'failed') return { sent: false, reason: 'failed' };

  if (!payout.booking_id) return sendTransfer(base44, payout, { notify });

  const outcome = await withBookingLock(
    base44,
    payout.booking_id,
    'payout',
    (booking) => sendTransfer(base44, payout, { notify, booking }),
    { waitMs: 4000 }
  );
  if (!outcome.locked) {
    if (outcome.reason === 'not-found') return failPayout(base44, payout, 'The booking no longer exists.');
    return { sent: false, reason: 'busy' };
  }
  return outcome.result;
}

async function failPayout(base44, payout, why) {
  await base44.asServiceRole.entities.ManualPayout.update(payout.id, {
    status: 'failed',
    waiting_reason: why,
  });
  return { sent: false, reason: 'refused', message: why };
}

/** `booking`, when given, is freshly read and locked by the caller. */
async function sendTransfer(base44, payout, { notify, booking = null }) {
  const ManualPayout = base44.asServiceRole.entities.ManualPayout;

  const lensman = await base44.asServiceRole.entities.Lensman.get(payout.lensman_id).catch(() => null);
  if (!lensman) return failPayout(base44, payout, 'Creator profile no longer exists.');

  if (booking) {
    if (booking.lensman_id !== payout.lensman_id) {
      return failPayout(base44, payout, 'That booking is with a different creator.');
    }
    // The same rules as a founder release — and above all, never twice.
    const blocker = releaseBlocker(booking, {
      nowMs: Date.now(),
      founder: true,
      liveMode: stripeMode() === 'live',
    });
    if (blocker === 'already-paid') {
      return failPayout(base44, payout, 'The creator has already been paid for this booking.');
    }
    if (blocker === 'disputed') {
      return failPayout(base44, payout, 'A card dispute is open on this booking, so it can’t be paid out.');
    }
    if (blocker === 'test-payment') {
      return failPayout(base44, payout, 'This booking was paid in Stripe test mode.');
    }
  }

  const { ownerEmail } = await resolveCreatorOwner(base44, lensman);
  const amount = Number(payout.amount || 0);

  // No payout account yet: the money stays on Stelli's balance until they set one up.
  if (!lensman.stripe_account_id || !lensman.payouts_enabled) {
    const firstNotice = payout.waiting_reason !== NO_SETUP;
    await ManualPayout.update(payout.id, { status: 'waiting', waiting_reason: NO_SETUP });
    if (notify && firstNotice) {
      await sendEmail(
        base44,
        ownerEmail,
        'You have money waiting on Stelli.',
        `Stelli sent you ${money(amount)}. Set up payouts whenever you're ready and it will go straight to your bank.\n\n${SITE_ORIGIN}/lensman-dashboard`
      );
    }
    return { sent: false, reason: 'no-payout-account' };
  }

  // A payout for a booking shares the booking's transfer group with the
  // automatic path, so each can see the other's transfer at Stripe.
  const transferGroup = booking
    ? booking.transfer_group || `booking_${booking.id}`
    : `manual_payout_${payout.id}`;

  // If an earlier attempt reached Stripe but we never heard back — or, for a
  // booking, if it has been paid some other way — record that transfer instead
  // of sending a second one.
  try {
    const existing = await stripeGet(`transfers?transfer_group=${encodeURIComponent(transferGroup)}&limit=10`);
    const found = (existing?.data || []).find((t) => !t.reversed);
    if (found) {
      const mine = found.metadata?.manual_payout_id === payout.id;
      if (booking && !mine) {
        return failPayout(base44, payout, 'The creator has already been paid for this booking.');
      }
      await markSent(base44, payout, found.id);
      if (booking) await markBookingPaidOut(base44, booking, payout, found.id);
      return { sent: true, transferId: found.id, amount };
    }
  } catch (error) {
    console.error('Could not check earlier transfers for', payout.id, '-', error.message);
    return { sent: false, reason: 'stripe-unreachable' };
  }

  const attempts = Number(payout.attempts || 0) + 1;
  const params = new URLSearchParams();
  params.set('amount', String(toCents(amount)));
  params.set('currency', 'usd');
  params.set('destination', lensman.stripe_account_id);
  params.set('transfer_group', transferGroup);
  params.set('description', payout.note ? `Stelli payout: ${payout.note}` : 'Stelli payout');
  params.set('metadata[manual_payout_id]', payout.id);
  if (booking) params.set('metadata[booking_id]', booking.id);
  params.set('metadata[base44_app_id]', secrets.get('BASE44_APP_ID') || '');

  let transfer;
  try {
    transfer = await stripePost('transfers', params, `manual-payout-${payout.id}-${attempts}`);
  } catch (error) {
    const insufficient = /insufficient/i.test(error.message);
    await ManualPayout.update(payout.id, {
      status: 'waiting',
      attempts,
      waiting_reason: insufficient
        ? "Stelli's Stripe balance doesn't have enough available funds yet. It retries every hour."
        : `Stripe said: ${error.message}`,
    });
    return { sent: false, reason: 'transfer-failed', message: error.message };
  }

  await markSent(base44, payout, transfer.id, attempts);
  if (booking) await markBookingPaidOut(base44, booking, payout, transfer.id);

  if (notify) {
    await sendEmail(
      base44,
      ownerEmail,
      'You got paid.',
      `${money(amount)} from Stelli is on its way to your bank.${payout.note ? `\n\n${payout.note}` : ''}`
    );
  }

  return { sent: true, transferId: transfer.id, amount };
}

async function markSent(base44, payout, transferId, attempts = 0) {
  await base44.asServiceRole.entities.ManualPayout.update(payout.id, {
    status: 'sent',
    stripe_transfer_id: transferId,
    sent_at: new Date().toISOString(),
    waiting_reason: '',
    ...(attempts ? { attempts } : {}),
  });
}

/**
 * The booking now carries this transfer as its payout. From here the automatic
 * path sees "already paid" and will never send another.
 */
async function markBookingPaidOut(base44, booking, payout, transferId) {
  const now = new Date().toISOString();
  const wasHeld = ['held', 'partially_refunded'].includes(booking.payment_status);
  const delivered = effectiveStatus(booking) === 'delivered';
  await base44.asServiceRole.entities.Booking.update(booking.id, {
    stripe_transfer_id: transferId,
    manual_payout_id: payout.id,
    released_at: now,
    released_by: 'founder',
    needs_payout_setup: false,
    cancellation_payout_due: false,
    payout_error: '',
    creator_payout_original: booking.creator_payout_original || booking.creator_payout || 0,
    creator_payout: Number(payout.amount || 0),
    ...(wasHeld ? { payment_status: 'released' } : {}),
    ...(wasHeld && delivered ? { status: 'completed', completed_at: now } : {}),
  });
}

/** Everything waiting for one creator — run the moment they can be paid. */
export async function sendWaitingManualPayouts(base44, lensman) {
  if (!lensman?.id || !lensman?.payouts_enabled) return { sent: 0 };
  const waiting = await base44.asServiceRole.entities.ManualPayout.filter({
    lensman_id: lensman.id,
    status: 'waiting',
  });
  let sent = 0;
  for (const payout of waiting) {
    try {
      const result = await sendManualPayout(base44, payout);
      if (result.sent) sent += 1;
    } catch (error) {
      console.error('Manual payout failed for', payout.id, '-', error.message);
    }
  }
  return { sent };
}

/** The hourly retry: every waiting payout whose creator can now be paid. */
export async function sweepManualPayouts(base44) {
  const waiting = await base44.asServiceRole.entities.ManualPayout.filter({ status: 'waiting' });
  let sent = 0;
  for (const payout of waiting) {
    try {
      // Quiet on the "still waiting for setup" case — they were told once already.
      const result = await sendManualPayout(base44, payout);
      if (result.sent) sent += 1;
    } catch (error) {
      console.error('Manual payout sweep failed for', payout.id, '-', error.message);
    }
  }
  return { checked: waiting.length, sent };
}
