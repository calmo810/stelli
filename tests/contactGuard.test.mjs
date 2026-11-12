import test from 'node:test';
import assert from 'node:assert/strict';
import { hasContactDetails, hasDirectContact } from '../base44/shared/contactGuard.ts';

test('the chat guard blocks the ways people take a booking off Stelli', () => {
  for (const text of [
    'text me at 336 555 0142',
    'my email is maya@example.com',
    'dm me @maya.shoots',
    'find me on instagram',
    'pay me on venmo instead',
    'www.mayashoots.com',
  ]) {
    assert.equal(hasContactDetails(text), true, text);
  }
  assert.equal(hasContactDetails('Sounds great, what time works?'), false);
});

test('the narrower guard lets an ordinary shoot note through', () => {
  for (const text of [
    'Grad photos for 12 of us on Dec 14 2026 at 3:30, about 2 hours',
    'Senior pics for my ig and the family, 2026-11-04 around 15:00',
    'Engagement shoot, 2 outfits, 30 edited photos, budget around $1,200',
    'Meet at 100 Campus Drive, Building 4, Room 210',
    'Rush delivery',
    'Second location + 1 hour',
  ]) {
    assert.equal(hasDirectContact(text), false, text);
  }
});

test('the narrower guard still catches an email, a link, a handle or a phone number', () => {
  for (const text of [
    'reach me at jordan@example.com',
    'call 336-555-0142 to confirm',
    'my number is (336) 555 0142',
    '+1 336 555 0142',
    'portfolio at mayashoots.com',
    'https://instagram.com/maya',
    'insta: @maya.shoots',
  ]) {
    assert.equal(hasDirectContact(text), true, text);
  }
});
