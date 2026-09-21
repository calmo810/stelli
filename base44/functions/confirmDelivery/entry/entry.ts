import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });

    const { bookingId } = await req.json();
    if (!bookingId) return Response.json({ error: 'Booking ID is required.' }, { status: 400 });

    const booking = await base44.asServiceRole.entities.Booking.get(bookingId);
    if (!booking) return Response.json({ error: 'Booking not found.' }, { status: 404 });

    const isClient = booking.client_id === user.id || booking.client_email === user.email;
    if (!isClient) return Response.json({ error: 'Only the client can confirm delivery.' }, { status: 403 });
    if (booking.status !== 'delivered') return Response.json({ error: 'Nothing has been delivered yet.' }, { status: 400 });

    const now = new Date().toISOString();
    const updated = await base44.asServiceRole.entities.Booking.update(bookingId, {
      client_confirmed_delivery: true,
      status: 'completed',
      payment_status: 'released',
      completed_at: now,
    });

    const lensman = await base44.asServiceRole.entities.Lensman.get(booking.lensman_id);
    if (lensman) {
      await base44.asServiceRole.entities.Lensman.update(lensman.id, {
        completed_shoots: (lensman.completed_shoots || 0) + 1,
      });
    }

    if (booking.creator_email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: booking.creator_email,
        subject: 'Delivery confirmed — payment released',
        body: `${booking.client_name || 'Your client'} confirmed delivery for the ${booking.event_date} shoot. Your payment is on its way.`,
      });
    }

    return Response.json({ booking: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
