/**
 * The memory album's link, and the random key that unlocks it.
 *
 * Every email that hands a client their photos must carry that key: the album
 * opens for a signed-in participant alone, and a client clicking a link in their
 * inbox is usually nobody. A link minted without the key answers "not found".
 */
export const SITE_URL = 'https://getstelli.com';

export function albumPath(bookingId, token) {
  return `/album/${bookingId}${token ? `?t=${encodeURIComponent(token)}` : ''}`;
}

export function albumUrl(bookingId, token) {
  return `${SITE_URL}${albumPath(bookingId, token)}`;
}

/** The booking's album key, minted the first time any link needs one. */
export async function ensureAlbumToken(base44, booking) {
  if (!booking?.id) return '';
  if (booking.album_token) return booking.album_token;

  const token = crypto.randomUUID();
  try {
    await base44.asServiceRole.entities.Booking.update(booking.id, { album_token: token });
  } catch (error) {
    console.error('Album token could not be minted for', booking.id, '-', error.message);
    return '';
  }
  return token;
}