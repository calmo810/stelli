import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });

    const { bookingId, deliveryLink, deliveryNotes } = await req.json();
    if (!bookingId || !deliveryLink) return Response.json({ error: 'A booking and a gallery link are required.' }, { status: 400 });
    if (!/^https:\/\//i.test(deliveryLink.trim())) return Response.json({ error: 'The gallery link needs to start with https://' }, { status: 400 });

    const booking = await base44.asServiceRole.entities.Booking.get(bookingId);
    if (!booking) return Response.json({ error: 'Booking not found.' }, { status: 404 });

    const isCreator = booking.creator_id === user.id || (booking.creator_email && booking.creator_email === user.email);
    if (!isCreator) return Response.json({ error: 'Only the creator can deliver this booking.' }, { status: 403 });
    if (booking.status !== 'confirmed') return Response.json({ error: 'This booking is not ready for delivery.' }, { status: 400 });

    const now = new Date().toISOString();
    const updated = await base44.asServiceRole.entities.Booking.update(bookingId, {
      delivery_link: deliveryLink.trim(),
      delivery_notes: (deliveryNotes || '').trim(),
      delivered_at: now,
      status: 'delivered',
    });

    await base44.asServiceRole.entities.Message.create({
      booking_id: bookingId,
      sender_name: 'Stelli',
      sender_role: 'creator',
      client_email: booking.client_email,
      creator_email: booking.creator_email || '',
      content: 'Your photos have been delivered. Open your gallery, then confirm you got everything so the creator gets paid.',
      kind: 'system',
    });

    if (booking.client_email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: booking.client_email,
        subject: 'Your photos are ready',
        body: `${booking.lensman_name || 'Your creator'} delivered your ${booking.event_date} shoot.\n\nGallery: ${deliveryLink.trim()}\n\nConfirm in Stelli once you have everything.`,
      });
    }

    return Response.json({ booking: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
