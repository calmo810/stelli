/**
 * Known issue 6 and step 5: the memory album and delivery.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { CLIENT, CREATOR, FOUNDER, STRANGER, scenario } from './helpers/scenario.mjs';
import { galleryLinkProblem, newAlbumToken, tokenMatches } from '../base44/shared/albumAccess.ts';

const LINK = 'https://maya.pixieset.com/jordan';

async function withPhotos(w, count = 3) {
  const files = Array.from({ length: count }, (_, i) => ({ file_uri: `private/b1/${i}.jpg`, name: `Photo ${i}` }));
  return w.call('deliveryPhotos', { bookingId: 'b1', action: 'add', files }, CREATOR);
}
const album = (w, token, user = null) => w.call('getAlbumBooking', { bookingId: 'b1', token }, user);

test('tokens are long, random and compared safely', () => {
  const a = newAlbumToken();
  assert.equal(a.length, 64);
  assert.notEqual(a, newAlbumToken());
  assert.equal(tokenMatches(a, a), true);
  assert.equal(tokenMatches(` ${a} `, a), true);
  assert.equal(tokenMatches(a.slice(0, 63), a), false);
  assert.equal(tokenMatches('', a), false);
  assert.equal(tokenMatches(a, ''), false);
  assert.equal(tokenMatches(undefined, undefined), false);
});

test('a gallery link has to be a real web address', () => {
  assert.equal(galleryLinkProblem(LINK), '');
  assert.equal(galleryLinkProblem('https://www.dropbox.com/sh/abc?dl=0'), '');
  assert.equal(galleryLinkProblem(''), '', 'a link is optional');
  // The value found on a live booking: a file path that "starts with https://".
  assert.notEqual(galleryLinkProblem('https://Users/someone/Downloads/29708d66b_stelli-hero-mockup.html'), '');
  assert.notEqual(galleryLinkProblem('http://maya.pixieset.com/jordan'), '');
  assert.notEqual(galleryLinkProblem('javascript:alert(1)'), '');
  assert.notEqual(galleryLinkProblem('data:text/html,<script>'), '');
  assert.notEqual(galleryLinkProblem('https://localhost/gallery'), '');
  assert.notEqual(galleryLinkProblem('https://user:pass@gallery.example.com'), '');
  assert.notEqual(galleryLinkProblem('not a link'), '');
});

test('the album opens with the token; a wrong token and a missing booking answer the same', async () => {
  const w = await scenario();
  await w.paid({ amount: 100 });
  await withPhotos(w);
  const token = (await w.booking()).album_token;
  assert.ok(token, 'the first upload mints the token for the email link');

  const guest = await album(w, token);
  assert.equal(guest.status, 200);
  assert.equal(guest.data.photos.length, 3);

  const wrong = await album(w, 'not-the-token');
  const noToken = await album(w, '');
  const missing = await w.call('getAlbumBooking', { bookingId: 'no-such-booking', token }, null);
  for (const res of [wrong, noToken, missing]) {
    assert.equal(res.status, 404);
    assert.deepEqual(res.data, { error: 'Album not found' });
  }
  // A signed-in stranger with no token gets the same answer.
  assert.deepEqual((await album(w, '', STRANGER)).data, { error: 'Album not found' });
});

test('the album shows photos and nothing private', async () => {
  const w = await scenario();
  await w.paid({ amount: 100 });
  await withPhotos(w);
  const token = (await w.booking()).album_token;
  const guest = await album(w, token);
  const text = JSON.stringify(guest.data);
  for (const secret of [CLIENT.email, CREATOR.email, 'Jordan', '114', 'held', 'confirmed', 'pi_', 'ch_', 'private/b1']) {
    assert.equal(text.includes(secret), false, `album leaked "${secret}"`);
  }
  assert.deepEqual(Object.keys(guest.data.booking).sort(), [
    'album_token', 'delivered_at', 'delivery_link', 'event_date', 'event_type', 'id', 'lensman_name',
  ]);
  assert.equal(guest.data.canResetLink, false);
});

test('the client and creator open their album without a token; only the client may reset it', async () => {
  const w = await scenario();
  await w.paid({ amount: 100 });
  await withPhotos(w);
  assert.equal((await album(w, '', CLIENT)).data.canResetLink, true);
  assert.equal((await album(w, '', CREATOR)).data.canResetLink, false);
  assert.equal((await album(w, '', FOUNDER)).data.canResetLink, true);
});

test('K6: resetting the link cuts the old one off for everyone', async () => {
  const w = await scenario();
  await w.paid({ amount: 100 });
  await withPhotos(w);
  const oldToken = (await w.booking()).album_token;
  assert.equal((await album(w, oldToken)).status, 200);

  // Not the creator, not a stranger — and a stranger can't tell the booking exists.
  assert.equal((await w.call('resetAlbumLink', { bookingId: 'b1' }, CREATOR)).status, 404);
  assert.equal((await w.call('resetAlbumLink', { bookingId: 'b1' }, STRANGER)).status, 404);
  assert.equal((await w.call('resetAlbumLink', { bookingId: 'b1' }, null)).status, 401);
  assert.equal((await w.booking()).album_token, oldToken);

  const reset = await w.call('resetAlbumLink', { bookingId: 'b1' }, CLIENT);
  assert.equal(reset.status, 200);
  assert.notEqual(reset.data.album_token, oldToken);
  assert.equal((await album(w, oldToken, null)).status, 404, 'the leaked link is dead');
  assert.equal((await album(w, reset.data.album_token, null)).status, 200);

  // A founder can do it too.
  assert.equal((await w.call('resetAlbumLink', { bookingId: 'b1' }, FOUNDER)).status, 200);
});

test('K6: final delivery happens once — a second "delivered" can\'t restart the 48 hours', async () => {
  const w = await scenario();
  await w.paid({ amount: 100 });
  const first = await w.call('markDelivered', { bookingId: 'b1', deliveryLink: LINK, step: 'final' }, CREATOR);
  assert.equal(first.status, 200);
  const before = await w.booking();
  assert.equal(before.status, 'delivered');

  await new Promise((r) => setTimeout(r, 15));
  const again = await w.call('markDelivered', { bookingId: 'b1', deliveryLink: 'https://other.example.com/x', step: 'final' }, CREATOR);
  assert.equal(again.status, 409);
  const unedited = await w.call('markDelivered', { bookingId: 'b1', deliveryLink: LINK, step: 'unedited' }, CREATOR);
  assert.equal(unedited.status, 409);

  const after = await w.booking();
  assert.equal(after.delivered_at, before.delivered_at);
  assert.equal(after.release_due_at, before.release_due_at);
  assert.equal(after.delivery_link, LINK, 'the delivered link can\'t be swapped either');
});

test('K6: two "delivered" taps at once set one window', async () => {
  const w = await scenario();
  await w.paid({ amount: 100 });
  const handler = (await import('../base44/functions/markDelivered/entry.ts')).default;
  const request = () =>
    new Request('https://stelli.test/fn', { method: 'POST', body: JSON.stringify({ bookingId: 'b1', deliveryLink: LINK, step: 'final' }) });
  w.db.currentUser = CREATOR;
  const responses = await Promise.all([handler(request()), handler(request())]);
  assert.deepEqual(responses.map((r) => r.status).sort(), [200, 409]);
  assert.equal((await w.entities.PhotoRelease.list()).length, 1);
});

test('K6: delivery needs a paid, open booking and the booked creator', async () => {
  const w = await scenario();
  await w.quoteAndAccept({ amount: 100 }); // accepted, not paid
  assert.equal((await w.call('markDelivered', { bookingId: 'b1', deliveryLink: LINK }, CREATOR)).status, 409);
  assert.equal((await withPhotos(w)).status, 409);

  const checkout = await w.checkout();
  await w.pay(checkout.data.sessionId);
  assert.equal((await w.call('markDelivered', { bookingId: 'b1', deliveryLink: LINK }, CLIENT)).status, 403);
  assert.equal((await w.call('markDelivered', { bookingId: 'b1', deliveryLink: LINK }, STRANGER)).status, 403);
  assert.equal((await w.call('markDelivered', { bookingId: 'b1', deliveryLink: 'https://Users/me/x.html' }, CREATOR)).status, 400);
  assert.equal((await w.call('markDelivered', { bookingId: 'b1', step: 'final' }, CREATOR)).status, 400, 'nothing to deliver');

  await w.entities.Booking.update('b1', { status: 'cancelled' });
  assert.equal((await w.call('markDelivered', { bookingId: 'b1', deliveryLink: LINK }, CREATOR)).status, 409);
});

test('K6: after final delivery the creator can\'t add or remove photos; a founder still can remove', async () => {
  const w = await scenario();
  await w.paid({ amount: 100 });
  await withPhotos(w, 3);
  const listed = await w.call('deliveryPhotos', { bookingId: 'b1', action: 'list' }, CREATOR);
  const [one, two] = listed.data.photos;

  // Before delivery the creator may still take one back.
  assert.equal((await w.call('deliveryPhotos', { bookingId: 'b1', action: 'remove', photoId: one.id }, CREATOR)).status, 200);

  await w.call('markDelivered', { bookingId: 'b1', step: 'final' }, CREATOR);
  assert.equal((await w.call('deliveryPhotos', { bookingId: 'b1', action: 'remove', photoId: two.id }, CREATOR)).status, 409);
  assert.equal((await withPhotos(w, 1)).status, 409);
  assert.equal((await w.call('deliveryPhotos', { bookingId: 'b1', action: 'list' }, CLIENT)).data.photos.length, 2);

  // Never the client, never a stranger.
  assert.equal((await w.call('deliveryPhotos', { bookingId: 'b1', action: 'remove', photoId: two.id }, CLIENT)).status, 403);
  assert.equal((await w.call('deliveryPhotos', { bookingId: 'b1', action: 'list' }, STRANGER)).status, 403);

  assert.equal((await w.call('deliveryPhotos', { bookingId: 'b1', action: 'remove', photoId: two.id }, FOUNDER)).status, 200);
});

test('delivery emails carry the album link with its token', async () => {
  const w = await scenario();
  await w.paid({ amount: 100 });
  await withPhotos(w);
  await w.call('markDelivered', { bookingId: 'b1', step: 'final' }, CREATOR);
  const token = (await w.booking()).album_token;
  const mails = w.emailsTo(CLIENT.email).filter((e) => /photos/i.test(e.subject));
  assert.ok(mails.length >= 2);
  for (const mail of mails) assert.match(mail.body, new RegExp(`https://getstelli\\.com/album/b1\\?t=${token}`));
});
