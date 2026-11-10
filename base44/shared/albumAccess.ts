/**
 * Small, pure helpers for the shareable memory album and delivery links.
 * Tested in tests/albumAccess.test.mjs.
 */

/** A fresh album token: 256 random bits, as hex. Not guessable, not derived from anything. */
export function newAlbumToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Compares a presented token with the stored one in constant time, so the
 * time it takes says nothing about how much of the token was right.
 */
export function tokenMatches(presented, stored) {
  const a = typeof presented === 'string' ? presented.trim() : '';
  const b = typeof stored === 'string' ? stored : '';
  if (!a || !b) return false;
  // Compare over the longer length so a short guess takes just as long.
  const length = Math.max(a.length, b.length);
  let difference = a.length ^ b.length;
  for (let index = 0; index < length; index += 1) {
    difference |= (a.charCodeAt(index) || 0) ^ (b.charCodeAt(index) || 0);
  }
  return difference === 0;
}

const MAX_LINK = 500;

/**
 * Why a pasted gallery link can't be saved, or ''.
 *
 * "Starts with https://" is not enough: `https://Users/me/Downloads/x.html`
 * passes that and is a file path. A gallery link has to be a real web address
 * — https, a proper host name with a dot in it, no login details tucked in.
 */
export function galleryLinkProblem(link) {
  const value = String(link || '').trim();
  if (!value) return '';
  if (value.length > MAX_LINK) return 'That link is too long. Paste the gallery’s share link.';
  let url;
  try {
    url = new URL(value);
  } catch {
    return 'That doesn’t look like a link. Paste the gallery’s share link, starting with https://';
  }
  if (url.protocol !== 'https:') return 'The gallery link needs to start with https://';
  if (url.username || url.password) return 'That link has a username in it. Paste the gallery’s share link.';
  const host = url.hostname.toLowerCase();
  const looksLikeADomain = /^([a-z0-9-]+\.)+[a-z]{2,}$/.test(host);
  if (!looksLikeADomain || host === 'localhost') {
    return 'That looks like a file on your computer, not a link. Paste the gallery’s share link.';
  }
  return '';
}
