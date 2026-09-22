import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { viewerRole, isConfirmed, recordFirstReply, creatorEmail } from '../../shared/bookingAccess.ts';
import { hasContactDetails, CONTACT_BLOCK_MESSAGE } from '../../shared/contactGuard.ts';
import { notifyThread } from '../../shared/notify.ts';

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

    // Which side of this booking you are on — never your account type.
    const role = viewerRole(booking, user);
    if (!role) {
      return Response.json({ error: 'This conversation is not yours.' }, { status: 403 });
    }

    const text = content.trim().slice(0, 4000);

    // Contact details stay blocked until the booking is confirmed.
    if (!isConfirmed(booking) && hasContactDetails(text)) {
      return Response.json({ error: CONTACT_BLOCK_MESSAGE, blocked: true }, { status: 400 });
    }

    const isCreator = role === 'lensman';
    const senderName =
      (isCreator ? booking.lensman_name : booking.client_name) || user.full_name || 'Someone';
    const now = new Date().toISOString();

    const message = await base44.asServiceRole.entities.Message.create({
      booking_id: bookingId,
      sender_name: senderName,
      sender_role: isCreator ? 'lensman' : 'client',
      client_email: booking.client_email,
      lensman_email: creatorEmail(booking),
      content: text,
      kind: 'chat',
    });

    await base44.asServiceRole.entities.Booking.update(bookingId, {
      [isCreator ? 'creator_last_read_at' : 'client_last_read_at']: now,
    });

    if (isCreator) await recordFirstReply(base44, booking);

    const recipient = isCreator ? booking.client_email : creatorEmail(booking);
    const senderFirst = String(senderName).split(' ')[0];

    await notifyThread(base44, booking, {
      to: recipient,
      role: isCreator ? 'client' : 'creator',
      sinceIso: now,
      subject: `${senderFirst} sent you a message`,
      body: `${senderFirst} sent you a message about the ${booking.event_date} shoot.\n\nOpen Stelli to reply.`,
    });

    return Response.json({ message });
  } catch (error) {
    console.error('sendMessage error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}