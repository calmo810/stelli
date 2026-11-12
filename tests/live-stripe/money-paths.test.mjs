/**
 * PR 1's money paths against real Stripe test mode. See realStripe.mjs.
 *
 *   npm run test:stripe
 *
 * Payouts to a creator need a test connected account that has finished
 * Stripe's onboarding (a person has to click through it once: it has a
 * captcha). Pass its ID as STELLI_TEST_CREATOR_ACCOUNT=acct_... to run those;
 * without it they are skipped, and the payout-blocked path is run instead.
 */
import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import { CLIENT, CREATOR, FOUNDER, assertTestMode, stripe, waitForEvent, world } from './realStripe.mjs';

const CREATOR_ACCOUNT = process.env.STELLI_TEST_CREATOR_ACCOUNT || '';
// A test connected account whose onboarding was never finished.
const UNFINISHED_ACCOUNT = process.env.STELLI_TEST_UNFINISHED_ACCOUNT || '';
const cents = (dollars) => Math.round(Number(dollars) * 100);

before(assertTestMode);

test('Checkout: the real session charges the quote, each add-on and the fee, and payment confirms the booking', async () => {
  const w = await world();
  await w.quoteAndAccept({
    amount: 100,
    addOns: [{ name: 'Rush delivery', price: 50 }, { name: 'Extra hour', price: 80 }],
    pick: ['Rush delivery'],
  });
  const checkout = await w.checkout();
  assert.equal(checkout.status, 200);
  assert.match(checkout.data.url, /^https:\/\/checkout\.stripe\.com\//);

  // What Stripe will actually charge, line by line.
  const lines = await stripe('GET', `checkout/sessions/${checkout.data.sessionId}/line_items`, { limit: 10 });
  assert.deepEqual(
    lines.data.map((line) => [line.description, line.amount_total]),
    [['Stelli booking', 10000], ['Rush delivery', 5000], ['Stelli service fee', 2100]]
  );
  const session = await stripe('GET', `checkout/sessions/${checkout.data.sessionId}`);
  assert.equal(session.amount_total, 17100);
  assert.equal(session.livemode, false);

  // Asking again returns the same open page, not a second one.
  const again = await w.checkout();
  assert.equal(again.data.sessionId, checkout.data.sessionId);

  const { intent, delivered } = await w.pay(checkout.data.sessionId);
  assert.equal(delivered.status, 200);
  const booking = await w.booking();
  assert.equal(booking.status, 'confirmed');
  assert.equal(booking.payment_status, 'held');
  assert.equal(booking.amount_charged, 171);
  assert.equal(booking.fee_amount, 21);
  assert.equal(booking.creator_payout, 129);
  assert.equal(booking.stripe_livemode, false);
  assert.equal(booking.stripe_payment_intent_id, intent.id);
  assert.equal(booking.stripe_charge_id, intent.latest_charge, 'the charge is read back from Stripe');

  // The same event again changes nothing.
  await w.pay(checkout.data.sessionId).catch(() => {});
  assert.equal((await w.booking()).amount_charged, 171);
});

test('Replacing the quote really expires the old Checkout page at Stripe', async () => {
  const w = await world();
  await w.quoteAndAccept({ amount: 300 });
  const old = await w.checkout();
  await w.call('sendQuote', { bookingId: w.bookingId, amount: 200 }, CREATOR);
  const session = await stripe('GET', `checkout/sessions/${old.data.sessionId}`);
  assert.equal(session.status, 'expired');
});

test('Cancelling more than 72 hours out: Stripe refunds what Stelli promised, and the refund event agrees', async () => {
  const w = await world();
  const { intent } = await w.paid({ amount: 100 });
  const preview = await w.call('cancelBooking', { bookingId: w.bookingId, preview: true }, CLIENT);
  assert.equal(preview.data.tier, 'full');

  const done = await w.call('cancelBooking', { bookingId: w.bookingId, reason: 'Plans changed' }, CLIENT);
  assert.equal(done.status, 200);
  assert.equal(done.data.refundAmount, preview.data.refundAmount);

  const charge = await w.chargeOf(intent.id);
  assert.equal(charge.amount_refunded, cents(preview.data.refundAmount), 'Stripe refunded exactly the promised amount');

  // Stripe's own charge.refunded event, back through the webhook.
  const event = await waitForEvent('charge.refunded', (object) => object.payment_intent === intent.id);
  assert.equal((await w.deliver(event)).status, 200);
  const booking = await w.booking();
  assert.equal(booking.status, 'cancelled');
  assert.equal(cents(booking.refund_amount), charge.amount_refunded);
});

test('A founder refunds part, then the rest: two real refunds, never more than was charged', async () => {
  const w = await world();
  const { intent } = await w.paid({ amount: 100 });
  const first = await w.call('releasePayout', { bookingId: w.bookingId, action: 'refund', amount: 40, actionId: 'harness-a' }, FOUNDER);
  assert.equal(first.data.ok, true, first.data.message);
  // The same confirmation sent twice refunds once.
  await w.call('releasePayout', { bookingId: w.bookingId, action: 'refund', amount: 40, actionId: 'harness-a' }, FOUNDER);
  let charge = await w.chargeOf(intent.id);
  assert.equal(charge.amount_refunded, 4000);

  const rest = await w.call('releasePayout', { bookingId: w.bookingId, action: 'refund', actionId: 'harness-b' }, FOUNDER);
  assert.equal(rest.data.ok, true, rest.data.message);
  charge = await w.chargeOf(intent.id);
  assert.equal(charge.amount_refunded, charge.amount, 'refunded in full, not beyond');
  const extra = await w.call('releasePayout', { bookingId: w.bookingId, action: 'refund', actionId: 'harness-c' }, FOUNDER);
  assert.equal(extra.data.ok, false);
  assert.equal((await w.booking()).status, 'cancelled');
});

test('Two stale Checkout pages both paid: two records, two separate real refunds', async () => {
  const w = await world();
  await w.quoteAndAccept({ amount: 300 });
  const a = await w.checkout();
  // Pay the old pages as if the client had them open in other tabs. Stripe
  // expires them when the quote changes, so they are paid before that.
  const sessionA = a.data.sessionId;
  await w.call('sendQuote', { bookingId: w.bookingId, amount: 200 }, CREATOR);
  const [second] = await w.entities.Quote.filter({ booking_id: w.bookingId, status: 'sent' });
  await w.call('acceptQuote', { quoteId: second.id }, CLIENT);
  const b = await w.checkout();
  const sessionB = b.data.sessionId;
  await w.call('sendQuote', { bookingId: w.bookingId, amount: 150 }, CREATOR);

  const paidA = await w.pay(sessionA);
  const paidB = await w.pay(sessionB);
  const strays = await w.entities.StrayPayment.filter({ booking_id: w.bookingId }, 'received_at');
  assert.equal(strays.length, 2);
  assert.deepEqual(strays.map((row) => row.amount), [342, 228]);
  assert.equal((await w.booking()).payment_status, 'pending', 'neither confirms the booking');

  for (const stray of strays) {
    const res = await w.call('releasePayout', { bookingId: w.bookingId, action: 'refund_stray', strayId: stray.id }, FOUNDER);
    assert.equal(res.data.ok, true, res.data.message);
  }
  assert.equal((await w.chargeOf(paidA.intent.id)).amount_refunded, 34200);
  assert.equal((await w.chargeOf(paidB.intent.id)).amount_refunded, 22800);
  const booking = await w.booking();
  assert.equal(booking.stray_payment_count, 0);
  assert.equal(booking.flagged_for_review, false);
});

test('A card dispute from the bank freezes the payout; winning it lifts the freeze', async () => {
  const w = await world();
  const { intent } = await w.paid({ amount: 100 }, { token: 'tok_createDispute' });
  const opened = await waitForEvent('charge.dispute.created', (object) => object.payment_intent === intent.id);
  assert.equal((await w.deliver(opened)).status, 200);
  let booking = await w.booking();
  assert.equal(booking.dispute_status, opened.data.object.status);
  assert.equal(booking.flagged_for_review, true);

  await w.deliveredAndDue();
  const release = await w.call('releasePayout', { bookingId: w.bookingId, action: 'release' }, FOUNDER);
  assert.equal(release.data.ok, false);
  assert.match(release.data.message, /dispute/i);
  const refund = await w.call('releasePayout', { bookingId: w.bookingId, action: 'refund', actionId: 'harness-d' }, FOUNDER);
  assert.equal(refund.data.ok, false, 'no refund on top of the bank taking the money');

  // Win it in Stripe's test mode, and pass Stripe's closing event back.
  await stripe('POST', `disputes/${opened.data.object.id}`, { evidence: { uncategorized_text: 'winning_evidence' }, submit: 'true' });
  const closed = await waitForEvent('charge.dispute.closed', (object) => object.id === opened.data.object.id, { timeoutMs: 180_000 });
  assert.equal(closed.data.object.status, 'won');
  assert.equal((await w.deliver(closed)).status, 200);
  booking = await w.booking();
  assert.equal(booking.dispute_status, 'won');
  assert.equal(booking.flagged_for_review, false);
});

test('Without finished payout setup, the payout sweep sends nothing and the money waits', async () => {
  const w = await world();
  await w.paid({ amount: 100 });
  // Their payout setup lapsed after they quoted.
  const [lensman] = await w.entities.Lensman.list();
  await w.entities.Lensman.update(lensman.id, { payouts_enabled: false, stripe_account_id: '' });
  await w.deliveredAndDue();
  const sweep = await w.call('releasePayouts', {}, FOUNDER);
  assert.equal(sweep.status, 200);
  const booking = await w.booking();
  assert.equal(booking.payment_status, 'held');
  assert.equal(booking.stripe_transfer_id || '', '');
  assert.equal(booking.needs_payout_setup, true);
});

test('A payout Stripe refuses (onboarding not finished) is recorded, and the money stays held', { skip: !UNFINISHED_ACCOUNT && 'set STELLI_TEST_UNFINISHED_ACCOUNT' }, async () => {
  const w = await world({ creatorAccount: UNFINISHED_ACCOUNT });
  const { intent } = await w.paid({ amount: 100 });
  await w.deliveredAndDue();
  const sweep = await w.call('releasePayouts', {}, FOUNDER);
  assert.equal(sweep.status, 200);
  const booking = await w.booking();
  assert.equal(booking.payment_status, 'held', 'nothing left the platform');
  assert.equal(booking.stripe_transfer_id || '', '');
  assert.ok(booking.payout_error, 'Stripe\'s reason is on the booking');
  assert.equal(Number(booking.payout_attempts), 1);
  const transfers = await stripe('GET', 'transfers', { transfer_group: `booking_${w.bookingId}` });
  assert.equal(transfers.data.length, 0);
  // And the client can still be refunded in full.
  const refund = await w.call('releasePayout', { bookingId: w.bookingId, action: 'refund', actionId: 'harness-f' }, FOUNDER);
  assert.equal(refund.data.ok, true, refund.data.message);
  assert.equal((await w.chargeOf(intent.id)).amount_refunded, 11400);
});

test('Payout to the creator: a real transfer of exactly their share, tied to the charge', { skip: !CREATOR_ACCOUNT && 'set STELLI_TEST_CREATOR_ACCOUNT' }, async () => {
  const w = await world({ creatorAccount: CREATOR_ACCOUNT });
  const { intent } = await w.paid({ amount: 100, addOns: [{ name: 'Rush delivery', price: 50 }], pick: ['Rush delivery'] });
  await w.deliveredAndDue();
  await w.call('releasePayouts', {}, FOUNDER);
  await w.call('releasePayouts', {}, FOUNDER); // a second sweep pays nothing more
  const booking = await w.booking();
  assert.equal(booking.payment_status, 'released');
  assert.ok(booking.stripe_transfer_id);
  const transfer = await stripe('GET', `transfers/${booking.stripe_transfer_id}`);
  assert.equal(transfer.amount, 12900, '$150 less 14%');
  assert.equal(transfer.destination, CREATOR_ACCOUNT);
  assert.equal(transfer.source_transaction, intent.latest_charge);
  assert.equal(transfer.transfer_group, `booking_${w.bookingId}`);
  const transfers = await stripe('GET', 'transfers', { transfer_group: `booking_${w.bookingId}` });
  assert.equal(transfers.data.length, 1, 'one transfer, however many sweeps');
});

test('Refund after the creator was paid: the client is refunded and the payout pulled back', { skip: !CREATOR_ACCOUNT && 'set STELLI_TEST_CREATOR_ACCOUNT' }, async () => {
  const w = await world({ creatorAccount: CREATOR_ACCOUNT });
  const { intent } = await w.paid({ amount: 100 });
  await w.deliveredAndDue();
  await w.call('releasePayouts', {}, FOUNDER);
  const paid = await w.booking();
  assert.equal(paid.payment_status, 'released');

  const refund = await w.call('releasePayout', { bookingId: w.bookingId, action: 'refund', actionId: 'harness-e' }, FOUNDER);
  assert.equal(refund.data.ok, true, refund.data.message);
  assert.equal((await w.chargeOf(intent.id)).amount_refunded, 11400);
  const transfer = await stripe('GET', `transfers/${paid.stripe_transfer_id}`);
  assert.equal(transfer.amount_reversed, 8600, 'the whole $86 payout came back');
  const booking = await w.booking();
  assert.equal(booking.reversal_status, 'done');
});

/** Stripe's newest account.updated event for the creator, as a Connect endpoint would get it. */
async function latestAccountUpdate(account) {
  const page = await stripe('GET', 'events', { type: 'account.updated', limit: 20 }, { account });
  const ready = page.data.find(
    (event) => event.data.object.capabilities?.transfers === 'active' && event.data.object.payouts_enabled === true
  );
  assert.ok(ready, 'Stripe has an account.updated event showing transfers active');
  return { ...ready, account };
}

test('Payout setup finishing (Stripe\'s account.updated event) switches payouts on and sends what was waiting', { skip: !CREATOR_ACCOUNT && 'set STELLI_TEST_CREATOR_ACCOUNT' }, async () => {
  const w = await world({ creatorAccount: CREATOR_ACCOUNT });
  await w.paid({ amount: 100 });
  const [lensman] = await w.entities.Lensman.list();
  await w.entities.Lensman.update(lensman.id, { payouts_enabled: false });
  await w.deliveredAndDue();
  await w.call('releasePayouts', {}, FOUNDER);
  assert.equal((await w.booking()).needs_payout_setup, true, 'the money waits while setup is unfinished');

  const event = await latestAccountUpdate(CREATOR_ACCOUNT);
  assert.equal((await w.deliver(event)).status, 200);
  assert.equal((await w.entities.Lensman.get(lensman.id)).payouts_enabled, true);
  const booking = await w.booking();
  assert.equal(booking.payment_status, 'released', 'what was waiting went out');
  const transfer = await stripe('GET', `transfers/${booking.stripe_transfer_id}`);
  assert.equal(transfer.amount, 8600);
  assert.equal(transfer.destination, CREATOR_ACCOUNT);
});

test('The creator\'s dashboard status check reads Stripe and does the same', { skip: !CREATOR_ACCOUNT && 'set STELLI_TEST_CREATOR_ACCOUNT' }, async () => {
  const w = await world({ creatorAccount: CREATOR_ACCOUNT });
  await w.paid({ amount: 100 });
  const [lensman] = await w.entities.Lensman.list();
  await w.entities.Lensman.update(lensman.id, { payouts_enabled: false });
  await w.deliveredAndDue();
  await w.call('releasePayouts', {}, FOUNDER);

  const status = await w.call('startPayoutSetup', { action: 'status' }, CREATOR);
  assert.equal(status.status, 200);
  assert.equal(status.data.payoutsEnabled, true);
  assert.equal(status.data.needsInfo, false);
  assert.equal(status.data.paidOut, 1);
  const booking = await w.booking();
  assert.equal(booking.payment_status, 'released');
  const transfers = await stripe('GET', 'transfers', { transfer_group: `booking_${w.bookingId}` });
  assert.equal(transfers.data.length, 1);
});

/** A New York date and time this many hours from now. */
function nyIn(hours) {
  const at = new Date(Date.now() + hours * 3_600_000);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
      .formatToParts(at)
      .map((part) => [part.type, part.value])
  );
  return { eventDate: `${parts.year}-${parts.month}-${parts.day}`, eventTime: `${parts.hour}:${parts.minute}` };
}

test('Cancelling 48 to 72 hours out: a real half refund, and the creator is paid their half', { skip: !CREATOR_ACCOUNT && 'set STELLI_TEST_CREATOR_ACCOUNT' }, async () => {
  const w = await world({ creatorAccount: CREATOR_ACCOUNT, ...nyIn(60) });
  const { intent } = await w.paid({ amount: 100 });
  const preview = await w.call('cancelBooking', { bookingId: w.bookingId, preview: true }, CLIENT);
  assert.equal(preview.data.tier, 'half', preview.data.message);

  const done = await w.call('cancelBooking', { bookingId: w.bookingId, reason: 'Sick' }, CLIENT);
  assert.equal(done.status, 200);
  const charge = await w.chargeOf(intent.id);
  assert.equal(charge.amount_refunded, cents(preview.data.refundAmount), 'Stripe refunded exactly the promised half');
  assert.ok(charge.amount_refunded > 0 && charge.amount_refunded < charge.amount);

  // The creator's half goes out (now, or with the next sweep), once, and no more.
  await w.call('releasePayouts', {}, FOUNDER);
  await w.call('releasePayouts', {}, FOUNDER);
  const transfers = await stripe('GET', 'transfers', { transfer_group: `booking_${w.bookingId}` });
  assert.equal(transfers.data.length, 1);
  assert.equal(transfers.data[0].amount, cents(preview.data.creatorShare));
  assert.equal(transfers.data[0].destination, CREATOR_ACCOUNT);
});
