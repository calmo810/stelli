import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';
import { notifyBoth } from '../../shared/notify.ts';
import { PRODUCT_NAMES } from '../../shared/bookingContract.ts';

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
    const webhookSecret = secrets.get('STRIPE_WEBHOOK_SECRET');

    if (!signature || !webhookSecret) {
      console.error('Stripe webhook rejected: missing signature or secret.');
      return Response.json({ error: 'Missing signature' }, { status: 400 });
    }

    if (!(await isValidSignature(payload, signature, webhookSecret))) {
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
          await base44.asServiceRole.entities.Booking.update(bookingId, {
            payment_status: 'held',
            status: 'confirmed',
          });

          const formatName = PRODUCT_NAMES[booking.package_type] || 'your shoot';
          await notifyBoth(
            base44,
            [booking.client_email, booking.lensman_email],
            `Payment held · ${formatName}`,
            `Payment of $${(booking.total_price || 0).toLocaleString()} is now held in escrow.\n\nShoot date: ${booking.event_date}\n\nThe money is released to the creator after delivery.`
          );
        }
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('stripeWebhook error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}