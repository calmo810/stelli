import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { viewerRole } from '../../shared/bookingAccess.ts';
import { refundBooking } from '../../shared/payouts.ts';
import { clientTotal } from '../../shared/stripe.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });

    const { bookingId, reason } = await req.json();
    if (!bookingId) return Response.json({ error: 'Booking ID is required.' }, { status: 400 });

    const booking = await base44.asServiceRole.entities.Booking.get(bookingId);
    if (!booking) return Response.json({ error: 'Booking not found.' }, { status: 404 });

    const role = viewerRole(booking, user);
    if (!role) return Response.json({ error: 'This booking is not yours.' }, { status: 403 });
    if (['completed', 'cancelled'].includes(booking.status)) {
      return Response.json({ error: 'This booking is already closed.' }, { status: 400 });
    }

    const isClient = role === 'client';
    const now = new Date();
    const shootAt = new Date(`${booking.event_date}T${booking.event_time || '12:00'}`);
    const hoursUntil = (shootAt.getTime() - now.getTime()) / 3600000;
    const paid = clientTotal(booking.total_price);

    // The creator walking away is always a full refund, and it puts them in
    // front of a founder.
    let refundAmount = 0;
    let refundNote = 'No payment had been taken, so there is nothing to refund.';

    if (booking.payment_status === 'held') {
      if (!isClient) {
        refundAmount = paid;
        refundNote = 'The creator cancelled, so the client is refunded in full.';
      } else if (hoursUntil >= 72) {
        refundAmount = paid;
        refundNote = 'Cancelled 72 hours or more before the shoot, so the client is refunded in full.';
      } else if (hoursUntil >= 48) {
        refundAmount = Math.round(paid * 0.5 * 100) / 100;
        refundNote = 'Cancelled between 48 and 72 hours before the shoot, so half is refunded.';
      } else {
        refundNote = 'Cancelled less than 48 hours before the shoot, so the creator keeps the full amount.';
      }
    }

    const updated = await base44.asServiceRole.entities.Booking.update(bookingId, {
      status: 'cancelled',
      cancelled_at: now.toISOString(),
      cancelled_by: isClient ? 'client' : 'creator',
      cancellation_reason: (reason || '').trim(),
      flagged_for_review: !isClient,
      flag_reason: isClient ? '' : 'Creator cancelled — review the creator.',
    });

    if (refundAmount > 0) {
      await refundBooking(base44, booking, refundAmount, refundNote);
    }

    if (!isClient) {
      const lensman = await base44.asServiceRole.entities.Lensman.get(booking.lensman_id).catch(() => null);
      if (lensman) {
        await base44.asServiceRole.entities.Lensman.update(lensman.id, {
          under_review: true,
          review_note: `Cancelled the ${booking.event_date} booking.`,
        });
      }
    }

    await base44.asServiceRole.entities.Message.create({
      booking_id: bookingId,
      sender_name: 'Stelli',
      sender_role: isClient ? 'client' : 'lensman',
      client_email: booking.client_email,
      lensman_email: booking.creator_email || booking.lensman_email || '',
      content: `Booking cancelled by the ${isClient ? 'client' : 'creator'}.${reason ? ` Reason: ${reason}.` : ''} ${refundNote}`,
      kind: 'system',
    });

    const other = isClient ? booking.creator_email || booking.lensman_email : booking.client_email;
    if (other) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: other,
        subject: `Booking cancelled — ${booking.event_date}`,
        body: `The ${booking.event_date} shoot was cancelled by the ${isClient ? 'client' : 'creator'}.${reason ? `\n\nReason: ${reason}` : ''}\n\n${refundNote}`,
      });
    }

    return Response.json({ booking: updated, refundNote, refundAmount });
  } catch (error) {
    console.error('cancelBooking error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}