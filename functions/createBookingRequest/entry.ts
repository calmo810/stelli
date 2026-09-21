import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please sign in to send a request.' }, { status: 401 });

    const { lensmanId, eventDate, eventTime, location, note, clientName, clientPhone, albumAccessEmails } = await req.json();
    if (!lensmanId || !eventDate) return Response.json({ error: 'A creator and a date are required.' }, { status: 400 });

    const lensman = await base44.asServiceRole.entities.Lensman.get(lensmanId);
    if (!lensman || lensman.status !== 'approved') {
      return Response.json({ error: 'That creator is not taking bookings right now.' }, { status: 404 });
    }

    const contacts = await base44.asServiceRole.entities.CreatorContact.filter({ lensman_id: lensmanId });
    const creatorEmail = contacts[0]?.email || '';

    const booking = await base44.asServiceRole.entities.Booking.create({
      lensman_id: lensmanId,
      lensman_name: lensman.display_name || lensman.full_name,
      creator_id: lensman.user_id || '',
      creator_email: creatorEmail,
      client_id: user.id,
      client_name: (clientName || user.full_name || '').trim(),
      client_email: user.email,
      client_phone: (clientPhone || '').trim(),
      event_date: eventDate,
      event_time: eventTime || '',
      location: (location || '').trim(),
      note: (note || '').trim(),
      album_access_emails: Array.isArray(albumAccessEmails) ? albumAccessEmails : [],
      status: 'requested',
      payment_status: 'pending',
    });

    if (note && note.trim()) {
      await base44.asServiceRole.entities.Message.create({
        booking_id: booking.id,
        sender_id: user.id,
        sender_name: booking.client_name || 'Client',
        sender_role: 'client',
        client_email: booking.client_email,
        creator_email: creatorEmail,
        content: note.trim(),
        kind: 'text',
      });
    }

    if (creatorEmail) {
      const firstName = (booking.client_name || 'Someone').split(' ')[0];
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: creatorEmail,
        subject: `New Stelli request for ${eventDate}`,
        body: `${firstName} wants to book you on ${eventDate}${location ? ` in ${location}` : ''}.\n\n${note ? `They said: ${note}\n\n` : ''}Open Stelli to work out the details and send your quote.`,
      });
    }

    return Response.json({ booking });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
