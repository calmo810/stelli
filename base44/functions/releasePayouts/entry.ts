import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { releaseBooking } from '../../shared/payouts.ts';
import { sweepManualPayouts } from '../../shared/manualPayouts.ts';

/**
 * The hourly sweep: delivered bookings whose 48 hour window has closed with
 * no problem reported get paid out, and so does the creator's share of a late
 * cancellation that could not be paid at the time.
 *
 * The scheduled "Release Payouts" workflow calls it as an app admin, and a
 * signed-in founder may run it by hand. Everyone else — anonymous requests
 * included — is turned away before a single booking is read.
 *
 * The lists read here only say which bookings are worth a look. Whether a
 * booking is actually paid is decided inside releaseBooking, on a fresh read
 * taken after the booking is locked — so a problem reported a second ago, or a
 * founder refunding at the same moment, is always seen.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const Booking = base44.asServiceRole.entities.Booking;

    const [delivered, cancelledWithShare] = await Promise.all([
      Booking.filter({ status: 'delivered', payment_status: 'held' }, 'release_due_at', 500),
      Booking.filter({ status: 'cancelled', cancellation_payout_due: true }, 'cancelled_at', 500),
    ]);

    const now = Date.now();
    const candidates = [
      ...delivered.filter(
        (booking) =>
          !booking.flagged_for_review &&
          !booking.problem_reported_at &&
          (booking.client_confirmed_delivery ||
            (booking.release_due_at && new Date(booking.release_due_at).getTime() <= now))
      ),
      ...cancelledWithShare.filter((booking) => !booking.flagged_for_review),
    ];

    let released = 0;
    let failed = 0;
    let waitingOnSetup = 0;
    for (const booking of candidates) {
      try {
        const result = await releaseBooking(base44, booking.id, 'auto');
        if (result.released) released += 1;
        else if (result.reason === 'no-payout-account') waitingOnSetup += 1;
        else if (result.reason === 'transfer-failed') failed += 1;
      } catch (error) {
        failed += 1;
        console.error('Release failed for booking', booking.id, '-', error.message);
      }
    }

    // Founder payouts still waiting on setup or on the balance clearing.
    let manual = { checked: 0, sent: 0 };
    try {
      manual = await sweepManualPayouts(base44);
    } catch (error) {
      console.error('Manual payout sweep failed:', error.message);
    }

    // Counts only — never booking identifiers or per-booking detail.
    return Response.json({
      checked: delivered.length + cancelledWithShare.length,
      due: candidates.length,
      released,
      failed,
      waitingOnSetup,
      manual,
    });
  } catch (error) {
    console.error('releasePayouts error:', error.message);
    return Response.json({ error: 'The sweep did not finish.' }, { status: 500 });
  }
}
