import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';
import { BOOKING_LABEL } from '../../shared/bookingContract.ts';
import { clientTotal, serviceFee, stripeGet, stripePost, toCents } from '../../shared/stripe.ts';
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

    // The quote plus the add-ons the client ticked when they accepted it.
    // Worked out here, never trusted from the browser.
    const pickedAddOns = (booking.picked_add_ons || [])
      .filter((addOn) => addOn && addOn.name)
      .map((addOn) => ({ name: String(addOn.name), price: Number(addOn.price) || 0 }));

    const price =
      Math.round(
        (Number(quote.amount) + pickedAddOns.reduce((sum, addOn) => sum + addOn.price, 0)) * 100
      ) / 100;
    const fee = serviceFee(price);
    const total = clientTotal(price);
    const transferGroup = `booking_${bookingId}`;
    const base = safeOrigin(origin);
    const appId = secrets.get('BASE44_APP_ID') || '';
    const eventLabel = booking.event_description || 'Shoot';

    // A checkout already open for this exact quote is handed back instead of
    // opening a second one, so the client can never pay the same booking twice.
    if (booking.stripe_checkout_session_id) {
      const open = await stripeGet(`checkout/sessions/${booking.stripe_checkout_session_id}`).catch(
        () => null
      );
      if (
        open?.status === 'open' &&
        open.url &&
        open.metadata?.quote_id === quote.id &&
        Number(open.amount_total) === toCents(total)
      ) {
        return Response.json({ url: open.url, sessionId: open.id, price, fee, total });
      }
      // Paid, but the webhook has not landed yet. A completed session that is
      // unpaid is a bank payment that failed, and the client may pay again.
      if (open?.status === 'complete' && open.payment_status === 'paid') {
        return Response.json({ error: 'This booking is already paid.' }, { status: 409 });
      }
      // Anything still open no longer matches, so it is closed before a new one
      // opens — only one checkout is ever payable.
      if (open?.status === 'open') {
        await stripePost(`checkout/sessions/${open.id}/expire`, new URLSearchParams()).catch(
          (error) => console.error('Could not expire stale checkout', open.id, '-', error.message)
        );
      }
    }

    const body = new URLSearchParams();
    body.set('mode', 'payment');
    body.set('success_url', `${base}/messages/${bookingId}?payment=success`);
    body.set('cancel_url', `${base}/messages/${bookingId}?payment=cancelled`);
    body.set('customer_email', booking.client_email || '');

    // The shoot itself.
    body.set('line_items[0][quantity]', '1');
    body.set('line_items[0][price_data][currency]', 'usd');
    body.set('line_items[0][price_data][unit_amount]', String(toCents(Number(quote.amount))));
    body.set('line_items[0][price_data][product_data][name]', BOOKING_LABEL);
    body.set('line_items[0][price_data][product_data][description]', `${eventLabel} on ${booking.event_date || 'TBC'}`);

    // Every add-on the client ticked, on its own line.
    pickedAddOns.forEach((addOn, index) => {
      const i = index + 1;
      body.set(`line_items[${i}][quantity]`, '1');
      body.set(`line_items[${i}][price_data][currency]`, 'usd');
      body.set(`line_items[${i}][price_data][unit_amount]`, String(toCents(addOn.price)));
      body.set(`line_items[${i}][price_data][product_data][name]`, addOn.name);
    });

    // Stelli's service fee, shown on its own line.
    const feeIndex = pickedAddOns.length + 1;
    body.set(`line_items[${feeIndex}][quantity]`, '1');
    body.set(`line_items[${feeIndex}][price_data][currency]`, 'usd');
    body.set(`line_items[${feeIndex}][price_data][unit_amount]`, String(toCents(fee)));
    body.set(`line_items[${feeIndex}][price_data][product_data][name]`, 'Stelli service fee');

    // Every paid booking gets a Stripe invoice and receipt.
    body.set('invoice_creation[enabled]', 'true');
    body.set('metadata[base44_app_id]', appId);
    body.set('metadata[booking_id]', bookingId);
    body.set('metadata[quote_id]', quote.id);
    // The price the fee and the creator's share are worked out from, fixed now
    // so the webhook never has to rebuild it.
    body.set('metadata[price]', String(price));
    body.set('payment_intent_data[transfer_group]', transferGroup);
    body.set('payment_intent_data[metadata][base44_app_id]', appId);
    body.set('payment_intent_data[metadata][booking_id]', bookingId);
    body.set('payment_intent_data[metadata][quote_id]', quote.id);

    // Keyed by the quote and the checkout it replaces: a double click shares one
    // session, while paying again after an expired or failed checkout opens a
    // fresh one. The origin is part of it because it changes the parameters.
    const attempt = booking.stripe_checkout_session_id || 'first';
    const session = await stripePost(
      'checkout/sessions',
      body,
      `booking-checkout-${quote.id}-${attempt}-${new URL(base).hostname}`
    );

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