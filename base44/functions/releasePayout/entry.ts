import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { releaseBooking, refundBooking } from '../../shared/payouts.ts';

/**
 * A founder deciding what happens to frozen money: release it to the creator
 * or send it back to the client.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { bookingId, action, note } = await req.json();
    if (!bookingId || !['release', 'refund'].includes(action)) {
      return Response.json({ error: 'A booking and an action are required.' }, { status: 400 });
    }

    const booking = await base44.asServiceRole.entities.Booking.get(bookingId);
    if (!booking) return Response.json({ error: 'Booking not found.' }, { status: 404 });

    if (action === 'release') {
      const result = await releaseBooking(base44, { ...booking, flagged_for_review: false }, 'founder');
      return Response.json({ result });
    }

    const result = await refundBooking(base44, booking, 0, note || 'Refunded by a founder.');
    await base44.asServiceRole.entities.Booking.update(bookingId, {
      status: 'cancelled',
      cancelled_by: 'creator',
      flag_reason: note || 'Refunded by a founder.',
    });

    return Response.json({ result });
  } catch (error) {
    console.error('releasePayout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}