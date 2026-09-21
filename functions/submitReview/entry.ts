import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });

    const { bookingId, rating, comment } = await req.json();
    const stars = Number(rating);
    if (!bookingId || !Number.isFinite(stars) || stars < 1 || stars > 5) {
      return Response.json({ error: 'A booking and a rating from 1 to 5 are required.' }, { status: 400 });
    }

    const booking = await base44.asServiceRole.entities.Booking.get(bookingId);
    if (!booking) return Response.json({ error: 'Booking not found.' }, { status: 404 });

    const isClient = booking.client_id === user.id || booking.client_email === user.email;
    if (!isClient) return Response.json({ error: 'Only the client on this booking can review it.' }, { status: 403 });
    if (booking.status !== 'completed') return Response.json({ error: 'You can review a shoot once it is completed.' }, { status: 400 });
    if (booking.reviewed) return Response.json({ error: 'You already reviewed this shoot.' }, { status: 400 });

    const review = await base44.asServiceRole.entities.Review.create({
      booking_id: bookingId,
      lensman_id: booking.lensman_id,
      client_id: user.id,
      client_name: booking.client_name || 'Stelli client',
      rating: Math.round(stars),
      comment: (comment || '').trim().slice(0, 2000),
    });

    await base44.asServiceRole.entities.Booking.update(bookingId, { reviewed: true });

    const reviews = await base44.asServiceRole.entities.Review.filter({ lensman_id: booking.lensman_id });
    const count = reviews.length;
    const average = count ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / count : 0;
    const lowRatings = reviews.filter(r => (r.rating || 0) <= 2).length;

    await base44.asServiceRole.entities.Lensman.update(booking.lensman_id, {
      avg_rating: Math.round(average * 10) / 10,
      review_count: count,
    });

    if (lowRatings >= 3) {
      await base44.asServiceRole.entities.Report.create({
        reporter_email: 'system@getstelli.com',
        reported_lensman_id: booking.lensman_id,
        booking_id: bookingId,
        reason: 'other',
        details: `Automatic flag: this creator now has ${lowRatings} ratings at 2 stars or below.`,
        status: 'open',
      });
    }

    return Response.json({ review });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
