import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });

    const { bookingId, amount, message, includedEditedPhotos, expiresInDays } = await req.json();
    const value = Number(amount);
    if (!bookingId || !Number.isFinite(value) || value <= 0) {
      return Response.json({ error: 'A booking and a quote amount are required.' }, { status: 400 });
    }
    if (value > 100000) return Response.json({ error: 'That amount looks wrong. Quotes are capped at $100,000.' }, { status: 400 });

    const booking = await base44.asServiceRole.entities.Booking.get(bookingId);
    if (!booking) return Response.json({ error: 'Booking not found.' }, { status: 404 });

    const isCreator = booking.creator_id === user.id || (booking.creator_email && booking.creator_email === user.email);
    if (!isCreator) return Response.json({ error: 'Only the booked creator can send a quote.' }, { status: 403 });
    if (!['requested', 'quoted'].includes(booking.status)) {
      return Response.json({ error: 'This booking is past the quote stage.' }, { status: 400 });
    }

    const open = await base44.asServiceRole.entities.Quote.filter({ booking_id: bookingId, status: 'sent' });
    await Promise.all(open.map(q => base44.asServiceRole.entities.Quote.update(q.id, { status: 'withdrawn' })));

    const now = new Date();
    const expires = new Date(now.getTime() + (Number(expiresInDays) > 0 ? Number(expiresInDays) : 7) * 86400000);

    const quote = await base44.asServiceRole.entities.Quote.create({
      booking_id: bookingId,
      lensman_id: booking.lensman_id,
      creator_id: booking.creator_id || user.id,
      creator_email: booking.creator_email || user.email,
      client_id: booking.client_id || '',
      client_email: booking.client_email,
      amount: Math.round(value * 100) / 100,
      message: (message || '').trim(),
      included_edited_photos: Number(includedEditedPhotos) > 0 ? Number(includedEditedPhotos) : 30,
      expires_at: expires.toISOString(),
      status: 'sent',
      sent_at: now.toISOString(),
    });

    await base44.asServiceRole.entities.Booking.update(bookingId, { status: 'quoted' });

    await base44.asServiceRole.entities.Message.create({
      booking_id: bookingId,
      sender_id: user.id,
      sender_name: booking.lensman_name || user.full_name || 'Creator',
      sender_role: 'creator',
      client_email: booking.client_email,
      lensman_email: booking.lensman_email || booking.creator_email || user.email,
      creator_email: booking.creator_email || user.email,
      content: (message || '').trim() || 'Here is your quote.',
      kind: 'quote',
      quote_id: quote.id,
    });

    if (booking.client_email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: booking.client_email,
        subject: `Your quote for ${booking.event_date}`,
        body: `${booking.lensman_name || 'Your creator'} sent a quote for your ${booking.event_date} shoot.\n\nOpen Stelli to review and accept it. Nothing is charged until you accept.`,
      });
    }

    return Response.json({ quote });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}