/**
 * Contact protection for booking threads.
 *
 * Mirrors src/lib/profilePresets.js so the composer can warn before sending,
 * while the server stays the authority — a blocked message is never stored.
 * Only applies before a booking is confirmed; afterwards messaging is free.
 */

export const CONTACT_BLOCK_MESSAGE =
  'Contact details unlock once the booking is confirmed. Keep it here until then.';

const CONTACT_PHRASES = [
  'dm me',
  'text me',
  'call me',
  'hit me up',
  'my insta',
  'ig',
  'instagram',
  'tiktok',
  'whatsapp',
  'venmo',
  'cash app',
  'zelle',
  'email me',
  'my number',
  'facetime',
  'snapchat',
  'telegram',
  'paypal',
  'off platform',
  'off-platform',
  'take this off',
];

export function hasContactDetails(text) {
  const value = String(text || '');
  if (!value.trim()) return false;
  if (/(?:\d[\s\-().]*){7,}/.test(value)) return true;
  if (/[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(value)) return true;
  if (/(^|[\s(])@[a-z0-9._]{2,}/i.test(value)) return true;
  if (/(https?:\/\/|www\.)/i.test(value)) return true;
  if (/\.(com|co|net|io|me|link)\b/i.test(value)) return true;
  const lower = value.toLowerCase();
  return CONTACT_PHRASES.some((phrase) =>
    new RegExp(`(^|[^a-z0-9])${phrase}([^a-z0-9]|$)`).test(lower)
  );
}