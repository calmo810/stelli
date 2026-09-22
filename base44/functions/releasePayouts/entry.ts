import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { releaseBooking } from '../../shared/payouts.ts';

/**
 * The nightly sweep: delivered bookings whose 48 hour window has closed with
 * no problem reported get paid out. Runs on a schedule, so it takes no user —
 * but anyone reaching it as a signed-in user must be a founder.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    let user = null;
    try {
      user = await base44.auth.me();
    } catch {
      user = null;
    }
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const delivered = await base44.asServiceRole.entities.Booking.filter({
      status: 'delivered',
      payment_status: 'held',
    });

    const now = Date.now();
    const due = delivered.filter(
      (booking) =>
        booking.release_due_at &&
        new Date(booking.release_due_at).getTime() <= now &&
        !booking.problem_reported_at &&
        !booking.flagged_for_review
    );

    const results = [];
    for (const booking of due) {
      try {
        const result = await releaseBooking(base44, booking, 'auto');
        results.push({ bookingId: booking.id, ...result });
      } catch (error) {
        console.error('Release failed for booking', booking.id, '-', error.message);
        results.push({ bookingId: booking.id, released: false, reason: error.message });
      }
    }

    return Response.json({ checked: delivered.length, due: due.length, results });
  } catch (error) {
    console.error('releasePayouts error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}