import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { viewerRole } from '../../shared/bookingAccess.ts';

/**
 * Unread state lives on the booking, so the lime dot follows the person
 * across devices instead of the browser they happened to open.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });

    const { bookingId } = await req.json();
    if (!bookingId) return Response.json({ error: 'Booking ID is required.' }, { status: 400 });

    const booking = await base44.asServiceRole.entities.Booking.get(bookingId);
    if (!booking) return Response.json({ error: 'Booking not found.' }, { status: 404 });

    const role = viewerRole(booking, user);
    if (!role) return Response.json({ error: 'This conversation is not yours.' }, { status: 403 });

    await base44.asServiceRole.entities.Booking.update(bookingId, {
      [role === 'lensman' ? 'creator_last_read_at' : 'client_last_read_at']: new Date().toISOString(),
    });

    return Response.json({ ok: true, role });
  } catch (error) {
    console.error('markThreadRead error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}