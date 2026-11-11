import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { viewerRole } from '../../shared/bookingAccess.ts';
import { signedDeliveryPhotos } from '../../shared/deliveryPhotos.ts';
import { ensureAlbumToken } from '../../shared/albumAccess.ts';

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
 * to find out which booking IDs exist.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const { bookingId, token } = await req.json();

    if (!bookingId) {
      return Response.json({ error: 'Booking ID is required', code: 'missing' }, { status: 400 });
    }

    const booking = await base44.asServiceRole.entities.Booking.get(bookingId).catch(() => null);
    if (!booking) {
      return Response.json({ error: 'Album not found', code: 'missing' }, { status: 404 });
    }

    let user = null;
    try {
      user = await base44.auth.me();
    } catch {
      user = null;
    }

    const isParty = Boolean(viewerRole(booking, user)) || user?.role === 'admin';
    const presented = typeof token === 'string' ? token.trim() : '';
    const tokenMatches =
      Boolean(booking.album_token) && presented !== '' && presented === booking.album_token;

    if (!isParty && !tokenMatches) {
      // A link that lost its key is the common case here: the gallery exists,
      // the visitor just cannot prove they were invited to it.
      return Response.json({ error: 'This link is missing its key', code: 'locked' }, { status: 404 });
    }

    const albumToken = await ensureAlbumToken(base44, booking);

    return Response.json({
      booking: {
        id: booking.id,
        event_type: booking.event_type,
        event_date: booking.event_date,
        lensman_name: booking.lensman_name,
        client_name: booking.client_name,
        delivery_link: booking.delivery_link || '',
        delivered_at: booking.delivered_at || '',
        album_token: albumToken,
      },
      photos: await signedDeliveryPhotos(base44, booking.id),
    });
  } catch (error) {
    console.error('getAlbumBooking error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}