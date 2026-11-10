import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { notifyBoth } from '../../shared/notify.ts';
import { deliveryBlocker, releaseDueFrom } from '../../shared/bookingRules.ts';
import { viewerRole, creatorEmail } from '../../shared/bookingAccess.ts';
import { openPhotoRelease } from '../../shared/photoRelease.ts';
import { deliveryPhotoRows } from '../../shared/deliveryPhotos.ts';
import { galleryLinkProblem, newAlbumToken } from '../../shared/albumAccess.ts';
import { SITE_ORIGIN } from '../../shared/origins.ts';
import { withBookingLock } from '../../shared/bookingLock.ts';

/**
 * Delivery happens in two steps: the unedited set first (no status change),
 * then the final edits, which starts the 48 hour window before payout and
 * opens the photo release agreement for both sides.
 *
 * Final delivery happens once. After it the album is locked and this function
 * refuses: marking a booking delivered again would restart the client's
 * 48 hours, which a creator could use to push a payout window around — and
 * which, on a booking that had already paid out, dragged it back to
 * "delivered". A booking has to be paid for, and not cancelled, to be
 * delivered at all.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { bookingId, deliveryLink, step } = await req.json();
    const isFinal = step !== 'unedited';

    if (!bookingId) {
      return Response.json({ error: 'A booking is required.' }, { status: 400 });
    }

    const Booking = base44.asServiceRole.entities.Booking;
    const booking = await Booking.get(bookingId).catch(() => null);
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

    const role = viewerRole(booking, user);
    if (role !== 'lensman' && user.role !== 'admin') {
      return Response.json({ error: 'Only the booked creator can deliver this booking.' }, { status: 403 });
    }

    const blocker = deliveryBlocker(booking);
    if (blocker) return Response.json({ error: blocker }, { status: 409 });

    const link = String(deliveryLink || '').trim();

    // A link is optional now that photos can be delivered straight into the
    // client's album, but anything pasted has to be a real web address — never
    // a javascript: or data: payload, and not a file path. With no link there
    // must be at least one delivered photo, so the client always gets something.
    const linkProblem = galleryLinkProblem(link);
    if (linkProblem) return Response.json({ error: linkProblem }, { status: 400 });

    if (!link) {
      const delivered = await deliveryPhotoRows(base44, bookingId, 1);
      const alreadyLinked = isFinal ? false : Boolean(booking.unedited_link);
      if (!delivered.length && !alreadyLinked) {
        return Response.json(
          { error: 'Add at least one photo above, or paste a gallery link.' },
          { status: 400 }
        );
      }
    }

    // The link the client opens always carries the album token.
    const albumToken = booking.album_token || newAlbumToken();
    const albumUrl = `${SITE_ORIGIN}/album/${bookingId}?t=${albumToken}`;
    const now = new Date();

    if (!isFinal) {
      await Booking.update(bookingId, {
        ...(link ? { unedited_link: link } : {}),
        unedited_delivered_at: booking.unedited_delivered_at || now.toISOString(),
        album_token: albumToken,
      });

      await notifyBoth(
        base44,
        [booking.client_email],
        'Your unedited set is ready',
        `${booking.lensman_name || 'Your creator'} posted the unedited set for the ${booking.event_date} shoot.\n\n${
          link ? `Open it here: ${link}` : `Open your album: ${albumUrl}`
        }\n\nThe final edits follow.`
      );

      return Response.json({ booking: { id: bookingId, status: booking.status }, step: 'unedited' });
    }

    const deliveredAt = now.toISOString();

    // Final delivery is taken under the booking's lock and re-checked on a
    // fresh read, so two taps at once deliver once and set one window.
    const outcome = await withBookingLock(
      base44,
      bookingId,
      'deliver',
      async (fresh) => {
        const stillBlocked = deliveryBlocker(fresh);
        if (stillBlocked) return { error: stillBlocked };
        return {
          booking: await Booking.update(bookingId, {
            ...(link ? { delivery_link: link } : {}),
            delivered_at: deliveredAt,
            release_due_at: releaseDueFrom(deliveredAt),
            status: 'delivered',
            album_token: fresh.album_token || albumToken,
          }),
        };
      },
      { waitMs: 4000 }
    );
    if (!outcome.locked) {
      return Response.json({ error: 'This booking is being updated right now. Try again in a moment.' }, { status: 409 });
    }
    if (outcome.result.error) return Response.json({ error: outcome.result.error }, { status: 409 });
    const updated = outcome.result.booking;

    await notifyBoth(
      base44,
      [booking.client_email],
      'Your photos are ready',
      `${booking.lensman_name || 'Your creator'} delivered your final edits.\n\n${
        link ? `Open them here: ${link}\n\nYour Stelli album: ${albumUrl}` : `Open your album: ${albumUrl}`
      }\n\nYou have 48 hours to report a problem. After that the payment is released to your creator.`
    );

    // A new photo release agreement opens in both portals. Nothing is public
    // until the client and the creator both say yes.
    await openPhotoRelease(base44, { ...updated, creator_email: creatorEmail(booking) });

    return Response.json({
      booking: {
        id: bookingId,
        status: 'delivered',
        delivered_at: updated.delivered_at,
        release_due_at: updated.release_due_at,
      },
      step: 'final',
    });
  } catch (error) {
    console.error('markDelivered error:', error.message);
    return Response.json({ error: 'That did not save. Try again.' }, { status: 500 });
  }
}
