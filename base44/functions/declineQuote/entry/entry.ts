import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });

    const { quoteId, reason } = await req.json();
    if (!quoteId) return Response.json({ error: 'Quote ID is required.' }, { status: 400 });

    const quote = await base44.asServiceRole.entities.Quote.get(quoteId);
    if (!quote) return Response.json({ error: 'Quote not found.' }, { status: 404 });

    const booking = await base44.asServiceRole.entities.Booking.get(quote.booking_id);
    const isClient = booking && (booking.client_id === user.id || booking.client_email === user.email);
    if (!isClient) return Response.json({ error: 'Only the client can respond to this quote.' }, { status: 403 });
    if (quote.status !== 'sent') return Response.json({ error: 'This quote is no longer open.' }, { status: 400 });

    await base44.asServiceRole.entities.Quote.update(quoteId, { status: 'declined', responded_at: new Date().toISOString() });
    await base44.asServiceRole.entities.Booking.update(booking.id, { status: 'requested' });

    await base44.asServiceRole.entities.Message.create({
      booking_id: booking.id,
      sender_id: user.id,
      sender_name: 'Stelli',
      sender_role: 'client',
      client_email: booking.client_email,
      creator_email: booking.creator_email || '',
      content: reason ? `Quote declined: ${reason}` : 'Quote declined. The conversation is still open.',
      kind: 'system',
    });

    if (booking.creator_email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: booking.creator_email,
        subject: `Quote declined for ${booking.event_date}`,
        body: `Your quote for the ${booking.event_date} shoot was declined.${reason ? `\n\nThey said: ${reason}` : ''}\n\nThe conversation is still open in Stelli if you want to send another one.`,
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
