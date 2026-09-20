import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

const PRODUCT_NAMES = {
  half_day: 'The Candid',
  full_day: 'The Event Film',
  custom: 'The Content Day',
};

const RATE_KEYS = {
  half_day: 'rate_half_day',
  full_day: 'rate_full_day',
  custom: 'rate_custom',
};

const ADDON_PRICES = {
  rush: 150,
  raw: 100,
  bts: 200,
};

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

    // The amount is always rebuilt from the creator's published rates plus the
    // booking's add-ons — never from a price supplied by the browser.
    const lensman = await base44.asServiceRole.entities.Lensman.get(booking.lensman_id);
    const rateKey = RATE_KEYS[booking.package_type];
    const baseRate = Number(lensman?.[rateKey]) || 0;
    const addOnTotal = (booking.add_ons || []).reduce(
      (sum, id) => sum + (ADDON_PRICES[id] || 0),
      0
    );
    const quote = baseRate + addOnTotal;

    if (quote <= 0) {
      return Response.json(
        { error: 'This booking has no agreed amount to pay.' },
        { status: 400 }
      );
    }

    const amount = Math.round(quote * 100);
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

    // Store the server-computed quote so the recorded price matches what was charged.
    await base44.asServiceRole.entities.Booking.update(bookingId, { total_price: quote });

    return Response.json({ url: session.url, sessionId: session.id, amount: quote });
  } catch (error) {
    console.error('createBookingCheckout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}