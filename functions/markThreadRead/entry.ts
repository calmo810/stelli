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
    const isCreator = booking.creator_id === user.id || (booking.creator_email && booking.creator_email === user.email);
    if (!isClient && !isCreator) return Response.json({ error: 'This conversation is not yours.' }, { status: 403 });

    const now = new Date().toISOString();
    await base44.asServiceRole.entities.Booking.update(bookingId,
      isClient ? { client_last_read_at: now } : { creator_last_read_at: now });

    return Response.json({ ok: true, readAt: now });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
