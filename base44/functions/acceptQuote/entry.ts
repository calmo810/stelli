import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { notifyBoth } from '../../shared/notify.ts';
import { createContractForBooking, syncContractTerms } from '../../shared/bookingContract.ts';
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

    // Money already moving locks the price in, add-ons included.
    const paying = ['processing', 'held', 'released', 'partially_refunded', 'refunded'].includes(
      booking.payment_status
    );
    const reAccepting = quote.status === 'accepted';

    if (reAccepting && (paying || booking.quote_id !== quote.id)) {
      return Response.json({ quote, alreadyAccepted: true });
    }
    if (!reAccepting && quote.status !== 'sent') {
      return Response.json({ error: `This quote was already ${quote.status}.` }, { status: 409 });
    }

    if (!reAccepting && quote.expires_at && new Date(quote.expires_at) < new Date()) {
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

    // Back before paying with a different set of add-ons: the booking and its
    // contract follow the new pick, and the checkout is rebuilt from it.
    if (reAccepting) {
      const changed =
        Math.round(Number(booking.total_price || 0) * 100) !== Math.round(subtotal * 100) ||
        JSON.stringify(booking.picked_add_ons || []) !== JSON.stringify(chosen);
      if (!changed) {
        return Response.json({ quote, alreadyAccepted: true, total: subtotal, pickedAddOns: chosen });
      }

      await base44.asServiceRole.entities.Booking.update(booking.id, {
        total_price: subtotal,
        picked_add_ons: chosen,
      });

      const contracts = await base44.asServiceRole.entities.BookingContract.filter({
        booking_id: booking.id,
      });
      const contract = contracts[0]
        ? await syncContractTerms(base44, contracts[0], {
            booking,
            quote: { ...quote, amount: subtotal, add_ons: chosen },
          })
        : null;

      const addOnLine = chosen.length
        ? `\nAdd-ons: ${chosen.map((addOn) => `${addOn.name} (+$${addOn.price})`).join(', ')}`
        : '\nNo add-ons.';
      await notifyBoth(
        base44,
        [booking.creator_email || booking.lensman_email],
        'Add-ons updated',
        `The client changed their add-ons before paying. New total: $${subtotal.toLocaleString()}.${addOnLine}\n\nShoot date: ${booking.event_date}`
      );

      return Response.json({
        quote,
        alreadyAccepted: true,
        updated: true,
        contract,
        total: subtotal,
        pickedAddOns: chosen,
      });
    }

    // One quote in play: every other live quote on this booking is retired, so
    // only the accepted one can ever be paid.
    await base44.asServiceRole.entities.Quote.updateMany(
      { booking_id: booking.id, status: 'sent' },
      { $set: { status: 'superseded' } }
    );
    await base44.asServiceRole.entities.Quote.updateMany(
      { booking_id: booking.id, status: 'accepted' },
      { $set: { status: 'superseded' } }
    );
    await base44.asServiceRole.entities.Quote.update(quote.id, { status: 'accepted' });
    await base44.asServiceRole.entities.Booking.update(booking.id, {
      status: 'quote_accepted',
      total_price: subtotal,
      picked_add_ons: chosen,
      quote_id: quote.id,
    });

    const contact = await loadCreatorContact(base44, booking.lensman_id);
    const acceptedTerms = { ...quote, amount: subtotal, add_ons: chosen };
    const existing = await createContractForBooking(base44, {
      booking,
      quote: acceptedTerms,
      lensman: null,
      contact,
    });
    // A contract left from an earlier quote is brought up to this one.
    const contract = await syncContractTerms(base44, existing, { booking, quote: acceptedTerms });
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