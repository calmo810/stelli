import test from 'node:test';
import assert from 'node:assert/strict';
import { founderQueue, queueItemFor, refundable } from '../src/lib/founderQueue.js';

const NOW = Date.parse('2026-11-20T12:00:00Z');
const held = {
  id: 'b1',
  client_name: 'Jordan Lee',
  lensman_name: 'Maya',
  status: 'delivered',
  payment_status: 'held',
  amount_charged: 114,
  creator_payout: 86,
  event_date: '2026-11-14',
  delivered_at: '2026-11-15T10:00:00Z',
  stripe_livemode: true,
};
const names = (item) => item.actions.map((a) => a.action);

test('a healthy booking is not in the queue', () => {
  assert.equal(queueItemFor(held, NOW), null);
  assert.equal(queueItemFor({ ...held, status: 'completed', payment_status: 'released', stripe_transfer_id: 'tr_1' }, NOW), null);
  assert.equal(queueItemFor({ id: 'x', status: 'requested', payment_status: 'pending' }, NOW), null);
});

test('a reported problem offers release or refund, with the exact amounts', () => {
  const item = queueItemFor({ ...held, flagged_for_review: true, problem_reported_at: 'x' }, NOW);
  assert.equal(item.kind, 'problem');
  assert.deepEqual(names(item), ['release', 'refund']);
  assert.equal(item.actions[0].label, 'Release $86.00 to Maya');
  assert.equal(item.actions[0].confirm, 'Release $86.00 to Maya. This can’t be undone.');
  assert.equal(item.actions[1].confirm, 'Refund $114.00 to Jordan’s card. This can’t be undone.');
});

test('refunding a booking that was already paid out says the payout comes back', () => {
  const item = queueItemFor(
    { ...held, payment_status: 'released', stripe_transfer_id: 'tr_1', flagged_for_review: true, problem_reported_at: 'x' },
    NOW
  );
  assert.equal(item.kind, 'problem_after_payout');
  assert.match(item.actions[0].confirm, /Maya’s \$86\.00 payout will be pulled back/);
});

test('an open dispute comes first and offers no release', () => {
  const dispute = queueItemFor({ ...held, flagged_for_review: true, dispute_status: 'needs_response', problem_reported_at: 'x' }, NOW);
  assert.equal(dispute.kind, 'dispute');
  assert.equal(dispute.urgency, 1);
  assert.deepEqual(names(dispute), []);
  const paid = queueItemFor(
    { ...held, payment_status: 'released', stripe_transfer_id: 'tr_1', flagged_for_review: true, dispute_status: 'needs_response' },
    NOW
  );
  assert.deepEqual(names(paid), ['pull_back']);
});

test('a failed pull-back shows what is still owed and a retry', () => {
  const item = queueItemFor(
    {
      ...held, payment_status: 'refunded', refund_amount: 114, stripe_transfer_id: 'tr_1', flagged_for_review: true,
      reversal_status: 'failed', reversal_amount_due: 86, reversal_amount_done: 0, reversal_error: 'Insufficient funds',
    },
    NOW
  );
  assert.equal(item.kind, 'pull_back');
  assert.match(item.headline, /\$86\.00 still has to come back from Maya/);
  assert.deepEqual(names(item), ['retry_reversal']);
  assert.match(item.actions[0].confirm, /refund is not sent again/);
});

test('a stray payment, a failed payout, a failed cancellation refund each get their own item', () => {
  const stray = queueItemFor({ ...held, status: 'quoted', payment_status: 'pending', flagged_for_review: true, stray_payment_intent_id: 'pi_1', stray_payment_amount: 342 }, NOW);
  assert.equal(stray.kind, 'stray_payment');
  assert.equal(stray.actions[0].label, 'Send $342.00 back to Jordan');

  const failing = queueItemFor({ ...held, flagged_for_review: true, payout_error: 'Account restricted', payout_attempts: 3 }, NOW);
  assert.equal(failing.kind, 'payout_failed');

  const refundFailed = queueItemFor(
    { ...held, status: 'cancelled', delivered_at: undefined, flagged_for_review: true, flag_reason: 'Cancelled, but the refund of $57.00 to the client did not go through (x).' },
    NOW
  );
  assert.equal(refundFailed.kind, 'refund_failed');
});

test('a creator cancellation and other settled flags can only be marked reviewed', () => {
  const item = queueItemFor(
    { ...held, status: 'cancelled', cancelled_by: 'creator', payment_status: 'refunded', refund_amount: 114, flagged_for_review: true },
    NOW
  );
  assert.equal(item.kind, 'creator_cancelled');
  assert.deepEqual(names(item), ['mark_reviewed']);
});

test('paid, never delivered, ten days on: it shows up instead of sitting unseen', () => {
  const quiet = { ...held, status: 'confirmed', delivered_at: undefined, event_date: '2026-11-04' };
  assert.equal(queueItemFor(quiet, NOW).kind, 'overdue_delivery');
  assert.equal(queueItemFor({ ...quiet, event_date: '2026-11-15' }, NOW), null, 'not yet');
});

test('money waiting on payout setup and test-mode payments are shown with nothing to press', () => {
  const setup = queueItemFor({ ...held, needs_payout_setup: true }, NOW);
  assert.equal(setup.kind, 'payout_setup');
  assert.deepEqual(names(setup), []);
  const testMode = queueItemFor({ ...held, stripe_livemode: undefined, stripe_checkout_session_id: 'cs_test_1', needs_payout_setup: true }, NOW);
  assert.equal(testMode.kind, 'test_payment');
});

test('the queue is sorted by urgency', () => {
  const queue = founderQueue(
    [
      { ...held, id: 'setup', needs_payout_setup: true },
      { ...held, id: 'problem', flagged_for_review: true, problem_reported_at: 'x' },
      { ...held, id: 'fine' },
      { ...held, id: 'dispute', flagged_for_review: true, dispute_status: 'under_review' },
    ],
    NOW
  );
  assert.deepEqual(queue.map((q) => q.id), ['dispute', 'problem', 'setup']);
});

test('what is refundable accounts for what has already gone back', () => {
  assert.equal(refundable(held), 114);
  assert.equal(refundable({ ...held, refund_amount: 57 }), 57);
  assert.equal(refundable({ ...held, refund_amount: 114 }), 0);
});
