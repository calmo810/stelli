import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { notifyBoth } from '../../shared/notify.ts';
import { PRODUCT_NAMES } from '../../shared/bookingContract.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { bookingId, amount, message, includedEdits, addOns, expiresAt } = await req.json();
    if (!bookingId || !amount) {
      return Response.json({ error: 'A booking and an amount are required.' }, { status: 400 });
    }

    const booking = await base44.asServiceRole.entities.Booking.get(bookingId);
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

    const isCreator = !!booking.lensman_email && booking.lensman_email === user.email;
    if (!isCreator && user.role !== 'admin') {
      return Response.json({ error: 'Only the booked creator can quote this request.' }, { status: 403 });
    }

    const cleanAddOns = (addOns || [])
      .filter((addOn) => addOn && addOn.name)
      .map((addOn) => ({ name: String(addOn.name), price: Number(addOn.price) || 0 }));

    const quote = await base44.asServiceRole.entities.Quote.create({
      booking_id: bookingId,
      creator_id: booking.lensman_id,
      client_email: booking.client_email,
      creator_email: booking.lensman_email || user.email,
      amount: Number(amount) || 0,
      message: message || '',
      included_edits: Number(includedEdits) || 30,
      add_ons: cleanAddOns,
      expires_at: expiresAt || '',
      status: 'sent',
    });

    await base44.asServiceRole.entities.Booking.update(bookingId, {
      status: 'quoted',
      total_price: quote.amount,
    });

    const formatName = PRODUCT_NAMES[booking.package_type] || 'your shoot';
    const lines = [
      `Your quote from ${booking.lensman_name || 'your creator'} is ready.`,
      '',
      `Format: ${formatName}`,
      `Shoot date: ${booking.event_date}`,
      `Amount: $${quote.amount.toLocaleString()}`,
      `Edited photos included: ${quote.included_edits}`,
      cleanAddOns.length
        ? `Add-ons: ${cleanAddOns.map((a) => `${a.name} (+$${a.price})`).join(', ')}`
        : '',
      quote.expires_at
        ? `Expires: ${new Date(quote.expires_at).toLocaleDateString('en-US')}`
        : '',
      message ? `\nNote from your creator: ${message}` : '',
      '',
      'Accept it in your Stelli dashboard to lock the date and pay.',
    ].filter(Boolean);

    await notifyBoth(
      base44,
      [booking.client_email, booking.lensman_email],
      `Your Stelli quote · ${formatName}`,
      lines.join('\n')
    );

    return Response.json({ quote });
  } catch (error) {
    console.error('sendQuote error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}