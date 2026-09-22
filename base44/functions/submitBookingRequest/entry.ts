import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { notifyBoth } from '../../shared/notify.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    let user = null;
    try {
      user = await base44.auth.me();
    } catch {
      user = null;
    }

    const {
      lensmanId,
      eventDate,
      eventTime,
      location,
      eventType,
      clientName,
      clientEmail,
      clientPhone,
      brief,
    } = await req.json();

    if (!lensmanId || !eventDate || !clientName || !clientEmail || !clientPhone) {
      return Response.json(
        { error: 'Date, name, email and phone are required.' },
        { status: 400 }
      );
    }

    const lensman = await base44.asServiceRole.entities.Lensman.get(lensmanId);
    if (!lensman) {
      return Response.json({ error: 'Creator not found.' }, { status: 404 });
    }

    const booking = await base44.asServiceRole.entities.Booking.create({
      lensman_id: lensmanId,
      lensman_name: lensman.full_name,
      lensman_email: lensman.email || '',
      client_id: user?.id || '',
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clientPhone,
      event_date: eventDate,
      event_time: eventTime || '',
      event_type: eventType || 'Custom shoot',
      location: location || '',
      event_description: brief || '',
      status: 'requested',
      payment_status: 'pending',
    });

    const clientFirst = String(clientName).trim().split(' ')[0];

    await notifyBoth(
      base44,
      [lensman.email],
      `New request from ${clientFirst} for ${eventDate}`,
      `New request from ${clientFirst} for ${eventDate}. Reply in Stelli to work out the details and send your quote.`
    );

    return Response.json({ booking });
  } catch (error) {
    console.error('submitBookingRequest error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}