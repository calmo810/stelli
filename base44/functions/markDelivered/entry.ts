import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { notifyBoth } from '../../shared/notify.ts';
import { releaseDueFrom } from '../../shared/payouts.ts';
import { viewerRole, creatorEmail } from '../../shared/bookingAccess.ts';
import { openPhotoRelease } from '../../shared/photoRelease.ts';
import { deliveryPhotoRows } from '../../shared/deliveryPhotos.ts';
import { ensureAlbumToken, albumUrl } from '../../shared/albumAccess.ts';

/**
 * Delivery happens in two steps: the unedited set first (no status change),
 * then the final edits, which starts the 48 hour window before payout and
 * opens the photo release agreement for both sides.
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

    const booking = await base44.asServiceRole.entities.Booking.get(bookingId);
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

    const role = viewerRole(booking, user);
    if (role !== 'lensman' && user.role !== 'admin') {
      return Response.json({ error: 'Only the booked creator can deliver this booking.' }, { status: 403 });
    }

    const link = (deliveryLink || '').trim();

    // A link is optional now that photos can be delivered straight into the
    // client's album, but anything pasted still has to be a real https address
    // — never a javascript: or data: payload. With no link there must be at
    // least one delivered photo, so the client always receives something.
    if (link && !/^https:\/\//i.test(link)) {
      return Response.json(
        { error: 'The gallery link needs to start with https://' },
        { status: 400 }
      );
    }

    if (!link) {
      const delivered = await deliveryPhotoRows(base44, bookingId, 1);
      if (!delivered.length) {
        return Response.json(
          { error: 'Add at least one photo above, or paste a gallery link.' },
          { status: 400 }
        );
      }
    }

    const now = new Date();

    // The email has to carry the album key, or a client opening it in their
    // inbox lands on an album that answers "not found".
    const albumToken = await ensureAlbumToken(base44, booking);
    const albumLine = albumToken ? `Your Stelli album: ${albumUrl(bookingId, albumToken)}\n\n` : '';

    if (!isFinal) {
      const updated = await base44.asServiceRole.entities.Booking.update(bookingId, {
        ...(link ? { unedited_link: link } : {}),
        unedited_delivered_at: now.toISOString(),
      });

      await notifyBoth(
        base44,
        [booking.client_email],
        'Your unedited set is ready',
        `${booking.lensman_name || 'Your creator'} posted the unedited set for the ${booking.event_date} shoot.\n\n${
          link ? `Open it here: ${link}\n\n` : ''
        }${albumLine}The final edits follow.`
      );

      return Response.json({ booking: updated, step: 'unedited' });
    }

    const deliveredAt = now.toISOString();

    const updated = await base44.asServiceRole.entities.Booking.update(bookingId, {
      ...(link ? { delivery_link: link } : {}),
      delivered_at: deliveredAt,
      release_due_at: releaseDueFrom(deliveredAt),
      status: 'delivered',
    });

    await notifyBoth(
      base44,
      [booking.client_email],
      'Your photos are ready',
      `${booking.lensman_name || 'Your creator'} delivered your final edits.\n\n${
        link ? `Open them here: ${link}\n\n` : ''
      }${albumLine}You have 48 hours to report a problem. After that the payment is released to your creator.`
    );

    // A new photo release agreement opens in both portals. Nothing is public
    // until the client and the creator both say yes.
    await openPhotoRelease(base44, { ...booking, ...updated, creator_email: creatorEmail(booking) });

    return Response.json({ booking: updated, step: 'final' });
  } catch (error) {
    console.error('markDelivered error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}