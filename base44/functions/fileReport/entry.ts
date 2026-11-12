import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { viewerRole, creatorEmail } from '../../shared/bookingAccess.ts';
import { albumLocked, moneyTaken } from '../../shared/bookingRules.ts';
import { claimBooking, unlockBooking } from '../../shared/bookingLock.ts';
import { hoursUntilShoot } from '../../shared/shootTime.ts';
import { emailAdmins } from '../../shared/notify.ts';

const REASONS = ['no_show', 'off_platform_booking', 'late_delivery', 'behavior', 'photos_misused', 'other'];

/** One person can't flood the queue. */
const MAX_OPEN_REPORTS = 10;

/**
 * Either side of a booking reporting the other to Stelli.
 *
 * A report is about a booking you are on — you can't report a stranger's
 * booking, and the person reported is always the other side of yours. Reports
 * are read by founders only.
 *
 * One reason acts at once. When a CLIENT reports a NO-SHOW on a booking they
 * paid for, after the shoot time, with nothing delivered:
 *   - the payment is frozen for a founder, exactly as "report a problem" does;
 *   - the creator's profile goes on hold: hidden from browse and closed to new
 *     requests until a founder has looked (they can lift it in one tap).
 * Everything else waits for a founder to read it.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });

    const { bookingId, reason, details } = await req.json();
    const text = String(details || '').trim().slice(0, 4000);
    if (!bookingId || !REASONS.includes(reason) || !text) {
      return Response.json({ error: 'Pick a reason and tell us what happened.' }, { status: 400 });
    }

    const Booking = base44.asServiceRole.entities.Booking;
    const booking = await Booking.get(bookingId).catch(() => null);
    const role = booking ? viewerRole(booking, user) : null;
    if (!role) return Response.json({ error: 'This booking is not yours.' }, { status: 403 });

    const Report = base44.asServiceRole.entities.Report;
    const mine = await Report.filter({ reporter_id: user.id, status: 'open' });
    if (mine.some((report) => report.booking_id === bookingId && report.reason === reason)) {
      return Response.json({ error: 'You already reported this. A founder is on it.' }, { status: 409 });
    }
    if (mine.length >= MAX_OPEN_REPORTS) {
      return Response.json(
        { error: 'You have several reports open already. Email getstelli@gmail.com for anything urgent.' },
        { status: 429 }
      );
    }

    const isClient = role === 'client';
    const report = await Report.create({
      reporter_id: user.id,
      reporter_email: user.email,
      reporter_role: isClient ? 'client' : 'creator',
      reported_lensman_id: isClient ? booking.lensman_id || '' : '',
      reported_email: isClient ? creatorEmail(booking) : booking.client_email || '',
      booking_id: bookingId,
      reason,
      details: text,
      status: 'open',
    });

    // A client's no-show report on a paid, undelivered shoot whose time has passed.
    const shootPassed = !(hoursUntilShoot(booking.event_date, booking.event_time, Date.now()) > 0);
    let frozen = false;
    let held = false;
    if (isClient && reason === 'no_show' && moneyTaken(booking) && !albumLocked(booking) && shootPassed) {
      const claim = await claimBooking(base44, bookingId, 'review', { waitMs: 6000 });
      try {
        const fresh = claim.booking || booking;
        if (!fresh.problem_reported_at) {
          await Booking.update(bookingId, {
            problem_reported_at: new Date().toISOString(),
            problem_note: text.slice(0, 2000),
            flagged_for_review: true,
            flag_reason: `Client reported a no-show: ${text.slice(0, 200)}`,
          });
          frozen = fresh.payment_status === 'held';
        }
      } finally {
        if (claim.won) await unlockBooking(base44, bookingId, claim.token);
      }

      if (booking.lensman_id) {
        await base44.asServiceRole.entities.Lensman.update(booking.lensman_id, { under_review: true })
          .then(() => { held = true; })
          .catch((error) => console.error('Creator hold failed -', error.message));
      }
    }

    await emailAdmins(
      base44,
      reason === 'no_show' ? 'A no-show was reported' : 'A report was filed',
      `${isClient ? booking.client_name || 'A client' : booking.lensman_name || 'A creator'} reported ${
        isClient ? booking.lensman_name || 'their creator' : booking.client_name || 'their client'
      } on the ${booking.event_date} booking.\n\nReason: ${reason.replace(/_/g, ' ')}\n\n"${text.slice(0, 1000)}"${
        frozen ? '\n\nThe payment is frozen.' : ''
      }${held ? '\nThe creator’s profile is on hold until you have looked.' : ''}\n\nIt is in your queue on the admin page.`
    );

    return Response.json({ report: { id: report.id, status: 'open' }, frozen, creatorOnHold: held });
  } catch (error) {
    console.error('fileReport error:', error.message);
    return Response.json({ error: 'Your report did not send. Try again, or email getstelli@gmail.com.' }, { status: 500 });
  }
}
