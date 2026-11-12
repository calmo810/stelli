/**
 * The memory album's link, the random key that unlocks it, and the checks on
 * pasted gallery links. Tested in tests/flow-album.test.mjs.
 *
 * Every email that hands a client their photos must carry the key: the album
 * opens for a signed-in participant alone, and a client clicking a link in their
 * inbox is usually nobody. A link without the key answers "not found".
 */
import { SITE_ORIGIN } from './origins.ts';

export const SITE_URL = SITE_ORIGIN;

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

export function albumPath(bookingId, token) {
  return `/album/${bookingId}${token ? `?t=${encodeURIComponent(token)}` : ''}`;
}

export function albumUrl(bookingId, token) {
  return `${SITE_URL}${albumPath(bookingId, token)}`;
}

/**
 * The booking's album key, minted the first time any link needs one.
 *
 * Two emails going out at once (photos added, and delivery marked) must not
 * mint two different keys, or one of them carries a link that no longer opens.
 * So the key is only written where there is none yet, and what is returned is
 * whatever the booking holds afterwards.
 */
export async function ensureAlbumToken(base44, booking) {
  if (!booking?.id) return '';
  if (booking.album_token) return booking.album_token;

  const Booking = base44.asServiceRole.entities.Booking;
  const token = newAlbumToken();
  try {
    const current = await Booking.get(booking.id);
    if (current?.album_token) return current.album_token;
    await Booking.updateMany(
      { id: booking.id, album_token: { $in: [null, ''] } },
      { $set: { album_token: token } }
    );
    let stored = (await Booking.get(booking.id))?.album_token || '';
    if (!stored) {
      // The conditional write matched nothing (a field that was never set may
      // not count as empty): set it plainly.
      await Booking.update(booking.id, { album_token: token });
      stored = (await Booking.get(booking.id))?.album_token || token;
    }
    return stored;
  } catch (error) {
    console.error('Album token could not be minted for', booking.id, '-', error.message);
    return '';
  }
}
