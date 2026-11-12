/**
 * STRIPE_MODE=test is how a founder rehearses payments on the live app. While
 * it is on, bookings that were paid with real money must be left exactly as
 * they are: no payout attempts (which would fail, pile up and flag the
 * booking), no refunds, no pull-backs, no cancellations that can't refund.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { CLIENT, FOUNDER, scenario } from './helpers/scenario.mjs';

const toTestMode = () => {
  globalThis.__secrets = { ...globalThis.__secrets, STRIPE_MODE: 'test' };
};

test('test mode: the sweep leaves a real-money booking alone, and pays it once live again', async () => {
  const w = await scenario();
  await w.deliveredAndDue({ amount: 100 });
  toTestMode();

  for (let run = 0; run < 4; run += 1) {
    const sweep = await w.call('releasePayouts', {}, FOUNDER);
    assert.equal(sweep.status, 200);
  }
  let booking = await w.booking();
  assert.equal(w.stripe.transfers.size, 0, 'no transfer attempted');
  assert.equal(booking.payment_status, 'held');
  assert.ok(!booking.payout_attempts, 'no failures recorded');
  assert.ok(!booking.flagged_for_review, 'not flagged');

  globalThis.__secrets = { ...globalThis.__secrets, STRIPE_MODE: '' };
  await w.call('releasePayouts', {}, FOUNDER);
  booking = await w.booking();
  assert.equal(booking.payment_status, 'released');
  assert.equal(w.stripe.transfers.size, 1);
});

test('test mode: a founder refund or release on a real-money booking moves nothing and says why', async () => {
  const w = await scenario();
  await w.deliveredAndDue({ amount: 100 });
  toTestMode();

  const refund = await w.call('releasePayout', { bookingId: w.bookingId, action: 'refund', actionId: 'a1' }, FOUNDER);
  assert.equal(refund.data.ok, false);
  assert.match(refund.data.message, /other Stripe mode/);

  const release = await w.call('releasePayout', { bookingId: w.bookingId, action: 'release', actionId: 'a2' }, FOUNDER);
  assert.equal(release.data.ok, false);
  assert.match(release.data.message, /test mode/);

  const booking = await w.booking();
  assert.equal(booking.payment_status, 'held');
  assert.ok(!booking.refunded_at);
  assert.equal(w.stripe.refunds.length, 0);
});

test('test mode: a client cannot cancel a real-money booking into a refund that cannot happen', async () => {
  const w = await scenario({ eventDate: '2027-06-12' });
  await w.paid({ amount: 100 });
  toTestMode();

  const preview = await w.call('cancelBooking', { bookingId: w.bookingId, preview: true }, CLIENT);
  assert.equal(preview.data.allowed, false);
  const cancel = await w.call('cancelBooking', { bookingId: w.bookingId, reason: 'test' }, CLIENT);
  assert.equal(cancel.status, 409);

  const booking = await w.booking();
  assert.notEqual(booking.status, 'cancelled');
  assert.equal(booking.payment_status, 'held');
});
