import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';
import { notifyBoth, sendEmail } from '../../shared/notify.ts';
import { markBookingPaid, releaseWaitingPayouts } from '../../shared/payouts.ts';
import { eventMatchesMode, money, stripeGet } from '../../shared/stripe.ts';

/** Anything older than this is a replay and is refused. */
const SIGNATURE_TOLERANCE_SECONDS = 300;

/**
 * Stelli points two Stripe endpoints at this one function — one for its own
 * account and one for connected accounts — and each signs with its own secret.
 */
const WEBHOOK_SECRET_NAMES = [
  'STRIPE_TEST_WEBHOOK_SECRET',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_TEST_CONNECT_WEBHOOK_SECRET',
  'STRIPE_CONNECT_WEBHOOK_SECRET',
];

function parseSignatureHeader(header) {
  const parsed = { timestamp: null, signatures: [] };
  for (const part of header.split(',')) {
    const [key, value] = part.split('=');
    if (key === 't') parsed.timestamp = value;
    if (key === 'v1') parsed.signatures.push(value);
  }
  return parsed;
}

/** Compared in constant time, so a wrong signature leaks nothing. */
function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return difference === 0;
}

async function hmacHex(secret, payload) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/** True when the event is signed by any of the configured endpoints. */
async function signatureIsValid(payload, header) {
  const { timestamp, signatures } = parseSignatureHeader(header);
  if (!timestamp || signatures.length === 0) return false;

  const seconds = Number(timestamp);
  if (!Number.isFinite(seconds)) return false;
  if (Math.abs(Date.now() / 1000 - seconds) > SIGNATURE_TOLERANCE_SECONDS) return false;

  const candidates = WEBHOOK_SECRET_NAMES.map((name) => secrets.get(name)).filter(Boolean);
  if (candidates.length === 0) return false;

  for (const secret of candidates) {
    const expected = await hmacHex(secret, `${timestamp}.${payload}`);
    if (signatures.some((signature) => constantTimeEqual(signature, expected))) return true;
  }

  return false;
}

async function emailAdmins(base44, subject, body) {
  const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
  await notifyBoth(
    base44,
    admins.map((admin) => admin.email),
    subject,
    body
  );
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    const signature = req.headers.get('stripe-signature');
    const payload = await req.text();

    if (!signature) {
      console.error('Stripe webhook rejected: missing signature.');
      return Response.json({ error: 'Missing signature' }, { status: 400 });
    }

    if (!(await signatureIsValid(payload, signature))) {
      console.error('Stripe webhook rejected: invalid signature.');
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(payload);
    const object = event?.data?.object || {};

    // A test event while running live (or the reverse) is acknowledged and
    // ignored, so the two can share endpoints without touching real bookings.
    if (!eventMatchesMode(event)) {
      return Response.json({ received: true, ignored: 'mode-mismatch' });
    }

    // Paid by card: the money is held. Paid by bank: it has to clear first.
    if (event.type === 'checkout.session.completed') {
      const bookingId = object?.metadata?.booking_id;

      if (bookingId && object.payment_status === 'paid') {
        await markBookingPaid(base44, object);
      } else if (bookingId && object.payment_status === 'unpaid') {
        const booking = await base44.asServiceRole.entities.Booking.get(bookingId).catch(() => null);
        if (booking) {
          // Not confirmed and contact details stay locked until the money clears.
          await base44.asServiceRole.entities.Booking.update(bookingId, {
            payment_status: 'processing',
          });
          await sendEmail(
            base44,
            booking.client_email,
            'Your payment is processing',
            'Your payment is processing. Your date is locked in once it clears, usually within a few business days.'
          );
        }
      }
    } else if (event.type === 'checkout.session.async_payment_succeeded') {
      await markBookingPaid(base44, object);
    } else if (event.type === 'checkout.session.async_payment_failed') {
      const bookingId = object?.metadata?.booking_id;
      if (bookingId) {
        const booking = await base44.asServiceRole.entities.Booking.get(bookingId).catch(() => null);
        if (booking) {
          await base44.asServiceRole.entities.Booking.update(bookingId, {
            payment_status: 'pending',
            status: 'quote_accepted',
          });
          await sendEmail(
            base44,
            booking.client_email,
            'Your bank payment did not go through',
            "Your bank payment didn't go through. Open your Stelli messages to pay again."
          );
        }
      }
    } else if (event.type === 'charge.refunded') {
      const charge = object;
      // Found from the payment intent — charge metadata is not reliable.
      if (charge?.payment_intent) {
        const matches = await base44.asServiceRole.entities.Booking.filter({
          stripe_payment_intent_id: charge.payment_intent,
        });
        const booking = matches[0];
        if (booking) {
          const refunded = Number(charge.amount_refunded || 0) / 100;
          // Stelli tags every refund it makes. An untagged one was done by hand
          // in the Stripe Dashboard; if the creator was already paid, nothing
          // pulled their share back, so a founder has to look.
          let needsReview = false;
          if (booking.stripe_transfer_id) {
            const latest = await stripeGet(
              `refunds?payment_intent=${encodeURIComponent(charge.payment_intent)}&limit=1`
            ).catch(() => null);
            needsReview = Boolean(latest?.data?.[0]) && !latest.data[0].metadata?.booking_id;
          }

          await base44.asServiceRole.entities.Booking.update(booking.id, {
            refund_amount: refunded,
            refunded_at: new Date().toISOString(),
            ...(charge.refunded === true
              ? { payment_status: 'refunded' }
              : booking.payment_status === 'held'
                ? { payment_status: 'partially_refunded' }
                : {}),
            ...(needsReview
              ? {
                  flagged_for_review: true,
                  flag_reason: `${money(refunded)} was refunded in the Stripe Dashboard after the creator was paid. Reverse their transfer if needed.`,
                }
              : {}),
          });

          if (needsReview) {
            await emailAdmins(
              base44,
              'Refund made outside Stelli',
              `${money(refunded)} was refunded in Stripe on the ${booking.event_date} shoot after the creator was already paid. Check whether their transfer should be reversed.`
            );
          }
        }
      }
    } else if (event.type === 'charge.dispute.created') {
      const dispute = object;
      if (dispute?.payment_intent) {
        const matches = await base44.asServiceRole.entities.Booking.filter({
          stripe_payment_intent_id: dispute.payment_intent,
        });
        const booking = matches[0];
        if (booking) {
          await base44.asServiceRole.entities.Booking.update(booking.id, {
            dispute_status: dispute.status,
            flagged_for_review: true,
            flag_reason: 'Card dispute opened. Respond in Stripe before the deadline.',
          });
          await emailAdmins(
            base44,
            'Card dispute opened',
            `A client opened a card dispute on the ${booking.event_date} shoot (${dispute.status}). Respond in Stripe before the deadline.`
          );
        }
      }
    } else if (event.type === 'charge.dispute.closed') {
      const dispute = object;
      if (dispute?.payment_intent) {
        const matches = await base44.asServiceRole.entities.Booking.filter({
          stripe_payment_intent_id: dispute.payment_intent,
        });
        // The flag stays on, so a founder clears it by hand.
        const booking = matches[0];
        if (booking) {
          await base44.asServiceRole.entities.Booking.update(booking.id, {
            dispute_status: dispute.status,
          });
          await emailAdmins(
            base44,
            dispute.status === 'lost' ? 'Card dispute lost' : 'Card dispute closed',
            `The card dispute on the ${booking.event_date} shoot closed as "${dispute.status}". Release or refund the held money from the founder queue.`
          );
        }
      }
    } else if (event.type === 'account.updated') {
      const account = object;
      const profiles = await base44.asServiceRole.entities.Lensman.filter({
        stripe_account_id: account.id,
      });
      const lensman = profiles[0];
      if (lensman) {
        // Same rule the dashboard check uses: transfers active and payouts on.
        const enabled =
          account?.capabilities?.transfers === 'active' && account?.payouts_enabled === true;

        await base44.asServiceRole.entities.Lensman.update(lensman.id, {
          payouts_enabled: enabled,
        });

        // Anything that was waiting on this creator goes out right away.
        if (enabled && !lensman.payouts_enabled) {
          await releaseWaitingPayouts(base44, { ...lensman, payouts_enabled: true });
        }
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('stripeWebhook error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}