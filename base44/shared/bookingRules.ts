/**
 * What a booking is allowed to do in the state it is in.
 *
 * Every backend function used to carry its own idea of "is this paid", "is
 * this open", "can this be delivered". They disagreed, and several moves had
 * no check at all. The rules now live here, as plain functions that take a
 * booking and answer with '' (go ahead) or the reason it can't happen.
 *
 * Pure: no secrets, no network, no database. Tested in tests/bookingRules.test.mjs.
 */
import { chargeMatches } from './money.ts';
import { shootDayEndMs } from './shootTime.ts';

/** How long the client has to report a problem before the payout releases. */
export const HOLD_HOURS = 48;

/** Statuses once a booking is paid for and going ahead. */
export const CONFIRMED_STATUSES = [
  'confirmed',
  'in_progress',
  'awaiting_delivery',
  'delivered',
  'completed',
];

/** Paid, shoot not yet delivered. */
const AWAITING_PHOTOS = ['confirmed', 'in_progress', 'awaiting_delivery'];

/** Two statuses older code could leave a booking in. Nothing sets them now. */
const LEGACY_LIMBO = ['pending', 'awaiting_creator_acceptance'];

/** The client's money was taken and at least part of it is still counted. */
const MONEY_TAKEN = ['held', 'released', 'partially_refunded'];

/** Any payment state other than "nothing has happened yet". */
const PAYMENT_STARTED = ['processing', 'held', 'released', 'partially_refunded', 'refunded'];

export function moneyTaken(booking) {
  return MONEY_TAKEN.includes(booking?.payment_status);
}

/**
 * The status a booking is really in.
 *
 * Older code could park a booking in `awaiting_creator_acceptance` (or
 * `pending`) even after it was paid, which hid it from both portals. Rather
 * than rewrite stored records, those two are read as what they mean.
 */
export function effectiveStatus(booking) {
  const status = booking?.status || 'requested';
  if (!LEGACY_LIMBO.includes(status)) return status;
  if (moneyTaken(booking)) return booking.delivered_at ? 'delivered' : 'confirmed';
  return booking?.quote_id ? 'quote_accepted' : 'quoted';
}

/** Paid and going ahead: contact details unlock and photos can be delivered. */
export function isConfirmed(booking) {
  return CONFIRMED_STATUSES.includes(effectiveStatus(booking)) && moneyTaken(booking);
}

/** A card dispute that Stripe has not closed yet. */
export function disputeOpen(booking) {
  const status = booking?.dispute_status;
  return Boolean(status) && !['won', 'lost', 'warning_closed'].includes(status);
}

export function disputeLost(booking) {
  return booking?.dispute_status === 'lost';
}

/** A payment that arrived but could not be matched to this booking's price. */
export function hasStrayPayment(booking) {
  return Boolean(booking?.stray_payment_intent_id);
}

/**
 * Was this booking paid for in Stripe's test mode? Older records have no
 * stripe_livemode flag, so the Checkout session's own prefix is read instead.
 */
export function isTestModePayment(booking) {
  if (booking?.stripe_livemode === false) return true;
  if (booking?.stripe_livemode === true) return false;
  return /^cs_test_/.test(String(booking?.stripe_checkout_session_id || ''));
}

/** When the hold window closes on a delivered booking. */
export function releaseDueFrom(deliveredAt) {
  return new Date(new Date(deliveredAt).getTime() + HOLD_HOURS * 3_600_000).toISOString();
}

/* ------------------------------------------------------------------ */
/* Quotes and checkout                                                  */
/* ------------------------------------------------------------------ */

/** Why a creator can't send a quote on this booking, or ''. */
export function quoteBlocker(booking) {
  const status = effectiveStatus(booking);
  if (status === 'cancelled') return 'This booking was cancelled. Ask the client to send a new request.';
  if (hasStrayPayment(booking)) return 'A payment on this booking is being reviewed by Stelli.';
  if (PAYMENT_STARTED.includes(booking?.payment_status)) {
    return 'This booking is already paid. Message Stelli to change the price.';
  }
  if (CONFIRMED_STATUSES.includes(status)) return 'This booking is already confirmed.';
  return '';
}

/** Why the client can't accept this quote, or ''. */
export function acceptBlocker(booking, quote, nowMs) {
  if (!quote || quote.booking_id !== booking?.id) return 'That quote is not on this booking.';
  const status = effectiveStatus(booking);
  if (status === 'cancelled') return 'This booking was cancelled.';
  if (hasStrayPayment(booking)) return 'A payment on this booking is being reviewed by Stelli.';
  if (PAYMENT_STARTED.includes(booking?.payment_status)) return 'This booking is already paid.';
  if (quote.status !== 'sent') {
    return quote.status === 'superseded'
      ? 'Your creator sent a newer quote. Use that one.'
      : `This quote was already ${quote.status}.`;
  }
  if (quote.expires_at && new Date(quote.expires_at).getTime() < nowMs) {
    return 'This quote expired. Ask your creator for a new one.';
  }
  return '';
}

/** Why the client can't open Checkout for this booking, or ''. */
export function checkoutBlocker(booking, quote, nowMs) {
  const status = effectiveStatus(booking);
  if (status === 'cancelled') return 'This booking was cancelled, so there is nothing to pay.';
  if (hasStrayPayment(booking)) return 'A payment on this booking is being reviewed by Stelli.';
  if (booking?.payment_status === 'processing') return 'Your bank payment is still clearing.';
  if (PAYMENT_STARTED.includes(booking?.payment_status)) return 'This booking is already paid.';
  if (!quote || quote.booking_id !== booking?.id || quote.status !== 'accepted') {
    return 'There is no accepted quote on this booking yet.';
  }
  if (!booking?.quote_id || booking.quote_id !== quote.id) {
    return 'Your creator sent a newer quote. Accept that one to pay.';
  }
  const dayEnd = shootDayEndMs(booking?.event_date);
  if (Number.isFinite(dayEnd) && dayEnd < nowMs) {
    return 'The date on this booking has passed. Ask your creator for a new quote with a new date.';
  }
  return '';
}

/**
 * Is a paid Checkout session the payment this booking is waiting for?
 *
 * A payment only confirms the booking when every one of these holds. Anything
 * else is real money that has to be looked at by a person, so it is kept apart
 * from the booking instead of being treated as its payment.
 */
export function paidSessionVerdict({ booking, quote, session, breakdown }) {
  const reasons = [];
  const metadataQuoteId = session?.metadata?.quote_id || '';
  const beforeTaxCents =
    typeof session?.amount_subtotal === 'number'
      ? session.amount_subtotal
      : Number(session?.amount_total || 0) - Number(session?.total_details?.amount_tax || 0);

  if (effectiveStatus(booking) === 'cancelled') reasons.push('booking-cancelled');
  if (
    PAYMENT_STARTED.includes(booking?.payment_status) &&
    booking.payment_status !== 'processing' &&
    booking.stripe_payment_intent_id &&
    booking.stripe_payment_intent_id !== session?.payment_intent
  ) {
    reasons.push('already-paid');
  }
  if (!booking?.stripe_checkout_session_id || booking.stripe_checkout_session_id !== session?.id) {
    reasons.push('not-the-session-on-record');
  }
  if (!booking?.quote_id || !metadataQuoteId || booking.quote_id !== metadataQuoteId) {
    reasons.push('quote-replaced');
  }
  if (!quote || quote.booking_id !== booking?.id || quote.status !== 'accepted') {
    reasons.push('quote-not-accepted');
  }
  if (!chargeMatches(breakdown, beforeTaxCents)) reasons.push('amount-mismatch');

  return { clean: reasons.length === 0, reasons, beforeTaxCents };
}

const STRAY_REASON_TEXT = {
  'booking-cancelled': 'the booking was already cancelled',
  'already-paid': 'the booking was already paid',
  'not-the-session-on-record': 'it came from an older checkout page',
  'quote-replaced': 'the quote it paid for has been replaced',
  'quote-not-accepted': 'the quote it paid for is not the accepted one',
  'amount-mismatch': 'the amount does not match the accepted quote',
};

/** One plain sentence for the founder queue. */
export function strayPaymentSummary(reasons, amountText) {
  const why = (reasons || []).map((reason) => STRAY_REASON_TEXT[reason]).filter(Boolean);
  return `A payment of ${amountText} came in that does not belong to this booking as it stands: ${
    why.join('; ') || 'it could not be matched'
  }. The booking was not confirmed. Refund it, or decide what to do with it.`;
}

/* ------------------------------------------------------------------ */
/* Delivery                                                             */
/* ------------------------------------------------------------------ */

/** Once final edits are delivered the album and the payout window are fixed. */
export function albumLocked(booking) {
  return Boolean(booking?.delivered_at);
}

/** Why the creator can't post a delivery step, or ''. */
export function deliveryBlocker(booking) {
  const status = effectiveStatus(booking);
  if (status === 'cancelled') return 'This booking was cancelled.';
  if (albumLocked(booking)) {
    return 'The final edits are already delivered. To change something, message your client or Stelli.';
  }
  if (!moneyTaken(booking) || !AWAITING_PHOTOS.includes(status)) {
    return 'Photos can go to the client once the shoot is paid for.';
  }
  return '';
}

/** Why the creator can't add photos to the album, or ''. */
export function photoAddBlocker(booking) {
  return deliveryBlocker(booking);
}

/** Why the creator can't take a photo out of the album, or ''. */
export function photoRemoveBlocker(booking) {
  if (albumLocked(booking)) {
    return 'The final edits are delivered, so the album is locked. Message Stelli if a photo has to come down.';
  }
  return '';
}

/* ------------------------------------------------------------------ */
/* Money leaving the hold                                               */
/* ------------------------------------------------------------------ */

/**
 * Why held money can't go to the creator right now, or ''.
 *
 * `founder` is a founder's explicit decision from the admin page: it may
 * release a flagged booking and does not wait for the window. It still can't
 * release during an open card dispute, after a lost one, or twice.
 */
export function releaseBlocker(booking, { nowMs = Date.now(), founder = false, liveMode = true } = {}) {
  if (!booking) return 'not-found';
  if (booking.stripe_transfer_id || booking.released_at || booking.payment_status === 'released') {
    return 'already-paid';
  }
  if (!['held', 'partially_refunded'].includes(booking.payment_status)) return 'nothing-held';
  if (disputeOpen(booking) || disputeLost(booking)) return 'disputed';
  if (liveMode && isTestModePayment(booking)) return 'test-payment';
  if (founder) return '';

  if (booking.flagged_for_review) return 'flagged';

  const status = effectiveStatus(booking);
  if (status === 'cancelled') {
    // Only a late client cancellation leaves the creator a share.
    return booking.cancellation_payout_due ? '' : 'nothing-owed';
  }
  if (status !== 'delivered' || !booking.delivered_at) return 'not-delivered';
  if (booking.problem_reported_at) return 'problem-reported';
  if (booking.client_confirmed_delivery) return '';
  if (!booking.release_due_at || new Date(booking.release_due_at).getTime() > nowMs) return 'not-due';
  return '';
}

/**
 * Why a client can't report a problem, or ''.
 * `shootPassed` is whether the shoot's start time is behind us.
 */
export function reportBlocker(booking, { shootPassed }) {
  if (booking?.problem_reported_at) return 'A problem is already reported on this booking. A founder is on it.';
  if (!moneyTaken(booking)) return 'There is no payment on this booking to hold.';
  if (!albumLocked(booking) && !shootPassed) {
    return 'The shoot has not happened yet. If plans changed, cancel the booking instead.';
  }
  return '';
}
