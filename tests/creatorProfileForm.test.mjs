/**
 * The profile form's own rules: what each section needs, what it sends, and
 * that the application is just the first four sections put together. The
 * server tests (flow-creator-application) check the same payload is accepted.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  APPLICATION_SECTIONS, SECTIONS, DEFAULT_SPOT,
  applicationPayload, applicationProblem, emptyForm, formFromDraft, formFromProfile,
} from '../src/lib/creatorProfile.js';
import { applicationProblem as serverProblem } from '../base44/shared/creatorApplication.ts';
import { buildProfilePatch } from '../base44/shared/profileRules.ts';

const shot = (n) => ({ src: `https://files.example/shot-${n}.jpg` });

const filled = () => ({
  ...emptyForm(),
  photo: 'https://files.example/me.jpg',
  name: 'Riley',
  what: ['Portraits'],
  portfolio: [shot(1), shot(2), shot(3)],
  cover: 1,
  fullName: 'Riley Park',
  email: 'riley@example.com',
});

test('the application is four sections, and names the first one that is not ready', () => {
  assert.deepEqual(APPLICATION_SECTIONS, ['you', 'work', 'portfolio', 'contact']);
  assert.equal(applicationProblem(emptyForm()).section, 'you');
  assert.equal(applicationProblem({ ...filled(), what: [] }).section, 'work');
  assert.equal(applicationProblem({ ...filled(), portfolio: [shot(1)] }).section, 'portfolio');
  assert.equal(applicationProblem({ ...filled(), fullName: ' ' }).section, 'contact');
  assert.equal(applicationProblem({ ...filled(), email: 'nope' }).section, 'contact');
  assert.equal(applicationProblem(filled()), null);
});

test('what the form sends is exactly what the server accepts as a reviewable application', () => {
  const payload = applicationPayload(filled());
  assert.equal(payload.slug, 'riley');
  assert.equal(payload.cover_image, shot(2).src, 'the starred photo leads');
  assert.deepEqual(payload.neighborhoods, [DEFAULT_SPOT], 'no spots picked means anywhere on campus');
  assert.equal('pricing_tiers' in payload, false, 'packages are not part of applying');

  const { patch, errors } = buildProfilePatch(payload);
  assert.deepEqual(errors, {});
  assert.equal(
    serverProblem({ fullName: payload.full_name, email: payload.email, displayName: payload.display_name, profile: patch }),
    null
  );
});

test('each portal section sends only its own fields', () => {
  const form = { ...filled(), bio: 'I keep it relaxed.', promptIdx: 0, promptA: 'a rooftop at blue hour.' };
  assert.deepEqual(Object.keys(SECTIONS.portfolio.payload(form)).sort(), ['cover_image', 'portfolio_images']);
  assert.deepEqual(Object.keys(SECTIONS.contact.payload(form)).sort(), ['email', 'full_name', 'instagram', 'phone']);
  assert.deepEqual(Object.keys(SECTIONS.you.payload(form)).sort(), ['display_name', 'profile_image']);
  const about = SECTIONS.about.payload(form);
  assert.equal(about.bio, 'I keep it relaxed.');
  assert.equal(about.prompt_question, 'My dream shoot is…');
  assert.equal('portfolio_images' in about, false);
  // An answer without a prompt is caught before it is sent.
  assert.ok(SECTIONS.about.problem({ ...form, promptIdx: null }));
  // A package with a price needs a name.
  const tiers = form.tiers.map((tier, i) => (i === 0 ? { ...tier, name: ' ', price: '80' } : tier));
  assert.ok(SECTIONS.packages.problem({ ...form, tiers }));
});

test('a saved profile opens as the form and goes back unchanged', () => {
  const lensman = {
    display_name: 'Maya',
    profile_image: 'https://files.example/maya.jpg',
    specialties: ['Events'],
    neighborhoods: ['Scott Plaza'],
    portfolio_images: [shot(1).src, shot(2).src, shot(3).src],
    cover_image: shot(1).src,
    bio: 'Hello.',
    pricing_tiers: [{ tier: 'mid', name: 'Standard', price: 150, duration: '1 hr', includes: '' }],
    wall_layout: 'grid',
    show_captions: false,
  };
  const form = formFromProfile(lensman, { full_name: 'Maya Ortiz', email: 'maya@example.com' }, null);
  assert.deepEqual(SECTIONS.work.payload(form), { specialties: ['Events'], neighborhoods: ['Scott Plaza'] });
  assert.deepEqual(SECTIONS.portfolio.payload(form).portfolio_images, lensman.portfolio_images);
  assert.deepEqual(SECTIONS.packages.payload(form).pricing_tiers, lensman.pricing_tiers);
  assert.equal(SECTIONS.look.payload(form).wall_layout, 'grid');
  assert.equal(SECTIONS.look.payload(form).show_captions, false);
  assert.equal(form.fullName, 'Maya Ortiz');
});

test('an old or damaged draft never breaks the form', () => {
  const form = formFromDraft(
    { name: 'Riley', portfolio: [null, shot(1), { nope: true }], tiers: 'x', what: 'Portraits', cover: 9, theme: 'night' },
    { email: 'riley@example.com', full_name: 'Riley Park' }
  );
  assert.equal(form.name, 'Riley');
  assert.equal(form.portfolio.length, 1);
  assert.equal(form.cover, 0);
  assert.deepEqual(form.what, []);
  assert.equal(form.tiers.length, 3);
  assert.equal(form.email, 'riley@example.com');
  assert.equal('theme' in form, false, 'fields the form no longer has are dropped');
});
