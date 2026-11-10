import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addOnsProblem,
  bookingBreakdown,
  chargeMatches,
  cleanAddOns,
  clientFeeCents,
  creatorPayoutCents,
  pickOfferedAddOns,
  quoteAmountProblem,
  reversalShareCents,
  toCents,
} from '../base44/shared/money.ts';
import { clientTotal, creatorPayout, serviceFee } from '../src/lib/threadPricing.js';

test('the spec example: $100 quote with a $50 add-on', () => {
  const b = bookingBreakdown(100, [{ name: 'Rush delivery', price: 50 }]);
  assert.equal(b.subtotalCents, 15000);
  assert.equal(b.clientFeeCents, 2100);
  assert.equal(b.clientTotalCents, 17100); // what Checkout charges
  assert.equal(b.creatorPayoutCents, 12900); // not 8600
  assert.equal(b.creatorFeeCents, 2100);
});

test('no add-ons: $100 in, $114 charged, $86 out', () => {
  const b = bookingBreakdown(100, []);
  assert.equal(b.clientTotalCents, 11400);
  assert.equal(b.creatorPayoutCents, 8600);
});

test('the one real held booking: $20 quote is $22.80 charged, $17.20 owed', () => {
  const b = bookingBreakdown(20, []);
  assert.equal(b.clientTotalCents, 2280);
  assert.equal(b.clientFeeCents, 280);
  assert.equal(b.creatorPayoutCents, 1720);
});

test('fee plus payout never loses or invents a cent', () => {
  for (let cents = 100; cents <= 250000; cents += 37) {
    const b = bookingBreakdown(cents / 100, []);
    assert.equal(b.creatorFeeCents + b.creatorPayoutCents, b.subtotalCents);
    assert.equal(b.clientTotalCents - b.clientFeeCents, b.subtotalCents);
    assert.ok(Number.isInteger(b.clientFeeCents) && Number.isInteger(b.creatorPayoutCents));
  }
});

test('Checkout line items add up to exactly the client total', () => {
  const b = bookingBreakdown(249.99, [
    { name: 'Second location', price: 35.5 },
    { name: 'Rush', price: 19.99 },
  ]);
  const lines = [b.baseCents, ...b.addOns.map((a) => a.cents), b.clientFeeCents];
  assert.equal(lines.reduce((a, c) => a + c, 0), b.clientTotalCents);
});

test('the quote card in the browser shows the same numbers the server charges', () => {
  for (const dollars of [1, 19.99, 20, 35, 100, 150, 249.5, 1234.56, 9999.99]) {
    const b = bookingBreakdown(dollars, []);
    assert.equal(toCents(serviceFee(dollars)), b.clientFeeCents, `fee for ${dollars}`);
    assert.equal(toCents(clientTotal(dollars)), b.clientTotalCents, `total for ${dollars}`);
    assert.equal(toCents(creatorPayout(dollars)), b.creatorPayoutCents, `payout for ${dollars}`);
  }
});

test('floating-point dollars do not leak into cents', () => {
  assert.equal(toCents(0.1 + 0.2), 30);
  assert.equal(toCents('19.99'), 1999);
  assert.equal(toCents('nope'), 0);
  assert.equal(clientFeeCents(1999), 280);
  assert.equal(creatorPayoutCents(1999), 1719);
});

test('only add-ons the creator offered can be picked, at the creator\'s price', () => {
  const offered = [
    { name: 'Rush delivery', price: 50 },
    { name: 'Extra hour', price: 80 },
  ];
  // The browser tries a cheaper price and an add-on that was never offered.
  const picked = pickOfferedAddOns(offered, [
    { name: 'rush delivery', price: 1 },
    { name: 'Free everything', price: -500 },
  ]);
  assert.deepEqual(picked, [{ name: 'Rush delivery', price: 50 }]);
});

test('add-ons are cleaned: no blanks, no negatives, no duplicates, capped', () => {
  const clean = cleanAddOns([
    { name: '  Prints ', price: '25' },
    { name: '', price: 10 },
    { name: 'Discount', price: -40 },
    { name: 'prints', price: 99 },
    null,
  ]);
  assert.deepEqual(clean, [{ name: 'Prints', price: 25 }]);
  assert.equal(cleanAddOns(Array.from({ length: 30 }, (_, i) => ({ name: `a${i}`, price: 1 }))).length, 10);
});

test('quote amounts are checked before they are stored', () => {
  assert.equal(quoteAmountProblem(250), '');
  assert.equal(quoteAmountProblem(249.5), '');
  assert.notEqual(quoteAmountProblem(0), '');
  assert.notEqual(quoteAmountProblem(-20), '');
  assert.notEqual(quoteAmountProblem('abc'), '');
  assert.notEqual(quoteAmountProblem(0.5), '');
  assert.notEqual(quoteAmountProblem(100.555), '');
  assert.notEqual(quoteAmountProblem(10_000_000), '');
  assert.equal(addOnsProblem([{ name: 'Rush', price: 50 }]), '');
  assert.notEqual(addOnsProblem([{ name: 'Rush', price: -1 }]), '');
  assert.notEqual(addOnsProblem([{ name: 'Rush', price: 1.999 }]), '');
});

test('a payment only counts when Stripe charged exactly the expected total', () => {
  const b = bookingBreakdown(100, [{ name: 'Rush', price: 50 }]);
  assert.equal(chargeMatches(b, 17100), true);
  assert.equal(chargeMatches(b, 11400), false); // paid the old, add-on-free price
  assert.equal(chargeMatches(b, 17101), false);
});

test('pulling a payout back follows the refund, and a full refund returns it all', () => {
  // $100 booking: $114 charged, $86 paid out.
  assert.equal(reversalShareCents({ payoutCents: 8600, chargedCents: 11400, refundedTotalCents: 11400 }), 8600);
  assert.equal(reversalShareCents({ payoutCents: 8600, chargedCents: 11400, refundedTotalCents: 5700 }), 4300);
  assert.equal(reversalShareCents({ payoutCents: 8600, chargedCents: 11400, refundedTotalCents: 0 }), 0);
  // Tax on top: refunding everything still returns the whole payout.
  assert.equal(reversalShareCents({ payoutCents: 8600, chargedCents: 12312, refundedTotalCents: 12312 }), 8600);
  // Never more than was paid.
  assert.equal(reversalShareCents({ payoutCents: 8600, chargedCents: 11400, refundedTotalCents: 99999 }), 8600);
});
