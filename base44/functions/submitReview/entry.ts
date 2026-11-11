import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { viewerRole } from '../../shared/bookingAccess.ts';
import { effectiveStatus } from '../../shared/bookingRules.ts';
import { hasDirectContact } from '../../shared/contactGuard.ts';
import { emailAdmins } from '../../shared/notify.ts';

/** This many ratings of two stars or fewer puts a creator in front of a founder. */
const LOW_RATING_LIMIT = 3;

/** "Jordan Lee" -> "Jordan L." Reviews are public; full names are not. */
function publicName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'Stelli client';
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : parts[0];
}

/**
 * A client reviewing a finished shoot.
 *
 * Only the client on the booking, only once the booking is completed, and only
 * once: the check is a lookup for an existing review of this booking. (It used
 * to rely on a `reviewed` flag the Booking entity does not have, so it never
 * stuck and a client could review the same shoot over and over.)
 *
 * Reviews can be read by anyone, so the record carries the client's first name
 * and last initial only, and no user ID.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });

    const { bookingId, rating, comment } = await req.json();
    const stars = Math.round(Number(rating));
    if (!bookingId || !Number.isFinite(stars) || stars < 1 || stars > 5) {
      return Response.json({ error: 'A booking and a rating from 1 to 5 are required.' }, { status: 400 });
    }

    const booking = await base44.asServiceRole.entities.Booking.get(bookingId).catch(() => null);
    if (!booking) return Response.json({ error: 'Booking not found.' }, { status: 404 });

    // The creator on a booking is never its client, so nobody reviews themselves.
    if (viewerRole(booking, user) !== 'client') {
      return Response.json({ error: 'Only the client on this booking can review it.' }, { status: 403 });
    }
    if (effectiveStatus(booking) !== 'completed') {
      return Response.json({ error: 'You can review a shoot once it is completed.' }, { status: 400 });
    }

    const text = String(comment || '').trim().slice(0, 2000);
    if (hasDirectContact(text)) {
      return Response.json({ error: 'Leave contact details out of the review.' }, { status: 400 });
    }

    const Review = base44.asServiceRole.entities.Review;
    const existing = await Review.filter({ booking_id: bookingId });
    if (existing.length) {
      return Response.json({ error: 'You already reviewed this shoot.', review: existing[0] }, { status: 409 });
    }

    const review = await Review.create({
      booking_id: bookingId,
      lensman_id: booking.lensman_id,
      client_name: publicName(booking.client_name),
      rating: stars,
      comment: text,
      event_type: booking.event_type || '',
    });

    // Two taps at once: keep the earliest, drop the rest.
    const all = (await Review.filter({ booking_id: bookingId })).sort(
      (a, b) => String(a.created_date).localeCompare(String(b.created_date)) || String(a.id).localeCompare(String(b.id))
    );
    if (all.length > 1 && all[0].id !== review.id) {
      await Review.delete(review.id).catch(() => {});
      return Response.json({ error: 'You already reviewed this shoot.', review: all[0] }, { status: 409 });
    }

    // One review per booking counts, even if a duplicate is still being withdrawn.
    const seenBookings = new Set();
    const reviews = (await Review.filter({ lensman_id: booking.lensman_id }, 'created_date', 500)).filter((r) => {
      const key = r.booking_id || r.id;
      if (seenBookings.has(key)) return false;
      seenBookings.add(key);
      return true;
    });
    const count = reviews.length;
    const average = count ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / count : 0;
    const lowRatings = reviews.filter((r) => (r.rating || 0) <= 2).length;

    await base44.asServiceRole.entities.Lensman.update(booking.lensman_id, {
      avg_rating: Math.round(average * 10) / 10,
      review_count: count,
    });

    // The third low rating puts the creator in the founder queue — once, not
    // again on every review after it.
    if (stars <= 2 && lowRatings >= LOW_RATING_LIMIT) {
      const Report = base44.asServiceRole.entities.Report;
      const open = await Report.filter({
        reported_lensman_id: booking.lensman_id,
        reason: 'low_ratings',
        status: 'open',
      }).catch(() => []);
      if (!open.length) {
        await Report.create({
          reporter_email: 'system',
          reported_lensman_id: booking.lensman_id,
          booking_id: bookingId,
          reason: 'low_ratings',
          details: `${booking.lensman_name || 'This creator'} now has ${lowRatings} ratings of two stars or fewer.`,
          status: 'open',
        }).catch((error) => console.error('Low-rating report failed -', error.message));
        await emailAdmins(
          base44,
          'A creator has three low ratings',
          `${booking.lensman_name || 'A creator'} now has ${lowRatings} ratings of two stars or fewer. It is in your queue on the admin page.`
        );
      }
    }

    return Response.json({ review });
  } catch (error) {
    console.error('submitReview error:', error.message);
    return Response.json({ error: 'Your review did not save. Try again.' }, { status: 500 });
  }
}
