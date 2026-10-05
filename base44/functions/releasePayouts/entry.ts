import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';
import { releaseBooking } from '../../shared/payouts.ts';

/**
 * The nightly sweep: delivered bookings whose 48 hour window has closed with
 * no problem reported get paid out.
 *
 * Only two callers may run it: the scheduled "Release Payouts" workflow, which
 * presents the shared sweep token, and a signed-in founder. Everyone else —
 * anonymous requests included — is turned away before a single booking is read.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json().catch(() => ({}));
    const presented = typeof body?.sweep_token === 'string' ? body.sweep_token : '';
    const expected = secrets.get('PAYOUT_SWEEP_TOKEN') || '';

    let authorized = Boolean(expected) && presented === expected;
    if (!authorized) {
      try {
        const user = await base44.auth.me();
        authorized = Boolean(user && user.role === 'admin');
      } catch {
        authorized = false;
      }
    }
    if (!authorized) {
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