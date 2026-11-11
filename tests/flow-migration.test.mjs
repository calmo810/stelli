/**
 * D5: the one-off backfill that lets access match on account IDs only.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { CLIENT, CREATOR, FOUNDER, scenario } from './helpers/scenario.mjs';

async function messyWorld() {
  const w = await scenario();
  // The shapes found in the live data: a booking with no client ID, a quote
  // carrying the creator PROFILE's ID, an agreement with no account ID.
  await w.entities.Booking.update('b1', { client_id: '', creator_id: '' });
  await w.entities.Quote.create({ id: 'q-old', booking_id: 'b1', client_id: '', creator_id: 'l1', amount: 50, status: 'superseded' });
  await w.entities.Message.create({ id: 'm-old', booking_id: 'b1', client_id: '', creator_id: CREATOR.id, content: 'hi' });
  await w.entities.BookingContract.create({ id: 'c-old', booking_id: 'b1', client_id: '', creator_id: 'l1' });
  await w.entities.BookingContract.create({ id: 'c-orphan', booking_id: 'gone', client_id: FOUNDER.id, creator_id: 'nobody' });
  return w;
}

test('a dry run reports what it would change and writes nothing', async () => {
  const w = await messyWorld();
  const res = await w.call('migrateRecordOwners', {}, FOUNDER);
  assert.equal(res.data.dryRun, true);
  assert.equal(res.data.bookings, 1);
  assert.equal(res.data.quotes, 1);
  assert.equal(res.data.messages, 1);
  assert.equal(res.data.contracts, 1);
  assert.equal((await w.booking()).client_id, '', 'nothing written');
});

test('the real run fills in account IDs everywhere, and a second run changes nothing', async () => {
  const w = await messyWorld();
  const res = await w.call('migrateRecordOwners', { dryRun: false }, FOUNDER);
  assert.equal(res.data.dryRun, false);

  const booking = await w.booking();
  assert.equal(booking.client_id, CLIENT.id);
  assert.equal(booking.creator_id, CREATOR.id);
  assert.equal((await w.entities.Quote.get('q-old')).creator_id, CREATOR.id, 'profile ID replaced by the account ID');
  assert.equal((await w.entities.Message.get('m-old')).client_id, CLIENT.id);
  const contract = await w.entities.BookingContract.get('c-old');
  assert.equal(contract.creator_user_id, CREATOR.id);
  assert.equal(contract.creator_id, 'l1', 'the profile ID stays where other code expects it');

  // The orphan can't be resolved: listed by ID only, no names or emails.
  assert.ok(res.data.unresolved.some((u) => u.id === 'c-orphan'));
  assert.equal(JSON.stringify(res.data.unresolved).includes('@'), false);

  const again = await w.call('migrateRecordOwners', { dryRun: false }, FOUNDER);
  assert.equal(again.data.bookings + again.data.quotes + again.data.messages + again.data.contracts, 0);
  assert.ok((await w.entities.AdminAuditLog.list()).some((e) => e.action === 'migrate_data'));
});

test('only a founder can run it', async () => {
  const w = await messyWorld();
  for (const user of [CLIENT, CREATOR, null]) {
    assert.equal((await w.call('migrateRecordOwners', { dryRun: false }, user)).status, 403);
  }
  assert.equal((await w.booking()).client_id, '');
});
