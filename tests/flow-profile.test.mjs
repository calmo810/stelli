/**
 * The creator profile, end to end: the wizard's form is turned into a save,
 * sent through the real applyAsCreator / updateCreatorProfile functions, read
 * back the way the portal and the wizard read it, and edited again.
 *
 * The form model (src/lib/creatorProfile.js) is what the wizard, the public
 * page's preview and the portal's checklist all share, so these tests are also
 * the proof that those three agree with each other and with the server.
 */
process.env.TZ = 'America/New_York';

import test from 'node:test';
import assert from 'node:assert/strict';
import { STRANGER, CREATOR, scenario } from './helpers/scenario.mjs';
import * as rules from '../base44/shared/profileRules.ts';
import {
  ACCENTS, CURVES, FRAMES, LAYOUTS, LEGACY_PROMPTS, LIMITS, MATS, MAX_SHOTS, PROMPTS, REQS,
  contactProblems, formToPayload, formToProfile, freshForm, lookSummary, missingReqs, normalizeForm,
  profileToForm, promptOptions, storefrontChecklist,
} from '../src/lib/creatorProfile.js';
import { hasContactDetails } from '../src/lib/contactGuard.js';
import { longDate, money, shortDate, timeLabel } from '../src/lib/format.js';

const shot = (n) => ({ src: `https://files.example/shot-${n}.jpg` });

/** A form a new creator could publish. */
const filled = (changes = {}) => ({
  ...freshForm(),
  photo: 'https://files.example/face.jpg',
  name: 'Sam',
  slug: 'sam',
  oneLiner: 'Flash on, hands up.',
  tags: ['direct flash', 'candid'],
  where: ['Fonville Fountain'],
  what: ['Portraits', 'Events'],
  portfolio: [shot(1), shot(2), shot(3)],
  cover: 1,
  tiers: [
    { on: true, name: 'Quick Session', price: '60', duration: '30 min', includes: '10 edits' },
    { on: true, name: 'Standard', price: '', duration: '1 hr', includes: '' },
    { on: false, name: 'Full Shoot', price: '200', duration: '2 hr', includes: '' },
  ],
  bio: 'I keep sessions relaxed.',
  equip: 'Sony A7IV',
  years: '3',
  prompt: PROMPTS[1],
  promptA: 'it felt easy.',
  fullName: 'Sam Rivera',
  email: 'sam@example.com',
  ...changes,
});

const readBack = async (w, user) => (await w.call('getMyCreatorProfile', {}, user)).data;

/* ---------------- the client mirrors the server ---------------- */

test('the form offers exactly what the server accepts', () => {
  assert.deepEqual([...PROMPTS, ...LEGACY_PROMPTS].sort(), [...rules.PROMPTS].sort(), 'prompts');
  for (const field of ['one_liner', 'bio', 'prompt_answer', 'dont_shoot']) {
    assert.equal(LIMITS[field], rules.LIMITS[field], field);
  }
  assert.equal(LIMITS.display_name, rules.MAX_DISPLAY_NAME);
  assert.equal(LIMITS.equipment, rules.MAX_EQUIPMENT);
  assert.equal(MAX_SHOTS, rules.MAX_PORTFOLIO_IMAGES);
  assert.deepEqual(ACCENTS.map((a) => a.v), rules.ACCENTS);
  assert.deepEqual(LAYOUTS.map((o) => o.v), rules.DISPLAY_OPTIONS.wall_layout);
  assert.deepEqual(CURVES.map((o) => o.v), rules.DISPLAY_OPTIONS.wall_curve);
  assert.deepEqual(FRAMES.map((o) => o.v), rules.DISPLAY_OPTIONS.print_frame);
  assert.deepEqual(MATS.map((o) => o.v), rules.DISPLAY_OPTIONS.print_mat);
});

test('the contact check in the form matches the one on the server', () => {
  for (const line of ['dm me for rates', 'call 336 555 0100', 'find me @samshoots', 'samshoots.com', 'Golden hour only', '']) {
    assert.equal(hasContactDetails(line), rules.hasContactDetails(line), line);
  }
  assert.deepEqual(contactProblems(filled({ bio: 'text me', dont: 'email me first' })), ['bio', 'dont']);
});

/* ---------------- create ---------------- */

test('a filled-in form publishes: a pending page, the private details kept apart', async () => {
  const w = await scenario();
  const form = filled();
  assert.deepEqual(missingReqs(form), []);

  const sent = await w.call('applyAsCreator', formToPayload(form), STRANGER);
  assert.equal(sent.status, 200, sent.data.error);
  const { lensman } = sent.data;
  assert.equal(lensman.status, 'pending');
  assert.equal(lensman.user_id, STRANGER.id);
  assert.equal(lensman.slug, 'sam');
  // The starred photo leads.
  assert.equal(lensman.cover_image, shot(2).src);
  assert.equal(lensman.portfolio_images[0], shot(2).src);
  // Only the priced, switched-on package is saved.
  assert.deepEqual(lensman.pricing_tiers, [{ tier: 'low', name: 'Quick Session', price: 60, duration: '30 min', includes: '10 edits' }]);
  // Nothing private lands on the public record.
  assert.equal(JSON.stringify(lensman).includes('sam@example.com'), false);
  assert.equal(JSON.stringify(lensman).includes('Rivera'), false);

  const [contact] = await w.entities.CreatorContact.filter({ lensman_id: lensman.id });
  assert.equal(contact.full_name, 'Sam Rivera');
  assert.equal(contact.email, 'sam@example.com');
});

test('what was published reads back into the same form', async () => {
  const w = await scenario();
  const form = filled();
  await w.call('applyAsCreator', formToPayload(form), STRANGER);

  const { lensman, contact } = await readBack(w, STRANGER);
  const reopened = profileToForm(lensman, contact, STRANGER);
  // Nothing drifts on a round trip: saving it again would change nothing.
  // (The unpriced and switched-off packages were never saved, by design.)
  const expected = formToPayload(form);
  assert.deepEqual(formToPayload(reopened), expected);
  // The preview draws the same record the public page gets.
  const preview = formToProfile(reopened, lensman);
  for (const field of ['display_name', 'slug', 'one_liner', 'bio', 'cover_image', 'prompt_question', 'prompt_answer', 'wall_layout', 'accent_color']) {
    assert.deepEqual(preview[field], lensman[field], field);
  }
  assert.deepEqual(preview.portfolio_images, lensman.portfolio_images);
});

test('an application without the applicant\'s name is caught by the form, and refused by the server with nothing created', async () => {
  const w = await scenario();
  const form = filled({ fullName: '  ' });
  assert.deepEqual(missingReqs(form).map((r) => r.k), ['priv']);

  const sent = await w.call('applyAsCreator', formToPayload(form), STRANGER);
  assert.equal(sent.status, 400);
  assert.equal((await w.entities.Lensman.filter({ user_id: STRANGER.id })).length, 0);
});

test('applying twice gives back the first profile, never a second one', async () => {
  const w = await scenario();
  const first = await w.call('applyAsCreator', formToPayload(filled()), STRANGER);
  const second = await w.call('applyAsCreator', formToPayload(filled({ name: 'Sammy', slug: 'sammy' })), STRANGER);
  assert.equal(second.data.alreadyApplied, true);
  assert.equal(second.data.lensman.id, first.data.lensman.id);
  assert.equal((await w.entities.Lensman.filter({ user_id: STRANGER.id })).length, 1);
});

test('a taken link gets a suffix, and a name with no letters still gets a link', async () => {
  const w = await scenario();
  await w.entities.Lensman.update('l1', { slug: 'sam' });
  const sent = await w.call('applyAsCreator', formToPayload(filled()), STRANGER);
  assert.match(sent.data.lensman.slug, /^sam-[a-z0-9]{4}$/);

  const w2 = await scenario();
  const odd = await w2.call('applyAsCreator', formToPayload(filled({ name: '★★★', slug: '' })), STRANGER);
  assert.equal(odd.status, 200, odd.data.error);
  assert.match(odd.data.lensman.slug, /^creator-[a-z0-9]{4}$/);
});

/* ---------------- edit ---------------- */

test('an edit changes the live page and keeps what the form does not own', async () => {
  const w = await scenario();
  await w.entities.Lensman.update('l1', { status: 'approved', avg_rating: 4.9, review_count: 7, payouts_enabled: true });
  const before = await readBack(w, CREATOR);
  const form = { ...profileToForm(before.lensman, before.contact, CREATOR), ...filled({ name: 'Maya', slug: 'maya', fullName: 'Maya Ortiz', email: CREATOR.email }) };

  const saved = await w.call('updateCreatorProfile', formToPayload({ ...form, bio: 'New words.', layout: 'grid' }), CREATOR);
  assert.equal(saved.status, 200, saved.data.error);

  const after = await readBack(w, CREATOR);
  assert.equal(after.lensman.bio, 'New words.');
  assert.equal(after.lensman.wall_layout, 'grid');
  // A creator can never reach these from a save.
  assert.equal(after.lensman.status, 'approved');
  assert.equal(after.lensman.avg_rating, 4.9);
  assert.equal(after.lensman.payouts_enabled, true);
  assert.equal(lookSummary(after.lensman), 'Grid · Mat · Lime');
});

test('a save refused for a private field leaves the public page exactly as it was', async () => {
  const w = await scenario();
  await w.entities.Lensman.update('l1', { bio: 'The original bio.', display_name: 'Maya' });
  const { lensman, contact } = await readBack(w, CREATOR);
  const form = { ...profileToForm(lensman, contact, CREATOR), bio: 'A changed bio.', fullName: '' };

  const saved = await w.call('updateCreatorProfile', formToPayload(form), CREATOR);
  assert.equal(saved.status, 400);
  assert.equal(saved.data.field, 'full_name');
  assert.equal((await w.entities.Lensman.get('l1')).bio, 'The original bio.');
});

test('a profile with a prompt from the earlier editor can still be edited and keeps its prompt', async () => {
  const w = await scenario();
  await w.entities.Lensman.update('l1', { prompt_question: LEGACY_PROMPTS[0], prompt_answer: 'a foggy sunrise at the lake.' });
  const { lensman, contact } = await readBack(w, CREATOR);
  const form = profileToForm(lensman, contact, CREATOR);
  assert.equal(form.prompt, LEGACY_PROMPTS[0]);
  assert.equal(promptOptions(lensman.prompt_question)[0], LEGACY_PROMPTS[0]);

  const saved = await w.call('updateCreatorProfile', formToPayload({ ...form, bio: 'Edited.' }), CREATOR);
  assert.equal(saved.status, 200, saved.data.error);
  const after = await w.entities.Lensman.get('l1');
  assert.equal(after.prompt_question, LEGACY_PROMPTS[0]);
  assert.equal(after.prompt_answer, 'a foggy sunrise at the lake.');
});

test('half a prompt never blocks a save, and years of experience can be cleared', async () => {
  const w = await scenario();
  await w.entities.Lensman.update('l1', { years_experience: 4 });
  const { lensman, contact } = await readBack(w, CREATOR);
  const form = { ...profileToForm(lensman, contact, CREATOR), prompt: '', promptA: 'an answer with no question', years: '' };
  assert.equal(form.fullName, 'Maya Ortiz');

  const saved = await w.call('updateCreatorProfile', formToPayload(form), CREATOR);
  assert.equal(saved.status, 200, saved.data.error);
  const after = await w.entities.Lensman.get('l1');
  assert.equal(after.prompt_answer, '');
  assert.equal(after.years_experience, null);
});

test('contact details in a public line are refused, and the answer names the field', async () => {
  const w = await scenario();
  const { lensman, contact } = await readBack(w, CREATOR);
  const form = { ...profileToForm(lensman, contact, CREATOR), oneLiner: 'dm me @maya' };
  assert.deepEqual(contactProblems(form), ['line']);
  const saved = await w.call('updateCreatorProfile', formToPayload(form), CREATOR);
  assert.equal(saved.status, 400);
  assert.equal(saved.data.field, 'one_liner');
});

test('nobody edits a profile that is not theirs, or without one', async () => {
  const w = await scenario();
  const none = await w.call('updateCreatorProfile', formToPayload(filled()), STRANGER);
  assert.equal(none.status, 404);
  assert.equal((await w.call('updateCreatorProfile', {}, null)).status, 401);
  assert.equal((await w.call('getMyCreatorProfile', {}, STRANGER)).data.lensman, null);
});

/* ---------------- the portal reads the same rules ---------------- */

test('the portal\'s storefront checklist agrees with what the wizard needs', async () => {
  const w = await scenario();
  await w.call('applyAsCreator', formToPayload(filled()), STRANGER);
  const { lensman, contact } = await readBack(w, STRANGER);
  const list = storefrontChecklist(lensman, contact);
  assert.equal(list.every((item) => item.done), true);
  // Every line points at a real wizard requirement or step.
  const steps = ['photo', 'name', 'line', 'where', 'what', 'pf', 'price', 'bio', 'kit', 'prompt', 'dont', 'look', 'priv'];
  for (const item of list) assert.equal(steps.includes(item.step), true, item.step);
  assert.equal(REQS.every((req) => steps.includes(req.k)), true);

  const bare = storefrontChecklist({ display_name: 'Sam', portfolio_images: ['https://files.example/a.jpg'] });
  assert.deepEqual(bare.filter((item) => !item.done).map((item) => item.step), ['pf', 'photo', 'bio', 'price', 'where']);
});

test('a draft from the earlier wizard opens in today\'s shape', () => {
  const old = { ...filled(), promptIdx: 4, tiers: [{ on: true }], cover: 9 };
  delete old.prompt;
  const form = normalizeForm(old);
  assert.equal(form.prompt, PROMPTS[4]);
  assert.equal('promptIdx' in form, false);
  assert.equal(form.tiers.length, 3);
  assert.equal(form.cover, 2);
  assert.deepEqual(normalizeForm(null), freshForm());
});

/* ---------------- dates, times, money ---------------- */

test('a shoot\'s day is read as that day, not shifted by the time zone', () => {
  // In New York, new Date("2026-11-26") is still the evening of the 25th.
  assert.equal(shortDate('2026-11-26'), 'Thu, Nov 26');
  assert.equal(longDate('2026-01-01'), 'January 1, 2026');
  assert.equal(shortDate(''), '');
  assert.equal(shortDate('not a date'), '');
});

test('clock times and money are written one way', () => {
  assert.equal(timeLabel('16:30'), '4:30 PM');
  assert.equal(timeLabel('00:05'), '12:05 AM');
  assert.equal(timeLabel('12:00'), '12:00 PM');
  assert.equal(timeLabel('', 'Time TBD'), 'Time TBD');
  assert.equal(timeLabel('after lunch'), 'after lunch');
  assert.equal(money(140), '$140');
  assert.equal(money(91.2), '$91.20');
  assert.equal(money(undefined), '$0');
});
