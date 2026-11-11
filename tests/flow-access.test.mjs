/**
 * Step 4: who may call what, and in which state. Each function is called as
 * the client, the creator, a stranger and a founder against the fake database.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { CLIENT, CREATOR, FOUNDER, STRANGER, scenario } from './helpers/scenario.mjs';
import { buildProfilePatch } from '../base44/shared/profileRules.ts';

const request = (w, body, user = STRANGER) =>
  w.call(
    'submitBookingRequest',
    { lensmanId: 'l1', eventDate: '2027-06-20', eventTime: '14:00', brief: 'Family portraits in the park.', ...body },
    user
  );

/* ---------------- booking requests ---------------- */

test('a request reaches an approved creator, once, however many times it is tapped', async () => {
  const w = await scenario();
  const [a, b] = [await request(w), await request(w)];
  assert.equal(a.status, 200);
  assert.equal(b.data.duplicate, true);
  assert.equal(a.data.booking.id, b.data.booking.id);
  assert.equal(w.emailsTo(CREATOR.email).filter((e) => /New request/.test(e.subject)).length, 1);
});

test('you can\'t book a creator who is pending, rejected, on hold, missing — or yourself', async () => {
  const w = await scenario();
  assert.equal((await request(w, {}, CREATOR)).status, 400, 'own profile');
  for (const patch of [{ status: 'pending' }, { status: 'rejected' }, { status: 'approved', under_review: true }]) {
    await w.entities.Lensman.update('l1', { status: 'approved', under_review: false, ...patch });
    assert.equal((await request(w)).status, 404, JSON.stringify(patch));
  }
  assert.equal((await request(w, { lensmanId: 'nope' })).status, 404);
  assert.equal((await request(w, {}, null)).status, 401);
});

test('a request needs a real, future date and a note without contact details', async () => {
  const w = await scenario();
  assert.equal((await request(w, { eventDate: '2020-01-01' })).status, 400);
  assert.equal((await request(w, { eventDate: 'next week' })).status, 400);
  assert.equal((await request(w, { eventDate: '2099-01-01' })).status, 400);
  assert.equal((await request(w, { eventTime: 'afternoon' })).status, 400);
  assert.equal((await request(w, { brief: '' })).status, 400);
  assert.equal((await request(w, { brief: 'x'.repeat(2001) })).status, 400);
  const withPhone = await request(w, { brief: 'Text me on 336 555 0142 to sort it out' });
  assert.equal(withPhone.status, 400);
  assert.equal(withPhone.data.blocked, true);
  // An ordinary note with a date and a time in it goes through.
  assert.equal((await request(w, { brief: 'Grad photos for 12 of us, Dec 14 2026 at 3:30, for my ig' })).status, 200);
});

test('budget and length are optional, kept short, and can\'t carry contact details either', async () => {
  const w = await scenario();
  const blocked = await request(w, { budget: 'about $300, call 336 555 0142' });
  assert.equal(blocked.status, 400);
  assert.equal(blocked.data.blocked, true);
  const ok = await request(w, { budget: 'Around $300', duration: '2 hours' + ' '.repeat(5) + 'x'.repeat(200) });
  assert.equal(ok.status, 200);
  const booking = await w.entities.Booking.get(ok.data.booking.id);
  assert.equal(booking.budget, 'Around $300');
  assert.ok(booking.duration.length <= 60);
});

/* ---------------- contact details ---------------- */

test('contact details unlock for the client only, and only once the booking is paid', async () => {
  const w = await scenario();
  await w.quoteAndAccept({ amount: 100 });
  const contact = (user) => w.call('getBookingContact', { bookingId: 'b1' }, user);

  assert.equal((await contact(CLIENT)).status, 403, 'accepted but unpaid');
  // A status alone is not enough.
  await w.entities.Booking.update('b1', { status: 'confirmed' });
  assert.equal((await contact(CLIENT)).status, 403, '"confirmed" with no money');
  await w.entities.Booking.update('b1', { status: 'quote_accepted' });

  await w.pay((await w.checkout()).data.sessionId);
  const ok = await contact(CLIENT);
  assert.equal(ok.status, 200);
  assert.deepEqual(Object.keys(ok.data.contact).sort(), ['email', 'instagram', 'phone']);
  assert.equal(JSON.stringify(ok.data).includes('Maya Ortiz'), false, 'the real name stays private');

  assert.equal((await contact(STRANGER)).status, 403);
  assert.equal((await contact(CREATOR)).status, 403);
  assert.equal((await contact(null)).status, 401);

  // Cancelled: locked again.
  await w.entities.Booking.update('b1', { status: 'cancelled' });
  assert.equal((await contact(CLIENT)).status, 403);
});

test('messages can\'t carry contact details until the booking is paid; strangers can\'t post', async () => {
  const w = await scenario();
  const say = (content, user) => w.call('sendMessage', { bookingId: 'b1', content }, user);
  assert.equal((await say('Hi, is the afternoon free?', CLIENT)).status, 200);
  assert.equal((await say('just text me 336 555 0142', CREATOR)).status, 400);
  assert.equal((await say('hello', STRANGER)).status, 403);
  // A quote note is a message too.
  const quote = await w.call('sendQuote', { bookingId: 'b1', amount: 100, message: 'Email me at maya@example.com' }, CREATOR);
  assert.equal(quote.status, 400);
  const addOn = await w.call('sendQuote', { bookingId: 'b1', amount: 100, addOns: [{ name: 'DM @maya.shoots', price: 5 }] }, CREATOR);
  assert.equal(addOn.status, 400);

  await w.paid({ amount: 100 });
  assert.equal((await say('My number is 336 555 0142', CREATOR)).status, 200, 'unlocked once paid');
});

test('only the creator on a booking can quote it, and only the client can accept or pay', async () => {
  const w = await scenario();
  assert.equal((await w.call('sendQuote', { bookingId: 'b1', amount: 100 }, CLIENT)).status, 403);
  assert.equal((await w.call('sendQuote', { bookingId: 'b1', amount: 100 }, STRANGER)).status, 403);
  const sent = await w.call('sendQuote', { bookingId: 'b1', amount: 100 }, CREATOR);
  assert.equal((await w.call('acceptQuote', { quoteId: sent.data.quote.id }, CREATOR)).status, 403);
  assert.equal((await w.call('acceptQuote', { quoteId: sent.data.quote.id }, STRANGER)).status, 403);
  assert.equal((await w.call('acceptQuote', { quoteId: sent.data.quote.id }, CLIENT)).status, 200);
});

/* ---------------- legal acceptance records ---------------- */

test('acceptance records can\'t be forged', async () => {
  const w = await scenario();
  const record = (body, user = CLIENT) => w.call('recordAgreementAcceptance', body, user);
  assert.equal((await record({ documentType: 'terms', documentVersion: '2026-10-22' })).status, 200);
  assert.equal((await record({ documentType: 'terms', documentVersion: '2026-10-22' })).data.alreadyRecorded, true);
  assert.equal((await record({ documentType: 'booking_contract', documentVersion: '2026-10-22', bookingId: 'b1' })).status, 400);
  assert.equal((await record({ documentType: 'terms', documentVersion: '9999-forged' })).status, 400);
  assert.equal((await record({ documentType: 'terms', documentVersion: '2026-10-22' }, null)).status, 401);
  const rows = await w.entities.AgreementAcceptance.list();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].booking_id, '');
});

/* ---------------- declining a quote ---------------- */

test('only the client declines, only an open quote, and never on a paid booking', async () => {
  const w = await scenario();
  const sent = await w.call('sendQuote', { bookingId: 'b1', amount: 100 }, CREATOR);
  const decline = (user, reason) => w.call('declineQuote', { quoteId: sent.data.quote.id, reason }, user);
  assert.equal((await decline(CREATOR)).status, 403);
  assert.equal((await decline(STRANGER)).status, 403);
  assert.equal((await decline(CLIENT, 'Out of budget, call me 336 555 0142')).status, 200);
  assert.equal((await w.booking()).status, 'requested');
  assert.equal(JSON.stringify(w.db.emails).includes('555 0142'), false, 'a phone number in the reason is not passed on');
  assert.equal((await decline(CLIENT)).status, 409, 'already declined');

  // A paid booking stays confirmed whatever happens to stray quotes.
  await w.paid({ amount: 100 });
  const stray = await w.entities.Quote.create({ booking_id: 'b1', status: 'sent', amount: 5 });
  await w.call('declineQuote', { quoteId: stray.id }, CLIENT);
  assert.equal((await w.booking()).status, 'confirmed');
});

/* ---------------- reviews ---------------- */

async function completed(w) {
  await w.deliveredAndDue({ amount: 100 });
  await w.call('releasePayouts', {}, FOUNDER);
}

test('one review, by the client, after the shoot is completed — with a first name only', async () => {
  const w = await scenario();
  await w.paid({ amount: 100 });
  const review = (user, body = {}) => w.call('submitReview', { bookingId: 'b1', rating: 5, comment: 'Loved it.', ...body }, user);
  assert.equal((await review(CLIENT)).status, 400, 'not completed yet');

  await w.entities.Booking.update('b1', {
    status: 'delivered',
    delivered_at: new Date(Date.now() - 50 * 3_600_000).toISOString(),
    release_due_at: new Date(Date.now() - 3_600_000).toISOString(),
  });
  await w.call('releasePayouts', {}, FOUNDER);

  assert.equal((await review(CREATOR)).status, 403, 'a creator can\'t review their own shoot');
  assert.equal((await review(STRANGER)).status, 403);
  assert.equal((await review(CLIENT, { rating: 9 })).status, 400);
  assert.equal((await review(CLIENT, { comment: 'Book direct: maya@example.com' })).status, 400);

  const [first, second] = await Promise.all([review(CLIENT), review(CLIENT)]);
  assert.deepEqual([first.status, second.status].sort(), [200, 409]);
  assert.equal((await review(CLIENT)).status, 409);

  const reviews = await w.entities.Review.list();
  assert.equal(reviews.length, 1);
  assert.equal(reviews[0].client_name, 'Jordan L.');
  assert.equal(reviews[0].client_id, undefined, 'no user ID on a public record');
  assert.equal(JSON.stringify(reviews[0]).includes(CLIENT.email), false);
  const lensman = await w.entities.Lensman.get('l1');
  assert.equal(lensman.review_count, 1);
  assert.equal(lensman.avg_rating, 5);
});

test('the third low rating files one report for the founders, not one per review', async () => {
  const w = await scenario();
  await completed(w);
  for (const id of ['r1', 'r2']) {
    await w.entities.Review.create({ id, booking_id: `old-${id}`, lensman_id: 'l1', rating: 1 });
  }
  await w.call('submitReview', { bookingId: 'b1', rating: 2 }, CLIENT);
  const reports = await w.entities.Report.filter({ reason: 'low_ratings' });
  assert.equal(reports.length, 1);
  assert.ok(w.emailsTo(FOUNDER.email).some((e) => /three low ratings/.test(e.subject)));
});

/* ---------------- reports ---------------- */

test('a report must be about your own booking, and names the other side', async () => {
  const w = await scenario();
  const report = (user, body = {}) =>
    w.call('fileReport', { bookingId: 'b1', reason: 'behavior', details: 'Rude in messages.', ...body }, user);
  assert.equal((await report(STRANGER)).status, 403);
  assert.equal((await report(null)).status, 401);
  assert.equal((await report(CLIENT, { reason: 'made-up' })).status, 400);
  assert.equal((await report(CLIENT, { details: '' })).status, 400);

  assert.equal((await report(CLIENT)).status, 200);
  assert.equal((await report(CLIENT)).status, 409, 'the same report twice');
  assert.equal((await report(CREATOR, { reason: 'off_platform_booking', details: 'Asked to pay cash.' })).status, 200);

  const rows = await w.entities.Report.list('created_date');
  assert.equal(rows[0].reported_lensman_id, 'l1');
  assert.equal(rows[0].reported_email, CREATOR.email);
  assert.equal(rows[1].reported_email, CLIENT.email);
  assert.equal(rows[1].reported_lensman_id, '');
  assert.equal((await w.entities.Lensman.get('l1')).under_review, undefined, 'an ordinary report holds nobody');
});

test('a no-show report on a paid shoot freezes the payment and puts the creator on hold', async () => {
  const w = await scenario({ eventDate: '2026-11-01', eventTime: '10:00' });
  // Paid while the date was still ahead; the shoot time has since passed.
  await w.entities.Booking.update('b1', { event_date: '2027-06-12' });
  await w.paid({ amount: 100 });
  await w.entities.Booking.update('b1', { event_date: '2026-11-01' });

  const res = await w.call('fileReport', { bookingId: 'b1', reason: 'no_show', details: 'Nobody came.' }, CLIENT);
  assert.equal(res.status, 200);
  assert.equal(res.data.frozen, true);
  assert.equal(res.data.creatorOnHold, true);

  const booking = await w.booking();
  assert.equal(booking.flagged_for_review, true);
  assert.equal(booking.payment_status, 'held');
  assert.equal((await w.entities.Lensman.get('l1')).under_review, true);
  await w.call('releasePayouts', {}, FOUNDER);
  assert.equal(w.stripe.transfers.size, 0);

  // On hold: no new requests. A founder lifts it in one call.
  assert.equal((await request(w)).status, 404);
  const lift = await w.call('reviewCreator', { lensmanId: 'l1', decision: 'unhold' }, FOUNDER);
  assert.equal(lift.data.ok, true);
  assert.equal((await request(w)).status, 200);
});

/* ---------------- creators and their profiles ---------------- */

test('only a founder approves, rejects or holds a creator — and the creator is emailed once', async () => {
  const w = await scenario();
  await w.entities.Lensman.update('l1', { status: 'pending' });
  const decide = (decision, user = FOUNDER) => w.call('reviewCreator', { lensmanId: 'l1', decision }, user);
  for (const user of [CLIENT, CREATOR, STRANGER, null]) {
    assert.equal((await decide('approve', user)).status, 403);
  }
  assert.equal((await w.entities.Lensman.get('l1')).status, 'pending', 'a creator can\'t approve themselves');

  assert.equal((await decide('approve')).data.ok, true);
  assert.equal((await w.entities.Lensman.get('l1')).status, 'approved');
  // The workflow fires as well; between them, one email.
  await w.call('notifyCreatorStatus', { lensman_id: 'l1' }, FOUNDER);
  await decide('approve');
  assert.equal(w.emailsTo(CREATOR.email).filter((e) => /live on Stelli/.test(e.subject)).length, 1);

  const log = await w.entities.AdminAuditLog.filter({ lensman_id: 'l1' });
  assert.ok(log.some((entry) => entry.action === 'approve_creator' && entry.actor_email === FOUNDER.email));
});

test('the Applications tab: founders only, pending only, one email, logged', async () => {
  const w = await scenario();
  await w.entities.Lensman.update('l1', { status: 'pending' });
  const review = (decision, user = FOUNDER) =>
    w.call('reviewCreatorApplication', { lensmanId: 'l1', decision }, user);

  assert.equal((await review('approved', null)).status, 401);
  for (const user of [CLIENT, CREATOR, STRANGER]) {
    assert.equal((await review('approved', user)).status, 404, 'a non-founder is told it does not exist');
  }
  assert.equal((await w.entities.Lensman.get('l1')).status, 'pending');
  assert.equal((await review('maybe')).status, 400);

  const done = await review('approved');
  assert.equal(done.status, 200);
  assert.equal(done.data.updated, true);
  assert.equal((await w.entities.Lensman.get('l1')).status, 'approved');
  // The workflow fires on the status change too; between them, one email.
  await w.call('notifyCreatorStatus', { lensman_id: 'l1' }, FOUNDER);
  assert.equal(w.emailsTo(CREATOR.email).filter((e) => /live on Stelli/.test(e.subject)).length, 1);

  // Pressing again changes nothing; the other decision is refused.
  assert.equal((await review('approved')).data.updated, false);
  assert.equal((await review('rejected')).status, 409);
  assert.equal((await w.entities.Lensman.get('l1')).status, 'approved');

  const log = await w.entities.AdminAuditLog.filter({ lensman_id: 'l1' });
  assert.equal(log.filter((entry) => entry.action === 'approve_creator').length, 1);
});

test('two founders deciding the same application at once: one decision wins', async () => {
  const w = await scenario();
  await w.entities.Lensman.update('l1', { status: 'pending' });
  const [a, b] = await Promise.all([
    w.call('reviewCreatorApplication', { lensmanId: 'l1', decision: 'approved' }, FOUNDER),
    w.call('reviewCreatorApplication', { lensmanId: 'l1', decision: 'rejected' }, FOUNDER),
  ]);
  const status = (await w.entities.Lensman.get('l1')).status;
  assert.ok(['approved', 'rejected'].includes(status));
  const winners = [a, b].filter((res) => res.status === 200 && res.data.updated);
  assert.equal(winners.length, 1);
  assert.equal(winners[0].data.application.status, status);
  assert.equal(w.db.emails.filter((e) => e.to === CREATOR.email).length <= 1, true);
});

test('a profile save can only touch the caller\'s own profile, and never its status or payouts', async () => {
  const w = await scenario();
  await w.entities.Lensman.create({ id: 'l2', user_id: 'someone-else', display_name: 'Other', status: 'pending' });
  const res = await w.call(
    'updateCreatorProfile',
    {
      display_name: 'Maya O',
      bio: 'Portraits and events.',
      status: 'approved',
      under_review: false,
      payouts_enabled: true,
      stripe_account_id: 'acct_attacker',
      avg_rating: 5,
      user_id: 'someone-else',
      id: 'l2',
    },
    CREATOR
  );
  assert.equal(res.status, 200);
  const mine = await w.entities.Lensman.get('l1');
  assert.equal(mine.display_name, 'Maya O');
  assert.equal(mine.stripe_account_id, 'acct_maya');
  assert.equal(mine.user_id, CREATOR.id);
  assert.equal(mine.avg_rating, undefined);
  const theirs = await w.entities.Lensman.get('l2');
  assert.equal(theirs.display_name, 'Other');
  assert.equal(theirs.status, 'pending');

  assert.equal((await w.call('updateCreatorProfile', { display_name: 'X' }, CLIENT)).status, 404, 'no profile to edit');
});

test('public profile fields are capped and can\'t carry contact details', () => {
  const ok = buildProfilePatch({
    specialties: ['Portraits', ' portraits ', 'Events', 42, ''],
    neighborhoods: ['Elon', 'Burlington'],
    equipment: 'Sony A7 IV, 35mm and 85mm',
    years_experience: 4.6,
    gallery_style: 'hero_grid',
    portfolio_images: ['https://files.example/a.jpg', 'javascript:alert(1)', ''],
  });
  assert.deepEqual(ok.errors, {});
  assert.deepEqual(ok.patch.specialties, ['Portraits', 'Events']);
  assert.equal(ok.patch.years_experience, 5);
  assert.deepEqual(ok.patch.portfolio_images, ['https://files.example/a.jpg']);

  assert.ok(buildProfilePatch({ specialties: ['DM @maya.shoots'] }).errors.specialties);
  assert.ok(buildProfilePatch({ neighborhoods: ['call 336 555 0142'] }).errors.neighborhoods);
  assert.ok(buildProfilePatch({ equipment: 'see mayashoots.com' }).errors.equipment);
  assert.ok(buildProfilePatch({ display_name: 'maya@example.com' }).errors.display_name);
  assert.equal(buildProfilePatch({ gallery_style: 'whatever' }).patch.gallery_style, undefined);
  assert.equal(buildProfilePatch({ specialties: Array.from({ length: 40 }, (_, i) => `Kind ${i}`) }).patch.specialties.length, 12);
});

/* ---------------- photo releases ---------------- */

test('the client approves specific photos; changing them needs a new yes', async () => {
  const w = await scenario();
  await w.paid({ amount: 100 });
  await w.call('markDelivered', { bookingId: 'b1', deliveryLink: 'https://gallery.example.com/j', step: 'final' }, CREATOR);
  const [release] = await w.entities.PhotoRelease.list();
  const answer = (user, body) => w.call('respondPhotoRelease', { releaseId: release.id, ...body }, user);
  const shown = async () => (await w.call('getPastShoots', { lensmanId: 'l1' }, null)).data.shoots;

  assert.equal((await answer(STRANGER, { decision: 'approved' })).status, 403);
  assert.equal((await answer(CLIENT, { decision: 'approved' })).status, 400, 'no photos picked yet');

  await answer(CREATOR, { decision: 'approved', photos: ['https://files.example/1.jpg', 'https://files.example/2.jpg'] });
  assert.equal((await shown()).length, 0, 'one yes is not enough');
  await answer(CLIENT, { decision: 'approved' });
  assert.equal((await shown()).length, 1);
  assert.equal((await shown())[0].client_first_name, 'Jordan');

  // The creator swaps a photo in: the shoot comes down until the client agrees.
  await answer(CREATOR, { decision: 'approved', photos: ['https://files.example/1.jpg', 'https://files.example/other.jpg'] });
  assert.equal((await w.entities.PhotoRelease.get(release.id)).client_decision, 'pending');
  assert.equal((await shown()).length, 0);
  assert.ok(w.emailsTo(CLIENT.email).some((e) => /photos for your shared shoot changed/.test(e.subject)));

  await answer(CLIENT, { decision: 'approved' });
  assert.equal((await shown()).length, 1);
  // Either side can take it down at any time.
  await answer(CLIENT, { decision: 'declined' });
  assert.equal((await shown()).length, 0);
});

/* ---------------- deleting an account ---------------- */

test('an account can\'t be deleted while a booking or money still depends on it', async () => {
  const w = await scenario();
  const del = (user) => w.call('deleteMyAccount', { confirm: 'DELETE' }, user);
  assert.equal((await del(CLIENT)).status, 409, 'an open request');
  assert.equal((await del(CREATOR)).status, 409);

  await w.deliveredAndDue({ amount: 100 });
  assert.equal((await del(CLIENT)).status, 409, 'money held');
  assert.equal((await del(CREATOR)).status, 409);

  await w.call('releasePayouts', {}, FOUNDER);
  assert.equal((await w.call('deleteMyAccount', {}, CLIENT)).status, 400, 'needs the confirmation word');
  assert.equal((await del(FOUNDER)).status, 409, 'founder accounts');

  // A founder payout still waiting for the creator blocks too.
  await w.entities.ManualPayout.create({ creator_user_id: CREATOR.id, lensman_id: 'l1', amount: 50, status: 'waiting' });
  assert.equal((await del(CREATOR)).status, 409);
  await w.entities.ManualPayout.updateMany({ creator_user_id: CREATOR.id }, { $set: { status: 'sent' } });

  assert.equal((await del(CREATOR)).status, 200);
  assert.equal((await w.entities.Lensman.list()).length, 0);
  assert.equal((await del(CLIENT)).status, 200);
});

/* ---------------- 18+ ---------------- */

test('an account that never confirmed 18+ does so before its first request, once', async () => {
  const w = await scenario();
  const newcomer = { id: 'u_new', email: 'new@example.com', full_name: 'New Person', role: 'user' };
  await w.entities.User.create({ ...newcomer });

  const refused = await request(w, {}, newcomer);
  assert.equal(refused.status, 400);
  assert.equal(refused.data.needsAge, true);
  assert.equal((await w.entities.Booking.filter({ client_id: 'u_new' })).length, 0);

  const ok = await request(w, { ageConfirmed: true }, newcomer);
  assert.equal(ok.status, 200);
  assert.equal((await w.entities.User.get('u_new')).age_confirmed, true);
});

/* ---------------- a creator's own full profile ---------------- */

test('a creator gets their own full record from the server, without the founders\' notes', async () => {
  const w = await scenario();
  await w.entities.Lensman.update('l1', { pricing_tiers: [{ tier: 'low', name: 'Mini', price: 125 }] });
  await w.entities.CreatorContact.updateMany({ lensman_id: 'l1' }, { $set: { admin_notes: 'Late twice', review_note: 'Watch' } });

  const mine = await w.call('getMyCreatorProfile', {}, CREATOR);
  assert.equal(mine.data.lensman.id, 'l1');
  assert.equal(mine.data.lensman.payouts_enabled, true);
  assert.equal(mine.data.lensman.pricing_tiers.length, 1);
  assert.equal(mine.data.contact.full_name, 'Maya Ortiz');
  assert.equal(JSON.stringify(mine.data).includes('Late twice'), false);
  assert.equal(JSON.stringify(mine.data).includes('Watch'), false);

  assert.deepEqual((await w.call('getMyCreatorProfile', {}, CLIENT)).data, { lensman: null, contact: null });
  assert.equal((await w.call('getMyCreatorProfile', {}, null)).status, 401);
});
