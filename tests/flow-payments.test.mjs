/**
 * The booking's money path, run through the real backend functions against a
 * fake database and a fake Stripe (tests/helpers). These are the scenarios the
 * review found broken; each test is the "how it happens" from REVIEW.md.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { CLIENT, CREATOR, FOUNDER, STRANGER, scenario } from './helpers/scenario.mjs';

/* ------------------------------------------------------------------ */
/* Known issue 1: add-ons in the payout math                            */
/* ------------------------------------------------------------------ */

test('K1: a $100 quote with a $50 add-on charges $171 and owes the creator $129', async () => {
  const w = await scenario();
  await w.quoteAndAccept({ amount: 100, addOns: [{ name: 'Rush delivery', price: 50 }], pick: ['Rush delivery'] });

  const checkout = await w.checkout();
  assert.equal(checkout.status, 200);
  assert.equal(checkout.data.total, 171);
  assert.equal(w.stripe.sessions.get(checkout.data.sessionId).amount_subtotal, 17100);

  await w.pay(checkout.data.sessionId);
  const booking = await w.booking();
  assert.equal(booking.status, 'confirmed');
  assert.equal(booking.payment_status, 'held');
  assert.equal(booking.total_price, 150);
  assert.equal(booking.fee_amount, 21);
  assert.equal(booking.creator_payout, 129);
  assert.equal(booking.amount_charged, 171);
  assert.equal(booking.flagged_for_review, undefined);
});

test('K1: the browser can\'t pick an add-on that was not offered, or its own price', async () => {
  const w = await scenario();
  const sent = await w.call('sendQuote', { bookingId: 'b1', amount: 100, addOns: [{ name: 'Rush', price: 50 }] }, CREATOR);
  await w.call(
    'acceptQuote',
    { quoteId: sent.data.quote.id, pickedAddOns: [{ name: 'Rush', price: 0.01 }, { name: 'Free prints', price: -90 }] },
    CLIENT
  );
  const booking = await w.booking();
  assert.deepEqual(booking.picked_add_ons, [{ name: 'Rush', price: 50 }]);
  assert.equal(booking.total_price, 150);
});

test('quotes with bad prices are refused before anything is stored', async () => {
  const w = await scenario();
  for (const amount of [0, -50, 'lots', 0.5, 100.555, 99999999]) {
    const res = await w.call('sendQuote', { bookingId: 'b1', amount }, CREATOR);
    assert.equal(res.status, 400, `amount ${amount}`);
  }
  const bad = await w.call('sendQuote', { bookingId: 'b1', amount: 100, addOns: [{ name: 'Discount', price: -40 }] }, CREATOR);
  assert.equal(bad.status, 400);
  assert.equal((await w.entities.Quote.list()).length, 0);
});

/* ------------------------------------------------------------------ */
/* Known issue 2: an old checkout becoming the payment                  */
/* ------------------------------------------------------------------ */

test('K2: paying an old checkout after the quote was replaced does not confirm the booking', async () => {
  const w = await scenario();
  const oldQuote = await w.quoteAndAccept({ amount: 300 });
  const oldCheckout = await w.checkout();

  // The creator replaces the quote; Stripe refuses to expire the old page.
  w.stripe.failNextPost(`checkout/sessions/${oldCheckout.data.sessionId}/expire`, 'Stripe is having a moment', 500);
  const replaced = await w.call('sendQuote', { bookingId: 'b1', amount: 200 }, CREATOR);
  assert.equal(replaced.status, 200);

  // The client still has the old tab open, and pays it.
  await w.pay(oldCheckout.data.sessionId);

  const booking = await w.booking();
  assert.equal(booking.status, 'quoted', 'booking must not be confirmed');
  assert.equal(booking.payment_status, 'pending');
  assert.equal(booking.flagged_for_review, true);
  assert.equal(booking.stray_payment_amount, 342);
  assert.match(booking.stray_payment_reason, /quote-replaced/);
  assert.equal((await w.entities.Quote.get(oldQuote.id)).status, 'superseded', 'old quote stays retired');
  assert.equal((await w.entities.Quote.get(replaced.data.quote.id)).status, 'sent');
  assert.equal(w.emailsTo(FOUNDER.email).length, 1, 'founders are told');

  // And the client can't pay again on top until a founder has sorted it out.
  await w.call('acceptQuote', { quoteId: replaced.data.quote.id }, CLIENT);
  assert.equal((await w.checkout()).status, 409);
});

test('K2: replacing a quote closes the old checkout page when Stripe allows it', async () => {
  const w = await scenario();
  await w.quoteAndAccept({ amount: 300 });
  const oldCheckout = await w.checkout();
  await w.call('sendQuote', { bookingId: 'b1', amount: 200 }, CREATOR);
  assert.equal(w.stripe.sessions.get(oldCheckout.data.sessionId).status, 'expired');
});

test('K2: a creator can\'t requote once the client has finished paying', async () => {
  const w = await scenario();
  await w.quoteAndAccept({ amount: 300 });
  const checkout = await w.checkout();
  w.stripe.pay(checkout.data.sessionId); // paid at Stripe; the webhook has not arrived yet
  const requote = await w.call('sendQuote', { bookingId: 'b1', amount: 500 }, CREATOR);
  assert.equal(requote.status, 409);
  assert.equal((await w.booking()).quote_id !== '', true, 'accepted quote left alone');
});

test('K2: a double click on pay gets one checkout session, not two', async () => {
  const w = await scenario();
  await w.quoteAndAccept({ amount: 100 });
  const [a, b] = await Promise.all([w.checkout(), w.checkout()]);
  const c = await w.checkout();
  assert.equal(a.data.sessionId, b.data.sessionId);
  assert.equal(a.data.sessionId, c.data.sessionId);
  assert.equal(w.stripe.sessions.size, 1);
});

test('K2: no checkout for a cancelled booking, a paid one, or someone else\'s', async () => {
  const w = await scenario();
  await w.quoteAndAccept({ amount: 100 });
  assert.equal((await w.checkout(STRANGER)).status, 403);
  assert.equal((await w.checkout(CREATOR)).status, 403);

  await w.entities.Booking.update('b1', { status: 'cancelled' });
  assert.equal((await w.checkout()).status, 409);

  await w.entities.Booking.update('b1', { status: 'confirmed', payment_status: 'held' });
  assert.equal((await w.checkout()).status, 409);
});

test('K2: the same payment event delivered twice is recorded once', async () => {
  const w = await scenario();
  const session = await w.paid({ amount: 100 });
  const emailsBefore = w.db.emails.length;
  const again = await w.webhook('checkout.session.completed', session);
  assert.equal(again.status, 200);
  assert.equal(w.db.emails.length, emailsBefore, 'no second round of emails');
  assert.equal((await w.booking()).payment_status, 'held');
});

test('a late "bank payment failed" event can\'t reopen a booking that has been paid', async () => {
  const w = await scenario();
  const session = await w.paid({ amount: 100 });
  await w.webhook('checkout.session.async_payment_failed', session);
  await w.webhook('checkout.session.completed', { ...session, payment_status: 'unpaid' });
  const booking = await w.booking();
  assert.equal(booking.payment_status, 'held');
  assert.equal(booking.status, 'confirmed');
});

test('a bank payment goes processing, then held when it clears; or back to pending when it fails', async () => {
  const w = await scenario();
  await w.quoteAndAccept({ amount: 100 });
  const checkout = await w.checkout();

  await w.webhook('checkout.session.completed', w.stripe.payByBank(checkout.data.sessionId));
  assert.equal((await w.booking()).payment_status, 'processing');
  assert.equal((await w.booking()).status, 'quote_accepted', 'not confirmed until the money clears');
  assert.equal((await w.checkout()).status, 409, 'no second payment while the first is clearing');

  await w.webhook('checkout.session.async_payment_succeeded', w.stripe.bankClears(checkout.data.sessionId));
  assert.equal((await w.booking()).payment_status, 'held');
  assert.equal((await w.booking()).status, 'confirmed');

  // Separate booking: the bank payment fails, and the client can pay again.
  const w2 = await scenario();
  await w2.quoteAndAccept({ amount: 100 });
  const first = await w2.checkout();
  await w2.webhook('checkout.session.completed', w2.stripe.payByBank(first.data.sessionId));
  await w2.webhook('checkout.session.async_payment_failed', w2.stripe.bankFails(first.data.sessionId));
  assert.equal((await w2.booking()).payment_status, 'pending');
  const retry = await w2.checkout();
  assert.equal(retry.status, 200);
  assert.notEqual(retry.data.sessionId, first.data.sessionId, 'a fresh page, not the dead one');
  await w2.pay(retry.data.sessionId);
  assert.equal((await w2.booking()).payment_status, 'held');
});

test('a client who finished a bank payment can\'t open a second checkout before the webhook lands', async () => {
  const w = await scenario();
  await w.quoteAndAccept({ amount: 100 });
  const checkout = await w.checkout();
  w.stripe.payByBank(checkout.data.sessionId); // webhook not delivered yet
  assert.equal((await w.checkout()).status, 409);
  assert.equal(w.stripe.sessions.size, 1);
});

test('an expired checkout page is replaced by a fresh one', async () => {
  const w = await scenario();
  await w.quoteAndAccept({ amount: 100 });
  const first = await w.checkout();
  w.stripe.sessions.get(first.data.sessionId).status = 'expired';
  await w.webhook('checkout.session.expired', w.stripe.sessions.get(first.data.sessionId));
  const second = await w.checkout();
  assert.equal(second.status, 200);
  assert.notEqual(second.data.sessionId, first.data.sessionId);
});

test('a test-mode event can\'t mark a live booking paid', async () => {
  const w = await scenario();
  await w.quoteAndAccept({ amount: 100 });
  const checkout = await w.checkout();
  const session = w.stripe.pay(checkout.data.sessionId);
  const res = await w.webhook('checkout.session.completed', session, { livemode: false });
  assert.equal(res.status, 200);
  assert.equal((await w.booking()).payment_status, 'pending');
});

/* ------------------------------------------------------------------ */
/* Known issue 3: the report racing the payout                          */
/* ------------------------------------------------------------------ */

test('K3: the sweep pays a delivered booking once its window has closed', async () => {
  const w = await scenario();
  await w.deliveredAndDue({ amount: 100 });
  const sweep = await w.call('releasePayouts', {}, FOUNDER);
  assert.equal(sweep.data.released, 1);
  const booking = await w.booking();
  assert.equal(booking.payment_status, 'released');
  assert.equal(booking.status, 'completed');
  assert.equal([...w.stripe.transfers.values()][0].amount, 8600);
  assert.equal(booking.payout_lock, '', 'lock is let go');
});

test('K3: a report and a payout at the same moment — exactly one of them wins', async () => {
  // Start the report a few "ticks" before, with, or after the sweep, to cover
  // every way the two can interleave.
  for (let delay = 0; delay <= 40; delay += 1) {
    const w = await scenario();
    await w.deliveredAndDue({ amount: 100 });

    const lateReport = (async () => {
      for (let i = 0; i < delay; i += 1) await new Promise((r) => setImmediate(r));
      w.db.currentUser = CLIENT;
      const handler = (await import('../base44/functions/reportBookingProblem/entry.ts')).default;
      return handler(
        new Request('https://stelli.test/fn', { method: 'POST', body: JSON.stringify({ bookingId: 'b1', note: 'Half the photos are missing.' }) })
      );
    })();
    const sweep = (async () => {
      const { releaseBooking } = await import('../base44/shared/payouts.ts');
      return releaseBooking(w.db, 'b1', 'auto');
    })();

    const [reportResponse, payout] = await Promise.all([lateReport, sweep]);
    const booking = await w.booking();
    const transfers = w.stripe.transfers.size;

    assert.equal(reportResponse.status, 200, `delay ${delay}: the report is never lost`);
    assert.equal(booking.flagged_for_review, true);
    assert.ok(booking.problem_reported_at);

    if (payout.released) {
      // The payout got there first. The report says so, honestly.
      assert.equal(transfers, 1);
      assert.match(booking.flag_reason, /after the payout had gone out/, `delay ${delay}`);
    } else {
      // The report got there first. The money is frozen: no transfer at all.
      assert.equal(transfers, 0, `delay ${delay}: flagged booking must not be paid`);
      assert.equal(booking.payment_status, 'held');
      assert.doesNotMatch(booking.flag_reason, /after the payout/);
    }
    assert.equal(booking.payout_lock, '');
  }
});

test('K3: once a problem is reported, no later sweep pays it', async () => {
  const w = await scenario();
  await w.deliveredAndDue({ amount: 100 });
  const report = await w.call('reportBookingProblem', { bookingId: 'b1', note: 'Wrong shoot delivered.' }, CLIENT);
  assert.equal(report.status, 200);
  assert.equal(report.data.held, true);
  await w.call('releasePayouts', {}, FOUNDER);
  await w.call('releasePayouts', {}, FOUNDER);
  assert.equal(w.stripe.transfers.size, 0);
  assert.equal((await w.booking()).payment_status, 'held');
});

test('K3: three payout paths at once still make exactly one transfer', async () => {
  const w = await scenario();
  await w.deliveredAndDue({ amount: 100 });
  const { releaseBooking } = await import('../base44/shared/payouts.ts');
  const results = await Promise.all([
    releaseBooking(w.db, 'b1', 'auto'),
    releaseBooking(w.db, 'b1', 'auto'),
    releaseBooking(w.db, 'b1', 'founder'),
  ]);
  assert.equal(results.filter((r) => r.released).length, 1);
  assert.equal(w.stripe.transfers.size, 1);
  // And again afterwards: still one.
  await releaseBooking(w.db, 'b1', 'founder');
  assert.equal(w.stripe.transfers.size, 1);
});

test('K3: a run that died after Stripe paid is recovered without paying twice', async () => {
  const w = await scenario();
  await w.deliveredAndDue({ amount: 100 });
  // Stripe made the transfer, then our function died before writing it down,
  // leaving the booking locked and still "held".
  w.stripe.transfers.set('tr_orphan', {
    id: 'tr_orphan', amount: 8600, amount_reversed: 0, reversed: false,
    destination: 'acct_maya', transfer_group: 'booking_b1',
  });
  await w.entities.Booking.update('b1', {
    payout_lock: 'payout:dead-run',
    payout_lock_at: new Date(Date.now() - 20 * 60_000).toISOString(),
  });
  const { releaseBooking } = await import('../base44/shared/payouts.ts');
  const result = await releaseBooking(w.db, 'b1', 'auto');
  assert.equal(result.released, true);
  assert.equal(result.transferId, 'tr_orphan');
  assert.equal(w.stripe.count('POST', 'transfers'), 0, 'no second transfer is sent');
});

test('the client confirming delivery releases early; a stranger can\'t', async () => {
  const w = await scenario();
  await w.paid({ amount: 100 });
  await w.entities.Booking.update('b1', {
    status: 'delivered',
    delivered_at: new Date().toISOString(),
    release_due_at: new Date(Date.now() + 40 * 3_600_000).toISOString(),
  });
  // The sweep leaves it alone: the window is still open.
  await w.call('releasePayouts', {}, FOUNDER);
  assert.equal(w.stripe.transfers.size, 0);

  assert.equal((await w.call('confirmDelivery', { bookingId: 'b1' }, STRANGER)).status, 403);
  assert.equal((await w.call('confirmDelivery', { bookingId: 'b1' }, CREATOR)).status, 403);
  const ok = await w.call('confirmDelivery', { bookingId: 'b1' }, CLIENT);
  assert.equal(ok.data.result.released, true);
});

test('a creator with no payout account: the money waits, then goes out once, when they finish setup', async () => {
  const w = await scenario({ payoutsEnabled: false });
  // Founders may quote on a creator's behalf before payouts are set up.
  const sent = await w.call('sendQuote', { bookingId: 'b1', amount: 100 }, FOUNDER);
  await w.call('acceptQuote', { quoteId: sent.data.quote.id }, CLIENT);
  const checkout = await w.checkout();
  await w.pay(checkout.data.sessionId);
  await w.entities.Booking.update('b1', {
    status: 'delivered',
    delivered_at: new Date(Date.now() - 50 * 3_600_000).toISOString(),
    release_due_at: new Date(Date.now() - 2 * 3_600_000).toISOString(),
  });

  await w.call('releasePayouts', {}, FOUNDER);
  await w.call('releasePayouts', {}, FOUNDER);
  let booking = await w.booking();
  assert.equal(booking.needs_payout_setup, true);
  assert.equal(booking.payment_status, 'held');
  assert.equal(w.stripe.transfers.size, 0);
  assert.equal(w.emailsTo(CREATOR.email).filter((e) => /money waiting/.test(e.subject)).length, 1, 'told once, not hourly');

  await w.entities.Lensman.update('l1', { payouts_enabled: true, stripe_account_id: 'acct_maya' });
  const { releaseWaitingPayouts } = await import('../base44/shared/payouts.ts');
  await releaseWaitingPayouts(w.db, await w.entities.Lensman.get('l1'));
  await releaseWaitingPayouts(w.db, await w.entities.Lensman.get('l1'));
  booking = await w.booking();
  assert.equal(booking.payment_status, 'released');
  assert.equal(w.stripe.transfers.size, 1);
});

test('a payout Stripe keeps refusing shows up for a founder instead of failing quietly', async () => {
  const w = await scenario();
  await w.deliveredAndDue({ amount: 100 });
  for (let i = 0; i < 3; i += 1) {
    w.stripe.failNextPost('transfers', 'The destination account is restricted.');
    await w.call('releasePayouts', {}, FOUNDER);
  }
  let booking = await w.booking();
  assert.equal(booking.payment_status, 'held');
  assert.equal(booking.payout_attempts, 3);
  assert.match(booking.payout_error, /restricted/);
  assert.equal(booking.flagged_for_review, true);
  assert.equal(w.emailsTo(FOUNDER.email).filter((e) => /keeps failing/.test(e.subject)).length, 1);

  // The creator fixes their account; the founder releases; it goes through once.
  const release = await w.call('releasePayout', { bookingId: 'b1', action: 'release' }, FOUNDER);
  assert.equal(release.data.result.released, true);
  booking = await w.booking();
  assert.equal(booking.payment_status, 'released');
  assert.equal(booking.flagged_for_review, false);
  assert.equal(w.stripe.transfers.size, 1);
});

test('an unclear Stripe failure is retried under the same key, so it can never pay twice', async () => {
  const w = await scenario();
  await w.deliveredAndDue({ amount: 100 });
  w.stripe.failNextPost('transfers', 'Internal error', 500);
  await w.call('releasePayouts', {}, FOUNDER);
  assert.equal((await w.booking()).payout_key_version, undefined, 'key is kept after an unclear failure');
});

test('only a founder can run the sweep or decide a payout', async () => {
  const w = await scenario();
  await w.deliveredAndDue({ amount: 100 });
  for (const user of [CLIENT, CREATOR, STRANGER]) {
    assert.equal((await w.call('releasePayouts', {}, user)).status, 403);
    assert.equal((await w.call('releasePayout', { bookingId: 'b1', action: 'release' }, user)).status, 403);
  }
  assert.equal(w.stripe.transfers.size, 0);
});
