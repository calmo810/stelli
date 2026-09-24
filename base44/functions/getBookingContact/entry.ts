import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

/**
 * The only way a client ever sees a creator's contact details.
 *
 * CreatorContact is admin-only to read, so this function checks that the
 * caller is the client on a booking that has actually been confirmed before
 * handing anything back. Contact details never travel with a public profile.
 */

const CONFIRMED_STATUSES = [
  'confirmed',
  'in_progress',
  'awaiting_delivery',
  'delivered',
  'completed',
];

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });

    const { bookingId } = await req.json();
    if (!bookingId) return Response.json({ error: 'bookingId is required.' }, { status: 400 });

    const booking = await base44.asServiceRole.entities.Booking.get(bookingId);
    if (!booking) return Response.json({ error: 'Booking not found.' }, { status: 404 });

    const isAdmin = user.role === 'admin';
    const isClient =
      booking.client_id === user.id ||
      (booking.client_email && booking.client_email === user.email);

    if (!isAdmin && !isClient) {
      return Response.json({ error: 'This booking is not yours.' }, { status: 403 });
    }
    if (!isAdmin && !CONFIRMED_STATUSES.includes(booking.status)) {
      return Response.json(
        { error: 'Contact details are shared once the booking is confirmed.' },
        { status: 403 }
      );
    }

    const contacts = await base44.asServiceRole.entities.CreatorContact.filter({
      lensman_id: booking.lensman_id,
    });
    const contact = contacts[0];
    if (!contact) return Response.json({ contact: null });

    // The real name stays private — clients only ever get the display name,
    // which already travels with the public profile.
    return Response.json({
      contact: {
        email: contact.email || '',
        phone: contact.phone || '',
        instagram: contact.instagram || '',
      },
    });
  } catch (error) {
    console.error('getBookingContact error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}