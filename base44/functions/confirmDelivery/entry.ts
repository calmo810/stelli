import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { viewerRole } from '../../shared/bookingAccess.ts';
import { releaseBooking } from '../../shared/payouts.ts';

/** The client releasing the hold early instead of waiting out the window. */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });

    const { bookingId } = await req.json();
    if (!bookingId) return Response.json({ error: 'Booking ID is required.' }, { status: 400 });

    const booking = await base44.asServiceRole.entities.Booking.get(bookingId);
    if (!booking) return Response.json({ error: 'Booking not found.' }, { status: 404 });

    if (viewerRole(booking, user) !== 'client') {
      return Response.json({ error: 'Only the client can confirm delivery.' }, { status: 403 });
    }
    if (booking.status !== 'delivered') {
      return Response.json({ error: 'Nothing has been delivered yet.' }, { status: 400 });
    }

    await base44.asServiceRole.entities.Booking.update(bookingId, {
      client_confirmed_delivery: true,
    });

    const result = await releaseBooking(base44, booking, 'auto');

    return Response.json({ result });
  } catch (error) {
    console.error('confirmDelivery error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}