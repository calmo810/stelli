import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { viewerRole } from '../../shared/bookingAccess.ts';
import { cancellationPlan } from '../../shared/cancellation.ts';
import { claimBooking, unlockBooking } from '../../shared/bookingLock.ts';
import { refundHeld } from '../../shared/refunds.ts';
import { releaseHeld } from '../../shared/payouts.ts';
import { fromCents, money } from '../../shared/money.ts';
import { emailAdmins, sendEmail } from '../../shared/notify.ts';
import { hasContactDetails } from '../../shared/contactGuard.ts';
import { isConfirmed, paidInOtherMode } from '../../shared/bookingRules.ts';
import { stripeMode } from '../../shared/stripe.ts';

/**
 * Either side cancelling a booking.
 *
 * What happens to the money is decided by shared/cancellation.ts (the 72 and
 * 48 hour lines, measured in New York time) and nowhere else. This function
 * only carries the plan out, with the booking locked so a payout or a refund
 * can't run beside it:
 *
 *   1. the booking is marked cancelled, and flagged while a refund is owed;
 *   2. the refund goes out; only when it has does the flag come off;
 *   3. the creator's share of a late cancellation is paid.
 *
 * If the refund fails, the booking stays in the founder queue saying so — a
 * cancelled booking with the client's money still on it is never left looking
 * finished.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });

    const { bookingId, reason, preview } = await req.json();
    if (!bookingId) return Response.json({ error: 'Booking ID is required.' }, { status: 400 });

    const Booking = base44.asServiceRole.entities.Booking;
    const seen = await Booking.get(bookingId).catch(() => null);
    if (!seen) return Response.json({ error: 'Booking not found.' }, { status: 404 });

    const role = viewerRole(seen, user);
    if (!role) return Response.json({ error: 'This booking is not yours.' }, { status: 403 });

    // While the app runs on the other set of Stripe keys (STRIPE_MODE=test with
    // a real payment on the booking, or the reverse), a paid booking can't be
    // refunded or paid out from here, so it can't be cancelled either.
    const PAID = ['held', 'processing', 'partially_refunded'];
    if (PAID.includes(seen.payment_status) && paidInOtherMode(seen, stripeMode() === 'live')) {
      const message = 'Payments are paused for a few minutes while Stelli runs a check. Try again shortly, or message support.';
      return preview
        ? Response.json({ allowed: false, message })
        : Response.json({ error: message }, { status: 409 });
    }

    // "What would happen if I cancelled now?" — the same plan, nothing moved.
    // The cancel button shows this sentence before anyone confirms.
    if (preview) {
      const plan = cancellationPlan({ role, booking: seen, nowMs: Date.now() });
      if (!plan.allowed) return Response.json({ allowed: false, message: plan.message });
      const refund = fromCents(plan.refundCents);
      const share = fromCents(plan.creatorPayoutCents);
      const isClient = role === 'client';
      let message;
      if (plan.tier === 'unpaid') message = 'Nothing has been paid, so nothing is charged or refunded.';
      else if (isClient && plan.tier === 'full') message = `You get ${money(refund)} back in full.`;
      else if (isClient && plan.tier === 'half') message = `The shoot is less than 72 hours away, so you get ${money(refund)} back and ${seen.lensman_name || 'your creator'} keeps half.`;
      else if (isClient) message = 'The shoot is less than 48 hours away, so there is no refund. Your creator is paid in full.';
      else message = `${(seen.client_name || 'Your client').split(' ')[0]} gets ${money(refund)} back in full, and your profile goes to Stelli for review.`;
      return Response.json({
        allowed: true,
        tier: plan.tier,
        refundAmount: refund,
        creatorShare: share,
        message: `${message} This can’t be undone.`,
      });
    }

    const claim = await claimBooking(base44, bookingId, 'cancel', { waitMs: 4000 });
    if (!claim.won) {
      return Response.json(
        { error: 'This booking is being updated right now. Try again in a moment.' },
        { status: 409 }
      );
    }

    try {
      const booking = claim.booking;
      const isClient = role === 'client';
      const plan = cancellationPlan({ role, booking, nowMs: Date.now() });
      if (!plan.allowed) return Response.json({ error: plan.message }, { status: 409 });

      const why = String(reason || '').trim().slice(0, 500);
      const now = new Date().toISOString();
      const refundOwed = plan.refundCents > 0;
      const shareOwed = plan.creatorPayoutCents > 0;

      // 1. Cancelled. Flagged for as long as a refund is still owed.
      const cancelledPatch = {
        status: 'cancelled',
        cancelled_at: now,
        cancelled_by: isClient ? 'client' : 'creator',
        cancellation_reason: why,
        cancellation_payout_due: shareOwed,
        ...(shareOwed
          ? {
              creator_payout: fromCents(plan.creatorPayoutCents),
              creator_payout_original: booking.creator_payout_original || booking.creator_payout,
            }
          : {}),
        ...(refundOwed
          ? {
              flagged_for_review: true,
              flag_reason: `Cancelled. A refund of ${money(fromCents(plan.refundCents))} is on its way to the client.`,
            }
          : {}),
      };
      await Booking.update(bookingId, cancelledPatch);

      // 2. The refund.
      let refundFailed = '';
      if (refundOwed) {
        const refund = await refundHeld(
          base44,
          { ...booking, ...cancelledPatch },
          {
            amountCents: plan.refundCents,
            note: plan.note,
            key: 'cancellation',
            setCreatorPayoutCents: plan.creatorPayoutCents,
            clearFlag: true,
          }
        );
        if (!refund.refunded && refund.reason !== 'already-refunded') {
          refundFailed = refund.error || refund.reason || 'unknown';
          await Booking.update(bookingId, {
            flagged_for_review: true,
            flag_reason: `Cancelled, but the refund of ${money(fromCents(plan.refundCents))} to the client did not go through (${refundFailed}). Refund it from here.`,
          });
          await emailAdmins(
            base44,
            'A cancellation refund failed',
            `The ${booking.event_date} shoot was cancelled, but the refund of ${money(fromCents(plan.refundCents))} did not go through.\n\nStripe said: ${refundFailed}\n\nIt is in your queue on the admin page.`
          );
        }
      }

      // 3. The creator's share of a late client cancellation.
      if (shareOwed && !refundFailed) {
        const fresh = await Booking.get(bookingId);
        await releaseHeld(base44, fresh, 'auto');
      }

      // A creator walking away always puts them in front of a founder. It does
      // not hide them by itself: putting a creator on hold is the founder's call
      // (one tap from the queue). Only a client's no-show report holds a
      // creator automatically. See REVIEW.md, decision D12.
      if (!isClient) {
        const lensman = await base44.asServiceRole.entities.Lensman.get(booking.lensman_id).catch(() => null);
        if (lensman) {
          const contacts = await base44.asServiceRole.entities.CreatorContact.filter({ lensman_id: lensman.id });
          if (contacts[0]) {
            await base44.asServiceRole.entities.CreatorContact.update(contacts[0].id, {
              review_note: `Cancelled the ${booking.event_date} booking.`,
            });
          }
        }
        if (!refundFailed) {
          await Booking.update(bookingId, {
            flagged_for_review: true,
            flag_reason: `The creator cancelled this booking${why ? ` ("${why.slice(0, 200)}")` : ''}. The client was refunded in full.`,
          });
        }
        await emailAdmins(
          base44,
          'A creator cancelled a booking',
          `${booking.lensman_name || 'A creator'} cancelled the ${booking.event_date} shoot with ${booking.client_name || 'a client'}.${why ? `\n\nReason: ${why}` : ''}\n\nThe client was refunded in full. It is in your queue on the admin page, where you can put the creator on hold if needed.`
        );
      }

      const who = isClient ? 'client' : 'creator';
      // The reason is passed on, unless it would hand over contact details
      // on a booking that was never confirmed.
      const shareReason = why && (isConfirmed(booking) || !hasContactDetails(why)) ? ` Reason: ${why}` : '';
      const clientLine = refundFailed
        ? `${plan.note} The refund is being handled by a founder and will follow shortly.`
        : plan.note;

      await base44.asServiceRole.entities.Message.create({
        booking_id: bookingId,
        sender_name: 'Stelli',
        sender_role: isClient ? 'client' : 'lensman',
        client_id: booking.client_id || '',
        creator_id: booking.creator_id || '',
        client_email: booking.client_email,
        lensman_email: booking.creator_email || booking.lensman_email || '',
        content: `Booking cancelled by the ${who}.${shareReason} ${clientLine}`,
        kind: 'system',
      });

      const other = isClient ? booking.creator_email || booking.lensman_email : booking.client_email;
      await sendEmail(
        base44,
        other,
        `Booking cancelled — ${booking.event_date}`,
        `The ${booking.event_date} shoot was cancelled by the ${who}.${shareReason}\n\n${clientLine}`
      );

      return Response.json({
        booking: { id: bookingId, status: 'cancelled' },
        tier: plan.tier,
        refundNote: clientLine,
        refundAmount: refundFailed ? 0 : fromCents(plan.refundCents),
      });
    } finally {
      await unlockBooking(base44, bookingId, claim.token);
    }
  } catch (error) {
    console.error('cancelBooking error:', error.message);
    return Response.json({ error: 'That did not go through. Try again.' }, { status: 500 });
  }
}
