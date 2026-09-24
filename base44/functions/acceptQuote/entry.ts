import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { notifyBoth } from '../../shared/notify.ts';
import { createContractForBooking } from '../../shared/bookingContract.ts';
import { viewerRole } from '../../shared/bookingAccess.ts';
import { loadCreatorContact } from '../../shared/creatorOwner.ts';

/**
 * The client accepts a quote and ticks which add-ons they want.
 *
 * Only add-ons the creator actually offered on the quote count, and the total
 * is worked out here — the browser never sends an amount.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { quoteId, pickedAddOns } = await req.json();
    if (!quoteId) return Response.json({ error: 'Quote ID is required' }, { status: 400 });

    const quote = await base44.asServiceRole.entities.Quote.get(quoteId);
    if (!quote) return Response.json({ error: 'Quote not found' }, { status: 404 });

    const booking = await base44.asServiceRole.entities.Booking.get(quote.booking_id);
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

    if (viewerRole(booking, user) !== 'client' && user.role !== 'admin') {
      return Response.json({ error: 'Only the client on this booking can accept the quote.' }, { status: 403 });
    }

    if (quote.status === 'accepted') {
      return Response.json({ quote, alreadyAccepted: true });
    }
    if (quote.status !== 'sent') {
      return Response.json({ error: `This quote was already ${quote.status}.` }, { status: 409 });
    }

    if (quote.expires_at && new Date(quote.expires_at) < new Date()) {
      await base44.asServiceRole.entities.Quote.update(quote.id, { status: 'expired' });
      return Response.json({ error: 'This quote expired. Ask your creator for a new one.' }, { status: 409 });
    }

    // Only the add-ons offered on this quote can be picked.
    const offered = quote.add_ons || [];
    const wanted = (pickedAddOns || []).map((addOn) => String(addOn?.name || ''));
    const chosen = offered
      .filter((addOn) => wanted.includes(String(addOn.name)))
      .map((addOn) => ({ name: String(addOn.name), price: Number(addOn.price) || 0 }));

    const subtotal =
      Math.round(
        (Number(quote.amount || 0) + chosen.reduce((sum, addOn) => sum + addOn.price, 0)) * 100
      ) / 100;

    await base44.asServiceRole.entities.Quote.update(quote.id, { status: 'accepted' });
    await base44.asServiceRole.entities.Booking.update(booking.id, {
      status: 'quote_accepted',
      total_price: subtotal,
      picked_add_ons: chosen,
    });

    const contact = await loadCreatorContact(base44, booking.lensman_id);
    const contract = await createContractForBooking(base44, {
      booking,
      quote: { ...quote, amount: subtotal, add_ons: chosen },
      lensman: null,
      contact,
    });
    await base44.asServiceRole.entities.BookingContract.update(contract.id, {
      client_accepted_at: new Date().toISOString(),
    });

    const addOnLine = chosen.length
      ? `\nAdd-ons: ${chosen.map((addOn) => `${addOn.name} (+$${addOn.price})`).join(', ')}`
      : '';

    await notifyBoth(
      base44,
      [booking.creator_email || booking.lensman_email],
      'Quote accepted',
      `The quote for $${subtotal.toLocaleString()} was accepted.${addOnLine}\n\nShoot date: ${booking.event_date}\n\nThe client can pay to lock the date. Payment stays held by Stelli until delivery.`
    );

    return Response.json({
      quote: { ...quote, status: 'accepted' },
      contract,
      total: subtotal,
      pickedAddOns: chosen,
    });
  } catch (error) {
    console.error('acceptQuote error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}