import test from 'node:test';
import assert from 'node:assert/strict';
import {
  acceptBlocker,
  checkoutBlocker,
  deliveryBlocker,
  effectiveStatus,
  isConfirmed,
  isTestModePayment,
  paidInOtherMode,
  paidSessionVerdict,
  photoRemoveBlocker,
  quoteBlocker,
  releaseBlocker,
  releaseDueFrom,
  reportBlocker,
} from '../base44/shared/bookingRules.ts';
import { bookingBreakdown } from '../base44/shared/money.ts';

const NOW = Date.parse('2026-11-10T15:00:00Z');
const HOUR = 3_600_000;

const base = {
  id: 'b1',
  status: 'quote_accepted',
  payment_status: 'pending',
  quote_id: 'q2',
  stripe_checkout_session_id: 'cs_live_new',
  event_date: '2026-12-01',
  picked_add_ons: [{ name: 'Rush', price: 50 }],
};
const acceptedQuote = { id: 'q2', booking_id: 'b1', status: 'accepted', amount: 100 };
const breakdown = bookingBreakdown(100, base.picked_add_ons); // $171.00 before tax
const goodSession = {
  id: 'cs_live_new',
  payment_intent: 'pi_new',
  amount_subtotal: 17100,
  amount_total: 17100,
  metadata: { booking_id: 'b1', quote_id: 'q2' },
};

/* ---------------- stale checkout (known issue 2) ---------------- */

test('the session on record, for the accepted quote, at the right amount, is clean', () => {
  const verdict = paidSessionVerdict({ booking: base, quote: acceptedQuote, session: goodSession, breakdown });
  assert.deepEqual(verdict, { clean: true, reasons: [], beforeTaxCents: 17100 });
});

test('tax on top does not make a correct payment look wrong', () => {
  const session = { ...goodSession, amount_subtotal: undefined, amount_total: 18468, total_details: { amount_tax: 1368 } };
  assert.equal(paidSessionVerdict({ booking: base, quote: acceptedQuote, session, breakdown }).clean, true);
});

test('an old checkout paid after the quote was replaced is not this booking\'s payment', () => {
  // sendQuote cleared quote_id and the expire call failed; the old tab gets paid.
  const booking = { ...base, status: 'quoted', quote_id: '', stripe_checkout_session_id: 'cs_live_old' };
  const oldQuote = { id: 'q1', booking_id: 'b1', status: 'superseded', amount: 300 };
  const session = { id: 'cs_live_old', payment_intent: 'pi_old', amount_subtotal: 34200, metadata: { quote_id: 'q1' } };
  const verdict = paidSessionVerdict({ booking, quote: oldQuote, session, breakdown: bookingBreakdown(300, []) });
  assert.equal(verdict.clean, false);
  assert.ok(verdict.reasons.includes('quote-replaced'));
  assert.ok(verdict.reasons.includes('quote-not-accepted'));
});

test('an old session paid after a NEW quote was accepted is caught three ways', () => {
  const oldQuote = { id: 'q1', booking_id: 'b1', status: 'superseded', amount: 300 };
  const session = { id: 'cs_live_old', payment_intent: 'pi_old', amount_subtotal: 34200, metadata: { quote_id: 'q1' } };
  const verdict = paidSessionVerdict({ booking: base, quote: oldQuote, session, breakdown: bookingBreakdown(300, []) });
  assert.deepEqual(verdict.reasons.sort(), ['not-the-session-on-record', 'quote-not-accepted', 'quote-replaced']);
});

test('a wrong amount, a cancelled booking and a second payment are each refused', () => {
  const short = paidSessionVerdict({ booking: base, quote: acceptedQuote, session: { ...goodSession, amount_subtotal: 11400 }, breakdown });
  assert.deepEqual(short.reasons, ['amount-mismatch']);

  const cancelled = paidSessionVerdict({ booking: { ...base, status: 'cancelled' }, quote: acceptedQuote, session: goodSession, breakdown });
  assert.deepEqual(cancelled.reasons, ['booking-cancelled']);

  const paid = { ...base, status: 'confirmed', payment_status: 'held', stripe_payment_intent_id: 'pi_first' };
  const second = paidSessionVerdict({ booking: paid, quote: acceptedQuote, session: goodSession, breakdown });
  assert.deepEqual(second.reasons, ['already-paid']);
});

test('a bank payment that was "processing" and then clears is clean', () => {
  const booking = { ...base, payment_status: 'processing', stripe_payment_intent_id: 'pi_new' };
  assert.equal(paidSessionVerdict({ booking, quote: acceptedQuote, session: goodSession, breakdown }).clean, true);
});

/* ---------------- quotes and checkout ---------------- */

test('checkout needs an open booking and its current accepted quote', () => {
  assert.equal(checkoutBlocker(base, acceptedQuote, NOW), '');
  assert.notEqual(checkoutBlocker({ ...base, status: 'cancelled' }, acceptedQuote, NOW), '');
  assert.notEqual(checkoutBlocker({ ...base, payment_status: 'held' }, acceptedQuote, NOW), '');
  assert.notEqual(checkoutBlocker({ ...base, payment_status: 'processing' }, acceptedQuote, NOW), '');
  assert.notEqual(checkoutBlocker({ ...base, payment_status: 'refunded' }, acceptedQuote, NOW), '');
  assert.notEqual(checkoutBlocker(base, null, NOW), '');
  assert.notEqual(checkoutBlocker(base, { ...acceptedQuote, status: 'superseded' }, NOW), '');
  assert.notEqual(checkoutBlocker({ ...base, quote_id: '' }, acceptedQuote, NOW), '');
  assert.notEqual(checkoutBlocker(base, { ...acceptedQuote, booking_id: 'someone-elses' }, NOW), '');
  assert.notEqual(checkoutBlocker({ ...base, stray_payment_intent_id: 'pi_x' }, acceptedQuote, NOW), '');
  assert.notEqual(checkoutBlocker({ ...base, event_date: '2026-11-01' }, acceptedQuote, NOW), '');
});

test('a quote can\'t bring a cancelled or paid booking back to life', () => {
  assert.equal(quoteBlocker({ status: 'requested', payment_status: 'pending' }), '');
  assert.equal(quoteBlocker({ status: 'quote_accepted', payment_status: 'pending' }), '');
  assert.notEqual(quoteBlocker({ status: 'cancelled', payment_status: 'pending' }), '');
  assert.notEqual(quoteBlocker({ status: 'cancelled', payment_status: 'refunded' }), '');
  assert.notEqual(quoteBlocker({ status: 'confirmed', payment_status: 'held' }), '');
  assert.notEqual(quoteBlocker({ status: 'quote_accepted', payment_status: 'processing' }), '');
});

test('only a live, unexpired quote on an open booking can be accepted', () => {
  const sent = { id: 'q3', booking_id: 'b1', status: 'sent', expires_at: new Date(NOW + HOUR).toISOString() };
  const open = { id: 'b1', status: 'quoted', payment_status: 'pending' };
  assert.equal(acceptBlocker(open, sent, NOW), '');
  assert.notEqual(acceptBlocker(open, { ...sent, expires_at: new Date(NOW - 1).toISOString() }, NOW), '');
  assert.notEqual(acceptBlocker(open, { ...sent, status: 'superseded' }, NOW), '');
  assert.notEqual(acceptBlocker(open, { ...sent, status: 'declined' }, NOW), '');
  assert.notEqual(acceptBlocker({ ...open, status: 'cancelled' }, sent, NOW), '');
  assert.notEqual(acceptBlocker({ ...open, payment_status: 'held' }, sent, NOW), '');
  assert.notEqual(acceptBlocker(open, { ...sent, booking_id: 'other' }, NOW), '');
});

/* ---------------- legacy statuses ---------------- */

test('a paid booking parked in awaiting_creator_acceptance is read as confirmed', () => {
  const trapped = { status: 'awaiting_creator_acceptance', payment_status: 'held' };
  assert.equal(effectiveStatus(trapped), 'confirmed');
  assert.equal(isConfirmed(trapped), true);
  assert.equal(deliveryBlocker(trapped), '');
  assert.equal(effectiveStatus({ status: 'awaiting_creator_acceptance', payment_status: 'pending', quote_id: 'q' }), 'quote_accepted');
  assert.equal(effectiveStatus({ status: 'pending', payment_status: 'pending' }), 'quoted');
});

test('"confirmed" without money is not confirmed', () => {
  assert.equal(isConfirmed({ status: 'confirmed', payment_status: 'pending' }), false);
  assert.equal(isConfirmed({ status: 'confirmed', payment_status: 'held' }), true);
  assert.equal(isConfirmed({ status: 'cancelled', payment_status: 'held' }), false);
});

/* ---------------- delivery and the album lock (known issue 6) ---------------- */

test('delivery needs a paid, open booking and happens once', () => {
  const paid = { status: 'confirmed', payment_status: 'held' };
  assert.equal(deliveryBlocker(paid), '');
  assert.notEqual(deliveryBlocker({ status: 'quote_accepted', payment_status: 'pending' }), '');
  assert.notEqual(deliveryBlocker({ status: 'cancelled', payment_status: 'held' }), '');
  // Re-marking a delivered booking would restart the 48 hour window.
  assert.notEqual(deliveryBlocker({ status: 'delivered', payment_status: 'held', delivered_at: '2026-11-01T00:00:00Z' }), '');
  assert.notEqual(deliveryBlocker({ status: 'completed', payment_status: 'released', delivered_at: '2026-11-01T00:00:00Z' }), '');
});

test('photos can come out before final delivery and never after', () => {
  assert.equal(photoRemoveBlocker({ status: 'confirmed', payment_status: 'held' }), '');
  assert.notEqual(photoRemoveBlocker({ status: 'delivered', delivered_at: '2026-11-01T00:00:00Z' }), '');
});

/* ---------------- payout rules (known issue 3 and friends) ---------------- */

const delivered = {
  id: 'b1',
  status: 'delivered',
  payment_status: 'held',
  delivered_at: new Date(NOW - 50 * HOUR).toISOString(),
  release_due_at: new Date(NOW - 2 * HOUR).toISOString(),
  stripe_livemode: true,
};

test('the window is 48 hours from final delivery', () => {
  assert.equal(releaseDueFrom('2026-11-01T10:00:00.000Z'), '2026-11-03T10:00:00.000Z');
});

test('a delivered booking releases only after the window, with nothing reported', () => {
  assert.equal(releaseBlocker(delivered, { nowMs: NOW }), '');
  assert.equal(releaseBlocker({ ...delivered, release_due_at: new Date(NOW + HOUR).toISOString() }, { nowMs: NOW }), 'not-due');
  assert.equal(releaseBlocker({ ...delivered, problem_reported_at: 'x' }, { nowMs: NOW }), 'problem-reported');
  assert.equal(releaseBlocker({ ...delivered, flagged_for_review: true }, { nowMs: NOW }), 'flagged');
  assert.equal(releaseBlocker({ ...delivered, status: 'confirmed', delivered_at: undefined }, { nowMs: NOW }), 'not-delivered');
});

test('the client confirming delivery releases early, but never past a flag', () => {
  const early = { ...delivered, release_due_at: new Date(NOW + 40 * HOUR).toISOString(), client_confirmed_delivery: true };
  assert.equal(releaseBlocker(early, { nowMs: NOW }), '');
  assert.equal(releaseBlocker({ ...early, flagged_for_review: true }, { nowMs: NOW }), 'flagged');
});

test('nothing is ever paid twice', () => {
  assert.equal(releaseBlocker({ ...delivered, stripe_transfer_id: 'tr_1' }, { nowMs: NOW, founder: true }), 'already-paid');
  assert.equal(releaseBlocker({ ...delivered, payment_status: 'released' }, { nowMs: NOW, founder: true }), 'already-paid');
  assert.equal(releaseBlocker({ ...delivered, payment_status: 'refunded' }, { nowMs: NOW, founder: true }), 'nothing-held');
});

test('a founder can release a flagged booking, but not through a card dispute', () => {
  assert.equal(releaseBlocker({ ...delivered, flagged_for_review: true, problem_reported_at: 'x' }, { nowMs: NOW, founder: true }), '');
  assert.equal(releaseBlocker({ ...delivered, dispute_status: 'needs_response' }, { nowMs: NOW, founder: true }), 'disputed');
  assert.equal(releaseBlocker({ ...delivered, dispute_status: 'lost' }, { nowMs: NOW, founder: true }), 'disputed');
  assert.equal(releaseBlocker({ ...delivered, dispute_status: 'won' }, { nowMs: NOW, founder: true }), '');
});

test('a cancelled booking only pays the creator when the cancellation left them a share', () => {
  const cancelled = { ...delivered, status: 'cancelled', delivered_at: undefined };
  assert.equal(releaseBlocker(cancelled, { nowMs: NOW }), 'nothing-owed');
  assert.equal(releaseBlocker({ ...cancelled, cancellation_payout_due: true }, { nowMs: NOW }), '');
  assert.equal(releaseBlocker({ ...cancelled, cancellation_payout_due: true, flagged_for_review: true }, { nowMs: NOW }), 'flagged');
});

test('a test-mode payment is never paid out with live money', () => {
  const old = { ...delivered, stripe_livemode: undefined, stripe_checkout_session_id: 'cs_test_abc' };
  assert.equal(isTestModePayment(old), true);
  assert.equal(releaseBlocker(old, { nowMs: NOW, liveMode: true }), 'test-payment');
  assert.equal(releaseBlocker(old, { nowMs: NOW, liveMode: false }), '');
  assert.equal(isTestModePayment({ stripe_checkout_session_id: 'cs_live_abc' }), false);
});

test('a real-money payment is left alone while the app runs in test mode', () => {
  const live = { ...delivered, stripe_livemode: undefined, stripe_checkout_session_id: 'cs_live_abc' };
  assert.equal(releaseBlocker(live, { nowMs: NOW, liveMode: false }), 'live-payment');
  assert.equal(releaseBlocker(live, { nowMs: NOW, liveMode: false, founder: true }), 'live-payment');
  assert.equal(releaseBlocker({ ...delivered, stripe_livemode: true }, { nowMs: NOW, liveMode: false }), 'live-payment');
  assert.equal(releaseBlocker(live, { nowMs: NOW, liveMode: true }), '');
  assert.equal(paidInOtherMode(live, false), true);
  assert.equal(paidInOtherMode(live, true), false);
  assert.equal(paidInOtherMode({ stripe_livemode: false }, false), false);
  assert.equal(paidInOtherMode({ stripe_livemode: false }, true), true);
});

/* ---------------- reporting a problem ---------------- */

test('a problem can be reported once, on a paid booking, after the shoot or the delivery', () => {
  assert.equal(reportBlocker(delivered, { shootPassed: true }), '');
  assert.equal(reportBlocker({ status: 'confirmed', payment_status: 'held' }, { shootPassed: true }), ''); // a no-show
  assert.notEqual(reportBlocker({ status: 'confirmed', payment_status: 'held' }, { shootPassed: false }), '');
  assert.notEqual(reportBlocker({ ...delivered, problem_reported_at: 'x' }, { shootPassed: true }), '');
  assert.notEqual(reportBlocker({ status: 'quoted', payment_status: 'pending' }, { shootPassed: true }), '');
});
