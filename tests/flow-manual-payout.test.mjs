/**
 * The founder's manual payout, and the guarantee that it and the automatic
 * payout can never both pay the same booking.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { CLIENT, CREATOR, FOUNDER, scenario } from './helpers/scenario.mjs';

const pay = (w, body, user = FOUNDER) => w.call('payCreator', { lensmanId: 'l1', amount: 50, ...body }, user);

test('a manual payout with no held booking just pays, once', async () => {
  const w = await scenario();
  const res = await pay(w, { requestId: 'r1', note: 'Senior pics' });
  assert.equal(res.data.sent, true);
  assert.equal([...w.stripe.transfers.values()][0].amount, 5000);
  const log = await w.entities.AdminAuditLog.list();
  assert.equal(log.length, 1);
  assert.equal(log[0].action, 'manual_payout');
  assert.equal(log[0].actor_email, FOUNDER.email);
  assert.equal(log[0].amount, 50);
});

test('a double click on Pay sends one payout', async () => {
  const w = await scenario();
  const [a, b] = await Promise.all([pay(w, { requestId: 'same' }), pay(w, { requestId: 'same' })]);
  const c = await pay(w, { requestId: 'same' });
  assert.equal(w.stripe.transfers.size, 1);
  assert.equal((await w.entities.ManualPayout.list()).length, 1);
  assert.equal([a, b, c].filter((r) => r.data.duplicate).length, 2);
});

test('when the creator has a held booking, the founder must say whether the payout is for it', async () => {
  const w = await scenario();
  await w.paid({ amount: 100 });
  const ask = await pay(w, { requestId: 'r1' });
  assert.equal(ask.data.needsDecision, true);
  assert.equal(ask.data.heldBookings.length, 1);
  assert.equal(w.stripe.transfers.size, 0, 'nothing is paid until the founder decides');
  assert.equal((await w.entities.ManualPayout.list()).length, 0);
});

test('H-9: a manual payout FOR a booking is that booking\'s payout — the sweep never pays it again', async () => {
  const w = await scenario();
  await w.deliveredAndDue({ amount: 100 });
  const res = await pay(w, { requestId: 'r1', bookingId: 'b1' });
  assert.equal(res.data.sent, true);

  let booking = await w.booking();
  assert.equal(booking.payment_status, 'released');
  assert.equal(booking.released_by, 'founder');
  assert.equal(booking.creator_payout, 50);
  assert.equal(booking.creator_payout_original, 86);
  assert.ok(booking.manual_payout_id);

  // The hourly sweep, a founder release and a second manual payout all refuse.
  await w.call('releasePayouts', {}, FOUNDER);
  const release = await w.call('releasePayout', { bookingId: 'b1', action: 'release' }, FOUNDER);
  assert.equal(release.data.ok, false);
  const second = await pay(w, { requestId: 'r2', bookingId: 'b1' });
  assert.equal(second.status, 409);
  assert.equal(w.stripe.transfers.size, 1);
  assert.equal([...w.stripe.transfers.values()][0].amount, 5000);
});

test('H-9: after the automatic payout, a manual payout for the same booking is refused', async () => {
  const w = await scenario();
  await w.deliveredAndDue({ amount: 100 });
  await w.call('releasePayouts', {}, FOUNDER);
  const res = await pay(w, { requestId: 'r1', bookingId: 'b1' });
  assert.equal(res.status, 409);
  assert.equal(w.stripe.transfers.size, 1);
  assert.equal([...w.stripe.transfers.values()][0].amount, 8600);
});

test('H-9: the manual and the automatic payout at the same moment — one transfer, never two', async () => {
  for (let delay = 0; delay <= 30; delay += 3) {
    const w = await scenario();
    await w.deliveredAndDue({ amount: 100 });
    const { releaseBooking } = await import('../base44/shared/payouts.ts');
    const manual = (async () => {
      for (let i = 0; i < delay; i += 1) await new Promise((r) => setImmediate(r));
      return pay(w, { requestId: `r-${delay}`, bookingId: 'b1' });
    })();
    await Promise.all([releaseBooking(w.db, 'b1', 'auto'), manual]);
    assert.equal(w.stripe.transfers.size, 1, `delay ${delay}`);
    const booking = await w.booking();
    assert.equal(booking.payment_status, 'released');
    assert.equal(booking.stripe_transfer_id, [...w.stripe.transfers.keys()][0]);
  }
});

test('a manual payout for a booking waits for payout setup, then pays once and blocks the sweep', async () => {
  const w = await scenario({ payoutsEnabled: false });
  const sent = await w.call('sendQuote', { bookingId: 'b1', amount: 100 }, FOUNDER);
  await w.call('acceptQuote', { quoteId: sent.data.quote.id }, CLIENT);
  await w.pay((await w.checkout()).data.sessionId);

  const res = await pay(w, { requestId: 'r1', bookingId: 'b1' });
  assert.equal(res.data.sent, false);
  assert.equal(res.data.reason, 'no-payout-account');
  assert.equal(w.stripe.transfers.size, 0);

  await w.entities.Lensman.update('l1', { payouts_enabled: true, stripe_account_id: 'acct_maya' });
  await w.entities.Booking.update('b1', {
    status: 'delivered',
    delivered_at: new Date(Date.now() - 50 * 3_600_000).toISOString(),
    release_due_at: new Date(Date.now() - 2 * 3_600_000).toISOString(),
  });
  // The sweep runs both: the booking's own release and the waiting manual payout.
  await w.call('releasePayouts', {}, FOUNDER);
  await w.call('releasePayouts', {}, FOUNDER);
  assert.equal(w.stripe.transfers.size, 1, 'exactly one of the two paths paid');
  assert.equal((await w.booking()).payment_status, 'released');
});

test('separate money on top of a held booking is allowed when the founder says so', async () => {
  const w = await scenario();
  await w.deliveredAndDue({ amount: 100 });
  const res = await pay(w, { requestId: 'r1', confirmSeparate: true, note: 'Travel costs' });
  assert.equal(res.data.sent, true);
  await w.call('releasePayouts', {}, FOUNDER);
  const amounts = [...w.stripe.transfers.values()].map((t) => t.amount).sort();
  assert.deepEqual(amounts, [5000, 8600], 'both go out, because they are different money');
  assert.equal((await w.booking()).creator_payout, 86);
});

test('manual payouts are founder-only and capped', async () => {
  const w = await scenario();
  assert.equal((await pay(w, {}, CREATOR)).status, 403);
  assert.equal((await pay(w, {}, CLIENT)).status, 403);
  assert.equal((await pay(w, { amount: 5000 })).status, 400);
  assert.equal((await pay(w, { amount: 0 })).status, 400);
  assert.equal(w.stripe.transfers.size, 0);
});
