/**
 * What is waiting on a founder, and what they can do about it.
 *
 * One booking can need a founder for several reasons at once. This turns a
 * booking into at most one queue item — the most urgent reason — with a plain
 * headline, the amounts involved, and the two or three actions that settle it.
 * Each action carries the exact sentence shown before it runs.
 *
 * Unmatched ("stray") payments are their own records, one per Stripe payment,
 * and a booking can have several. When the founder's list of them is passed
 * in, each open one gets its own refund button.
 *
 * Pure: it only reads what it is given. Tested in tests/founderQueue.test.mjs.
 */

/** Unmatched payments still waiting on a founder or the bank. */
const STRAY_OPEN = ['open', 'refunding', 'refund_failed', 'disputed'];

const shortWhen = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })
    : '';

/** One button per unmatched payment that can be refunded now. */
function strayActions(booking, strays) {
  const client = firstName(booking.client_name, 'the client');
  const several = strays.length > 1;
  return strays
    .filter((stray) => ['open', 'refund_failed'].includes(stray.status || 'open'))
    .map((stray) => {
      const when = several && stray.received_at ? ` (paid ${shortWhen(stray.received_at)})` : '';
      const retry = stray.status === 'refund_failed' ? 'Try again: send' : 'Send';
      return {
        action: 'refund_stray',
        key: `refund_stray-${stray.id}`,
        strayId: stray.id,
        label: `${retry} ${money(stray.amount)} back to ${client}${when}`,
        tone: 'lime',
        confirm: `Send ${money(stray.amount)} back to ${client}’s card. Only this payment is refunded: the booking${
          several ? ' and its other unmatched payments stay' : ' itself stays'
        } as it is. This can’t be undone.`,
      };
    });
}

function strayDetail(strays, fallback) {
  const lines = strays.map((stray) => {
    const state =
      stray.status === 'disputed'
        ? 'the client’s bank opened a dispute, so it can’t be refunded until that closes'
        : stray.status === 'refunding'
          ? 'a refund is on its way'
          : stray.status === 'refund_failed'
            ? `Stripe refused the refund${stray.refund_error ? `: ${stray.refund_error}` : ''}`
            : 'waiting on you';
    return `${money(stray.amount)}${stray.received_at ? ` on ${shortWhen(stray.received_at)}` : ''}: ${state}.`;
  });
  return lines.length > 1 || strays.some((stray) => stray.status !== 'open')
    ? lines.join(' ')
    : fallback;
}

export function money(amount) {
  const value = Number(amount || 0);
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const firstName = (name, fallback) => String(name || '').trim().split(/\s+/)[0] || fallback;

const DAY = 86_400_000;
/** A paid shoot with nothing delivered this long after its date is worth a look. */
const OVERDUE_DAYS = 10;
/** Creators are asked to answer a request within 48 hours. */
const UNANSWERED_HOURS = 48;

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
export function queueItemFor(booking, nowMs = Date.now(), strays = null) {
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

  // With the records: one line and one button per open payment. Without them
  // (an older caller): the booking's own summary, and one button.
  const openStrays = Array.isArray(strays)
    ? strays.filter((stray) => stray.booking_id === b.id && STRAY_OPEN.includes(stray.status || 'open'))
    : null;
  if (openStrays ? openStrays.length > 0 : Boolean(b.stray_payment_intent_id)) {
    const fallback = b.flag_reason || 'It came from an old checkout page or for the wrong amount. The booking was not confirmed.';
    if (!openStrays) {
      return item('stray_payment', 2, `A payment of ${money(b.stray_payment_amount)} doesn’t match this booking`, fallback, ['refund_stray']);
    }
    const total = openStrays.reduce((sum, stray) => sum + Math.round(Number(stray.amount || 0) * 100), 0) / 100;
    return {
      ...item(
        'stray_payment',
        2,
        openStrays.length === 1
          ? `A payment of ${money(total)} doesn’t match this booking`
          : `${openStrays.length} payments (${money(total)} in all) don’t match this booking`,
        strayDetail(openStrays, fallback),
        []
      ),
      actions: strayActions(b, openStrays),
    };
  }

  if (b.problem_reported_at && held) {
    return item(
      'problem',
      2,
      `${client} reported a problem`,
      `${money(b.amount_charged)} is held. ${creator} is owed ${money(b.creator_payout)} if you release it.${
        b.delivered_at ? '' : ' Nothing was delivered: this may be a no-show.'
      }`,
      // Reported before anything was delivered: a no-show is likely, so holding
      // the creator is one tap away.
      b.delivered_at ? ['release', 'refund'] : ['refund', 'release', 'hold_creator']
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

  // A request the creator never answered. Nothing is paid yet, but a client
  // waiting days for a reply is how a marketplace loses them.
  if (
    b.status === 'requested' &&
    !b.first_reply_at &&
    !['held', 'processing', 'released'].includes(b.payment_status) &&
    !(b.client_id && b.client_id === b.creator_id) &&
    b.created_date
  ) {
    const asked = new Date(b.created_date).getTime();
    if (Number.isFinite(asked) && nowMs - asked > UNANSWERED_HOURS * 3_600_000) {
      const days = Math.floor((nowMs - asked) / DAY);
      const shootDay = b.event_date ? new Date(`${b.event_date}T23:59:59Z`).getTime() : NaN;
      const passed = Number.isFinite(shootDay) && shootDay < nowMs;
      return item(
        'unanswered_request',
        4,
        `${creator} hasn’t answered ${client}’s request`,
        `Sent ${days >= 1 ? `${days} day${days === 1 ? '' : 's'}` : 'over two days'} ago${
          b.event_date ? ` for ${b.event_date}` : ''
        }.${passed ? ' The date has passed.' : ''} Nudge ${creator}, or help ${client} find someone else.`,
        []
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
export function founderQueue(bookings = [], nowMs = Date.now(), strays = null) {
  return bookings
    .map((booking) => {
      const item = queueItemFor(booking, nowMs, strays);
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
