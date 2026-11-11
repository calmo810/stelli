import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { viewerRole, creatorEmail } from '../../shared/bookingAccess.ts';
import { effectiveStatus } from '../../shared/bookingRules.ts';
import { hasDirectContact } from '../../shared/contactGuard.ts';
import { sendEmail } from '../../shared/notify.ts';

/**
 * The client turning a quote down. The conversation stays open and the creator
 * can send another.
 *
 * Only the client on the booking can decline, only a quote that is still
 * waiting on them, and only on a booking that is still at the quote stage — it
 * can't knock a paid or cancelled booking back to "requested".
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });

    const { quoteId, reason } = await req.json();
    if (!quoteId) return Response.json({ error: 'Quote ID is required.' }, { status: 400 });

    const quote = await base44.asServiceRole.entities.Quote.get(quoteId).catch(() => null);
    if (!quote) return Response.json({ error: 'Quote not found.' }, { status: 404 });

    const booking = await base44.asServiceRole.entities.Booking.get(quote.booking_id).catch(() => null);
    if (!booking || viewerRole(booking, user) !== 'client') {
      return Response.json({ error: 'Only the client can respond to this quote.' }, { status: 403 });
    }
    if (quote.status !== 'sent') {
      return Response.json({ error: 'This quote is no longer open.' }, { status: 409 });
    }

    await base44.asServiceRole.entities.Quote.update(quoteId, { status: 'declined' });

    // Back to "requested" only from the quote stage, and only if no other
    // quote is still waiting.
    const stillOpen = await base44.asServiceRole.entities.Quote.filter({ booking_id: booking.id, status: 'sent' });
    if (effectiveStatus(booking) === 'quoted' && (booking.payment_status || 'pending') === 'pending' && !stillOpen.length) {
      await base44.asServiceRole.entities.Booking.update(booking.id, { status: 'requested' });
    }

    // The reason is passed on unless it would hand over contact details.
    const why = String(reason || '').trim().slice(0, 300);
    const shared = why && !hasDirectContact(why) ? why : '';

    await base44.asServiceRole.entities.Message.create({
      booking_id: booking.id,
      sender_name: 'Stelli',
      sender_role: 'client',
      client_id: booking.client_id || '',
      creator_id: booking.creator_id || '',
      client_email: booking.client_email,
      lensman_email: creatorEmail(booking),
      content: shared ? `Quote declined: ${shared}` : 'Quote declined. The conversation is still open.',
      kind: 'system',
    });

    await sendEmail(
      base44,
      creatorEmail(booking),
      `Quote declined for ${booking.event_date}`,
      `Your quote for the ${booking.event_date} shoot was declined.${shared ? `\n\nThey said: ${shared}` : ''}\n\nThe conversation is still open in Stelli if you want to send another one.`
    );

    return Response.json({ ok: true });
  } catch (error) {
    console.error('declineQuote error:', error.message);
    return Response.json({ error: 'That did not go through. Try again.' }, { status: 500 });
  }
}
