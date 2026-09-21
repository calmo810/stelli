import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const REASONS = ['no_show', 'off_platform_booking', 'late_delivery', 'behavior', 'photos_misused', 'other'];

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });

    const { bookingId, lensmanId, reason, details } = await req.json();
    if (!REASONS.includes(reason) || !details || !details.trim()) {
      return Response.json({ error: 'Pick a reason and tell us what happened.' }, { status: 400 });
    }

    let reportedEmail = '';
    let reportedLensmanId = lensmanId || '';
    if (bookingId) {
      const booking = await base44.asServiceRole.entities.Booking.get(bookingId);
      if (booking) {
        const isClient = booking.client_id === user.id || booking.client_email === user.email;
        reportedEmail = isClient ? (booking.creator_email || '') : booking.client_email;
        reportedLensmanId = reportedLensmanId || booking.lensman_id;
      }
    }

    const report = await base44.asServiceRole.entities.Report.create({
      reporter_id: user.id,
      reporter_email: user.email,
      reported_lensman_id: reportedLensmanId,
      reported_email: reportedEmail,
      booking_id: bookingId || '',
      reason,
      details: details.trim().slice(0, 4000),
      status: 'open',
    });

    return Response.json({ report });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
