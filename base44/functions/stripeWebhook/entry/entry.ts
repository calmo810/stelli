import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

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
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${payload}`));
  const expected = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
  return signatures.some(signature => signature === expected);
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const signature = req.headers.get('stripe-signature');
    const payload = await req.text();
    const webhookSecret = secrets.get('STRIPE_WEBHOOK_SECRET');

    if (!signature || !webhookSecret) return Response.json({ error: 'Missing signature' }, { status: 400 });
    if (!(await isValidSignature(payload, signature, webhookSecret))) {
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(payload);

    if (event.type === 'checkout.session.completed') {
      const bookingId = event.data.object?.metadata?.booking_id;
      if (bookingId) {
        const booking = await base44.asServiceRole.entities.Booking.get(bookingId);
        if (booking) {
          await base44.asServiceRole.entities.Booking.update(bookingId, { payment_status: 'held', status: 'confirmed' });
          await base44.asServiceRole.entities.Message.create({
            booking_id: bookingId,
            sender_name: 'Stelli',
            sender_role: 'client',
            client_email: booking.client_email,
            creator_email: booking.creator_email || '',
            content: `Payment received and held. The ${booking.event_date} shoot is confirmed. Contact details are now unlocked for both sides.`,
            kind: 'system',
          });
          if (booking.creator_email) {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: booking.creator_email,
              subject: `Booking confirmed for ${booking.event_date}`,
              body: `${booking.client_name || 'Your client'} paid for the ${booking.event_date} shoot. The money is held until you deliver the files.\n\nTheir details are in Stelli now.`,
            });
          }
          if (booking.client_email) {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: booking.client_email,
              subject: `You're booked for ${booking.event_date}`,
              body: `Your shoot with ${booking.lensman_name || 'your creator'} on ${booking.event_date} is confirmed. Your payment is held until your files are delivered.`,
            });
          }
        }
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
