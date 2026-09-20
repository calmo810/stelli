import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

const PRODUCT_NAMES = {
  half_day: 'The Candid',
  full_day: 'The Event Film',
  custom: 'The Content Day',
};

const PUBLISHED_ORIGIN = 'https://stelli-moment-craft.base44.app';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const { bookingId, origin } = await req.json();

    if (!bookingId) {
      return Response.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    const booking = await base44.asServiceRole.entities.Booking.get(bookingId);
    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    const amount = Math.round((booking.total_price || 0) * 100);
    if (amount <= 0) {
      return Response.json({ error: 'This booking has no amount to pay.' }, { status: 400 });
    }

    const base = (origin || PUBLISHED_ORIGIN).replace(/\/$/, '');
    const appId = secrets.get('BASE44_APP_ID') || '';
    const formatName = PRODUCT_NAMES[booking.package_type] || 'Stelli Shoot';
    const eventLabel = (booking.event_type || 'shoot').replace(/_/g, ' ');

    const body = new URLSearchParams();
    body.set('mode', 'payment');
    body.set('success_url', `${base}/client-dashboard?payment=success&booking=${bookingId}`);
    body.set('cancel_url', `${base}/book/${booking.lensman_id}?payment=cancelled`);
    body.set('customer_email', booking.client_email || '');
    body.set('line_items[0][quantity]', '1');
    body.set('line_items[0][price_data][currency]', 'usd');
    body.set('line_items[0][price_data][unit_amount]', String(amount));
    body.set('line_items[0][price_data][product_data][name]', formatName);
    body.set('line_items[0][price_data][product_data][description]', `${eventLabel} on ${booking.event_date || 'TBC'}`);
    body.set('metadata[base44_app_id]', appId);
    body.set('metadata[booking_id]', bookingId);
    body.set('payment_intent_data[metadata][base44_app_id]', appId);
    body.set('payment_intent_data[metadata][booking_id]', bookingId);

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secrets.get('STRIPE_SECRET_KEY')}`,
        'Stripe-Version': '2025-10-29.clover',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': `booking-checkout-${bookingId}`,
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

    return Response.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('createBookingCheckout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}