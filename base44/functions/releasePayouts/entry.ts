import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { releaseBooking } from '../../shared/payouts.ts';

/**
 * The nightly sweep: delivered bookings whose 48 hour window has closed with
 * no problem reported get paid out.
 *
 * The scheduled "Release Payouts" workflow calls it as an app admin, and a
 * signed-in founder may run it by hand. Everyone else — anonymous requests
 * included — is turned away before a single booking is read.
 *
 * The workflow carries no token: no secret is ever written into its
 * configuration, where anyone reading the app's source could take it.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

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

    let released = 0;
    for (const booking of due) {
      try {
        const result = await releaseBooking(base44, booking, 'auto');
        if (result.released) released += 1;
      } catch (error) {
        console.error('Release failed for booking', booking.id, '-', error.message);
      }
    }

    // Counts only — never booking identifiers or per-booking detail.
    return Response.json({ checked: delivered.length, due: due.length, released });
  } catch (error) {
    console.error('releasePayouts error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}