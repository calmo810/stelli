/**
 * Money going back: refunds, pulling a payout back from a creator,
 * cancellations and card disputes — run through the real backend functions
 * against the fake database and fake Stripe.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { CLIENT, CREATOR, FOUNDER, STRANGER, scenario } from './helpers/scenario.mjs';
import { shootStart } from '../base44/shared/shootTime.ts';

const HOUR = 3_600_000;

/** A date string and time `hours` from now, in New York terms. */
function shootIn(hours) {
  const at = new Date(Date.now() + hours * HOUR);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(at);
  const get = (type) => parts.find((p) => p.type === type).value;
  const eventDate = `${get('year')}-${get('month')}-${get('day')}`;
  const eventTime = `${get('hour')}:${get('minute')}`;
  // Sanity: the helper and the server agree on when this is.
  assert.ok(Math.abs(shootStart(eventDate, eventTime).ms - at.getTime()) < 60_000);
  return { eventDate, eventTime };
}

async function paidOut(w) {
  await w.deliveredAndDue({ amount: 100 });
  await w.call('releasePayouts', {}, FOUNDER);
  assert.equal((await w.booking()).payment_status, 'released');
}

const refund = (w, extra = {}) =>
  w.call('releasePayout', { bookingId: 'b1', action: 'refund', actionId: 'click-1', ...extra }, FOUNDER);

/* ------------------------------------------------------------------ */
/* Known issue 4: refund vs. pull-back                                  */
/* ------------------------------------------------------------------ */

test('K4: a refund before payout sends everything back and nothing to the creator', async () => {
  const w = await scenario();
  await w.deliveredAndDue({ amount: 100 });
  await w.call('reportBookingProblem', { bookingId: 'b1', note: 'No photos.' }, CLIENT);

  const res = await refund(w);
  assert.equal(res.data.ok, true);
  const booking = await w.booking();
  assert.equal(booking.payment_status, 'refunded');
  assert.equal(booking.refund_amount, 114);
  assert.equal(booking.status, 'cancelled');
  assert.equal(booking.flagged_for_review, false);
  assert.equal(w.stripe.refunds.length, 1);
  assert.equal(w.stripe.transfers.size, 0);

  // And the sweep can never pay it afterwards.
  await w.call('releasePayouts', {}, FOUNDER);
  assert.equal(w.stripe.transfers.size, 0);
});

test('K4: a double click on refund refunds once', async () => {
  const w = await scenario();
  await w.deliveredAndDue({ amount: 100 });
  const [a, b] = await Promise.all([refund(w, { amount: 50 }), refund(w, { amount: 50 })]);
  await refund(w, { amount: 50 }); // and a third, same confirmation
  assert.equal(w.stripe.refunds.length, 1, 'one refund at Stripe');
  assert.equal((await w.booking()).refund_amount, 50);
  assert.ok(a.status === 200 && b.status === 200);
});

test('K4: a second, deliberate refund is still possible after a partial one', async () => {
  const w = await scenario();
  await w.deliveredAndDue({ amount: 100 });
  await refund(w, { amount: 57, actionId: 'first' });
  let booking = await w.booking();
  assert.equal(booking.payment_status, 'partially_refunded');
  assert.equal(booking.status, 'delivered', 'a partial refund does not cancel the booking');
  assert.equal(booking.creator_payout, 43, 'the creator is owed half after the client got half back');

  await refund(w, { actionId: 'second' }); // everything that is left
  booking = await w.booking();
  assert.equal(booking.payment_status, 'refunded');
  assert.equal(booking.refund_amount, 114);
  assert.equal(w.stripe.refunds.reduce((sum, r) => sum + r.amount, 0), 11400);
});

test('K4: refund after payout pulls the creator\'s share back', async () => {
  const w = await scenario();
  await paidOut(w);
  const res = await refund(w);
  assert.equal(res.data.ok, true);
  const booking = await w.booking();
  assert.equal(booking.payment_status, 'refunded');
  assert.equal(booking.reversal_status, 'done');
  assert.equal(booking.reversal_amount_done, 86);
  assert.equal(w.stripe.reversals[0].amount, 8600);
});

test('K4: when the pull-back fails the refund is still recorded, the booking is flagged, and retry works', async () => {
  const w = await scenario();
  await paidOut(w);
  const transferId = (await w.booking()).stripe_transfer_id;

  // The creator has already withdrawn the money.
  w.stripe.failNextPost(`transfers/${transferId}/reversals`, 'Insufficient funds in the connected account.');
  const first = await refund(w);
  assert.match(first.data.message, /could not be pulled back/);

  let booking = await w.booking();
  assert.equal(booking.payment_status, 'refunded', 'the refund itself is on record');
  assert.equal(booking.refund_amount, 114);
  assert.equal(booking.reversal_status, 'failed', 'and so is the unfinished pull-back');
  assert.equal(booking.reversal_amount_due, 86);
  assert.equal(booking.flagged_for_review, true);
  assert.match(booking.flag_reason, /could not be pulled back/);
  assert.equal(w.emailsTo(FOUNDER.email).filter((e) => /pulled back/.test(e.subject)).length, 1);

  // Stripe's webhook saying "refunded" must not hide the open pull-back.
  await w.webhook('charge.refunded', [...w.stripe.charges.values()][0]);
  booking = await w.booking();
  assert.equal(booking.reversal_status, 'failed');
  assert.equal(booking.flagged_for_review, true);

  // Mark-reviewed is refused while money is still owed back.
  const reviewed = await w.call('releasePayout', { bookingId: 'b1', action: 'mark_reviewed' }, FOUNDER);
  assert.equal(reviewed.data.ok, false);

  // The founder retries once the creator's balance is back.
  const retry = await w.call('releasePayout', { bookingId: 'b1', action: 'retry_reversal' }, FOUNDER);
  assert.equal(retry.data.ok, true);
  booking = await w.booking();
  assert.equal(booking.reversal_status, 'done');
  assert.equal(booking.reversal_amount_done, 86);
  assert.equal(booking.flagged_for_review, false);
  assert.equal(w.stripe.refunds.length, 1, 'retrying never refunds the client again');
  assert.equal([...w.stripe.transfers.values()][0].amount_reversed, 8600);

  // Retrying again does nothing more.
  await w.call('releasePayout', { bookingId: 'b1', action: 'retry_reversal' }, FOUNDER);
  assert.equal([...w.stripe.transfers.values()][0].amount_reversed, 8600);
});

test('K4: a refund made in the Stripe dashboard after payout is noticed', async () => {
  const w = await scenario();
  await paidOut(w);
  const charge = [...w.stripe.charges.values()][0];
  charge.amount_refunded = charge.amount; // a founder refunded it in Stripe
  charge.refunded = true;
  await w.webhook('charge.refunded', charge);

  const booking = await w.booking();
  assert.equal(booking.payment_status, 'refunded');
  assert.equal(booking.reversal_status, 'needed');
  assert.equal(booking.reversal_amount_due, 86);
  assert.equal(booking.flagged_for_review, true);

  const pull = await w.call('releasePayout', { bookingId: 'b1', action: 'pull_back' }, FOUNDER);
  assert.equal(pull.data.ok, true);
  assert.equal((await w.booking()).reversal_status, 'done');
});

test('C-3: "refund" on a booking that can\'t be refunded says so and changes nothing', async () => {
  const w = await scenario();
  await w.quoteAndAccept({ amount: 100 }); // accepted, never paid
  const res = await refund(w);
  assert.equal(res.data.ok, false);
  const booking = await w.booking();
  assert.equal(booking.status, 'quote_accepted', 'not silently cancelled');
  assert.equal(booking.cancelled_by, undefined);
});

test('a refund and the sweep at the same moment never both move the money', async () => {
  for (let delay = 0; delay <= 20; delay += 2) {
    const w = await scenario();
    await w.deliveredAndDue({ amount: 100 });
    const { releaseBooking } = await import('../base44/shared/payouts.ts');
    const { refundBooking } = await import('../base44/shared/refunds.ts');
    const late = (async () => {
      for (let i = 0; i < delay; i += 1) await new Promise((r) => setImmediate(r));
      return refundBooking(w.db, 'b1', 0, 'Refunded by a founder.');
    })();
    await Promise.all([releaseBooking(w.db, 'b1', 'auto'), late]);

    const booking = await w.booking();
    const transfer = [...w.stripe.transfers.values()][0];
    assert.equal(booking.payment_status, 'refunded', `delay ${delay}`);
    // Either the creator was never paid, or was paid and then fully pulled back.
    if (transfer) assert.equal(transfer.amount_reversed, transfer.amount, `delay ${delay}`);
    assert.equal(w.stripe.refunds.reduce((s, r) => s + r.amount, 0), 11400);
    assert.equal(booking.payout_lock, '');
  }
});

/* ------------------------------------------------------------------ */
/* Stray payments (the other half of known issue 2)                     */
/* ------------------------------------------------------------------ */

test('a stray payment can be sent back without touching the booking', async () => {
  const w = await scenario();
  await w.quoteAndAccept({ amount: 300 });
  const old = await w.checkout();
  w.stripe.failNextPost(`checkout/sessions/${old.data.sessionId}/expire`, 'nope', 500);
  await w.call('sendQuote', { bookingId: 'b1', amount: 200 }, CREATOR);
  await w.pay(old.data.sessionId);
  assert.ok((await w.booking()).stray_payment_intent_id);

  const res = await w.call('releasePayout', { bookingId: 'b1', action: 'refund_stray' }, FOUNDER);
  assert.equal(res.data.ok, true);
  await w.call('releasePayout', { bookingId: 'b1', action: 'refund_stray' }, FOUNDER); // second click
  const booking = await w.booking();
  assert.equal(booking.stray_payment_intent_id, '');
  assert.equal(booking.flagged_for_review, false);
  assert.equal(booking.status, 'quoted', 'the booking is still open for the right quote');
  assert.equal(w.stripe.refunds.length, 1);
  assert.equal(w.stripe.refunds[0].amount, 34200);

  // The client can now accept and pay the current quote.
  const [current] = await w.entities.Quote.filter({ booking_id: 'b1', status: 'sent' });
  await w.call('acceptQuote', { quoteId: current.id }, CLIENT);
  const checkout = await w.checkout();
  assert.equal(checkout.status, 200);
  await w.pay(checkout.data.sessionId);
  assert.equal((await w.booking()).payment_status, 'held');
  assert.equal((await w.booking()).amount_charged, 228);
});

/* ------------------------------------------------------------------ */
/* Cancellations                                                        */
/* ------------------------------------------------------------------ */

const cancel = (w, user, reason = '') => w.call('cancelBooking', { bookingId: 'b1', reason }, user);

test('client cancels 4 days ahead: refunded in full, creator gets nothing', async () => {
  const w = await scenario(shootIn(100));
  await w.paid({ amount: 100 });
  const res = await cancel(w, CLIENT, 'Plans changed');
  assert.equal(res.status, 200);
  assert.equal(res.data.tier, 'full');
  const booking = await w.booking();
  assert.equal(booking.status, 'cancelled');
  assert.equal(booking.cancelled_by, 'client');
  assert.equal(booking.payment_status, 'refunded');
  assert.equal(booking.flagged_for_review, false);
  assert.equal(w.stripe.refunds[0].amount, 11400);
  assert.equal(w.stripe.transfers.size, 0);
});

test('client cancels 60 hours ahead: half back, creator is paid half their payout', async () => {
  const w = await scenario(shootIn(60));
  await w.paid({ amount: 100 });
  const res = await cancel(w, CLIENT);
  assert.equal(res.data.tier, 'half');
  const booking = await w.booking();
  assert.equal(w.stripe.refunds[0].amount, 5700);
  assert.equal([...w.stripe.transfers.values()][0].amount, 4300);
  assert.equal(booking.payment_status, 'released');
  assert.equal(booking.status, 'cancelled', 'the payout does not reopen a cancelled booking');
  assert.equal(booking.refund_amount, 57);
});

test('client cancels 20 hours ahead: no refund, creator is paid in full', async () => {
  const w = await scenario(shootIn(20));
  await w.paid({ amount: 100 });
  const res = await cancel(w, CLIENT);
  assert.equal(res.data.tier, 'none');
  assert.equal(w.stripe.refunds.length, 0);
  assert.equal([...w.stripe.transfers.values()][0].amount, 8600);
});

test('creator cancels: full refund, in the founder queue, founders told — not hidden automatically', async () => {
  const w = await scenario(shootIn(20));
  await w.paid({ amount: 100 });
  const res = await cancel(w, CREATOR);
  assert.equal(res.data.tier, 'creator');
  const booking = await w.booking();
  assert.equal(booking.payment_status, 'refunded');
  assert.equal(booking.cancelled_by, 'creator');
  assert.equal(booking.flagged_for_review, true);
  assert.notEqual((await w.entities.Lensman.get('l1')).under_review, true, 'hiding them is the founder\'s call');
  assert.equal(w.stripe.transfers.size, 0);
  assert.ok(w.emailsTo(FOUNDER.email).some((e) => /creator cancelled/.test(e.subject)));

  // Nothing left to decide: the founder can clear it from the queue.
  const reviewed = await w.call('releasePayout', { bookingId: 'b1', action: 'mark_reviewed' }, FOUNDER);
  assert.equal(reviewed.data.ok, true);
});

test('C-1: after a no-show, "cancel" does not pay the creator — the client reports it instead', async () => {
  const w = await scenario(shootIn(-20)); // the shoot was yesterday; nothing delivered
  await w.entities.Booking.update('b1', { event_date: shootIn(100).eventDate });
  await w.paid({ amount: 100 });
  await w.entities.Booking.update('b1', shootInFields(-20));

  const res = await cancel(w, CLIENT);
  assert.equal(res.status, 409);
  assert.match(res.data.error, /report a problem/);
  assert.equal(w.stripe.transfers.size, 0, 'the creator is not paid');
  assert.equal((await w.booking()).status, 'confirmed');

  const report = await w.call('reportBookingProblem', { bookingId: 'b1', note: 'They never showed up.' }, CLIENT);
  assert.equal(report.status, 200);
  assert.equal((await w.booking()).flagged_for_review, true);
  await w.call('releasePayouts', {}, FOUNDER);
  assert.equal(w.stripe.transfers.size, 0);
});

function shootInFields(hours) {
  const { eventDate, eventTime } = shootIn(hours);
  return { event_date: eventDate, event_time: eventTime };
}

test('C-1: cancelling can\'t wipe a dispute or a problem report and trigger a payout', async () => {
  const w = await scenario(shootIn(20));
  await w.paid({ amount: 100 });
  const charge = [...w.stripe.charges.values()][0];
  await w.webhook('charge.dispute.created', { id: 'dp_1', payment_intent: charge.payment_intent, status: 'needs_response', amount: 11400 });
  assert.equal((await w.booking()).flagged_for_review, true);

  const res = await cancel(w, CLIENT);
  assert.equal(res.status, 409);
  const booking = await w.booking();
  assert.equal(booking.flagged_for_review, true, 'the freeze is still on');
  assert.equal(booking.status, 'confirmed');
  assert.equal(w.stripe.transfers.size, 0);
});

test('a failed cancellation refund leaves the booking flagged, and the creator unpaid', async () => {
  const w = await scenario(shootIn(60));
  await w.paid({ amount: 100 });
  w.stripe.failNextPost('refunds', 'Your balance is too low to refund this charge.');
  const res = await cancel(w, CLIENT);
  assert.equal(res.status, 200, 'the cancellation itself takes effect');
  let booking = await w.booking();
  assert.equal(booking.status, 'cancelled');
  assert.equal(booking.flagged_for_review, true);
  assert.match(booking.flag_reason, /did not go through/);
  assert.equal(w.stripe.transfers.size, 0, 'creator share waits until the client has their refund');
  await w.call('releasePayouts', {}, FOUNDER);
  assert.equal(w.stripe.transfers.size, 0);

  // The founder finishes it: refund the half, then the creator's half goes out.
  await w.call('releasePayout', { bookingId: 'b1', action: 'refund', amount: 57, actionId: 'fix' }, FOUNDER);
  booking = await w.booking();
  assert.equal(booking.refund_amount, 57);
  assert.equal(booking.flagged_for_review, false);
  await w.call('releasePayouts', {}, FOUNDER);
  assert.equal([...w.stripe.transfers.values()][0].amount, 4300);
});

test('an unpaid booking cancels with nothing moving; strangers can\'t cancel', async () => {
  const w = await scenario(shootIn(100));
  await w.quoteAndAccept({ amount: 100 });
  assert.equal((await cancel(w, STRANGER)).status, 403);
  const res = await cancel(w, CLIENT);
  assert.equal(res.data.tier, 'unpaid');
  assert.equal(w.stripe.refunds.length, 0);
  assert.equal((await cancel(w, CLIENT)).status, 409, 'already cancelled');

  // And a quote can't bring it back.
  assert.equal((await w.call('sendQuote', { bookingId: 'b1', amount: 50 }, CREATOR)).status, 409);
});

test('two cancels at once (client and creator) settle the money once', async () => {
  const w = await scenario(shootIn(100));
  await w.paid({ amount: 100 });
  const handler = (await import('../base44/functions/cancelBooking/entry.ts')).default;
  const request = () =>
    new Request('https://stelli.test/fn', { method: 'POST', body: JSON.stringify({ bookingId: 'b1' }) });
  w.db.currentUser = CLIENT;
  await Promise.all([handler(request()), handler(request())]);
  assert.equal(w.stripe.refunds.reduce((s, r) => s + r.amount, 0), 11400);
  assert.equal(w.stripe.transfers.size, 0);
});

/* ------------------------------------------------------------------ */
/* Card disputes                                                        */
/* ------------------------------------------------------------------ */

async function openDispute(w) {
  const charge = [...w.stripe.charges.values()][0];
  const dispute = { id: 'dp_1', payment_intent: charge.payment_intent, status: 'needs_response', amount: charge.amount };
  await w.webhook('charge.dispute.created', dispute);
  return dispute;
}

test('a dispute freezes the payout — for the sweep, and for a founder', async () => {
  const w = await scenario();
  await w.deliveredAndDue({ amount: 100 });
  await openDispute(w);
  await w.call('releasePayouts', {}, FOUNDER);
  const forced = await w.call('releasePayout', { bookingId: 'b1', action: 'release' }, FOUNDER);
  assert.equal(forced.data.ok, false);
  assert.match(forced.data.message, /dispute/);
  assert.equal(w.stripe.transfers.size, 0);
  // Refunding on top of a dispute would pay the client twice.
  assert.equal((await refund(w)).data.ok, false);
  assert.equal(w.stripe.refunds.length, 0);
});

test('a dispute that is won lifts the freeze and the booking pays out as normal', async () => {
  const w = await scenario();
  await w.deliveredAndDue({ amount: 100 });
  const dispute = await openDispute(w);
  await w.webhook('charge.dispute.closed', { ...dispute, status: 'won' });
  const booking = await w.booking();
  assert.equal(booking.dispute_status, 'won');
  assert.equal(booking.flagged_for_review, false);
  await w.call('releasePayouts', {}, FOUNDER);
  assert.equal(w.stripe.transfers.size, 1);
});

test('a dispute that is lost before payout: nothing is ever paid to the creator', async () => {
  const w = await scenario();
  await w.deliveredAndDue({ amount: 100 });
  const dispute = await openDispute(w);
  await w.webhook('charge.dispute.closed', { ...dispute, status: 'lost' });
  const booking = await w.booking();
  assert.equal(booking.payment_status, 'refunded');
  assert.equal(booking.dispute_status, 'lost');
  await w.call('releasePayouts', {}, FOUNDER);
  assert.equal((await w.call('releasePayout', { bookingId: 'b1', action: 'release' }, FOUNDER)).data.ok, false);
  assert.equal(w.stripe.transfers.size, 0);
});

test('a dispute lost after payout pulls the creator\'s payout back', async () => {
  const w = await scenario();
  await paidOut(w);
  const dispute = await openDispute(w);
  assert.match((await w.booking()).flag_reason, /after the creator was paid/);
  await w.webhook('charge.dispute.closed', { ...dispute, status: 'lost' });
  const booking = await w.booking();
  assert.equal(booking.reversal_status, 'done');
  assert.equal([...w.stripe.transfers.values()][0].amount_reversed, 8600);
});

test('during a dispute a founder can pull a paid-out creator back by hand', async () => {
  const w = await scenario();
  await paidOut(w);
  await openDispute(w);
  const pull = await w.call('releasePayout', { bookingId: 'b1', action: 'pull_back' }, FOUNDER);
  assert.equal(pull.data.ok, true);
  assert.equal([...w.stripe.transfers.values()][0].amount_reversed, 8600);
});

test('only a founder can refund, pull back or mark reviewed', async () => {
  const w = await scenario();
  await w.deliveredAndDue({ amount: 100 });
  for (const action of ['refund', 'pull_back', 'refund_stray', 'mark_reviewed']) {
    for (const user of [CLIENT, CREATOR, STRANGER]) {
      assert.equal((await w.call('releasePayout', { bookingId: 'b1', action }, user)).status, 403);
    }
  }
  assert.equal(w.stripe.refunds.length, 0);
});

test('the cancel button can ask what would happen first, and nothing moves', async () => {
  const w = await scenario(shootIn(60));
  await w.paid({ amount: 100 });
  const preview = await w.call('cancelBooking', { bookingId: 'b1', preview: true }, CLIENT);
  assert.equal(preview.data.allowed, true);
  assert.equal(preview.data.tier, 'half');
  assert.equal(preview.data.refundAmount, 57);
  assert.match(preview.data.message, /\$57 back and Maya keeps half\. This can’t be undone\./);
  assert.equal((await w.booking()).status, 'confirmed');
  assert.equal(w.stripe.refunds.length, 0);

  const creator = await w.call('cancelBooking', { bookingId: 'b1', preview: true }, CREATOR);
  assert.match(creator.data.message, /Jordan gets \$114 back in full/);
  assert.equal((await w.call('cancelBooking', { bookingId: 'b1', preview: true }, STRANGER)).status, 403);
});
