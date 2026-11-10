import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { viewerRole } from '../../shared/bookingAccess.ts';
import { newAlbumToken } from '../../shared/albumAccess.ts';

/**
 * Cuts off a shared album link and issues a new one.
 *
 * The album opens for anyone holding the link. If that link has gone somewhere
 * it shouldn't have, the client — whose album it is — or a founder resets it:
 * the booking gets a fresh token and the old link stops opening anything, for
 * everyone, straight away. Photo links already handed out by the old page
 * expire on their own within the hour.
 *
 * The creator can't reset it: the album belongs to the client once delivered.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });

    const { bookingId } = await req.json().catch(() => ({}));
    if (!bookingId) return Response.json({ error: 'A booking is required.' }, { status: 400 });

    const booking = await base44.asServiceRole.entities.Booking.get(bookingId).catch(() => null);
    // A stranger learns nothing about which bookings exist.
    const allowed = booking && (viewerRole(booking, user) === 'client' || user.role === 'admin');
    if (!allowed) return Response.json({ error: 'Album not found' }, { status: 404 });

    const albumToken = newAlbumToken();
    await base44.asServiceRole.entities.Booking.update(bookingId, {
      album_token: albumToken,
      album_token_reset_at: new Date().toISOString(),
    });

    return Response.json({ bookingId, album_token: albumToken });
  } catch (error) {
    console.error('resetAlbumLink error:', error.message);
    return Response.json({ error: 'The link could not be reset. Try again.' }, { status: 500 });
  }
}
