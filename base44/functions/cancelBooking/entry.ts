import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { viewerRole } from '../../shared/bookingAccess.ts';
import { refundBooking, releaseBooking } from '../../shared/payouts.ts';
import { clientTotal, stripePost } from '../../shared/stripe.ts';

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

    // Everything is worked out from what Stripe actually took. Bookings paid
    // before amount_charged existed fall back to the quote plus the service fee.
    const paid =
      Number(booking.amount_charged || 0) > 0
        ? Number(booking.amount_charged)
        : clientTotal(booking.total_price);

    // The creator walking away is always a full refund, and it puts them in
    // front of a founder. A client cancelling late still owes the creator.
    let refundAmount = 0;
    let refundNote = 'No payment had been taken, so there is nothing to refund.';
    let creatorShare = 0; // 1 = the full share, 0.5 = half, 0 = nothing

    if (booking.stripe_payment_intent_id || booking.stripe_charge_id) {
      if (!isClient) {
        refundAmount = paid;
        refundNote = 'The creator cancelled, so the client is refunded in full.';
      } else if (hoursUntil >= 72) {
        refundAmount = paid;
        refundNote = 'Cancelled 72 hours or more before the shoot, so the client is refunded in full.';
      } else if (hoursUntil >= 48) {
        refundAmount = Math.round(paid * 0.5 * 100) / 100;
        creatorShare = 0.5;
        refundNote = 'Cancelled between 48 and 72 hours before the shoot, so half is refunded.';
      } else {
        creatorShare = 1;
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

    // A checkout left open would still let the client pay a cancelled booking.
    if (booking.stripe_checkout_session_id && !booking.stripe_payment_intent_id) {
      await stripePost(
        `checkout/sessions/${booking.stripe_checkout_session_id}/expire`,
        new URLSearchParams()
      ).catch((error) => {
        // Already expired or completed — a late payment is flagged for review.
        console.error('Could not expire checkout on cancel:', error.message);
      });
    }

    if (refundAmount > 0) {
      await refundBooking(base44, booking, refundAmount, refundNote);
    }

    // The creator is still paid their share of a late client cancellation.
    if (creatorShare > 0) {
      if (creatorShare < 1) {
        const half = Math.round(Number(booking.creator_payout || 0) * creatorShare * 100) / 100;
        await base44.asServiceRole.entities.Booking.update(bookingId, { creator_payout: half });
      }
      const fresh = await base44.asServiceRole.entities.Booking.get(bookingId);
      await releaseBooking(base44, fresh, 'auto');
    }

    if (!isClient) {
      const lensman = await base44.asServiceRole.entities.Lensman.get(booking.lensman_id).catch(() => null);
      if (lensman) {
        await base44.asServiceRole.entities.Lensman.update(lensman.id, { under_review: true });
        const contacts = await base44.asServiceRole.entities.CreatorContact.filter({
          lensman_id: lensman.id,
        });
        if (contacts[0]) {
          await base44.asServiceRole.entities.CreatorContact.update(contacts[0].id, {
            review_note: `Cancelled the ${booking.event_date} booking.`,
          });
        }
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