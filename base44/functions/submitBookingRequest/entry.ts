import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { notifyBoth } from '../../shared/notify.ts';
import { PRODUCT_NAMES } from '../../shared/bookingContract.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Please sign in to send a request.' }, { status: 401 });
    }

    const {
      lensmanId,
      packageType,
      eventType,
      eventDate,
      eventTime,
      location,
      brief,
      coBookers,
    } = await req.json();

    if (!lensmanId || !packageType || !eventType || !eventDate) {
      return Response.json({ error: 'Missing required request details.' }, { status: 400 });
    }

    const lensman = await base44.asServiceRole.entities.Lensman.get(lensmanId);
    if (!lensman) {
      return Response.json({ error: 'Creator not found.' }, { status: 404 });
    }

    const booking = await base44.entities.Booking.create({
      lensman_id: lensmanId,
      lensman_name: lensman.full_name,
      lensman_email: lensman.email || '',
      client_id: user.id,
      client_name: user.full_name || user.email,
      client_email: user.email,
      event_date: eventDate,
      event_time: eventTime || '',
      event_type: eventType,
      event_description: brief || '',
      location: location || '',
      package_type: packageType,
      co_bookers: (coBookers || []).filter(Boolean),
      status: 'requested',
      payment_status: 'pending',
    });

    const formatName = PRODUCT_NAMES[packageType] || 'your shoot';
    const summary = [
      `Format: ${formatName}`,
      `Date: ${eventDate}`,
      eventTime ? `Time: ${eventTime}` : '',
      location ? `Location: ${location}` : '',
      brief ? `\nBrief: ${brief}` : '',
    ].filter(Boolean).join('\n');

    await notifyBoth(
      base44,
      [lensman.email, user.email],
      `New shoot request · ${formatName}`,
      `${user.full_name || user.email} requested a shoot.\n\n${summary}\n\n${lensman.full_name} will reply with a private quote. Nothing is charged until the quote is accepted.`
    );

    return Response.json({ booking });
  } catch (error) {
    console.error('submitBookingRequest error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}