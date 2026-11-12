import { stripeGet } from './stripe.ts';
import { bookingBreakdown, fromCents, money } from './money.ts';
import { paidSessionVerdict } from './bookingRules.ts';
import { notifyBoth, sendEmail } from './notify.ts';
import { recordStrayPayment } from './strayPayments.ts';
import { addLegalNamesToContract } from './bookingContract.ts';

/**
 * Money coming in.
 *
 * Stripe tells us about a Checkout session three ways: it completed and is
 * paid (card), it completed and is still clearing (bank debit), or a clearing
 * payment later succeeded or failed. All of them land here.
 *
 * The rule that matters: a payment only confirms a booking when it is the
 * session on record, for the quote the client has accepted, at exactly the
 * price that quote and its add-ons come to. Anything else is still real money,
 * but it is not this booking's payment — it is kept apart as a "stray payment"
 * (one StrayPayment record each, see strayPayments.ts) and a founder decides
 * what happens to it.
 */

const SETTLED = ['held', 'released', 'partially_refunded', 'refunded'];

async function loadForSession(base44, session) {
  const bookingId = session?.metadata?.booking_id;
  if (!bookingId) return { reason: 'no-booking' };

  const booking = await base44.asServiceRole.entities.Booking.get(bookingId).catch(() => null);
  if (!booking) return { reason: 'not-found' };

  const quoteId = session?.metadata?.quote_id;
  const quote = quoteId
    ? await base44.asServiceRole.entities.Quote.get(quoteId).catch(() => null)
    : null;

  // One subtotal: the quote plus the add-ons the client picked when they
  // accepted it. Fee and payout both come from it — never from the quote alone.
  const breakdown = bookingBreakdown(quote?.amount, booking.picked_add_ons);
  const verdict = paidSessionVerdict({ booking, quote, session, breakdown });

  return { booking, quote, breakdown, verdict };
}

/**
 * Records a completed payment. Safe to receive twice: a repeat changes nothing
 * and sends no emails.
 */
export async function markBookingPaid(base44, session) {
  const loaded = await loadForSession(base44, session);
  if (loaded.reason) return { paid: false, reason: loaded.reason };
  const { booking, breakdown, verdict } = loaded;

  // The same payment arriving again is not a second payment.
  const sameIntent = Boolean(session.payment_intent);
  if (
    sameIntent &&
    booking.stripe_payment_intent_id === session.payment_intent &&
    SETTLED.includes(booking.payment_status)
  ) {
    return { paid: false, reason: 'already-recorded' };
  }

  const charged = Number(session.amount_total || 0) / 100;
  const tax = Number(session.total_details?.amount_tax || 0) / 100;
  const now = new Date().toISOString();

  if (!verdict.clean) {
    // Real money, but not this booking's payment. The booking's own state is
    // left alone; the payment gets its own record, keyed by its PaymentIntent,
    // so a second one can never overwrite the first.
    const filed = await recordStrayPayment(base44, booking, session, verdict, charged);
    return filed.recorded
      ? { paid: false, reason: 'stray-payment', reasons: verdict.reasons, strayId: filed.stray.id }
      : { paid: false, reason: filed.reason };
  }

  // The charge itself, so the later transfer can be tied back to it.
  let chargeId = '';
  if (session.payment_intent) {
    try {
      const intent = await stripeGet(`payment_intents/${session.payment_intent}`);
      chargeId = typeof intent?.latest_charge === 'string' ? intent.latest_charge : intent?.latest_charge?.id || '';
    } catch (error) {
      console.error('Could not read the charge for session', session.id, '-', error.message);
    }
  }

  await base44.asServiceRole.entities.Booking.update(booking.id, {
    status: 'confirmed',
    payment_status: 'held',
    paid_at: now,
    stripe_payment_intent_id: session.payment_intent || '',
    stripe_charge_id: chargeId,
    stripe_livemode: Boolean(session.livemode),
    transfer_group: `booking_${booking.id}`,
    total_price: fromCents(breakdown.subtotalCents),
    fee_amount: fromCents(breakdown.clientFeeCents),
    creator_payout: fromCents(breakdown.creatorPayoutCents),
    amount_charged: charged,
    tax_amount: tax,
  });

  // Paid: the agreement can now carry the creator's legal name.
  await addLegalNamesToContract(base44, booking);

  await notifyBoth(
    base44,
    [booking.client_email, booking.creator_email || booking.lensman_email],
    'Payment held',
    `The ${booking.event_date} shoot is confirmed. Payment of ${money(charged)} is held by Stelli until your photos are delivered.`
  );

  return { paid: true, charged, tax };
}

/**
 * A bank payment that has started but not cleared. The date is not locked and
 * contact details stay hidden until it does.
 *
 * Only moves a booking that is still waiting for payment: a retried or late
 * copy of this event must never knock a paid booking back to "processing".
 */
export async function markPaymentProcessing(base44, session) {
  const loaded = await loadForSession(base44, session);
  if (loaded.reason) return { processing: false, reason: loaded.reason };
  const { booking, verdict } = loaded;

  if ((booking.payment_status || 'pending') !== 'pending') {
    return { processing: false, reason: 'not-waiting-for-payment' };
  }
  // If it doesn't match, wait and see: should it clear, it is handled as a stray.
  if (!verdict.clean) return { processing: false, reason: 'does-not-match' };

  await base44.asServiceRole.entities.Booking.update(booking.id, {
    payment_status: 'processing',
    stripe_payment_intent_id: session.payment_intent || '',
  });

  await sendEmail(
    base44,
    booking.client_email,
    'Your payment is processing',
    'Your payment is processing. Your date is locked in once it clears, usually within a few business days.'
  );

  return { processing: true };
}

/**
 * A bank payment that did not clear. Only undoes the "processing" it belongs
 * to — an old failure arriving after the client has paid another way is ignored.
 */
export async function markPaymentFailed(base44, session) {
  const bookingId = session?.metadata?.booking_id;
  if (!bookingId) return { reset: false, reason: 'no-booking' };

  const booking = await base44.asServiceRole.entities.Booking.get(bookingId).catch(() => null);
  if (!booking) return { reset: false, reason: 'not-found' };

  if (booking.payment_status !== 'processing' || booking.stripe_checkout_session_id !== session.id) {
    return { reset: false, reason: 'not-the-payment-in-progress' };
  }

  // The finished session stays on record: the next checkout sees it is spent
  // and opens a fresh page under a new key.
  await base44.asServiceRole.entities.Booking.update(bookingId, {
    payment_status: 'pending',
    stripe_payment_intent_id: '',
  });

  await sendEmail(
    base44,
    booking.client_email,
    'Your bank payment did not go through',
    "Your bank payment didn't go through. Nothing was taken. Open your Stelli messages to pay again."
  );

  return { reset: true };
}

/**
 * A Checkout page that timed out. Nothing needs to change: the session stays on
 * record, and the next checkout sees it has expired and opens a fresh one.
 */
export async function markCheckoutExpired(_base44, session) {
  return { noted: Boolean(session?.id) };
}
