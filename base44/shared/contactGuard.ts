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
/**
 * The narrower check, for text that is not chat: the note on a booking request,
 * a quote's note, add-on names, the public parts of a creator profile.
 *
 * The chat guard above is deliberately jumpy (it trips on the word "ig", or on
 * a date and a time typed together). That is fine for a message someone can
 * rephrase, and wrong for the first note a client writes about their shoot.
 * This one only catches what is unmistakably a way to reach someone off
 * Stelli: an email address, a web link, an @handle, or a phone number.
 */
export function hasDirectContact(text) {
  const value = String(text || '');
  if (!value.trim()) return false;
  if (/[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(value)) return true;
  if (/(https?:\/\/|www\.)\S+/i.test(value)) return true;
  if (/(^|[\s(])@[a-z0-9._]{3,}/i.test(value)) return true;
  if (/\b[a-z0-9-]+\.(com|net|org|io|me|co|link)\b/i.test(value)) return true;
  // A phone number: ten or more digits, with the usual separators, not a date-time.
  if (/(?:\+?\d[\s\-().]{0,2}){10,}/.test(value.replace(/\d{4}-\d{2}-\d{2}/g, ' '))) return true;
  return false;
}
