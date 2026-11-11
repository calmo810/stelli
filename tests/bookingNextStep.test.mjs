import test from 'node:test';
import assert from 'node:assert/strict';
import {
  effectiveStatus,
  isConfirmed,
  isPast,
  nextStep,
  nextSteps,
  shootPassed,
  statusChip,
  statusLine,
} from '../src/lib/bookingNextStep.js';
import * as server from '../base44/shared/bookingRules.ts';
import { shootStart } from '../base44/shared/shootTime.ts';

const NOW = Date.parse('2026-11-10T18:00:00Z');
const HOUR = 3_600_000;
const base = {
  id: 'b1',
  client_name: 'Jordan Lee',
  lensman_name: 'Maya',
  event_type: 'Portraits',
  event_date: '2026-11-20',
  event_time: '15:00',
  status: 'requested',
  payment_status: 'pending',
};
const paid = { ...base, status: 'confirmed', payment_status: 'held', creator_payout: 86, contract_id: 'c1', creator_contract_accepted: true };
const title = (booking, role, ctx) => nextStep(booking, role, { nowMs: NOW, ...ctx })?.title;
const key = (booking, role, ctx) => nextStep(booking, role, { nowMs: NOW, ...ctx })?.key ?? null;

test('the browser and the server agree on what state a booking is in', () => {
  const samples = [
    base,
    paid,
    { status: 'awaiting_creator_acceptance', payment_status: 'held' },
    { status: 'awaiting_creator_acceptance', payment_status: 'held', delivered_at: 'x' },
    { status: 'awaiting_creator_acceptance', payment_status: 'pending', quote_id: 'q' },
    { status: 'pending', payment_status: 'pending' },
    { status: 'confirmed', payment_status: 'pending' },
    { status: 'cancelled', payment_status: 'held' },
    { status: 'completed', payment_status: 'released' },
    { status: 'delivered', payment_status: 'partially_refunded' },
  ];
  for (const booking of samples) {
    assert.equal(effectiveStatus(booking), server.effectiveStatus(booking), JSON.stringify(booking));
    assert.equal(isConfirmed(booking), server.isConfirmed(booking), JSON.stringify(booking));
  }
});

test('the browser and the server agree on when a shoot has started', () => {
  for (const [date, time] of [['2026-11-14', '15:00'], ['2026-07-04', '09:30'], ['2026-03-08', '12:00'], ['2026-12-31', '']]) {
    const start = shootStart(date, time).ms;
    const booking = { event_date: date, event_time: time };
    assert.equal(shootPassed(booking, start - 60_000), false, `${date} ${time} just before`);
    assert.equal(shootPassed(booking, start + 60_000), true, `${date} ${time} just after`);
  }
});

test('client: a quote to answer, then a payment to make', () => {
  const quote = { id: 'q1', booking_id: 'b1', status: 'sent', expires_at: new Date(NOW + HOUR).toISOString() };
  assert.equal(key(base, 'client'), null, 'waiting on the creator');
  assert.equal(title({ ...base, status: 'quoted' }, 'client', { quotes: [quote] }), 'Maya sent a quote');
  assert.equal(key({ ...base, status: 'quoted' }, 'client', { quotes: [{ ...quote, expires_at: new Date(NOW - 1).toISOString() }] }), null, 'an expired quote is not a to-do');
  // The step the old dashboard never showed.
  assert.equal(title({ ...base, status: 'quote_accepted', quote_id: 'q1' }, 'client'), 'Pay to lock in Maya');
  assert.equal(key({ ...base, status: 'quote_accepted', payment_status: 'processing' }, 'client'), null, 'bank payment clearing');
});

test('client: delivered photos show up as the thing to look at', () => {
  const delivered = { ...paid, status: 'delivered', delivered_at: 'x', delivery_link: 'https://g.example.com', album_token: 'tok' };
  const step = nextStep(delivered, 'client', { nowMs: NOW });
  assert.equal(step.key, 'photos');
  assert.equal(step.to, '/album/b1?t=tok');
  assert.equal(key({ ...delivered, problem_reported_at: 'x', flagged_for_review: true }, 'client'), null);
  assert.equal(key({ ...delivered, status: 'completed', payment_status: 'released' }, 'client'), null);
});

test('creator: a request to quote', () => {
  assert.equal(title(base, 'lensman'), 'Jordan wants Portraits');
  assert.equal(key({ ...base, status: 'quoted' }, 'lensman'), null);
  assert.equal(key({ ...base, status: 'quote_accepted' }, 'lensman'), null);
});

test('creator: nothing to deliver before the shoot; then unedited, then final', () => {
  const afterShoot = Date.parse('2026-11-21T18:00:00Z');
  assert.equal(key(paid, 'lensman'), null, 'the shoot has not happened yet');
  assert.equal(key(paid, 'lensman', { nowMs: afterShoot }), 'unedited');
  assert.equal(key({ ...paid, unedited_delivered_at: 'x' }, 'lensman', { nowMs: afterShoot }), 'deliver');
  assert.equal(key({ ...paid, status: 'delivered', delivered_at: 'x' }, 'lensman', { nowMs: afterShoot }), null);
});

test('creator: an agreement left unsigned is a to-do, and a trapped booking still gets one', () => {
  const unsigned = { ...paid, creator_contract_accepted: false };
  const step = nextStep(unsigned, 'lensman', { nowMs: NOW });
  assert.equal(step.key, 'agreement');
  assert.equal(step.to, '/agreements/c1');
  // A paid booking the old code parked in awaiting_creator_acceptance.
  const trapped = { ...paid, status: 'awaiting_creator_acceptance' };
  assert.equal(key(trapped, 'lensman', { nowMs: Date.parse('2026-11-21T18:00:00Z') }), 'unedited');
});

test('a booking a founder is reviewing asks nothing of either side', () => {
  for (const extra of [
    { flagged_for_review: true },
    { dispute_status: 'needs_response' },
    { stray_payment_intent_id: 'pi_1' },
  ]) {
    assert.equal(key({ ...paid, ...extra }, 'client'), null);
    assert.equal(key({ ...paid, ...extra }, 'lensman', { nowMs: Date.parse('2026-11-21T18:00:00Z') }), null);
  }
});

test('nothing falls out of the lists: every booking is either active or past', () => {
  for (const status of ['requested', 'quoted', 'quote_accepted', 'pending', 'awaiting_creator_acceptance', 'confirmed', 'in_progress', 'awaiting_delivery', 'delivered', 'disputed']) {
    assert.equal(isPast({ status, payment_status: 'pending' }), false, status);
  }
  assert.equal(isPast({ status: 'completed' }), true);
  assert.equal(isPast({ status: 'cancelled' }), true);
});

test('chips say what is going on, in words', () => {
  assert.equal(statusChip(base), 'REQUESTED');
  assert.equal(statusChip({ ...base, status: 'quote_accepted' }), 'TO PAY');
  assert.equal(statusChip({ ...base, status: 'quote_accepted', payment_status: 'processing' }), 'PAYMENT CLEARING');
  assert.equal(statusChip(paid), 'CONFIRMED');
  assert.equal(statusChip({ ...paid, status: 'awaiting_creator_acceptance' }), 'CONFIRMED');
  assert.equal(statusChip({ ...paid, flagged_for_review: true }), 'UNDER REVIEW');
  assert.equal(statusChip({ ...paid, status: 'cancelled' }), 'CANCELLED');
});

test('status lines are calm, role-aware, and never a raw status', () => {
  const lines = [
    statusLine(base, 'client', NOW),
    statusLine({ ...base, status: 'quote_accepted' }, 'client', NOW),
    statusLine({ ...base, status: 'quote_accepted', payment_status: 'processing' }, 'client', NOW),
    statusLine(paid, 'client', NOW),
    statusLine(paid, 'lensman', NOW),
    statusLine({ ...paid, status: 'delivered', delivered_at: 'x', release_due_at: new Date(NOW + 30 * HOUR).toISOString() }, 'client', NOW),
    statusLine({ ...paid, status: 'delivered', delivered_at: 'x', needs_payout_setup: true }, 'lensman', NOW),
    statusLine({ ...paid, problem_reported_at: 'x', flagged_for_review: true }, 'client', NOW),
    statusLine({ ...paid, status: 'cancelled', payment_status: 'refunded' }, 'client', NOW),
    statusLine({ ...paid, status: 'awaiting_creator_acceptance' }, 'client', NOW),
    statusLine({ ...paid, stray_payment_intent_id: 'pi_1' }, 'client', NOW),
  ];
  for (const line of lines) {
    assert.ok(line.length > 10);
    assert.doesNotMatch(line, /_|awaiting|held\b(?! safely| for you| until| while)|undefined|NaN/, line);
  }
  assert.equal(statusLine(paid, 'client', NOW), 'Booked. Your payment is held safely until your photos arrive.');
  assert.match(statusLine(paid, 'lensman', NOW), /\$86 is held for you until you deliver/);
  assert.match(lines[5], /You have 30 hours to report a problem/);
});

test('next steps across bookings come most pressing first', () => {
  const steps = nextSteps(
    [
      { ...base, id: 'a', status: 'quoted' },
      { ...base, id: 'b', status: 'quote_accepted' },
    ],
    'client',
    { nowMs: NOW, quotes: [{ booking_id: 'a', status: 'sent' }] }
  );
  assert.deepEqual(steps.map((s) => s.key), ['pay', 'quote']);
});
