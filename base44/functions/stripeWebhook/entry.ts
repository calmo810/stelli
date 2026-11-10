import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';
import { releaseWaitingPayouts } from '../../shared/payouts.ts';
import { syncRefundFromStripe, syncReversalFromStripe } from '../../shared/refunds.ts';
import { disputeClosed, disputeOpened } from '../../shared/disputes.ts';
import {
  markBookingPaid,
  markCheckoutExpired,
  markPaymentFailed,
  markPaymentProcessing,
} from '../../shared/payments.ts';
import { sameStripeMode } from '../../shared/stripe.ts';

/** Anything older than this is a replay and is refused. */
const SIGNATURE_TOLERANCE_SECONDS = 300;

/**
 * Every Stripe endpoint pointed at this function is a platform endpoint that
 * signs with the platform account's own signing secret — one in test mode and
 * one in live. Only names that are actually registered belong here: a name
 * with no stored value can never verify anything.
 */
const WEBHOOK_SECRET_NAMES = [
  'STRIPE_LIVE_WEBHOOK_SECRET',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_TEST_WEBHOOK_SECRET',
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

    // The endpoint accepts both the live and the test signing secret, so the
    // event's own mode has to match the keys this app is running on. A test
    // event must never mark a real booking paid; and while the app is switched
    // to test mode for a rehearsal, live events are sent back for Stripe to
    // retry rather than dropped.
    if (!sameStripeMode(event.livemode)) {
      if (event.livemode) {
        console.warn(`Live Stripe event ${event.type} arrived while in test mode. Asking Stripe to retry.`);
        return Response.json({ error: 'App is in test mode' }, { status: 409 });
      }
      console.warn(`Ignored test-mode Stripe event ${event.type}.`);
      return Response.json({ received: true, ignored: 'test-mode event' });
    }

    // One-off payments taken by a founder outside the booking flow.
    const oneOffId = object?.metadata?.one_off_charge_id;
    if (oneOffId && event.type.startsWith('checkout.session.')) {
      const status =
        event.type === 'checkout.session.async_payment_failed'
          ? 'failed'
          : object.payment_status === 'paid'
            ? 'paid'
            : event.type === 'checkout.session.completed'
              ? 'processing'
              : null;
      if (status) {
        await base44.asServiceRole.entities.OneOffCharge.update(oneOffId, {
          status,
          stripe_payment_intent_id: object.payment_intent || '',
          ...(status === 'paid' ? { paid_at: new Date().toISOString() } : {}),
        }).catch((error) => console.error('One-off charge', oneOffId, 'not updated -', error.message));
      }
      return Response.json({ received: true });
    }

    // Paid by card: the money is held. Paid by bank: it has to clear first.
    // Each handler checks the booking's current state itself, so an event that
    // is retried or arrives out of order changes nothing.
    if (event.type === 'checkout.session.completed') {
      if (object.payment_status === 'paid' || object.payment_status === 'no_payment_required') {
        await markBookingPaid(base44, object);
      } else {
        // Not confirmed and contact details stay locked until the money clears.
        await markPaymentProcessing(base44, object);
      }
    } else if (event.type === 'checkout.session.async_payment_succeeded') {
      await markBookingPaid(base44, object);
    } else if (event.type === 'checkout.session.async_payment_failed') {
      await markPaymentFailed(base44, object);
    } else if (event.type === 'checkout.session.expired') {
      await markCheckoutExpired(base44, object);
    } else if (event.type === 'charge.refunded') {
      // A refund made by the app or straight from the Stripe dashboard.
      await syncRefundFromStripe(base44, object);
    } else if (event.type === 'transfer.reversed') {
      await syncReversalFromStripe(base44, object);
    } else if (event.type === 'charge.dispute.created') {
      await disputeOpened(base44, object);
    } else if (event.type === 'charge.dispute.closed') {
      await disputeClosed(base44, object);
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