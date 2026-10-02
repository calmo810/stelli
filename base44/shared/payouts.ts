import { secrets } from 'base44:runtime';
import {
  creatorPayout,
  clientTotal,
  money,
  serviceFee,
  stripeGet,
  stripePost,
  toCents,
  HOLD_HOURS,
} from './stripe.ts';
import { notifyBoth, sendEmail } from './notify.ts';

const PUBLISHED_ORIGIN = 'https://getstelli.base44.app';

/**
 * Money leaving the hold.
 *
 * Charges are made on Stelli's own balance and the creator is paid by a
 * separate transfer, so every payout goes through here — the automatic sweep,
 * a founder decision, a client confirming delivery, the share a late
 * cancellation still owes the creator, and the catch-up run the moment a
 * creator finishes payout setup all use the same guarded path.
 */

export async function releaseBooking(base44, booking, releasedBy = 'auto') {
  if (!booking) return { released: false, reason: 'not-found' };

  // Never pay the same booking twice.
  if (booking.stripe_transfer_id || booking.released_at || booking.payment_status === 'released') {
    return { released: false, reason: 'already-paid' };
  }
  if (booking.flagged_for_review) return { released: false, reason: 'flagged' };
  // Money that was partly refunded is still money the creator is owed.
  if (!['held', 'partially_refunded'].includes(booking.payment_status)) {
    return { released: false, reason: 'nothing-held' };
  }

  const lensman = booking.lensman_id
    ? await base44.asServiceRole.entities.Lensman.get(booking.lensman_id).catch(() => null)
    : null;

  const destination = lensman?.stripe_account_id;
  const amount = Number(booking.creator_payout || creatorPayout(booking.total_price));
  const creatorEmail = booking.creator_email || booking.lensman_email;

  // No payout account yet, so the money simply stays on Stelli's balance. The
  // sweep keeps seeing this booking, so only the first pass sends the notice.
  if (!destination || !lensman?.payouts_enabled) {
    const firstNotice = !booking.needs_payout_setup;
    await base44.asServiceRole.entities.Booking.update(booking.id, { needs_payout_setup: true });

    if (firstNotice) {
      await sendEmail(
        base44,
        creatorEmail,
        'You have money waiting on Stelli.',
        `Set up payouts to get the ${money(amount)} from your shoot.\n\n${PUBLISHED_ORIGIN}/lensman-dashboard`
      );
    }

    return { released: false, reason: 'no-payout-account' };
  }

  const params = new URLSearchParams();
  params.set('amount', String(Math.round(amount * 100)));
  params.set('currency', 'usd');
  params.set('destination', destination);
  params.set('transfer_group', booking.transfer_group || `booking_${booking.id}`);
  // Tying the transfer to the original charge lets it go through even while the
  // client's payment is still settling.
  if (booking.stripe_charge_id) params.set('source_transaction', booking.stripe_charge_id);
  params.set('metadata[booking_id]', booking.id);
  params.set('metadata[base44_app_id]', secrets.get('BASE44_APP_ID') || '');

  // The idempotency key makes a re-run of the sweep or a duplicate webhook
  // unable to pay the same booking twice.
  const transfer = await stripePost('transfers', params, `payout-${booking.id}`);

  await base44.asServiceRole.entities.Booking.update(booking.id, {
    released_at: new Date().toISOString(),
    released_by: releasedBy,
    stripe_transfer_id: transfer.id,
    payment_status: 'released',
    needs_payout_setup: false,
    // A cancelled booking stays cancelled — the payout does not reopen it.
    ...(booking.status === 'cancelled' ? {} : { status: 'completed' }),
  });

  const clientFirst = String(booking.client_name || '').trim().split(' ')[0] || 'your client';

  await sendEmail(
    base44,
    creatorEmail,
    'You got paid.',
    `${money(amount)} for your shoot with ${clientFirst} is on its way to your bank.`
  );

  return { released: true, transferId: transfer.id, amount };
}

/**
 * The catch-up run: the moment a creator can be paid, everything that was held
 * back for them goes out.
 */
export async function releaseWaitingPayouts(base44, lensman) {
  if (!lensman?.id || !lensman?.payouts_enabled) return { released: 0, results: [] };

  const waiting = await base44.asServiceRole.entities.Booking.filter({
    lensman_id: lensman.id,
    needs_payout_setup: true,
  });

  const results = [];
  for (const booking of waiting) {
    try {
      results.push({ bookingId: booking.id, ...(await releaseBooking(base44, booking, 'auto')) });
    } catch (error) {
      console.error('Waiting payout failed for booking', booking.id, '-', error.message);
      results.push({ bookingId: booking.id, released: false, reason: error.message });
    }
  }

  return { released: results.filter((result) => result.released).length, results };
}

/**
 * Records a completed payment.
 *
 * Both the immediate card payment and the delayed bank payment land here, so
 * the money is worked out in exactly one place. It is safe to receive the same
 * payment twice: a repeat changes nothing and sends no emails. It only ever
 * touches the quote that was paid — never the other quotes on the booking.
 */
export async function markBookingPaid(base44, session) {
  const bookingId = session?.metadata?.booking_id;
  if (!bookingId) return { paid: false, reason: 'no-booking' };

  const booking = await base44.asServiceRole.entities.Booking.get(bookingId).catch(() => null);
  if (!booking) return { paid: false, reason: 'not-found' };

  // The same payment arriving again is not a second payment.
  const repeat =
    booking.stripe_payment_intent_id &&
    booking.stripe_payment_intent_id === session.payment_intent &&
    ['held', 'released', 'partially_refunded'].includes(booking.payment_status);
  if (repeat) return { paid: false, reason: 'already-recorded' };

  const quoteId = session?.metadata?.quote_id;
  const quote = quoteId
    ? await base44.asServiceRole.entities.Quote.get(quoteId).catch(() => null)
    : null;

  // The price the checkout was built from — quote plus the add-ons the client
  // ticked. Sessions from before it was recorded rebuild it the same way.
  const addOnTotal =
    quote && booking.quote_id === quote.id
      ? (booking.picked_add_ons || []).reduce((sum, addOn) => sum + (Number(addOn?.price) || 0), 0)
      : 0;
  const recordedPrice = Number(session?.metadata?.price);
  const price =
    Number.isFinite(recordedPrice) && recordedPrice > 0
      ? recordedPrice
      : Math.round((Number(quote?.amount || 0) + addOnTotal) * 100) / 100;
  const charged = Number(session.amount_total || 0) / 100;
  const tax = Number(session.total_details?.amount_tax || 0) / 100;
  const now = new Date().toISOString();

  // The charge itself, so the later transfer can be tied back to it.
  let chargeId = '';
  if (session.payment_intent) {
    try {
      const intent = await stripeGet(`payment_intents/${session.payment_intent}`);
      chargeId = intent?.latest_charge || '';
    } catch (error) {
      console.error('Could not read the charge for session', session.id, '-', error.message);
    }
  }

  // A newer quote replaced the one that was paid, or the booking was called
  // off. The money still lands, but a founder decides what happens to it.
  const replacedQuote = Boolean(booking.quote_id) && booking.quote_id !== quote?.id;
  const needsReview = replacedQuote || booking.status === 'cancelled';

  await base44.asServiceRole.entities.Booking.update(bookingId, {
    quote_id: quote?.id || booking.quote_id || '',
    payment_status: 'held',
    paid_at: now,
    stripe_payment_intent_id: session.payment_intent || '',
    stripe_charge_id: chargeId,
    transfer_group: `booking_${bookingId}`,
    fee_amount: serviceFee(price),
    creator_payout: creatorPayout(price),
    amount_charged: charged,
    tax_amount: tax,
    // A cancelled booking stays cancelled until a founder decides.
    ...(booking.status === 'cancelled' ? {} : { status: 'confirmed' }),
    ...(needsReview
      ? {
          flagged_for_review: true,
          flag_reason:
            'Payment came in for an old quote or a cancelled booking. Check before releasing or refunding.',
        }
      : {}),
  });

  // Only the quote that was paid becomes accepted.
  if (quote) {
    await base44.asServiceRole.entities.Quote.update(quote.id, { status: 'accepted' });
  }

  await notifyBoth(
    base44,
    [booking.client_email, booking.creator_email || booking.lensman_email],
    'Payment held',
    `The ${booking.event_date} shoot is confirmed. Payment of ${money(charged)} is held by Stelli until your photos are delivered.`
  );

  return { paid: true, charged, tax, needsReview };
}

/**
 * Sends money back to the client. With no amount it refunds whatever is still
 * left on the charge, so a founder can finish off a partly refunded booking.
 */
export async function refundBooking(base44, booking, amount, note) {
  if (!booking) return { refunded: false, reason: 'not-found' };

  const reference = booking.stripe_payment_intent_id || booking.stripe_charge_id;
  if (!reference) return { refunded: false, reason: 'no-charge' };

  // What Stripe actually took. Older bookings that predate amount_charged fall
  // back to the quote plus the service fee.
  const charged =
    Number(booking.amount_charged || 0) > 0
      ? Number(booking.amount_charged)
      : clientTotal(booking.total_price);

  const alreadyRefunded = Number(booking.refund_amount || 0);
  const remaining = Math.round((charged - alreadyRefunded) * 100) / 100;
  if (remaining <= 0) return { refunded: false, reason: 'already-refunded' };

  const refundAmount = Math.min(Number(amount || 0) > 0 ? Number(amount) : remaining, remaining);
  const cents = toCents(refundAmount);
  const totalRefunded = Math.round((alreadyRefunded + refundAmount) * 100) / 100;

  const params = new URLSearchParams();
  params.set(booking.stripe_payment_intent_id ? 'payment_intent' : 'charge', reference);
  params.set('amount', String(cents));
  params.set('metadata[booking_id]', booking.id);
  params.set('metadata[base44_app_id]', secrets.get('BASE44_APP_ID') || '');

  // Keyed by what was refunded before plus this amount: a retry of the same
  // refund is a no-op, while a later, second refund still goes through.
  const refund = await stripePost(
    'refunds',
    params,
    `refund-${booking.id}-${toCents(alreadyRefunded)}-${cents}`
  );

  const now = new Date().toISOString();

  // The refund is recorded before anything else can fail, so a retry never
  // sends the client's money twice.
  await base44.asServiceRole.entities.Booking.update(booking.id, {
    refund_amount: totalRefunded,
    refunded_at: now,
    payment_status: toCents(totalRefunded) >= toCents(charged) ? 'refunded' : 'partially_refunded',
    flagged_for_review: false,
    flag_reason: note || '',
  });

  // A refund after the creator was already paid pulls their share back.
  if (booking.stripe_transfer_id && charged > 0) {
    const share =
      Math.round(Number(booking.creator_payout || 0) * (refundAmount / charged) * 100) / 100;
    if (share > 0) {
      const reversalCents = toCents(share);
      const reversalParams = new URLSearchParams();
      reversalParams.set('amount', String(reversalCents));
      reversalParams.set('metadata[booking_id]', booking.id);
      reversalParams.set('metadata[base44_app_id]', secrets.get('BASE44_APP_ID') || '');
      try {
        const reversal = await stripePost(
          `transfers/${booking.stripe_transfer_id}/reversals`,
          reversalParams,
          `reversal-${booking.id}-${toCents(alreadyRefunded)}-${reversalCents}`
        );
        await base44.asServiceRole.entities.Booking.update(booking.id, {
          stripe_transfer_reversal_id: reversal.id,
        });
      } catch (error) {
        // The client has their money back; getting the creator's share back
        // is now a founder's call.
        console.error('Transfer reversal failed for booking', booking.id, '-', error.message);
        await base44.asServiceRole.entities.Booking.update(booking.id, {
          flagged_for_review: true,
          flag_reason: `Refunded ${money(refundAmount)} but could not pull back the creator's ${money(share)}: ${error.message}`,
        });
      }
    }
  }

  await sendEmail(
    base44,
    booking.client_email,
    'Refund issued',
    `${money(refundAmount)} has been refunded for the ${booking.event_date} shoot. It reaches your card in a few business days.`
  );

  return { refunded: true, refundId: refund.id, amount: refundAmount };
}

/** When the hold window closes on a delivered booking. */
export function releaseDueFrom(deliveredAt) {
  return new Date(new Date(deliveredAt).getTime() + HOLD_HOURS * 3600000).toISOString();
}