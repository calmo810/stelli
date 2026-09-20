import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

/**
 * Public read for a shareable memory album. Returns only what the album
 * shows — never the client's contact details, price, or booking status.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const { bookingId } = await req.json();

    if (!bookingId) {
      return Response.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    const booking = await base44.asServiceRole.entities.Booking.get(bookingId);
    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    return Response.json({
      booking: {
        id: booking.id,
        event_type: booking.event_type,
        event_date: booking.event_date,
        lensman_name: booking.lensman_name,
        delivery_link: booking.delivery_link || '',
        delivered_at: booking.delivered_at || '',
      },
    });
  } catch (error) {
    console.error('getAlbumBooking error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}