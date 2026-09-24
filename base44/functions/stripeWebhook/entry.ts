import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { notifyBoth } from '../../shared/notify.ts';
import { serviceFee, creatorPayout, stripeGet, webhookSecret } from '../../shared/stripe.ts';

function parseSignatureHeader(header) {
  const parsed = { timestamp: null, signatures: [] };
  for (const part of header.split(',')) {
    const [key, value] = part.split('=');
    if (key === 't') parsed.timestamp = value;
    if (key === 'v1') parsed.signatures.push(value);
  }
  return parsed;
}

async function isValidSignature(payload, header, secret) {
  const { timestamp, signatures } = parseSignatureHeader(header);
  if (!timestamp || signatures.length === 0) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const digest = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`)
  );
  const expected = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return signatures.some((signature) => signature === expected);
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    const signature = req.headers.get('stripe-signature');
    const payload = await req.text();
    const secret = webhookSecret();

    if (!signature || !secret) {
      console.error('Stripe webhook rejected: missing signature or secret.');
      return Response.json({ error: 'Missing signature' }, { status: 400 });
    }

    if (!(await isValidSignature(payload, signature, secret))) {
      console.error('Stripe webhook rejected: invalid signature.');
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(payload);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const bookingId = session?.metadata?.booking_id;

      if (bookingId) {
        const booking = await base44.asServiceRole.entities.Booking.get(bookingId);

        if (booking) {
          const price = Number(booking.total_price || 0);
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

          // The client is charged in full and the money stays on Stelli's
          // balance until the photos land — nothing moves to the creator here.
          await base44.asServiceRole.entities.Booking.update(bookingId, {
            payment_status: 'held',
            status: 'confirmed',
            paid_at: now,
            stripe_payment_intent_id: session.payment_intent || '',
            stripe_charge_id: chargeId,
            transfer_group: `booking_${bookingId}`,
            fee_amount: serviceFee(price),
            creator_payout: creatorPayout(price),
          });

          await base44.asServiceRole.entities.Quote.updateMany(
            { booking_id: bookingId, status: 'sent' },
            { $set: { status: 'accepted' } }
          );

          await notifyBoth(
            base44,
            [booking.client_email, booking.creator_email || booking.lensman_email],
            'Payment held',
            `The ${booking.event_date} shoot is confirmed. Payment of $${(price + serviceFee(price)).toLocaleString()} is held by Stelli until your photos are delivered.`
          );
        }
      }
    }

    if (event.type === 'charge.refunded') {
      const charge = event.data.object;
      const bookingId = charge?.metadata?.booking_id;
      if (bookingId) {
        await base44.asServiceRole.entities.Booking.update(bookingId, {
          payment_status: 'refunded',
          refunded_at: new Date().toISOString(),
        });
      }
    }

    // Payout readiness lands here once Stripe finishes onboarding.
    if (event.type === 'account.updated') {
      const account = event.data.object;
      const profiles = await base44.asServiceRole.entities.Lensman.filter({
        stripe_account_id: account.id,
      });
      if (profiles[0]) {
        await base44.asServiceRole.entities.Lensman.update(profiles[0].id, {
          payouts_enabled: Boolean(account.payouts_enabled),
        });
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('stripeWebhook error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}