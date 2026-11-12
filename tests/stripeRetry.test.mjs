/**
 * One Stripe hiccup shouldn't fail a payout. Safe requests (reads, and writes
 * with an idempotency key) are retried; the key makes a repeat return the
 * first result, so money can never move twice.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { FOUNDER, scenario } from './helpers/scenario.mjs';

test('a rate-limited payout (429) is retried and pays exactly once', async () => {
  const w = await scenario();
  await w.deliveredAndDue({ amount: 100 });
  // Stripe saves no result for a rate-limited request, so model that: the
  // failure is not remembered under the key.
  const realFetch = globalThis.fetch;
  let limited = false;
  globalThis.fetch = async (url, init) => {
    if (!limited && String(url).endsWith('/v1/transfers') && init?.method === 'POST') {
      limited = true;
      return new Response(JSON.stringify({ error: { message: 'Too many requests' } }), { status: 429 });
    }
    return realFetch(url, init);
  };
  const sweep = await w.call('releasePayouts', {}, FOUNDER);
  assert.equal(sweep.data.released, 1);
  assert.equal(w.stripe.transfers.size, 1);
  const booking = await w.booking();
  assert.equal(booking.payment_status, 'released');
  assert.ok(!booking.payout_error);
  assert.equal(limited, true);
  globalThis.fetch = realFetch;
});

test('a Stripe read that fails with a 500 is retried', async () => {
  const w = await scenario();
  await w.deliveredAndDue({ amount: 100 });
  w.stripe.failNextGet('transfers', 'Internal error', 500);
  const sweep = await w.call('releasePayouts', {}, FOUNDER);
  assert.equal(sweep.data.released, 1);
  assert.equal(w.stripe.transfers.size, 1);
});

test('a definite refusal (400) is not retried', async () => {
  const w = await scenario();
  await w.deliveredAndDue({ amount: 100 });
  w.stripe.failNextPost('transfers', 'The destination account is restricted.', 400);
  const before = w.stripe.count('POST', 'transfers');
  await w.call('releasePayouts', {}, FOUNDER);
  assert.equal(w.stripe.count('POST', 'transfers') - before, 1);
  assert.equal(w.stripe.transfers.size, 0);
});
