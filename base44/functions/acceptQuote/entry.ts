import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { notifyBoth } from '../../shared/notify.ts';
import { createContractForBooking } from '../../shared/bookingContract.ts';
import { viewerRole } from '../../shared/bookingAccess.ts';
import { acceptBlocker } from '../../shared/bookingRules.ts';
import { loadCreatorContact } from '../../shared/creatorOwner.ts';
import { bookingBreakdown, fromCents, money, pickOfferedAddOns } from '../../shared/money.ts';

/**
 * The client accepts a quote and ticks which add-ons they want.
 *
 * Only add-ons the creator actually offered on the quote count, and the total
 * is worked out here — the browser never sends an amount.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
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

    // Accepting the quote that is already the accepted one is a no-op, so a
    // second tap (or coming back to pay later) never changes the add-ons.
    if (quote.status === 'accepted' && booking.quote_id === quote.id) {
      return Response.json({
        quote,
        alreadyAccepted: true,
        total: booking.total_price,
        pickedAddOns: booking.picked_add_ons || [],
      });
    }

    // Only a live, unexpired quote on an open, unpaid booking can be accepted.
    const blocker = acceptBlocker(booking, quote, Date.now());
    if (blocker) {
      if (quote.status === 'sent' && quote.expires_at && new Date(quote.expires_at) < new Date()) {
        await base44.asServiceRole.entities.Quote.update(quote.id, { status: 'expired' });
      }
      return Response.json({ error: blocker }, { status: 409 });
    }

    // Only the add-ons offered on this quote can be picked, at the price the
    // creator set. The browser sends names; a price it sends is never used.
    const chosen = pickOfferedAddOns(quote.add_ons, pickedAddOns);

    // The one subtotal everything else is worked out from.
    const breakdown = bookingBreakdown(quote.amount, chosen);
    const subtotal = fromCents(breakdown.subtotalCents);

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
    // The agreement for THIS quote and these add-ons. A contract written for
    // an earlier quote is retired, so the client never pays one price under an
    // agreement that states another. Accepting the quote is the client's
    // acceptance, and is recorded on the contract, the booking, and as a
    // signed-acceptance record.
    const contract = await createContractForBooking(base44, {
      booking,
      quote,
      pickedAddOns: chosen,
      lensman: null,
      contact,
    });
    await base44.asServiceRole.entities.AgreementAcceptance.create({
      user_id: user.id,
      user_email: user.email,
      booking_id: booking.id,
      document_type: 'booking_contract',
      document_version: contract.version,
      accepted_at: new Date().toISOString(),
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || '',
      user_agent: req.headers.get('user-agent') || '',
    }).catch((error) => console.error('Contract acceptance record failed -', error.message));

    const addOnLine = chosen.length
      ? `\nAdd-ons: ${chosen.map((addOn) => `${addOn.name} (+${money(addOn.price)})`).join(', ')}`
      : '';

    await notifyBoth(
      base44,
      [booking.creator_email || booking.lensman_email],
      'Quote accepted',
      `The quote for ${money(subtotal)} was accepted.${addOnLine}\n\nYou receive ${money(fromCents(breakdown.creatorPayoutCents))} after Stelli's fee.\n\nShoot date: ${booking.event_date}\n\nThe client can pay to lock the date. Payment stays held by Stelli until delivery.`
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