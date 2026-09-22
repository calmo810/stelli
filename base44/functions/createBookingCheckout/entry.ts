import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';
import { BOOKING_LABEL } from '../../shared/bookingContract.ts';
import { clientTotal, serviceFee, stripePost, toCents } from '../../shared/stripe.ts';

const PUBLISHED_ORIGIN = 'https://getstelli.base44.app';

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

    if (booking.payment_status === 'held' || booking.payment_status === 'released') {
      return Response.json({ error: 'This booking is already paid.' }, { status: 409 });
    }

    // The amount always comes from the quote the client accepted — never the browser.
    const accepted = await base44.asServiceRole.entities.Quote.filter({
      booking_id: bookingId,
      status: 'accepted',
    });
    const quote = accepted[0];
    if (!quote || !quote.amount) {
      return Response.json(
        { error: 'There is no accepted quote on this booking yet.' },
        { status: 400 }
      );
    }

    const price = Number(quote.amount);
    const fee = serviceFee(price);
    const total = clientTotal(price);
    const transferGroup = `booking_${bookingId}`;
    const base = (origin || PUBLISHED_ORIGIN).replace(/\/$/, '');
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
    body.set('line_items[0][price_data][unit_amount]', String(toCents(price)));
    body.set('line_items[0][price_data][product_data][name]', BOOKING_LABEL);
    body.set('line_items[0][price_data][product_data][description]', `${eventLabel} on ${booking.event_date || 'TBC'}`);

    // Stelli's service fee, shown on its own line.
    body.set('line_items[1][quantity]', '1');
    body.set('line_items[1][price_data][currency]', 'usd');
    body.set('line_items[1][price_data][unit_amount]', String(toCents(fee)));
    body.set('line_items[1][price_data][product_data][name]', 'Stelli service fee');

    body.set('metadata[base44_app_id]', appId);
    body.set('metadata[booking_id]', bookingId);
    body.set('metadata[quote_id]', quote.id);
    body.set('payment_intent_data[transfer_group]', transferGroup);
    body.set('payment_intent_data[metadata][base44_app_id]', appId);
    body.set('payment_intent_data[metadata][booking_id]', bookingId);
    body.set('payment_intent_data[metadata][quote_id]', quote.id);

    const session = await stripePost('checkout/sessions', body, `booking-checkout-${quote.id}`);

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