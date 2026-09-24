import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { notifyBoth } from '../../shared/notify.ts';
import { resolveCreatorOwner } from '../../shared/creatorOwner.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Please sign in to send this request.' }, { status: 401 });
    }

    const { lensmanId, eventDate, eventTime, location, eventType, brief, clientName } =
      await req.json();

    if (!lensmanId || !eventDate || !brief || !brief.trim()) {
      return Response.json({ error: 'A date and what you are planning are required.' }, { status: 400 });
    }

    const lensman = await base44.asServiceRole.entities.Lensman.get(lensmanId);
    if (!lensman) {
      return Response.json({ error: 'Creator not found.' }, { status: 404 });
    }

    // File the request against the account that owns this creator profile,
    // not the contact email typed on the public profile.
    const owner = await resolveCreatorOwner(base44, lensman);

    const name = (clientName || user.full_name || '').trim() || user.email;

    const booking = await base44.asServiceRole.entities.Booking.create({
      lensman_id: lensmanId,
      lensman_name: lensman.display_name || 'Stelli creator',
      lensman_email: owner.ownerEmail,
      creator_id: owner.ownerId,
      creator_email: owner.ownerEmail,
      client_id: user.id,
      client_name: name,
      client_email: user.email,
      event_date: eventDate,
      event_time: eventTime || '',
      event_type: eventType || 'Custom shoot',
      location: location || '',
      event_description: brief.trim().slice(0, 2000),
      status: 'requested',
      payment_status: 'pending',
      client_last_read_at: new Date().toISOString(),
    });

    const clientFirst = name.split(' ')[0];

    await notifyBoth(
      base44,
      [owner.ownerEmail],
      `New request from ${clientFirst} for ${eventDate}`,
      `New request from ${clientFirst} for ${eventDate}. Reply in Stelli to work out the details and send your quote.`
    );

    await base44.asServiceRole.entities.Booking.update(booking.id, {
      creator_notified_at: new Date().toISOString(),
    });

    return Response.json({ booking });
  } catch (error) {
    console.error('submitBookingRequest error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}