/**
 * What is waiting on a founder, and what they can do about it.
 *
 * One booking can need a founder for several reasons at once. This turns a
 * booking into at most one queue item — the most urgent reason — with a plain
 * headline, the amounts involved, and the two or three actions that settle it.
 * Each action carries the exact sentence shown before it runs.
 *
 * Pure: it only reads the booking it is given. Tested in tests/founderQueue.test.mjs.
 */

export function money(amount) {
  const value = Number(amount || 0);
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const firstName = (name, fallback) => String(name || '').trim().split(/\s+/)[0] || fallback;

const DAY = 86_400_000;
/** A paid shoot with nothing delivered this long after its date is worth a look. */
const OVERDUE_DAYS = 10;

const disputeOpen = (b) => Boolean(b.dispute_status) && !['won', 'lost', 'warning_closed'].includes(b.dispute_status);
const isTestPayment = (b) =>
  b.stripe_livemode === false || (b.stripe_livemode == null && /^cs_test_/.test(String(b.stripe_checkout_session_id || '')));

/** What is still refundable on the client's payment. */
export function refundable(booking) {
  return Math.max(0, Math.round((Number(booking.amount_charged || 0) - Number(booking.refund_amount || 0)) * 100) / 100);
}

/** What a pull-back still has to bring home. */
export function owedBack(booking) {
  return Math.max(
    0,
    Math.round((Number(booking.reversal_amount_due || 0) - Number(booking.reversal_amount_done || 0)) * 100) / 100
  );
}

function actions(booking, list) {
  const client = firstName(booking.client_name, 'the client');
  const creator = firstName(booking.lensman_name, 'the creator');
  const payout = Number(booking.creator_payout || 0);
  const paidOut = Boolean(booking.stripe_transfer_id);
  const left = refundable(booking);

  const all = {
    release: {
      action: 'release',
      label: `Release ${money(payout)} to ${creator}`,
      tone: 'lime',
      confirm: `Release ${money(payout)} to ${creator}. This can’t be undone.`,
    },
    refund: {
      action: 'refund',
      label: `Refund ${client} ${money(left)}`,
      tone: 'plain',
      confirm: `Refund ${money(left)} to ${client}’s card.${
        paidOut ? ` ${creator}’s ${money(payout)} payout will be pulled back.` : ''
      } This can’t be undone.`,
    },
    pull_back: {
      action: 'pull_back',
      label: `Pull ${money(payout)} back from ${creator}`,
      tone: 'plain',
      confirm: `Pull ${money(payout)} back from ${creator}’s Stripe balance. This can’t be undone.`,
    },
    retry_reversal: {
      action: 'retry_reversal',
      label: `Try again: pull ${money(owedBack(booking))} back`,
      tone: 'lime',
      confirm: `Pull ${money(owedBack(booking))} back from ${creator}’s Stripe balance. The client’s refund is not sent again.`,
    },
    refund_stray: {
      action: 'refund_stray',
      label: `Send ${money(booking.stray_payment_amount)} back to ${client}`,
      tone: 'lime',
      confirm: `Send ${money(booking.stray_payment_amount)} back to ${client}’s card. The booking itself stays open. This can’t be undone.`,
    },
    mark_reviewed: { action: 'mark_reviewed', label: 'Mark as reviewed', tone: 'plain', confirm: '' },
    hold_creator: {
      action: 'hold_creator',
      label: `Put ${creator} on hold`,
      tone: 'plain',
      confirm: `${creator} is hidden from browse and can’t get new requests until you lift it. Their current bookings carry on.`,
    },
  };
  return list.map((name) => all[name]);
}

/**
 * The queue item for one booking, or null if nothing is waiting on a founder.
 * `urgency` sorts the queue: 1 is first.
 */
export function queueItemFor(booking, nowMs = Date.now()) {
  if (!booking) return null;
  const b = booking;
  const client = firstName(b.client_name, 'The client');
  const creator = firstName(b.lensman_name, 'the creator');
  const paidOut = Boolean(b.stripe_transfer_id);
  const held = ['held', 'partially_refunded'].includes(b.payment_status) && !paidOut;
  const item = (kind, urgency, headline, detail, names) => ({
    id: b.id,
    kind,
    urgency,
    headline,
    detail,
    actions: actions(b, names),
  });

  if (disputeOpen(b)) {
    return item(
      'dispute',
      1,
      `${client} disputed the charge with their bank`,
      paidOut
        ? `${creator} was already paid ${money(b.creator_payout)}. Respond in Stripe before the deadline. You can pull the payout back now.`
        : 'The payout is frozen. Respond in Stripe before the deadline.',
      paidOut && b.reversal_status !== 'done' ? ['pull_back'] : []
    );
  }

  if (['failed', 'needed'].includes(b.reversal_status) && owedBack(b) > 0) {
    return item(
      'pull_back',
      1,
      `${money(owedBack(b))} still has to come back from ${creator}`,
      b.reversal_error
        ? `The client was refunded, but the payout could not be pulled back. Stripe said: ${b.reversal_error}`
        : 'The client was refunded after the creator was paid. The payout has not been pulled back yet.',
      ['retry_reversal']
    );
  }

  if (b.stray_payment_intent_id) {
    return item(
      'stray_payment',
      2,
      `A payment of ${money(b.stray_payment_amount)} doesn’t match this booking`,
      b.flag_reason || 'It came from an old checkout page or for the wrong amount. The booking was not confirmed.',
      ['refund_stray']
    );
  }

  if (b.problem_reported_at && held) {
    return item(
      'problem',
      2,
      `${client} reported a problem`,
      `${money(b.amount_charged)} is held. ${creator} is owed ${money(b.creator_payout)} if you release it.`,
      ['release', 'refund']
    );
  }

  if (b.flagged_for_review && b.problem_reported_at && paidOut && refundable(b) > 0) {
    return item(
      'problem_after_payout',
      2,
      `${client} reported a problem after ${creator} was paid`,
      `Refunding pulls ${creator}’s payout back. If nothing needs doing, mark it reviewed.`,
      ['refund', 'mark_reviewed']
    );
  }

  if (b.payout_error && held) {
    return item(
      'payout_failed',
      3,
      `The payout to ${creator} keeps failing`,
      `Stripe said: ${b.payout_error}`,
      b.flagged_for_review ? ['release', 'refund'] : []
    );
  }

  if (b.flagged_for_review && b.status === 'cancelled' && held && /did not go through/.test(String(b.flag_reason || ''))) {
    return item('refund_failed', 2, `${client}’s cancellation refund didn’t go through`, b.flag_reason, ['refund']);
  }

  if (held && isTestPayment(b)) {
    return item(
      'test_payment',
      5,
      'Paid in Stripe test mode',
      'This booking was paid with a test card. It is not real money and will never pay out. Close it in the Base44 dashboard.',
      []
    );
  }

  if (b.flagged_for_review && held) {
    return item('review', 3, 'Needs a decision', b.flag_reason || 'This booking was flagged.', ['release', 'refund']);
  }

  if (b.flagged_for_review) {
    const creatorCancelled = b.status === 'cancelled' && b.cancelled_by === 'creator';
    return item(
      creatorCancelled ? 'creator_cancelled' : 'review',
      4,
      creatorCancelled ? `${creator} cancelled on ${client}` : 'Needs a look',
      b.flag_reason || '',
      creatorCancelled ? ['mark_reviewed', 'hold_creator'] : ['mark_reviewed']
    );
  }

  if (held && b.status !== 'cancelled' && !b.delivered_at && b.event_date) {
    const shootDay = new Date(`${b.event_date}T23:59:59Z`).getTime();
    if (Number.isFinite(shootDay) && nowMs - shootDay > OVERDUE_DAYS * DAY) {
      return item(
        'overdue_delivery',
        4,
        `${creator} hasn’t delivered ${client}’s photos`,
        `The shoot was ${b.event_date}. ${money(b.amount_charged)} is still held. Check with both of them.`,
        ['refund']
      );
    }
  }

  if (held && b.needs_payout_setup) {
    return item(
      'payout_setup',
      5,
      `${money(b.creator_payout)} is waiting for ${creator} to set up payouts`,
      'It goes out on its own once they finish. Nothing for you to do but nudge them.',
      []
    );
  }

  return null;
}

/** Every booking that needs a founder, most urgent first, oldest first within that. */
export function founderQueue(bookings = [], nowMs = Date.now()) {
  return bookings
    .map((booking) => {
      const item = queueItemFor(booking, nowMs);
      return item ? { ...item, booking } : null;
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        a.urgency - b.urgency ||
        String(a.booking.updated_date || a.booking.created_date || '').localeCompare(
          String(b.booking.updated_date || b.booking.created_date || '')
        )
    );
}
