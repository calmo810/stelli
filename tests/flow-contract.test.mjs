/**
 * Known issue 5: the booking agreement staying in step with the payment.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { CLIENT, CREATOR, STRANGER, scenario } from './helpers/scenario.mjs';

const contracts = (w) => w.entities.BookingContract.filter({ booking_id: 'b1' }, 'created_date');

test('K5: the agreement lists the shoot, each add-on and the totals on their own lines', async () => {
  const w = await scenario();
  await w.quoteAndAccept({
    amount: 100,
    addOns: [{ name: 'Rush delivery', price: 50 }, { name: 'Extra hour', price: 80 }],
    pick: ['Rush delivery'],
  });
  const [contract] = await contracts(w);
  assert.equal(contract.base_price, 100);
  assert.deepEqual(contract.add_on_lines, [{ name: 'Rush delivery', price: 50 }]);
  assert.equal(contract.creator_fee, 150, "the creator's price");
  assert.equal(contract.service_fee, 21);
  assert.equal(contract.total_paid, 171, 'what the client is charged');
  assert.equal(contract.creator_net, 129);

  const text = contract.contract_text;
  assert.match(text, /Shoot: \$100/);
  assert.match(text, /Add-on, Rush delivery: \$50/);
  assert.match(text, /Creator's price: \$150/);
  assert.match(text, /Total charged to the Client: \$171/);
  assert.doesNotMatch(text, /Extra hour/, 'an add-on that was not picked is not in the agreement');

  // What the agreement says is what Checkout charges.
  const checkout = await w.checkout();
  assert.equal(checkout.data.total, contract.total_paid);
});

test('K5: a new accepted quote gets a new agreement; the old one is kept but retired', async () => {
  const w = await scenario();
  await w.quoteAndAccept({ amount: 300 });
  const [first] = await contracts(w);

  await w.quoteAndAccept({ amount: 200, addOns: [{ name: 'Prints', price: 25 }], pick: ['Prints'] });
  const all = await contracts(w);
  assert.equal(all.length, 2);
  const old = all.find((c) => c.id === first.id);
  const current = all.find((c) => c.id !== first.id);
  assert.equal(old.status, 'superseded');
  assert.equal(old.total_paid, 342, 'the old agreement is not rewritten');
  assert.equal(current.status, 'active');
  assert.equal(current.total_paid, 256.5);
  assert.equal((await w.booking()).contract_id, current.id);

  const checkout = await w.checkout();
  assert.equal(checkout.data.total, 256.5);
});

test('K5: sending a new quote retires the agreement and both acceptances', async () => {
  const w = await scenario();
  await w.quoteAndAccept({ amount: 300 });
  await w.call('acceptBookingContract', { bookingId: 'b1' }, CREATOR);
  assert.equal((await w.booking()).creator_contract_accepted, true);

  await w.call('sendQuote', { bookingId: 'b1', amount: 250 }, CREATOR);
  const booking = await w.booking();
  assert.equal(booking.client_contract_accepted, false);
  assert.equal(booking.creator_contract_accepted, false);
  assert.equal(booking.contract_id, '');
  assert.equal((await contracts(w))[0].status, 'superseded');
});

test('K5: accepting the same quote twice writes one agreement and never changes the add-ons', async () => {
  const w = await scenario();
  const sent = await w.call('sendQuote', { bookingId: 'b1', amount: 100, addOns: [{ name: 'Rush', price: 50 }] }, CREATOR);
  await w.call('acceptQuote', { quoteId: sent.data.quote.id, pickedAddOns: [{ name: 'Rush' }] }, CLIENT);
  const again = await w.call('acceptQuote', { quoteId: sent.data.quote.id, pickedAddOns: [] }, CLIENT);
  assert.equal(again.data.alreadyAccepted, true);
  assert.equal((await contracts(w)).length, 1);
  assert.equal((await w.booking()).total_price, 150);
});

test('K5: accepting a quote records the client\'s acceptance on the booking', async () => {
  const w = await scenario();
  await w.quoteAndAccept({ amount: 100 });
  const booking = await w.booking();
  assert.equal(booking.client_contract_accepted, true);
  assert.ok(booking.client_contract_accepted_at);
  const [contract] = await contracts(w);
  assert.ok(contract.client_accepted_at);
  const records = await w.entities.AgreementAcceptance.filter({ booking_id: 'b1', user_id: CLIENT.id });
  assert.equal(records.length, 1);
});

test('K5: the creator accepting after payment leaves the booking confirmed', async () => {
  const w = await scenario();
  await w.paid({ amount: 100 });
  assert.equal((await w.booking()).status, 'confirmed');

  const res = await w.call('acceptBookingContract', { bookingId: 'b1' }, CREATOR);
  assert.equal(res.status, 200);
  assert.equal(res.data.bothSigned, true);
  const booking = await w.booking();
  assert.equal(booking.status, 'confirmed', 'not pushed back to awaiting_creator_acceptance');
  assert.equal(booking.creator_contract_accepted, true);
  assert.equal(booking.payment_status, 'held');

  // Both sides get a copy with a real link, once.
  const copies = w.db.emails.filter((e) => /booking agreement/.test(e.subject));
  assert.equal(copies.length, 2);
  assert.match(copies[0].body, /https:\/\/getstelli\.com\/agreements\//);
  await w.call('acceptBookingContract', { bookingId: 'b1' }, CREATOR);
  assert.equal(w.db.emails.filter((e) => /booking agreement/.test(e.subject)).length, 2);
});

test('K5: both sides accepting does not confirm a booking nobody has paid for', async () => {
  const w = await scenario();
  await w.quoteAndAccept({ amount: 100 });
  const res = await w.call('acceptBookingContract', { bookingId: 'b1' }, CREATOR);
  assert.equal(res.data.confirmed, false);
  const booking = await w.booking();
  assert.equal(booking.status, 'quote_accepted');
  assert.equal(booking.payment_status, 'pending');
});

test('K5: accepting the agreement can\'t un-cancel a booking, and strangers can\'t sign', async () => {
  const w = await scenario();
  await w.quoteAndAccept({ amount: 100 });
  assert.equal((await w.call('acceptBookingContract', { bookingId: 'b1' }, STRANGER)).status, 403);
  await w.entities.Booking.update('b1', { status: 'cancelled' });
  assert.equal((await w.call('acceptBookingContract', { bookingId: 'b1' }, CREATOR)).status, 409);
  assert.equal((await w.booking()).status, 'cancelled');
});

test('K5: the contract is readable by the creator\'s login email, not a typed contact address', async () => {
  const w = await scenario();
  await w.entities.CreatorContact.updateMany({ lensman_id: 'l1' }, { $set: { email: 'studio@elsewhere.example' } });
  await w.quoteAndAccept({ amount: 100 });
  const [contract] = await contracts(w);
  assert.equal(contract.creator_email, CREATOR.email);
  assert.equal(contract.creator_name, 'Maya Ortiz');
});
