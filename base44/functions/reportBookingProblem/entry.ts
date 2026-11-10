import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { emailAdmins, notifyBoth } from '../../shared/notify.ts';
import { viewerRole } from '../../shared/bookingAccess.ts';
import { reportBlocker } from '../../shared/bookingRules.ts';
import { claimBooking, unlockBooking } from '../../shared/bookingLock.ts';
import { hoursUntilShoot } from '../../shared/shootTime.ts';

/**
 * A client reporting a problem freezes the held funds and puts the booking in
 * the founder queue. Nothing moves until a person decides.
 *
 * The report and the payout compete for the same lock on the booking. If the
 * report gets it first, the flag is set before any payout can look. If a payout
 * is already in flight, the report waits a few seconds for it to finish and
 * then records what actually happened — it is never lost, and it never slips
 * in "at the same time".
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });

    const { bookingId, note } = await req.json();
    const text = String(note || '').trim();
    if (!bookingId || !text) {
      return Response.json({ error: 'Tell us what went wrong.' }, { status: 400 });
    }

    const Booking = base44.asServiceRole.entities.Booking;
    const seen = await Booking.get(bookingId).catch(() => null);
    if (!seen) return Response.json({ error: 'Booking not found.' }, { status: 404 });

    if (viewerRole(seen, user) !== 'client' && user.role !== 'admin') {
      return Response.json({ error: 'Only the client can report a problem.' }, { status: 403 });
    }

    // Wait behind a payout or refund already under way, rather than racing it.
    // If the lock still can't be had after that, the report is written anyway
    // on the latest read: a report must never be lost.
    const claim = await claimBooking(base44, bookingId, 'review', { waitMs: 6000 });
    const booking = claim.booking || seen;

    try {
      const shootPassed = !(hoursUntilShoot(booking.event_date, booking.event_time, Date.now()) > 0);
      const blocker = reportBlocker(booking, { shootPassed });
      if (blocker) return Response.json({ error: blocker }, { status: 400 });

      const now = new Date().toISOString();
      const alreadyPaidOut = booking.payment_status === 'released';
      const reason = alreadyPaidOut
        ? `Client reported a problem after the payout had gone out: ${text.slice(0, 200)}`
        : `Client reported a problem: ${text.slice(0, 200)}`;

      const updated = await Booking.update(bookingId, {
        problem_reported_at: now,
        problem_note: text.slice(0, 2000),
        flagged_for_review: true,
        flag_reason: reason,
      });

      const heldLine = alreadyPaidOut
        ? 'The payment had already been released. A founder is reviewing it.'
        : 'The payment stays held while a founder reviews it.';

      await base44.asServiceRole.entities.Message.create({
        booking_id: bookingId,
        sender_name: 'Stelli',
        sender_role: 'client',
        client_id: booking.client_id || '',
        creator_id: booking.creator_id || '',
        client_email: booking.client_email,
        lensman_email: booking.creator_email || booking.lensman_email || '',
        content: `A problem was reported on this booking. ${heldLine}`,
        kind: 'system',
      });

      await notifyBoth(
        base44,
        [booking.client_email, booking.creator_email || booking.lensman_email],
        alreadyPaidOut ? 'Problem reported' : 'Problem reported — payment on hold',
        `A problem was reported on the ${booking.event_date} shoot. ${heldLine}`
      );

      await emailAdmins(
        base44,
        'A client reported a problem',
        `${booking.client_name || 'A client'} reported a problem on the ${booking.event_date} shoot with ${booking.lensman_name || 'their creator'}.\n\n"${text.slice(0, 1000)}"\n\n${heldLine} It is in your queue on the admin page.`
      );

      return Response.json({
        booking: {
          id: updated.id,
          problem_reported_at: now,
          flagged_for_review: true,
          payment_status: booking.payment_status,
        },
        held: !alreadyPaidOut,
      });
    } finally {
      if (claim.won) await unlockBooking(base44, bookingId, claim.token);
    }
  } catch (error) {
    console.error('reportBookingProblem error:', error.message);
    return Response.json({ error: 'That report did not send. Try again.' }, { status: 500 });
  }
}
