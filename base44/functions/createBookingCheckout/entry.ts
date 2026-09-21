import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';
import { BOOKING_LABEL } from '../../shared/bookingContract.ts';

const PUBLISHED_ORIGIN = 'https://stelli-moment-craft.base44.app';

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
    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    const isClient = booking.client_id === user.id || booking.client_email === user.email;
    if (!isClient) {
      return Response.json({ error: 'This booking belongs to someone else.' }, { status: 403 });
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

    const amount = Math.round(Number(quote.amount) * 100);
    const base = (origin || PUBLISHED_ORIGIN).replace(/\/$/, '');
    const appId = secrets.get('BASE44_APP_ID') || '';
    const eventLabel = booking.event_description || 'Shoot';

    const body = new URLSearchParams();
    body.set('mode', 'payment');
    body.set('success_url', `${base}/client-dashboard?payment=success&booking=${bookingId}`);
    body.set('cancel_url', `${base}/client-dashboard?payment=cancelled&booking=${bookingId}`);
    body.set('customer_email', booking.client_email || '');
    body.set('line_items[0][quantity]', '1');
    body.set('line_items[0][price_data][currency]', 'usd');
    body.set('line_items[0][price_data][unit_amount]', String(amount));
    body.set('line_items[0][price_data][product_data][name]', BOOKING_LABEL);
    body.set('line_items[0][price_data][product_data][description]', `${eventLabel} on ${booking.event_date || 'TBC'}`);
    body.set('metadata[base44_app_id]', appId);
    body.set('metadata[booking_id]', bookingId);
    body.set('metadata[quote_id]', quote.id);
    body.set('payment_intent_data[metadata][base44_app_id]', appId);
    body.set('payment_intent_data[metadata][booking_id]', bookingId);
    body.set('payment_intent_data[metadata][quote_id]', quote.id);

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secrets.get('STRIPE_SECRET_KEY')}`,
        'Stripe-Version': '2025-10-29.clover',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': `booking-checkout-${quote.id}`,
      },
      body,
    });

    const session = await response.json();

    if (!response.ok) {
      console.error('Stripe checkout session failed:', session?.error?.message);
      return Response.json(
        { error: session?.error?.message || 'Payment could not be started.' },
        { status: 502 }
      );
    }

    return Response.json({ url: session.url, sessionId: session.id, amount: quote.amount });
  } catch (error) {
    console.error('createBookingCheckout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}