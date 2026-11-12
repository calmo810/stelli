/**
 * Where a booking stands, and the one thing its client or creator should do
 * next — in plain words.
 *
 * The portals used to work this out separately in several places, from the
 * raw `status` alone. They missed "pay now" and "your photos are ready"
 * entirely, showed "deliver" before a shoot had happened, and dropped
 * cancelled bookings and bank payments in progress out of every list. This is
 * the one place that decides it, for both portals and the thread.
 *
 * Pure: it only reads what it is given. Tested in tests/bookingNextStep.test.mjs.
 * The status rules mirror base44/shared/bookingRules.ts.
 */

const LEGACY_LIMBO = ['pending', 'awaiting_creator_acceptance'];
const MONEY_TAKEN = ['held', 'released', 'partially_refunded'];
const CONFIRMED = ['confirmed', 'in_progress', 'awaiting_delivery', 'delivered', 'completed'];
const SHOOT_ZONE = 'America/New_York';

export function money(amount) {
  const value = Number(amount || 0);
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

const firstName = (name, fallback) => String(name || '').trim().split(/\s+/)[0] || fallback;

export function moneyTaken(booking) {
  return MONEY_TAKEN.includes(booking?.payment_status);
}

/** The status a booking is really in (two old statuses are read as what they mean). */
export function effectiveStatus(booking) {
  const status = booking?.status || 'requested';
  if (!LEGACY_LIMBO.includes(status)) return status;
  if (moneyTaken(booking)) return booking.delivered_at ? 'delivered' : 'confirmed';
  return booking?.quote_id ? 'quote_accepted' : 'quoted';
}

/** Paid and going ahead: contact details are unlocked. */
export function isConfirmed(booking) {
  return CONFIRMED.includes(effectiveStatus(booking)) && moneyTaken(booking);
}

/** Has the shoot's start time (New York) passed? Noon is assumed with no time. */
export function shootPassed(booking, nowMs = Date.now()) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(booking?.event_date || ''));
  if (!match) return false;
  const time = /^(\d{1,2}):(\d{2})/.exec(String(booking?.event_time || '')) || [null, '12', '00'];
  const wall = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(time[1]), Number(time[2]));
  // How far New York is from UTC at that moment.
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SHOOT_ZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date(wall));
  const part = (type) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(part('year'), part('month') - 1, part('day'), part('hour'), part('minute'));
  return wall - (asUtc - wall) <= nowMs;
}

function underReview(booking) {
  return Boolean(
    booking?.flagged_for_review ||
      booking?.stray_payment_intent_id ||
      (booking?.dispute_status && !['won', 'lost', 'warning_closed'].includes(booking.dispute_status))
  );
}

/** Still in motion, or finished? Decides the Active / Past tabs. */
export function isPast(booking) {
  const status = effectiveStatus(booking);
  return status === 'completed' || status === 'cancelled';
}

/** The small chip next to a booking. */
export function statusChip(booking) {
  const status = effectiveStatus(booking);
  if (status === 'cancelled') return 'CANCELLED';
  if (underReview(booking) || status === 'disputed') return 'UNDER REVIEW';
  if (status === 'requested') return 'REQUESTED';
  if (status === 'quoted') return 'QUOTE SENT';
  if (status === 'quote_accepted') return booking?.payment_status === 'processing' ? 'PAYMENT CLEARING' : 'TO PAY';
  if (status === 'delivered' || status === 'completed') return 'DELIVERED';
  return 'CONFIRMED';
}

function windowLeft(booking, nowMs) {
  const due = booking?.release_due_at ? new Date(booking.release_due_at).getTime() : NaN;
  if (!Number.isFinite(due) || due <= nowMs) return '';
  const hours = Math.ceil((due - nowMs) / 3_600_000);
  return hours >= 2 ? `${hours} hours` : 'about an hour';
}

/**
 * One calm sentence on where the booking stands, written for whoever is
 * reading it. Never a raw status.
 */
export function statusLine(booking, role, nowMs = Date.now()) {
  const status = effectiveStatus(booking);
  const client = role === 'client';
  const creator = firstName(booking?.lensman_name, 'your creator');
  const payout = money(booking?.creator_payout);

  if (status === 'cancelled') {
    if (booking.payment_status === 'refunded') {
      return client ? 'Cancelled. Your refund is on its way back to your card.' : 'Cancelled. The client was refunded.';
    }
    if (booking.flagged_for_review) return 'Cancelled. A founder is finishing the refund.';
    return 'This booking was cancelled.';
  }
  if (booking?.stray_payment_intent_id) {
    return client
      ? 'We received a payment that doesn’t match this booking. A founder is sorting it out, and nothing more is needed from you.'
      : 'A payment on this booking is being checked by a founder.';
  }
  if (booking?.dispute_status && !['won', 'lost', 'warning_closed'].includes(booking.dispute_status)) {
    return 'The payment is being reviewed by the card’s bank. It stays on hold until that is settled.';
  }
  if (booking?.problem_reported_at && booking.payment_status === 'held') {
    return client
      ? 'A founder is looking into your report. Your payment stays held until it is settled.'
      : 'The client reported a problem. The payment stays held while a founder reviews it.';
  }

  switch (status) {
    case 'requested':
      return client ? 'Waiting on a quote. Nothing is charged yet.' : 'New request. Reply and send your quote.';
    case 'quoted':
      return client ? 'Your quote is in. Accept it to lock in the date.' : 'Quote sent. Waiting on the client.';
    case 'quote_accepted':
      if (booking.payment_status === 'processing') {
        return client
          ? 'Your bank payment is clearing. The date locks in once it does, usually within a few business days.'
          : 'The client paid by bank. The date locks in once the payment clears.';
      }
      return client ? 'Quote accepted. Pay to lock in the date.' : 'Quote accepted. Waiting on the client’s payment.';
    case 'delivered': {
      const left = windowLeft(booking, nowMs);
      if (client) {
        return left
          ? `Your photos are here. You have ${left} to report a problem; after that the payment goes to ${creator}.`
          : 'Your photos are here.';
      }
      if (booking.needs_payout_setup) return `Delivered. Set up payouts to receive your ${payout}.`;
      return left ? `Delivered. Your ${payout} is released in ${left}.` : `Delivered. Your ${payout} is being released.`;
    }
    case 'completed':
      return client ? `All done. The payment has been released to ${creator}.` : `Paid out. ${payout} is on its way to your bank.`;
    default: {
      // Confirmed: paid, not delivered yet.
      const after = shootPassed(booking, nowMs);
      if (client) {
        return after
          ? 'Your payment is held safely until your photos arrive.'
          : 'Booked. Your payment is held safely until your photos arrive.';
      }
      return after
        ? `Time to deliver. Your ${payout} is held until the final edits are in.`
        : `Booked and paid. Your ${payout} is held for you until you deliver.`;
    }
  }
}

/**
 * The one thing this person should do next on this booking, or null when
 * there is nothing for them to do right now.
 *
 * `quotes` is every quote on the booking the viewer can see.
 */
export function nextStep(booking, role, { quotes = [], nowMs = Date.now() } = {}) {
  if (!booking || isPast(booking)) return null;
  const status = effectiveStatus(booking);
  const id = booking.id;
  const client = firstName(booking.client_name, 'your client');
  const creator = firstName(booking.lensman_name, 'Your creator');
  const thread = `/messages/${id}`;
  const step = (key, title, action, to = thread) => ({ id: `${key}-${id}`, key, bookingId: id, title, action, to });

  // A founder has it. Nothing to do but wait — so nothing is listed.
  if (underReview(booking)) return null;

  if (role === 'client') {
    const liveQuote = quotes.find(
      (q) => q.booking_id === id && q.status === 'sent' && !(q.expires_at && new Date(q.expires_at).getTime() < nowMs)
    );
    if ((status === 'requested' || status === 'quoted') && liveQuote) {
      return step('quote', `${creator} sent a quote`, 'Review');
    }
    if (status === 'quote_accepted' && (booking.payment_status || 'pending') === 'pending') {
      return step('pay', `Pay to lock in ${creator}`, 'Pay');
    }
    if (status === 'delivered' && booking.payment_status === 'held' && !booking.problem_reported_at) {
      const album = booking.album_token ? `/album/${id}?t=${booking.album_token}` : `/album/${id}`;
      return step('photos', `${creator} delivered your photos`, 'View', booking.delivery_link || booking.album_token ? album : thread);
    }
    return null;
  }

  // The creator.
  if (status === 'requested') {
    const what = booking.event_type ? booking.event_type.replace(/_/g, ' ') : 'photos';
    return step('request', `${firstName(booking.client_name, 'Someone')} wants ${what}`, 'Quote');
  }
  if (isConfirmed(booking) && status !== 'delivered') {
    if (!booking.creator_contract_accepted && booking.contract_id) {
      return step('agreement', `Accept the agreement for ${client}’s shoot`, 'Open', `/agreements/${booking.contract_id}`);
    }
    if (shootPassed(booking, nowMs)) {
      return booking.unedited_delivered_at
        ? step('deliver', `Deliver ${client}’s final edits`, 'Deliver')
        : step('unedited', `Post ${client}’s unedited set`, 'Post');
    }
  }
  return null;
}

/** Every next step across a list of bookings, most pressing first. */
export function nextSteps(bookings = [], role, context = {}) {
  const order = ['pay', 'quote', 'photos', 'request', 'deliver', 'unedited', 'agreement'];
  return bookings
    .map((booking) => nextStep(booking, role, context))
    .filter(Boolean)
    .sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
}
