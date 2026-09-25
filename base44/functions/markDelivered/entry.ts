import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { notifyBoth } from '../../shared/notify.ts';
import { releaseDueFrom } from '../../shared/payouts.ts';
import { viewerRole } from '../../shared/bookingAccess.ts';

/**
 * Delivery happens in two steps: the unedited set first (no status change),
 * then the final edits, which starts the 48 hour window before payout.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { bookingId, deliveryLink, step } = await req.json();
    const isFinal = step !== 'unedited';

    if (!bookingId || !deliveryLink || !deliveryLink.trim()) {
      return Response.json({ error: 'A booking and a link are required.' }, { status: 400 });
    }

    const booking = await base44.asServiceRole.entities.Booking.get(bookingId);
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

    const role = viewerRole(booking, user);
    if (role !== 'lensman' && user.role !== 'admin') {
      return Response.json({ error: 'Only the booked creator can deliver this booking.' }, { status: 403 });
    }

    const link = deliveryLink.trim();

    // The link is emailed and rendered as a clickable anchor, so it has to be a
    // real https address — never a javascript: or data: payload.
    if (!/^https:\/\//i.test(link)) {
      return Response.json(
        { error: 'The gallery link needs to start with https://' },
        { status: 400 }
      );
    }

    const now = new Date();

    if (!isFinal) {
      const updated = await base44.asServiceRole.entities.Booking.update(bookingId, {
        unedited_link: link,
        unedited_delivered_at: now.toISOString(),
      });

      await notifyBoth(
        base44,
        [booking.client_email],
        'Your unedited set is ready',
        `${booking.lensman_name || 'Your creator'} posted the unedited set for the ${booking.event_date} shoot.\n\nOpen it here: ${link}\n\nThe final edits follow.`
      );

      return Response.json({ booking: updated, step: 'unedited' });
    }

    const deliveredAt = now.toISOString();

    const updated = await base44.asServiceRole.entities.Booking.update(bookingId, {
      delivery_link: link,
      delivered_at: deliveredAt,
      release_due_at: releaseDueFrom(deliveredAt),
      status: 'delivered',
    });

    await notifyBoth(
      base44,
      [booking.client_email],
      'Your photos are ready',
      `${booking.lensman_name || 'Your creator'} delivered your final edits.\n\nOpen them here: ${link}\n\nYou have 48 hours to report a problem. After that the payment is released to your creator.`
    );

    return Response.json({ booking: updated, step: 'final' });
  } catch (error) {
    console.error('markDelivered error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}