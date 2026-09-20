import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { notifyBoth } from '../../shared/notify.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { bookingId, deliveryLink } = await req.json();
    if (!bookingId || !deliveryLink) {
      return Response.json({ error: 'A booking and a delivery link are required.' }, { status: 400 });
    }

    const booking = await base44.asServiceRole.entities.Booking.get(bookingId);
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

    const isCreator = !!booking.lensman_email && booking.lensman_email === user.email;
    if (!isCreator && user.role !== 'admin') {
      return Response.json({ error: 'Only the booked creator can deliver this booking.' }, { status: 403 });
    }

    const deliveredAt = new Date().toISOString();
    const updated = await base44.asServiceRole.entities.Booking.update(bookingId, {
      delivery_link: deliveryLink,
      delivered_at: deliveredAt,
      status: 'delivered',
    });

    await notifyBoth(
      base44,
      [booking.client_email, booking.lensman_email],
      'Your photos are ready',
      `${booking.lensman_name || 'Your creator'} delivered your gallery.\n\nOpen it here: ${deliveryLink}\n\nDelivered ${new Date(deliveredAt).toLocaleDateString('en-US')}.`
    );

    return Response.json({ booking: updated });
  } catch (error) {
    console.error('markDelivered error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}