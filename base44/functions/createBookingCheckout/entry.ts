import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';
import { BOOKING_LABEL } from '../../shared/bookingContract.ts';
import { stripePost } from '../../shared/stripe.ts';
import { bookingBreakdown, fromCents } from '../../shared/money.ts';
import { safeOrigin } from '../../shared/origins.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    let user = null;
    try {
      user = await base44.auth.me();
    } catch {
      user = null;
    }
    if (!user) {
      return Response.json({ error: 'Please sign in to pay for this booking.' }, { status: 401 });
    }

    const { bookingId, origin } = await req.json();
    if (!bookingId) {
      return Response.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    const booking = await base44.asServiceRole.entities.Booking.get(bookingId);
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

    const isClient = booking.client_id === user.id || booking.client_email === user.email;
    if (!isClient) {
      return Response.json({ error: 'This booking belongs to someone else.' }, { status: 403 });
    }

    if (['processing', 'held', 'released'].includes(booking.payment_status)) {
      return Response.json({ error: 'This booking is already paid.' }, { status: 409 });
    }

    // The amount always comes from the quote the client accepted — never the browser.
    let quote = booking.quote_id
      ? await base44.asServiceRole.entities.Quote.get(booking.quote_id).catch(() => null)
      : null;

    // Bookings accepted before quote_id existed: fall back to the most recent
    // accepted quote and remember it, so nothing has to be re-accepted by hand.
    if (!quote) {
      const accepted = await base44.asServiceRole.entities.Quote.filter(
        { booking_id: bookingId, status: 'accepted' },
        '-created_date'
      );
      quote = accepted[0];
      if (quote) {
        await base44.asServiceRole.entities.Booking.update(bookingId, { quote_id: quote.id });
      }
    }

    if (!quote || !quote.amount) {
      return Response.json(
        { error: 'There is no accepted quote on this booking yet.' },
        { status: 400 }
      );
    }

    // The quote plus the add-ons the client ticked when they accepted it,
    // worked out here in whole cents — never trusted from the browser. The
    // same breakdown sets the fee and the payout when the payment lands.
    const breakdown = bookingBreakdown(quote.amount, booking.picked_add_ons);
    const price = fromCents(breakdown.subtotalCents);
    const fee = fromCents(breakdown.clientFeeCents);
    const total = fromCents(breakdown.clientTotalCents);
    const transferGroup = `booking_${bookingId}`;
    const base = safeOrigin(origin);
    const appId = secrets.get('BASE44_APP_ID') || '';
    const eventLabel = booking.event_description || 'Shoot';

    const body = new URLSearchParams();
    body.set('mode', 'payment');
    body.set('success_url', `${base}/messages/${bookingId}?payment=success`);
    body.set('cancel_url', `${base}/messages/${bookingId}?payment=cancelled`);
    body.set('customer_email', booking.client_email || '');

    // The shoot itself.
    body.set('line_items[0][quantity]', '1');
    body.set('line_items[0][price_data][currency]', 'usd');
    body.set('line_items[0][price_data][unit_amount]', String(breakdown.baseCents));
    body.set('line_items[0][price_data][product_data][name]', BOOKING_LABEL);
    body.set('line_items[0][price_data][product_data][description]', `${eventLabel} on ${booking.event_date || 'TBC'}`);

    // Every add-on the client ticked, on its own line.
    breakdown.addOns.forEach((addOn, index) => {
      const i = index + 1;
      body.set(`line_items[${i}][quantity]`, '1');
      body.set(`line_items[${i}][price_data][currency]`, 'usd');
      body.set(`line_items[${i}][price_data][unit_amount]`, String(addOn.cents));
      body.set(`line_items[${i}][price_data][product_data][name]`, addOn.name);
    });

    // Stelli's service fee, shown on its own line. The lines add up to exactly
    // breakdown.clientTotalCents, which the webhook checks against the charge.
    const feeIndex = breakdown.addOns.length + 1;
    body.set(`line_items[${feeIndex}][quantity]`, '1');
    body.set(`line_items[${feeIndex}][price_data][currency]`, 'usd');
    body.set(`line_items[${feeIndex}][price_data][unit_amount]`, String(breakdown.clientFeeCents));
    body.set(`line_items[${feeIndex}][price_data][product_data][name]`, 'Stelli service fee');

    // Every paid booking gets a Stripe invoice and receipt.
    body.set('invoice_creation[enabled]', 'true');
    body.set('metadata[base44_app_id]', appId);
    body.set('metadata[booking_id]', bookingId);
    body.set('metadata[quote_id]', quote.id);
    // What this session is meant to charge before tax.
    body.set('metadata[expected_total_cents]', String(breakdown.clientTotalCents));
    body.set('payment_intent_data[transfer_group]', transferGroup);
    body.set('payment_intent_data[metadata][base44_app_id]', appId);
    body.set('payment_intent_data[metadata][booking_id]', bookingId);
    body.set('payment_intent_data[metadata][quote_id]', quote.id);

    const session = await stripePost('checkout/sessions', body, `booking-checkout-${quote.id}`);

    // Kept so a later quote can close this session instead of leaving it payable.
    await base44.asServiceRole.entities.Booking.update(bookingId, {
      stripe_checkout_session_id: session.id,
    });

    return Response.json({
      url: session.url,
      sessionId: session.id,
      price,
      fee,
      total,
    });
  } catch (error) {
    console.error('createBookingCheckout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}