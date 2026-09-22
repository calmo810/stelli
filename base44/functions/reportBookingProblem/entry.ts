import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { notifyBoth } from '../../shared/notify.ts';
import { viewerRole } from '../../shared/bookingAccess.ts';

/**
 * A client reporting a problem freezes the held funds and puts the booking in
 * the founder queue. Nothing moves until a person decides.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });

    const { bookingId, note } = await req.json();
    if (!bookingId || !note || !note.trim()) {
      return Response.json({ error: 'Tell us what went wrong.' }, { status: 400 });
    }

    const booking = await base44.asServiceRole.entities.Booking.get(bookingId);
    if (!booking) return Response.json({ error: 'Booking not found.' }, { status: 404 });

    if (viewerRole(booking, user) !== 'client' && user.role !== 'admin') {
      return Response.json({ error: 'Only the client can report a problem.' }, { status: 403 });
    }

    if (booking.payment_status !== 'held') {
      return Response.json({ error: 'There is no held payment on this booking.' }, { status: 400 });
    }

    const now = new Date().toISOString();

    const updated = await base44.asServiceRole.entities.Booking.update(bookingId, {
      problem_reported_at: now,
      problem_note: note.trim().slice(0, 2000),
      flagged_for_review: true,
      flag_reason: `Client reported a problem: ${note.trim().slice(0, 200)}`,
    });

    await base44.asServiceRole.entities.Message.create({
      booking_id: bookingId,
      sender_name: 'Stelli',
      sender_role: 'client',
      client_email: booking.client_email,
      lensman_email: booking.creator_email || booking.lensman_email || '',
      content: 'A problem was reported with this delivery. The payment stays held while a founder reviews it.',
      kind: 'system',
    });

    await notifyBoth(
      base44,
      [booking.client_email, booking.creator_email || booking.lensman_email],
      'Problem reported — payment on hold',
      `A problem was reported on the ${booking.event_date} shoot. The payment stays held by Stelli while a founder reviews it.`
    );

    return Response.json({ booking: updated });
  } catch (error) {
    console.error('reportBookingProblem error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}