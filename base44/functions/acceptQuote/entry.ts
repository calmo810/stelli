import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { notifyBoth } from '../../shared/notify.ts';
import { createContractForBooking, PRODUCT_NAMES } from '../../shared/bookingContract.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { quoteId } = await req.json();
    if (!quoteId) return Response.json({ error: 'Quote ID is required' }, { status: 400 });

    const quote = await base44.asServiceRole.entities.Quote.get(quoteId);
    if (!quote) return Response.json({ error: 'Quote not found' }, { status: 404 });

    const booking = await base44.asServiceRole.entities.Booking.get(quote.booking_id);
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

    const isClient = booking.client_id === user.id || booking.client_email === user.email;
    if (!isClient && user.role !== 'admin') {
      return Response.json({ error: 'Only the client on this booking can accept the quote.' }, { status: 403 });
    }

    if (quote.status !== 'sent') {
      return Response.json({ error: `This quote was already ${quote.status}.` }, { status: 409 });
    }

    if (quote.expires_at && new Date(quote.expires_at) < new Date()) {
      await base44.asServiceRole.entities.Quote.update(quote.id, { status: 'expired' });
      return Response.json({ error: 'This quote has expired. Ask your creator for a new one.' }, { status: 409 });
    }

    const lensman = await base44.asServiceRole.entities.Lensman.get(booking.lensman_id);

    await base44.asServiceRole.entities.Quote.update(quote.id, { status: 'accepted' });
    await base44.asServiceRole.entities.Booking.update(booking.id, {
      status: 'quote_accepted',
      total_price: quote.amount,
    });

    const contract = await createContractForBooking(base44, { booking, quote, lensman });
    await base44.asServiceRole.entities.BookingContract.update(contract.id, {
      client_accepted_at: new Date().toISOString(),
    });

    const formatName = PRODUCT_NAMES[booking.package_type] || 'your shoot';
    await notifyBoth(
      base44,
      [booking.client_email, booking.lensman_email],
      `Quote accepted · ${formatName}`,
      `The quote for $${(quote.amount || 0).toLocaleString()} was accepted.\n\nShoot date: ${booking.event_date}\n\nThe booking agreement is now on file. The client can pay to lock the date, and payment stays held until delivery.`
    );

    return Response.json({ quote: { ...quote, status: 'accepted' }, contract });
  } catch (error) {
    console.error('acceptQuote error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}