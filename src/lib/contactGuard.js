/**
 * Spots contact details in text a client can read before a booking is
 * confirmed (profile lines, messages). Mirrors hasContactDetails in
 * base44/shared/profileRules.ts, so the form can warn before a save or a send
 * is attempted. The server check is the one that counts.
 */
export const CONTACT_MESSAGE =
  'Contact details stay private until a booking is confirmed. Keep this part about your work.';

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
];

export function hasContactDetails(text) {
  const value = String(text || '');
  if (!value.trim()) return false;
  // 7+ digits in a row, allowing the usual separators
  if (/(?:\d[\s\-().]*){7,}/.test(value)) return true;
  // email address
  if (/[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(value)) return true;
  // @handle
  if (/(^|[\s(])@[a-z0-9._]{2,}/i.test(value)) return true;
  // web address or domain
  if (/(https?:\/\/|www\.)/i.test(value)) return true;
  if (/\.(com|co|net|io)\b/i.test(value)) return true;
  const lower = value.toLowerCase();
  return CONTACT_PHRASES.some((phrase) => new RegExp(`(^|[^a-z0-9])${phrase}([^a-z0-9]|$)`).test(lower));
}
