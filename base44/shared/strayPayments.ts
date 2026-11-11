import { secrets } from 'base44:runtime';
import { stripeMode, stripePost } from './stripe.ts';
import { fromCents, money, toCents } from './money.ts';
import { disputeOpen, strayPaymentSummary } from './bookingRules.ts';
import { withBookingLock } from './bookingLock.ts';
import { emailAdmins, sendEmail } from './notify.ts';

/**
 * Payments that reached a booking but are not its payment: an old Checkout
 * page paid after the quote changed, a second tab paid after the first, the
 * wrong amount. Each is real money and needs its own way back.
 *
 * Each one is its own StrayPayment record, keyed by the Stripe PaymentIntent.
 * A booking can collect any number of them; none overwrites another, and each
 * is refunded (or disputed, or kept) on its own. The booking carries a summary
 * (how many are open, the latest one, the total) so the portals can say "a
 * payment is being reviewed" without reading founders-only records. The
 * records are the truth; the summary is worked out from them.
 */

/** Still waiting on a founder (or on the bank). */
export const STRAY_OPEN = ['open', 'refunding', 'refund_failed', 'disputed'];

/** A refund that never finished (the function died mid-way) is retried after this. */
const STUCK_AFTER_MS = 10 * 60 * 1000;

const records = (base44) => base44.asServiceRole.entities.StrayPayment;

/** The key a payment is filed under: its PaymentIntent, else its session. */
export const strayKey = (session) => String(session?.payment_intent || session?.id || '');

const byArrival = (a, b) =>
  String(a.received_at || a.created_date || '').localeCompare(String(b.received_at || b.created_date || '')) ||
  String(a.id).localeCompare(String(b.id));

/** Oldest first, ties by ID, so every caller agrees on which copy is the real one. */
const firstOf = (rows) =>
  [...rows].sort(
    (a, b) =>
      String(a.created_date || '').localeCompare(String(b.created_date || '')) ||
      String(a.id).localeCompare(String(b.id))
  )[0] || null;

export async function straysFor(base44, bookingId) {
  if (!bookingId) return [];
  return (await records(base44).filter({ booking_id: bookingId })).sort(byArrival);
}

export async function openStraysFor(base44, bookingId) {
  return (await straysFor(base44, bookingId)).filter((row) => STRAY_OPEN.includes(row.status || 'open'));
}

export async function strayByIntent(base44, intentId) {
  if (!intentId) return null;
  return firstOf(await records(base44).filter({ payment_intent_id: intentId }));
}

/**
 * Files one unmatched payment. Safe to receive twice, even at the same moment:
 * the same PaymentIntent is only ever filed once, and only the copy that
 * stays sends the emails.
 */
export async function recordStrayPayment(base44, booking, session, verdict, charged) {
  const key = strayKey(session);
  if (!key) return { recorded: false, reason: 'no-payment' };
  const StrayPayment = records(base44);

  const existing = await StrayPayment.filter({ payment_intent_id: key });
  if (existing.length) return { recorded: false, reason: 'already-recorded', stray: firstOf(existing) };

  const reasons = verdict?.reasons || [];
  const summary = strayPaymentSummary(reasons, money(charged));
  const mine = await StrayPayment.create({
    payment_intent_id: key,
    checkout_session_id: session?.id || '',
    booking_id: booking.id,
    client_id: booking.client_id || '',
    amount: charged,
    reason: reasons.join(', '),
    summary,
    livemode: Boolean(session?.livemode),
    status: 'open',
    received_at: new Date().toISOString(),
    refund_attempts: 0,
  });

  // Two deliveries of the same Stripe event can both get past the check
  // above. Both read every record for the payment back and keep the oldest;
  // the other removes its own copy and stays quiet.
  const keep = firstOf(await StrayPayment.filter({ payment_intent_id: key }));
  if (keep && keep.id !== mine.id) {
    await StrayPayment.delete(mine.id).catch(() => {});
    return { recorded: false, reason: 'already-recorded', stray: keep };
  }

  await refreshStraySummary(base44, booking.id, { arrived: mine });

  await emailAdmins(
    base44,
    'A payment needs a look',
    `${summary}\n\nBooking: ${booking.client_name || 'Client'} with ${booking.lensman_name || 'creator'}, ${booking.event_date}.\nStripe payment: ${key}`
  );
  await sendEmail(
    base44,
    booking.client_email,
    'About your payment',
    `We received a payment of ${money(charged)} for the ${booking.event_date} shoot, but it does not match the booking as it stands now, so it has not been counted as your booking's payment.\n\nNothing more is needed from you right now. A founder will sort it out and email you.`
  );

  return { recorded: true, stray: mine };
}

function stillFlaggedForOtherReasons(booking) {
  return (
    Boolean(booking.problem_reported_at && booking.payment_status === 'held') ||
    disputeOpen(booking) ||
    ['failed', 'needed'].includes(booking.reversal_status)
  );
}

/**
 * Works the booking's summary out from its records, under the booking's lock
 * and on a fresh read, so a payment filed a moment ago is never cleared away
 * by a refund finishing on another one.
 *
 * Setting the flag never waits on the lock: if the booking is busy, the
 * summary is written anyway (it only ever adds the warning). Clearing it does
 * wait: without the lock, it is left for the next refresh.
 */
export async function refreshStraySummary(base44, bookingId, { arrived = null } = {}) {
  const Booking = base44.asServiceRole.entities.Booking;

  const patchFor = async (booking) => {
    const open = await openStraysFor(base44, bookingId);
    const latest = open[open.length - 1] || null;
    const totalCents = open.reduce((sum, row) => sum + toCents(row.amount), 0);
    const patch: Record<string, unknown> = {
      stray_payment_count: open.length,
      stray_payment_intent_id: latest?.payment_intent_id || '',
      stray_payment_amount: fromCents(totalCents),
      stray_payment_reason: latest?.reason || '',
      stray_payment_at: latest?.received_at || '',
    };
    if (open.length) {
      patch.flagged_for_review = true;
      if (arrived) {
        patch.flag_reason =
          booking.flagged_for_review && booking.flag_reason
            ? `${arrived.summary} (Earlier: ${booking.flag_reason})`
            : arrived.summary;
      }
    } else if (booking.stray_payment_intent_id && !stillFlaggedForOtherReasons(booking)) {
      patch.flagged_for_review = false;
      patch.flag_reason = '';
    }
    return { patch, open };
  };

  const outcome = await withBookingLock(
    base44,
    bookingId,
    'review',
    async (booking) => {
      const { patch, open } = await patchFor(booking);
      await Booking.update(bookingId, patch);
      return { open: open.length };
    },
    { waitMs: 6000 }
  );
  if (outcome.locked) return outcome.result;

  const booking = await Booking.get(bookingId).catch(() => null);
  if (!booking) return { open: 0 };
  const { patch, open } = await patchFor(booking);
  if (open.length) await Booking.update(bookingId, patch);
  return { open: open.length, deferred: !open.length };
}

/** Claims one record for a refund: only one caller gets it, and a stuck one is retried. */
async function claimForRefund(base44, strayId) {
  const StrayPayment = records(base44);
  const stamp = new Date().toISOString();
  await StrayPayment.updateMany(
    { id: strayId, status: { $in: ['open', 'refund_failed'] } },
    { $set: { status: 'refunding', refund_started_at: stamp } }
  ).catch((error) => console.error('Stray refund claim failed for', strayId, '-', error.message));

  let row = await StrayPayment.get(strayId).catch(() => null);
  if (!row) return { won: false, reason: 'no-stray-payment' };
  if (row.status === 'refunding' && row.refund_started_at === stamp) return { won: true, row };

  // Somebody's refund died half-way: take it over.
  const startedMs = Date.parse(row.refund_started_at || '') || 0;
  if (row.status === 'refunding' && Date.now() - startedMs > STUCK_AFTER_MS) {
    await StrayPayment.updateMany(
      { id: strayId, status: 'refunding', refund_started_at: row.refund_started_at },
      { $set: { refund_started_at: stamp } }
    );
    row = await StrayPayment.get(strayId).catch(() => null);
    if (row?.refund_started_at === stamp) return { won: true, row };
  }

  if (row.status === 'refunded') return { won: false, reason: 'already-refunded', row };
  if (row.status === 'disputed') return { won: false, reason: 'disputed', row };
  if (row.status === 'dispute_lost') return { won: false, reason: 'dispute-lost', row };
  return { won: false, reason: 'busy', row };
}

/**
 * Sends one unmatched payment back in full. Nothing else on the booking — its
 * own payment, or any other unmatched one — is touched. Keyed by the payment
 * itself at Stripe, so however many times it is pressed it refunds once.
 */
export async function refundStrayRecord(base44, strayId): Promise<Record<string, any>> {
  const StrayPayment = records(base44);
  const claim = await claimForRefund(base44, strayId);
  if (!claim.won) return { refunded: false, reason: claim.reason, stray: claim.row || null };
  const stray = claim.row;
  const intentId = String(stray.payment_intent_id || '');

  if (!intentId.startsWith('pi_')) {
    await StrayPayment.update(stray.id, { status: 'open' });
    return { refunded: false, reason: 'refund-in-stripe', stray };
  }

  // Taken in the other Stripe mode from the one the app runs in now: these
  // keys can't see it. Leave it open rather than record a failed refund.
  if (stray.livemode !== undefined && stray.livemode !== null && Boolean(stray.livemode) !== (stripeMode() === 'live')) {
    await StrayPayment.update(stray.id, { status: 'open' });
    return { refunded: false, reason: 'other-mode', stray };
  }

  let refundId = '';
  let alreadyRefunded = false;
  try {
    const refund = await stripePost(
      'refunds',
      new URLSearchParams({
        payment_intent: intentId,
        'metadata[booking_id]': stray.booking_id,
        'metadata[stray_payment_id]': stray.id,
        'metadata[base44_app_id]': secrets.get('BASE44_APP_ID') || '',
      }),
      // A definite "no" from Stripe is saved under its key and replayed, so
      // a retry after one needs a new key. A full refund can't go out twice
      // either way: Stripe refuses one on a charge with nothing left.
      `refund-stray-${intentId}${Number(stray.refund_key_version) ? `-${Number(stray.refund_key_version)}` : ''}`
    );
    refundId = refund?.id || '';
  } catch (error) {
    const message = String(error?.message || '');
    if (/already been refunded|greater than the unrefunded/i.test(message)) {
      // Refunded by hand in Stripe already: nothing left, which is fine.
      alreadyRefunded = true;
    } else if (/dispute|charged back/i.test(message)) {
      await StrayPayment.update(stray.id, { status: 'disputed', refund_error: message.slice(0, 300) });
      await refreshStraySummary(base44, stray.booking_id);
      return { refunded: false, reason: 'disputed', stray };
    } else {
      await StrayPayment.update(stray.id, {
        status: 'refund_failed',
        refund_error: message.slice(0, 300),
        refund_attempts: Number(stray.refund_attempts || 0) + 1,
        // An unclear failure (timeout, 5xx) keeps the key, so a retry returns
        // the refund if it did go through.
        ...(error?.definitive ? { refund_key_version: Number(stray.refund_key_version || 0) + 1 } : {}),
      });
      return { refunded: false, reason: 'refund-failed', error: message.slice(0, 300), stray };
    }
  }

  await StrayPayment.update(stray.id, {
    status: 'refunded',
    refund_id: refundId,
    refunded_at: new Date().toISOString(),
    refund_error: '',
  });
  await refreshStraySummary(base44, stray.booking_id);

  if (!alreadyRefunded) {
    const booking = await base44.asServiceRole.entities.Booking.get(stray.booking_id).catch(() => null);
    if (booking) {
      await sendEmail(
        base44,
        booking.client_email,
        'Refund issued',
        `${money(stray.amount)} has been refunded for the ${booking.event_date} shoot. That payment did not match your booking, so it has been sent back in full. It reaches your card in a few business days.`
      );
    }
  }

  return { refunded: true, amount: Number(stray.amount || 0), stray };
}

/**
 * Bookings filed before stray payments had their own records kept just one,
 * on the booking. That one is filed as a record the first time anyone looks,
 * so it gets the same refund path as the rest.
 */
export async function adoptBookingStray(base44, booking) {
  const key = String(booking?.stray_payment_intent_id || '');
  if (!key || Number(booking.stray_payment_count) > 0) return null;
  if (await strayByIntent(base44, key)) return null;
  const row = await records(base44).create({
    payment_intent_id: key,
    booking_id: booking.id,
    client_id: booking.client_id || '',
    amount: Number(booking.stray_payment_amount || 0),
    reason: booking.stray_payment_reason || '',
    summary: booking.flag_reason || 'A payment that did not match this booking.',
    livemode: booking.stripe_livemode !== false,
    status: 'open',
    received_at: booking.stray_payment_at || new Date().toISOString(),
    refund_attempts: 0,
  });
  const keep = await strayByIntent(base44, key);
  if (keep && keep.id !== row.id) await records(base44).delete(row.id).catch(() => {});
  return keep;
}

/** Stripe says this payment's charge was refunded (by us, or by hand in the dashboard). */
export async function syncStrayRefund(base44, charge) {
  const stray = await strayByIntent(base44, charge?.payment_intent);
  if (!stray) return { synced: false };
  if (charge.refunded === true && stray.status !== 'refunded') {
    await records(base44).update(stray.id, {
      status: 'refunded',
      refunded_at: stray.refunded_at || new Date().toISOString(),
      refund_error: '',
    });
    await refreshStraySummary(base44, stray.booking_id);
  }
  return { synced: true, stray: true };
}

/** A card dispute opened or closed on an unmatched payment. */
export async function syncStrayDispute(base44, dispute, closed) {
  const stray = await strayByIntent(base44, dispute?.payment_intent);
  if (!stray) return { handled: false };
  const status = String(dispute.status || '');
  const next = !closed ? 'disputed' : status === 'lost' ? 'dispute_lost' : stray.refunded_at ? 'refunded' : 'open';
  await records(base44).update(stray.id, { status: next, dispute_status: status || (closed ? 'won' : 'needs_response') });
  await refreshStraySummary(base44, stray.booking_id);
  if (!closed) {
    await emailAdmins(
      base44,
      'Card dispute on an unmatched payment',
      `A client opened a card dispute on a payment of ${money(stray.amount)} that did not match their booking (Stripe payment ${stray.payment_intent_id}). It can't be refunded while the dispute is open. Respond in Stripe before the deadline.`
    );
  }
  return { handled: true, stray: true };
}
