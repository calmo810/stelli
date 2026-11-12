/**
 * The creator application, start to finish: what it takes to get into the
 * review queue, what happens when it is sent twice or half-saves, and the
 * three answers a founder can give.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { CREATOR, FOUNDER, STRANGER, scenario } from './helpers/scenario.mjs';

const APPLICANT = { id: 'u_new', email: 'riley@example.com', full_name: 'Riley Park', role: 'user', age_confirmed: true };

const photo = (n) => `https://files.example/shot-${n}.jpg`;

const application = (changes = {}) => ({
  display_name: 'Riley',
  profile_image: 'https://files.example/riley.jpg',
  specialties: ['Portraits'],
  neighborhoods: ['Anywhere on campus'],
  portfolio_images: [photo(1), photo(2), photo(3)],
  full_name: 'Riley Park',
  email: 'riley@example.com',
  ...changes,
});

const apply = (w, changes, user = APPLICANT) => w.call('applyAsCreator', application(changes), user);
const mine = async (w, user = APPLICANT) => (await w.entities.Lensman.filter({ user_id: user.id }))[0] || null;
const contactOf = async (w, lensmanId) => (await w.entities.CreatorContact.filter({ lensman_id: lensmanId }))[0] || null;
const review = (w, lensmanId, decision, note, user = FOUNDER) =>
  w.call('reviewCreatorApplication', { lensmanId, decision, note }, user);

/* ---------------- applying ---------------- */

test('the short application is enough: a pending profile, a private record, two emails', async () => {
  const w = await scenario();
  const sent = await apply(w);
  assert.equal(sent.status, 200);

  const lensman = await mine(w);
  assert.equal(lensman.status, 'pending');
  assert.equal(lensman.display_name, 'Riley');
  assert.equal(lensman.portfolio_images.length, 3);
  assert.deepEqual(lensman.pricing_tiers, [], 'no packages needed to apply');

  const contact = await contactOf(w, lensman.id);
  assert.equal(contact.full_name, 'Riley Park');
  assert.equal(contact.email, 'riley@example.com');

  assert.equal(w.emailsTo('riley@example.com').length, 1);
  assert.equal(w.emailsTo(FOUNDER.email).filter((e) => /New creator application/.test(e.subject)).length, 1);
});

test('nothing reaches the queue without a face, a name, a shoot type, three photos and a contact', async () => {
  const w = await scenario();
  const cases = [
    [{ profile_image: '' }, 'profile_image'],
    [{ specialties: [] }, 'specialties'],
    [{ portfolio_images: [photo(1), photo(2)] }, 'portfolio_images'],
    [{ full_name: '' , display_name: 'Riley' }, 'full_name'],
    [{ email: 'not-an-email' }, 'email'],
  ];
  for (const [changes, field] of cases) {
    const sent = await apply(w, changes);
    assert.equal(sent.status, 400, field);
    assert.equal(sent.data.field, field);
  }
  assert.equal(await mine(w), null, 'no half-made profile left behind');
  assert.equal(w.db.emails.length, 0);
  assert.equal((await apply(w, {}, null)).status, 401);
});

test('a HEIC photo never lands on a profile', async () => {
  const w = await scenario();
  const face = await apply(w, { profile_image: 'https://files.example/IMG_0001.heic' });
  assert.equal(face.status, 400);
  assert.equal(face.data.field, 'profile_image');

  // In the portfolio it is dropped, and the three-photo minimum counts what is left.
  const short = await apply(w, { portfolio_images: [photo(1), photo(2), 'https://files.example/IMG_0002.HEIC'] });
  assert.equal(short.status, 400);
  assert.equal(short.data.field, 'portfolio_images');

  const ok = await apply(w, { portfolio_images: [photo(1), photo(2), photo(3), 'https://files.example/x.heif'] });
  assert.equal(ok.status, 200);
  assert.equal((await mine(w)).portfolio_images.length, 3);
});

test('sending it twice makes one application, and the second send repairs a missing contact record', async () => {
  const w = await scenario();
  await apply(w);
  const again = await apply(w);
  assert.equal(again.status, 200);
  assert.equal(again.data.alreadyApplied, true);
  assert.equal((await w.entities.Lensman.filter({ user_id: APPLICANT.id })).length, 1);

  const lensman = await mine(w);
  await w.entities.CreatorContact.deleteMany({ lensman_id: lensman.id });
  const repaired = await apply(w);
  assert.equal(repaired.data.alreadyApplied, true);
  assert.equal((await contactOf(w, lensman.id)).email, 'riley@example.com');
});

test('if the private record fails to save, the profile is taken back and a retry works', async () => {
  const w = await scenario();
  const realCreate = w.entities.CreatorContact.create;
  w.entities.CreatorContact.create = async () => {
    throw new Error('database hiccup');
  };
  const failed = await apply(w);
  assert.equal(failed.status, 500);
  assert.equal(await mine(w), null, 'no orphaned pending profile');
  assert.equal(w.db.emails.length, 0, 'nobody is told about an application that is not in');

  w.entities.CreatorContact.create = realCreate;
  assert.equal((await apply(w)).status, 200);
  assert.equal((await mine(w)).status, 'pending');
});

test('one creator profile per email', async () => {
  const w = await scenario();
  const dupe = await apply(w, { email: CREATOR.email });
  assert.equal(dupe.status, 409);
  assert.equal(await mine(w), null);
});

/* ---------------- reviewing ---------------- */

test('only a founder can decide, and asking for changes needs a note', async () => {
  const w = await scenario();
  await apply(w);
  const { id } = await mine(w);

  assert.equal((await review(w, id, 'approved', '', STRANGER)).status, 404);
  assert.equal((await review(w, id, 'approved', '', null)).status, 401);
  assert.equal((await review(w, id, 'maybe')).status, 400);
  assert.equal((await review(w, id, 'needs_changes', '   ')).status, 400);
  assert.equal((await mine(w)).status, 'pending');
});

test('ask for changes → creator fixes and sends it back → founder approves', async () => {
  const w = await scenario();
  await apply(w);
  const { id } = await mine(w);
  const before = w.emailsTo('riley@example.com').length;

  const asked = await review(w, id, 'needs_changes', 'Swap the profile photo for one where we can see your face.');
  assert.equal(asked.status, 200);
  assert.equal((await mine(w)).status, 'needs_changes');
  assert.match((await contactOf(w, id)).changes_requested, /profile photo/);
  const note = w.emailsTo('riley@example.com').slice(before);
  assert.equal(note.length, 1);
  assert.match(note[0].body, /Swap the profile photo/);
  assert.match(note[0].body, /\/edit-profile/);

  // Their own profile tells them what was asked.
  const own = await w.call('getMyCreatorProfile', {}, APPLICANT);
  assert.match(own.data.contact.changes_requested, /profile photo/);

  // An ordinary save (the calendar, say) does not send it back.
  await w.call('updateCreatorProfile', { blackout_dates: ['2027-01-02'] }, APPLICANT);
  assert.equal((await mine(w)).status, 'needs_changes');

  // Sending it back does, once, and tells the founders.
  const back = await w.call(
    'updateCreatorProfile',
    { ...application({ profile_image: 'https://files.example/riley-face.jpg' }), resubmit: true },
    APPLICANT
  );
  assert.equal(back.status, 200);
  assert.equal(back.data.resubmitted, true);
  assert.equal((await mine(w)).status, 'pending');
  assert.equal((await contactOf(w, id)).changes_requested, '');
  assert.equal(w.emailsTo(FOUNDER.email).filter((e) => /sent their page back/.test(e.subject)).length, 1);

  const approved = await review(w, id, 'approved');
  assert.equal(approved.status, 200);
  assert.equal((await mine(w)).status, 'approved');
  assert.equal(w.emailsTo('riley@example.com').filter((e) => /You're live/.test(e.subject)).length, 1);
});

test('a creator can never approve themselves by "sending back"', async () => {
  const w = await scenario();
  await apply(w);
  // Pending: resubmit does nothing to the status.
  await w.call('updateCreatorProfile', { ...application(), resubmit: true, status: 'approved' }, APPLICANT);
  assert.equal((await mine(w)).status, 'pending');

  const { id } = await mine(w);
  await review(w, id, 'rejected');
  await w.call('updateCreatorProfile', { ...application(), resubmit: true }, APPLICANT);
  assert.equal((await mine(w)).status, 'rejected', 'a rejection is not reopened by an edit');
});

test('a founder can still approve or decline while waiting on the creator, and a decision is final', async () => {
  const w = await scenario();
  await apply(w);
  const { id } = await mine(w);
  await review(w, id, 'needs_changes', 'Add two more photos.');
  assert.equal((await review(w, id, 'needs_changes', 'Again')).data.updated, false);

  assert.equal((await review(w, id, 'rejected')).status, 200);
  assert.equal((await contactOf(w, id)).changes_requested, '');
  assert.equal((await review(w, id, 'approved')).status, 409);
  assert.equal((await review(w, id, 'needs_changes', 'Too late')).status, 409);
});

test('a live page cannot be saved down to nothing', async () => {
  const w = await scenario();
  await apply(w);
  const few = await w.call('updateCreatorProfile', application({ portfolio_images: [photo(1)] }), APPLICANT);
  assert.equal(few.status, 400);
  assert.equal(few.data.field, 'portfolio_images');
  const none = await w.call('updateCreatorProfile', application({ specialties: [] }), APPLICANT);
  assert.equal(none.status, 400);
  assert.equal((await mine(w)).portfolio_images.length, 3);
});
