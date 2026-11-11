import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { viewerRole } from '../../shared/bookingAccess.ts';
import { signedDeliveryPhotos } from '../../shared/deliveryPhotos.ts';
import { ensureAlbumToken, tokenMatches } from '../../shared/albumAccess.ts';

/**
 * Read for a shareable memory album. Returns only what the album shows — never
 * the client's contact details, price, or booking status.
 *
 * The album link travels to people who have no Stelli account, so access cannot
 * hang on signing in. The booking instead carries a random album token, and the
 * link is /album/<bookingId>?t=<token>: the token — never the booking ID on its
 * own — is what unlocks the gallery. The booking's own client and creator (and a
 * founder) open it without one, and the token is minted for them on first view,
 * so the link they copy out is the shareable one.
 *
 * A missing booking and a wrong token answer identically, so this cannot be used
 * to find out which booking IDs exist. The token is compared in constant time.
 *
 * A leaked link can be cut off: the client (or a founder) resets it with the
 * resetAlbumLink function, after which the old token opens nothing.
 */
// One answer for "no such album" and "wrong key", so it can't be used to
// find out which booking IDs exist. The album page shows its key panel for it.
const NOT_FOUND = () => Response.json({ error: 'Album not found', code: 'locked' }, { status: 404 });

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const bookingId = typeof body.bookingId === 'string' ? body.bookingId.trim() : '';
    const token = typeof body.token === 'string' ? body.token : '';

    if (!bookingId) return NOT_FOUND();

    const booking = await base44.asServiceRole.entities.Booking.get(bookingId).catch(() => null);

    let user = null;
    try {
      user = await base44.auth.me();
    } catch {
      user = null;
    }

    const role = booking ? viewerRole(booking, user) : null;
    const isAdmin = user?.role === 'admin';
    const isParty = Boolean(role) || isAdmin;
    // Always run the comparison, even with no booking, so both cases take alike.
    const tokenOk = tokenMatches(token, booking?.album_token || '');

    if (!booking || (!isParty && !tokenOk)) return NOT_FOUND();

    // A party opening a booking that predates album tokens gets one now, so the
    // link they copy carries it.
    const albumToken = isParty ? await ensureAlbumToken(base44, booking) : '';

    return Response.json({
      booking: {
        id: booking.id,
        event_type: booking.event_type,
        event_date: booking.event_date,
        lensman_name: booking.lensman_name,
        delivery_link: booking.delivery_link || '',
        delivered_at: booking.delivered_at || '',
        // Only the people on the booking are handed the token to share. A
        // guest already has it in their link and learns nothing new here.
        album_token: isParty ? albumToken : '',
      },
      // The client owns the album, so the client (or a founder) may reset its link.
      canResetLink: role === 'client' || isAdmin,
      photos: await signedDeliveryPhotos(base44, booking.id),
    });
  } catch (error) {
    console.error('getAlbumBooking error:', error.message);
    return Response.json({ error: 'The album could not be opened. Try again.' }, { status: 500 });
  }
}
