import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';
import { BOOKING_LABEL } from '../../shared/bookingContract.ts';
import { sameStripeMode, stripeGet, stripePost } from '../../shared/stripe.ts';
import { bookingBreakdown, fromCents } from '../../shared/money.ts';
import { checkoutBlocker } from '../../shared/bookingRules.ts';
import { viewerRole } from '../../shared/bookingAccess.ts';
import { safeOrigin } from '../../shared/origins.ts';

/**
 * Opens Stripe Checkout for the quote the client accepted.
 *
 * The amount comes from the accepted quote and the add-ons saved with it —
 * never from the browser. A booking has one live Checkout session at a time:
 * asking again returns the same page while it is still open, so a double click
 * cannot open two ways to pay.
 */
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

    const booking = await base44.asServiceRole.entities.Booking.get(bookingId).catch(() => null);
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

    if (viewerRole(booking, user) !== 'client') {
      return Response.json({ error: 'This booking belongs to someone else.' }, { status: 403 });
    }

    // The amount always comes from the quote the client accepted.
    let quoteId = booking.quote_id || '';
    let quote = quoteId
      ? await base44.asServiceRole.entities.Quote.get(quoteId).catch(() => null)
      : null;

    // Bookings accepted before quote_id existed: fall back to the accepted
    // quote and remember it, so nothing has to be re-accepted by hand.
    if (!quote) {
      const accepted = await base44.asServiceRole.entities.Quote.filter(
        { booking_id: bookingId, status: 'accepted' },
        '-created_date'
      );
      quote = accepted[0] || null;
      if (quote) {
        quoteId = quote.id;
        await base44.asServiceRole.entities.Booking.update(bookingId, { quote_id: quote.id });
      }
    }

    // Open booking, not already paid, and this exact quote is the accepted one.
    const blocker = checkoutBlocker({ ...booking, quote_id: quoteId }, quote, Date.now());
    if (blocker) return Response.json({ error: blocker }, { status: 409 });

    // The quote plus the add-ons the client ticked when they accepted it,
    // worked out here in whole cents. The same breakdown sets the fee and the
    // payout when the payment lands.
    const breakdown = bookingBreakdown(quote.amount, booking.picked_add_ons);
    if (breakdown.subtotalCents <= 0) {
      return Response.json({ error: 'There is no accepted quote on this booking yet.' }, { status: 400 });
    }
    const price = fromCents(breakdown.subtotalCents);
    const fee = fromCents(breakdown.clientFeeCents);
    const total = fromCents(breakdown.clientTotalCents);

    // One live session per booking. If the last one is still open and is for
    // this quote at this price, hand the same page back.
    const previousId = booking.stripe_checkout_session_id || '';
    if (previousId) {
      const previous = await stripeGet(`checkout/sessions/${previousId}`).catch(() => null);
      const samePurchase =
        previous &&
        sameStripeMode(previous.livemode) &&
        previous.metadata?.quote_id === quote.id &&
        Number(previous.amount_subtotal) === breakdown.clientTotalCents;

      // Finished and paid (or a bank payment still clearing): the webhook is
      // about to record it. A finished session whose bank payment failed is
      // spent, and falls through to a fresh page.
      if (previous?.status === 'complete' && samePurchase) {
        let inFlight = previous.payment_status === 'paid';
        if (!inFlight && previous.payment_intent) {
          const intent = await stripeGet(`payment_intents/${previous.payment_intent}`).catch(() => null);
          inFlight = !intent || ['processing', 'succeeded', 'requires_capture'].includes(intent.status);
        }
        if (inFlight) {
          return Response.json(
            { error: 'Your payment is being confirmed. Give it a minute, then refresh.' },
            { status: 409 }
          );
        }
      }
      if (previous?.status === 'open' && samePurchase && previous.url) {
        return Response.json({ url: previous.url, sessionId: previous.id, price, fee, total });
      }
      // Open but for something else (an older quote): close it before opening a new one.
      if (previous?.status === 'open') {
        await stripePost(`checkout/sessions/${previousId}/expire`, new URLSearchParams()).catch((error) =>
          console.error('Could not expire checkout session', previousId, '-', error.message)
        );
      }
    }

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
    body.set(
      'line_items[0][price_data][product_data][description]',
      `${String(eventLabel).slice(0, 200)} on ${booking.event_date || 'TBC'}`
    );

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

    // Two clicks at the same moment share this key and get the same session.
    // A fresh attempt after the last session ended gets a new key, so a client
    // whose bank payment failed is not handed the dead page back.
    const idempotencyKey = `booking-checkout-${quote.id}-${breakdown.clientTotalCents}-${
      previousId ? previousId.slice(-12) : 'first'
    }`;
    const session = await stripePost('checkout/sessions', body, idempotencyKey);

    // The session on record. Only a payment through this one confirms the booking.
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
    return Response.json(
      { error: 'Payment could not be started. Try again in a moment.' },
      { status: 500 }
    );
  }
}
