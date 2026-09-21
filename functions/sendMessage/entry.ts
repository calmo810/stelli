import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });

    const { bookingId, content } = await req.json();
    if (!bookingId || !content || !content.trim()) {
      return Response.json({ error: 'A booking and a message are required.' }, { status: 400 });
    }

    const booking = await base44.asServiceRole.entities.Booking.get(bookingId);
    if (!booking) return Response.json({ error: 'Booking not found.' }, { status: 404 });

    const isClient = booking.client_id === user.id || booking.client_email === user.email;
    const isCreator = booking.creator_id === user.id || (booking.creator_email && booking.creator_email === user.email);
    if (!isClient && !isCreator) return Response.json({ error: 'This conversation is not yours.' }, { status: 403 });

    const now = new Date().toISOString();
    const message = await base44.asServiceRole.entities.Message.create({
      booking_id: bookingId,
      sender_id: user.id,
      sender_name: (isClient ? booking.client_name : booking.lensman_name) || user.full_name || 'Someone',
      sender_role: isClient ? 'client' : 'creator',
      client_email: booking.client_email,
      creator_email: booking.creator_email || '',
      content: content.trim().slice(0, 4000),
      kind: 'text',
    });

    await base44.asServiceRole.entities.Booking.update(bookingId,
      isClient ? { client_last_read_at: now } : { creator_last_read_at: now });

    const recipient = isClient ? booking.creator_email : booking.client_email;
    const lastSeen = isClient ? booking.creator_last_read_at : booking.client_last_read_at;
    const quietFor = lastSeen ? Date.now() - new Date(lastSeen).getTime() : Infinity;
    if (recipient && quietFor > 15 * 60 * 1000) {
      const senderFirst = (message.sender_name || 'Someone').split(' ')[0];
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: recipient,
        subject: `${senderFirst} sent you a message`,
        body: `${senderFirst} sent you a message about your ${booking.event_date} shoot.\n\nOpen Stelli to reply.`,
      });
    }

    return Response.json({ message });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
