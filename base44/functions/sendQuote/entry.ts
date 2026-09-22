import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { notifyThread } from '../../shared/notify.ts';
import { viewerRole, recordFirstReply, creatorEmail } from '../../shared/bookingAccess.ts';

/** Quotes stay valid for 72 hours unless the creator picks otherwise. */
const EXPIRY_HOURS = { '24h': 24, '72h': 72, '7d': 168 };

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { bookingId, amount, message, includedEdits, addOns, expiry } = await req.json();
    if (!bookingId || !amount) {
      return Response.json({ error: 'A booking and an amount are required.' }, { status: 400 });
    }

    const booking = await base44.asServiceRole.entities.Booking.get(bookingId);
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

    const role = viewerRole(booking, user);
    if (role !== 'lensman' && user.role !== 'admin') {
      return Response.json({ error: 'Only the booked creator can quote this request.' }, { status: 403 });
    }

    // Payouts come before quoting — the money has to have somewhere to land.
    const lensman = await base44.asServiceRole.entities.Lensman.get(booking.lensman_id).catch(() => null);
    if (lensman && !lensman.payouts_enabled && user.role !== 'admin') {
      return Response.json(
        { error: 'Set up payouts to send your first quote.', needsPayouts: true },
        { status: 403 }
      );
    }

    const hours = EXPIRY_HOURS[expiry] || EXPIRY_HOURS['72h'];
    const expiresAt = new Date(Date.now() + hours * 3600000).toISOString();

    const cleanAddOns = (addOns || [])
      .filter((addOn) => addOn && addOn.name)
      .map((addOn) => ({ name: String(addOn.name), price: Number(addOn.price) || 0 }));

    const quote = await base44.asServiceRole.entities.Quote.create({
      booking_id: bookingId,
      creator_id: booking.lensman_id,
      client_email: booking.client_email,
      creator_email: creatorEmail(booking),
      amount: Number(amount) || 0,
      message: message || '',
      included_edits: Number(includedEdits) || 30,
      add_ons: cleanAddOns,
      expires_at: expiresAt,
      status: 'sent',
    });

    await base44.asServiceRole.entities.Booking.update(bookingId, {
      status: 'quoted',
      total_price: quote.amount,
    });

    await recordFirstReply(base44, booking);

    const lines = [
      `Your quote from ${booking.lensman_name || 'your creator'} is ready.`,
      '',
      `Shoot date: ${booking.event_date}`,
      `Amount: $${quote.amount.toLocaleString()}`,
      `Edited photos included: ${quote.included_edits}`,
      cleanAddOns.length
        ? `Add-ons: ${cleanAddOns.map((a) => `${a.name} (+$${a.price})`).join(', ')}`
        : '',
      `Expires: ${new Date(expiresAt).toLocaleDateString('en-US')}`,
      message ? `\nNote from your creator: ${message}` : '',
      '',
      'Accept it in your Stelli messages to lock the date and pay.',
    ].filter(Boolean);

    await notifyThread(base44, booking, {
      to: booking.client_email,
      role: 'client',
      sinceIso: quote.created_date || new Date().toISOString(),
      subject: 'Your Stelli quote',
      body: lines.join('\n'),
    });

    return Response.json({ quote });
  } catch (error) {
    console.error('sendQuote error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}