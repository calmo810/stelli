/**
 * Payments that are not a booking's payment ("stray" payments): each one is
 * its own record, keyed by its PaymentIntent, and is refunded on its own.
 *
 * The case that used to lose money: two stale Checkout pages on one booking
 * both get paid. Before, the booking kept one stray payment, so the second
 * overwrote the first and the first had no way back.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { CLIENT, CREATOR, FOUNDER, scenario } from './helpers/scenario.mjs';
import { founderQueue } from '../src/lib/founderQueue.js';

const refundStray = (w, strayId) =>
  w.call('releasePayout', { bookingId: 'b1', action: 'refund_stray', ...(strayId ? { strayId } : {}) }, FOUNDER);

const strays = (w) => w.entities.StrayPayment.filter({ booking_id: 'b1' }, 'received_at');

const chargeFor = (w, session) => {
  const intent = w.stripe.state.intents.get(session.payment_intent);
  return w.stripe.state.charges.get(intent.latest_charge);
};

/** Two Checkout pages left open on one booking, both now stale. */
async function twoStalePages(w) {
  await w.quoteAndAccept({ amount: 300 });
  const first = await w.checkout();
  // Stripe won't close the old page when the quote is replaced (it can happen).
  w.stripe.failNextPost(`checkout/sessions/${first.data.sessionId}/expire`, 'Stripe is having a moment', 500);
  await w.call('sendQuote', { bookingId: 'b1', amount: 200 }, CREATOR);
  const [second] = await w.entities.Quote.filter({ booking_id: 'b1', status: 'sent' });
  await w.call('acceptQuote', { quoteId: second.id }, CLIENT);
  const next = await w.checkout();
  w.stripe.failNextPost(`checkout/sessions/${next.data.sessionId}/expire`, 'Stripe is having a moment', 500);
  await w.call('sendQuote', { bookingId: 'b1', amount: 150 }, CREATOR);
  return [first.data.sessionId, next.data.sessionId];
}

test('two stale pages paid: two records, neither overwrites the other', async () => {
  const w = await scenario();
  const [a, b] = await twoStalePages(w);
  await w.pay(a);
  await w.pay(b);

  const rows = await strays(w);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map((row) => row.amount), [342, 228]);
  assert.notEqual(rows[0].payment_intent_id, rows[1].payment_intent_id);
  assert.ok(rows.every((row) => row.status === 'open' && row.payment_intent_id.startsWith('pi_')));

  const booking = await w.booking();
  assert.equal(booking.status, 'quoted', 'neither payment confirms the booking');
  assert.equal(booking.payment_status, 'pending');
  assert.equal(booking.stray_payment_count, 2);
  assert.equal(booking.stray_payment_amount, 570, 'the summary adds both up');
  assert.equal(booking.flagged_for_review, true);
  assert.equal(w.emailsTo(FOUNDER.email).filter((e) => /needs a look/.test(e.subject)).length, 2);
});

test('each one is refunded on its own, and the booking clears only when both are back', async () => {
  const w = await scenario();
  const [a, b] = await twoStalePages(w);
  await w.pay(a);
  await w.pay(b);
  const [first, second] = await strays(w);

  // Without saying which, nothing is refunded: two are open.
  const unsure = await refundStray(w);
  assert.equal(unsure.data.ok, false);
  assert.match(unsure.data.message, /more than one unmatched payment/);
  assert.equal(w.stripe.refunds.length, 0);

  const one = await refundStray(w, second.id);
  assert.equal(one.data.ok, true);
  assert.match(one.data.message, /\$228(\.00)? sent back/);
  assert.equal(chargeFor(w, w.stripe.sessions.get(b)).amount_refunded, 22800);
  assert.equal(chargeFor(w, w.stripe.sessions.get(a)).amount_refunded, 0, 'the other payment is untouched');

  let booking = await w.booking();
  assert.equal(booking.stray_payment_count, 1);
  assert.equal(booking.stray_payment_amount, 342);
  assert.equal(booking.stray_payment_intent_id, first.payment_intent_id);
  assert.equal(booking.flagged_for_review, true, 'still one to sort out');

  // A second press on the same one does nothing more.
  const again = await refundStray(w, second.id);
  assert.equal(again.data.ok, false);
  assert.match(again.data.message, /already sent back/);
  assert.equal(w.stripe.refunds.length, 1);

  // Now only one is open, so it can be refunded without naming it.
  assert.equal((await refundStray(w)).data.ok, true);
  assert.equal(chargeFor(w, w.stripe.sessions.get(a)).amount_refunded, 34200);
  assert.equal(w.stripe.refunds.length, 2);

  booking = await w.booking();
  assert.equal(booking.stray_payment_count, 0);
  assert.equal(booking.stray_payment_intent_id, '');
  assert.equal(booking.flagged_for_review, false);
  assert.deepEqual((await strays(w)).map((row) => row.status), ['refunded', 'refunded']);
  assert.equal(w.emailsTo(CLIENT.email).filter((e) => e.subject === 'Refund issued').length, 2);

  // And the client can pay the current quote.
  const [current] = await w.entities.Quote.filter({ booking_id: 'b1', status: 'sent' });
  await w.call('acceptQuote', { quoteId: current.id }, CLIENT);
  const checkout = await w.checkout();
  assert.equal(checkout.status, 200);
  await w.pay(checkout.data.sessionId);
  assert.equal((await w.booking()).payment_status, 'held');
});

test('the same Stripe event twice, even at the same moment, files one record and one email', async () => {
  const w = await scenario();
  const [a] = await twoStalePages(w);
  const session = w.stripe.pay(a);
  await Promise.all([
    w.webhook('checkout.session.completed', session),
    w.webhook('checkout.session.completed', session),
    w.webhook('checkout.session.completed', session),
  ]);
  await w.webhook('checkout.session.completed', session);
  assert.equal((await strays(w)).length, 1);
  assert.equal((await w.booking()).stray_payment_count, 1);
  assert.equal(w.emailsTo(FOUNDER.email).filter((e) => /needs a look/.test(e.subject)).length, 1);
});

test('a stale page paid after the booking is paid is filed apart; the booking stays confirmed', async () => {
  const w = await scenario();
  await w.quoteAndAccept({ amount: 300 });
  const stale = await w.checkout();
  w.stripe.failNextPost(`checkout/sessions/${stale.data.sessionId}/expire`, 'nope', 500);
  await w.call('sendQuote', { bookingId: 'b1', amount: 200 }, CREATOR);
  const [current] = await w.entities.Quote.filter({ booking_id: 'b1', status: 'sent' });
  await w.call('acceptQuote', { quoteId: current.id }, CLIENT);
  const good = await w.checkout();
  await w.pay(good.data.sessionId);
  await w.pay(stale.data.sessionId);

  const booking = await w.booking();
  assert.equal(booking.status, 'confirmed');
  assert.equal(booking.payment_status, 'held');
  assert.equal(booking.amount_charged, 228);
  assert.equal(booking.stray_payment_count, 1);
  assert.equal((await refundStray(w)).data.ok, true);
  assert.equal(chargeFor(w, w.stripe.sessions.get(good.data.sessionId)).amount_refunded, 0, 'the real payment is untouched');
  assert.equal((await w.booking()).payment_status, 'held');
});

test('a refund made by hand in Stripe closes only that payment', async () => {
  const w = await scenario();
  const [a, b] = await twoStalePages(w);
  await w.pay(a);
  await w.pay(b);
  const charge = chargeFor(w, w.stripe.sessions.get(a));
  charge.amount_refunded = charge.amount;
  charge.refunded = true;
  await w.webhook('charge.refunded', charge);

  const [first, second] = await strays(w);
  assert.equal(first.status, 'refunded');
  assert.equal(second.status, 'open');
  const booking = await w.booking();
  assert.equal(booking.stray_payment_count, 1);
  assert.equal(booking.stray_payment_amount, 228);
  assert.equal(booking.flagged_for_review, true);
});

test('Stripe refusing one refund leaves it open for a retry; the other still goes through', async () => {
  const w = await scenario();
  const [a, b] = await twoStalePages(w);
  await w.pay(a);
  await w.pay(b);
  const [first, second] = await strays(w);

  w.stripe.failNextPost('refunds', 'Your balance is too low for this refund', 400);
  const failed = await refundStray(w, first.id);
  assert.equal(failed.data.ok, false);
  assert.match(failed.data.message, /Stripe refused the refund/);
  assert.equal((await w.entities.StrayPayment.get(first.id)).status, 'refund_failed');

  assert.equal((await refundStray(w, second.id)).data.ok, true);
  assert.equal((await refundStray(w, first.id)).data.ok, true, 'the retry works');
  assert.equal((await w.booking()).stray_payment_count, 0);
});

test('a card dispute on an unmatched payment blocks its refund until the dispute closes', async () => {
  const w = await scenario();
  const [a] = await twoStalePages(w);
  await w.pay(a);
  const [stray] = await strays(w);
  const dispute = { id: 'dp_s', payment_intent: stray.payment_intent_id, status: 'needs_response', amount: 34200 };

  await w.webhook('charge.dispute.created', dispute);
  assert.equal((await w.entities.StrayPayment.get(stray.id)).status, 'disputed');
  assert.equal((await w.booking()).stray_payment_count, 1, 'still open: it needs an answer in Stripe');
  const refused = await refundStray(w, stray.id);
  assert.equal(refused.data.ok, false);
  assert.match(refused.data.message, /dispute/);
  assert.equal(w.stripe.refunds.length, 0, 'a refund would pay the client twice');

  await w.webhook('charge.dispute.closed', { ...dispute, status: 'won' });
  assert.equal((await w.entities.StrayPayment.get(stray.id)).status, 'open');
  assert.equal((await refundStray(w, stray.id)).data.ok, true);
});

test('a lost dispute on an unmatched payment closes it: the bank already sent the money back', async () => {
  const w = await scenario();
  const [a] = await twoStalePages(w);
  await w.pay(a);
  const [stray] = await strays(w);
  const dispute = { id: 'dp_l', payment_intent: stray.payment_intent_id, status: 'needs_response', amount: 34200 };
  await w.webhook('charge.dispute.created', dispute);
  await w.webhook('charge.dispute.closed', { ...dispute, status: 'lost' });
  assert.equal((await w.entities.StrayPayment.get(stray.id)).status, 'dispute_lost');
  const booking = await w.booking();
  assert.equal(booking.stray_payment_count, 0);
  assert.equal(booking.flagged_for_review, false);
});

test('the queue shows each unmatched payment with its own refund button', async () => {
  const w = await scenario();
  const [a, b] = await twoStalePages(w);
  await w.pay(a);
  await w.pay(b);
  const rows = await strays(w);
  const [item] = founderQueue([await w.booking()], Date.now(), rows);
  assert.equal(item.kind, 'stray_payment');
  assert.match(item.headline, /2 payments \(\$570\.00 in all\)/);
  assert.equal(item.actions.length, 2);
  assert.deepEqual(item.actions.map((action) => action.strayId), rows.map((row) => row.id));
  assert.match(item.actions[0].label, /Send \$342\.00 back to Jordan \(paid /);
  assert.match(item.actions[1].confirm, /Only this payment is refunded/);

  // Once one is back, only the other keeps a button.
  await refundStray(w, rows[0].id);
  const [after] = founderQueue([await w.booking()], Date.now(), await strays(w));
  assert.equal(after.actions.length, 1);
  assert.equal(after.actions[0].strayId, rows[1].id);
});

test('a founder can\'t mark a booking reviewed while an unmatched payment is open', async () => {
  const w = await scenario();
  const [a] = await twoStalePages(w);
  await w.pay(a);
  const res = await w.call('releasePayout', { bookingId: 'b1', action: 'mark_reviewed' }, FOUNDER);
  assert.equal(res.data.ok, false);
  assert.equal((await w.booking()).flagged_for_review, true);
});

test('only founders can refund an unmatched payment or read the records', async () => {
  const w = await scenario();
  const [a] = await twoStalePages(w);
  await w.pay(a);
  const [stray] = await strays(w);
  for (const user of [CLIENT, CREATOR]) {
    const res = await w.call('releasePayout', { bookingId: 'b1', action: 'refund_stray', strayId: stray.id }, user);
    assert.equal(res.status, 403);
  }
  assert.equal(w.stripe.refunds.length, 0);
});

test('a stray payment filed on the booking by an earlier version still gets its refund', async () => {
  const w = await scenario();
  const [a] = await twoStalePages(w);
  const session = w.stripe.pay(a);
  // As the earlier version left it: only the booking's own fields, no record.
  await w.entities.Booking.update('b1', {
    stray_payment_intent_id: session.payment_intent,
    stray_payment_amount: 342,
    stray_payment_reason: 'quote-replaced',
    flagged_for_review: true,
  });
  assert.equal((await refundStray(w)).data.ok, true);
  assert.equal(chargeFor(w, session).amount_refunded, 34200);
  assert.equal((await strays(w))[0].status, 'refunded');
  assert.equal((await w.booking()).flagged_for_review, false);
});
