import test from 'node:test';
import assert from 'node:assert/strict';
import { cancellationPlan } from '../base44/shared/cancellation.ts';
import { hoursUntilShoot, shootDayEndMs, shootStart, zonedToUtcMs } from '../base44/shared/shootTime.ts';

const HOUR = 3_600_000;

/** A paid $100 booking: $114 charged, $86 owed to the creator. */
function held(overrides = {}) {
  return {
    id: 'b1',
    status: 'confirmed',
    payment_status: 'held',
    event_date: '2026-11-14',
    event_time: '15:00',
    total_price: 100,
    amount_charged: 114,
    creator_payout: 86,
    ...overrides,
  };
}

const shoot = shootStart('2026-11-14', '15:00').ms;
const hoursBefore = (h) => shoot - h * HOUR;

test('shoot times are read in New York, not in the server\'s UTC', () => {
  // 3 pm on a November Saturday in New York is 20:00 UTC (EST, UTC-5).
  assert.equal(new Date(shoot).toISOString(), '2026-11-14T20:00:00.000Z');
  // In July New York is on daylight time (UTC-4).
  assert.equal(new Date(shootStart('2026-07-04', '15:00').ms).toISOString(), '2026-07-04T19:00:00.000Z');
});

test('daylight-saving changes do not shift a shoot by an hour', () => {
  // Clocks go forward on 8 March 2026 and back on 1 November 2026.
  assert.equal(new Date(zonedToUtcMs(2026, 3, 8, 12, 0)).toISOString(), '2026-03-08T16:00:00.000Z');
  assert.equal(new Date(zonedToUtcMs(2026, 3, 7, 12, 0)).toISOString(), '2026-03-07T17:00:00.000Z');
  assert.equal(new Date(zonedToUtcMs(2026, 11, 1, 12, 0)).toISOString(), '2026-11-01T17:00:00.000Z');
  assert.equal(new Date(zonedToUtcMs(2026, 10, 31, 12, 0)).toISOString(), '2026-10-31T16:00:00.000Z');
});

test('no start time means noon; odd formats are read or flagged, never guessed at', () => {
  assert.equal(shootStart('2026-11-14', '').assumedTime, true);
  assert.equal(new Date(shootStart('2026-11-14', '').ms).toISOString(), '2026-11-14T17:00:00.000Z');
  assert.equal(shootStart('2026-11-14', '3:30 PM').ms, shootStart('2026-11-14', '15:30').ms);
  assert.equal(shootStart('2026-11-14', '3pm').ms, shootStart('2026-11-14', '15:00').ms);
  assert.equal(shootStart('2026-11-14', 'after lunch').assumedTime, true);
  assert.ok(Number.isNaN(shootStart('next Saturday', '15:00').ms));
  assert.ok(shootDayEndMs('2026-11-14') > shoot);
});

test('the bug this replaces: 74 hours ahead in New York is a full refund', () => {
  // Shoot Saturday 3 pm. Client cancels Wednesday 1 pm New York time.
  const now = zonedToUtcMs(2026, 11, 11, 13, 0);
  assert.equal(Math.round(hoursUntilShoot('2026-11-14', '15:00', now)), 74);
  const plan = cancellationPlan({ role: 'client', booking: held(), nowMs: now });
  assert.equal(plan.tier, 'full');
  assert.equal(plan.refundCents, 11400);
  assert.equal(plan.creatorPayoutCents, 0);
});

test('exactly 72 hours ahead is still a full refund; a minute later is half', () => {
  assert.equal(cancellationPlan({ role: 'client', booking: held(), nowMs: hoursBefore(72) }).tier, 'full');
  const half = cancellationPlan({ role: 'client', booking: held(), nowMs: hoursBefore(72) + 60_000 });
  assert.equal(half.tier, 'half');
  assert.equal(half.refundCents, 5700);
  assert.equal(half.creatorPayoutCents, 4300);
});

test('exactly 48 hours ahead is half; a minute later the creator keeps it all', () => {
  assert.equal(cancellationPlan({ role: 'client', booking: held(), nowMs: hoursBefore(48) }).tier, 'half');
  const none = cancellationPlan({ role: 'client', booking: held(), nowMs: hoursBefore(48) + 60_000 });
  assert.equal(none.tier, 'none');
  assert.equal(none.refundCents, 0);
  assert.equal(none.creatorPayoutCents, 8600);
});

test('a creator cancelling always refunds the client in full', () => {
  for (const h of [200, 60, 5]) {
    const plan = cancellationPlan({ role: 'lensman', booking: held(), nowMs: hoursBefore(h) });
    assert.equal(plan.tier, 'creator');
    assert.equal(plan.refundCents, 11400);
    assert.equal(plan.creatorPayoutCents, 0);
  }
});

test('after the shoot has started nobody can "cancel" their way to a payout', () => {
  // The creator did not show; the client opens the booking the next day.
  for (const role of ['client', 'lensman']) {
    const plan = cancellationPlan({ role, booking: held(), nowMs: shoot + 20 * HOUR });
    assert.equal(plan.allowed, false);
    assert.equal(plan.creatorPayoutCents, 0);
    assert.equal(plan.refundCents, 0);
  }
});

test('a booking under review, disputed or delivered cannot be cancelled', () => {
  const now = hoursBefore(100);
  const cases = [
    held({ flagged_for_review: true }),
    held({ dispute_status: 'needs_response' }),
    held({ dispute_status: 'lost' }),
    held({ stray_payment_intent_id: 'pi_x' }),
    held({ status: 'delivered', delivered_at: '2026-11-01T00:00:00Z' }),
    held({ status: 'completed', payment_status: 'released' }),
    held({ status: 'cancelled' }),
    held({ payment_status: 'processing' }),
    held({ payment_status: 'partially_refunded' }),
  ];
  for (const booking of cases) {
    const plan = cancellationPlan({ role: 'client', booking, nowMs: now });
    assert.equal(plan.allowed, false, JSON.stringify(booking));
    assert.equal(plan.creatorPayoutCents, 0);
  }
});

test('an unpaid booking closes with nothing moving', () => {
  const plan = cancellationPlan({
    role: 'client',
    booking: held({ status: 'quoted', payment_status: 'pending', amount_charged: undefined }),
    nowMs: hoursBefore(1),
  });
  assert.equal(plan.allowed, true);
  assert.equal(plan.tier, 'unpaid');
  assert.equal(plan.refundCents, 0);
});

test('an unreadable date never falls through to "creator keeps everything"', () => {
  const plan = cancellationPlan({ role: 'client', booking: held({ event_date: 'soon' }), nowMs: Date.now() });
  assert.equal(plan.allowed, false);
  assert.equal(plan.creatorPayoutCents, 0);
});

test('tax is refunded with the rest, and bookings without amount_charged still work', () => {
  const taxed = cancellationPlan({ role: 'client', booking: held({ amount_charged: 123.12 }), nowMs: hoursBefore(100) });
  assert.equal(taxed.refundCents, 12312);
  const legacy = cancellationPlan({
    role: 'client',
    booking: held({ amount_charged: undefined, creator_payout: undefined }),
    nowMs: hoursBefore(10),
  });
  assert.equal(legacy.creatorPayoutCents, 8600);
});
