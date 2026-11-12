import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { viewerRole } from '../../shared/bookingAccess.ts';
import { isConfirmed } from '../../shared/bookingRules.ts';

/**
 * The only way a client ever sees a creator's contact details.
 *
 * CreatorContact is admin-only to read, so this function checks that the
 * caller is the client on a booking that has actually been confirmed before
 * handing anything back. Contact details never travel with a public profile.
 */

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });

    const { bookingId } = await req.json();
    if (!bookingId) return Response.json({ error: 'bookingId is required.' }, { status: 400 });

    const booking = await base44.asServiceRole.entities.Booking.get(bookingId).catch(() => null);
    if (!booking) return Response.json({ error: 'Booking not found.' }, { status: 404 });

    const isAdmin = user.role === 'admin';
    const isClient = viewerRole(booking, user) === 'client';

    if (!isAdmin && !isClient) {
      return Response.json({ error: 'This booking is not yours.' }, { status: 403 });
    }
    // Confirmed means paid for and going ahead. A status alone is not enough,
    // and a cancelled or refunded booking locks the details again.
    if (!isAdmin && !isConfirmed(booking)) {
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
    return Response.json({ error: 'Contact details could not be loaded.' }, { status: 500 });
  }
}