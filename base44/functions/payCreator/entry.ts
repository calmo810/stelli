import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { MANUAL_PAYOUT_MAX, sendManualPayout } from '../../shared/manualPayouts.ts';
import { logAdminAction, requireAdmin } from '../../shared/audit.ts';
import { money } from '../../shared/money.ts';

/**
 * A founder paying a creator directly. The payout goes out right away if the
 * creator can be paid; otherwise it waits on Stelli's balance until they
 * finish payout setup.
 *
 * Two things make it safe:
 *
 *  - `requestId` comes from the confirmation dialog. The same confirmation
 *    sent twice (a double click, a retry on a slow connection) finds the
 *    payout it already made and returns that — it never pays twice.
 *
 *  - If the creator has a paid booking Stelli is still holding money for, the
 *    founder has to say which this is: the payout FOR that booking (`bookingId`
 *    — the booking is then marked paid, and the automatic payout will not pay
 *    it again), or separate money on top (`confirmSeparate`). Without one of
 *    the two the function answers with the bookings and pays nothing.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await requireAdmin(base44);
    if (!user) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { lensmanId, amount, note, bookingId, confirmSeparate, requestId } = await req.json();
    const value = Math.round(Number(amount) * 100) / 100;
    const request = String(requestId || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);

    if (!lensmanId) {
      return Response.json({ error: 'Pick a creator to pay.' }, { status: 400 });
    }
    if (!Number.isFinite(value) || value < 1) {
      return Response.json({ error: 'The amount must be at least $1.' }, { status: 400 });
    }
    if (value > MANUAL_PAYOUT_MAX) {
      return Response.json(
        { error: `The most you can send in one payout is $${MANUAL_PAYOUT_MAX}.` },
        { status: 400 }
      );
    }

    const ManualPayout = base44.asServiceRole.entities.ManualPayout;

    // The same confirmation again: hand back what it already did.
    if (request) {
      const [earlier] = await ManualPayout.filter({ request_id: request });
      if (earlier) {
        return Response.json({
          payoutId: earlier.id,
          sent: earlier.status === 'sent',
          reason: earlier.status === 'sent' ? '' : 'already-requested',
          duplicate: true,
        });
      }
    }

    const lensman = await base44.asServiceRole.entities.Lensman.get(lensmanId).catch(() => null);
    if (!lensman) return Response.json({ error: 'Creator not found.' }, { status: 404 });

    const Booking = base44.asServiceRole.entities.Booking;
    let booking = null;
    if (bookingId) {
      booking = await Booking.get(bookingId).catch(() => null);
      if (!booking || booking.lensman_id !== lensman.id) {
        return Response.json({ error: 'That booking is not with this creator.' }, { status: 400 });
      }
      if (booking.stripe_transfer_id || booking.payment_status === 'released') {
        return Response.json(
          { error: `${lensman.display_name || 'This creator'} has already been paid for that booking.` },
          { status: 409 }
        );
      }
    } else if (!confirmSeparate) {
      // Money Stelli is holding for this creator that will pay out on its own.
      const held = (await Booking.filter({ lensman_id: lensman.id, payment_status: 'held' }))
        .concat(await Booking.filter({ lensman_id: lensman.id, payment_status: 'partially_refunded' }))
        .filter((b) => !b.stripe_transfer_id && b.status !== 'cancelled');
      if (held.length) {
        return Response.json({
          needsDecision: true,
          message: `${lensman.display_name || 'This creator'} has ${held.length === 1 ? 'a booking' : `${held.length} bookings`} Stelli is holding money for. Is this payout for one of them, or separate?`,
          heldBookings: held.map((b) => ({
            id: b.id,
            client_name: b.client_name || 'Client',
            event_date: b.event_date,
            status: b.status,
            creator_payout: b.creator_payout || 0,
            amount_charged: b.amount_charged || 0,
          })),
        });
      }
    }

    const payout = await ManualPayout.create({
      lensman_id: lensman.id,
      creator_user_id: lensman.user_id || '',
      lensman_name: lensman.display_name || 'Stelli creator',
      amount: value,
      note: String(note || '').slice(0, 500),
      status: 'waiting',
      attempts: 0,
      paid_by_email: user.email,
      booking_id: booking?.id || '',
      request_id: request,
    });

    // Two copies of the same confirmation can arrive in the same instant, before
    // either can see the other's record. Both look again now: only the earliest
    // record for this confirmation goes on, the other withdraws.
    if (request) {
      const same = await ManualPayout.filter({ request_id: request });
      const first = same.sort(
        (a, b) => String(a.created_date).localeCompare(String(b.created_date)) || String(a.id).localeCompare(String(b.id))
      )[0];
      if (first && first.id !== payout.id) {
        await ManualPayout.delete(payout.id).catch(() => {});
        return Response.json({ payoutId: first.id, sent: first.status === 'sent', duplicate: true });
      }
    }

    const result = await sendManualPayout(base44, payout);

    const who = lensman.display_name || 'creator';
    await logAdminAction(base44, user, {
      action: 'manual_payout',
      summary: result.sent
        ? `Paid ${money(value)} to ${who}${booking ? ` for the ${booking.event_date} booking` : ''}.`
        : result.reason === 'refused'
          ? `Manual payout of ${money(value)} to ${who} refused: ${result.message}`
          : `Manual payout of ${money(value)} to ${who} is waiting (${result.reason}).`,
      outcome: result.sent ? 'ok' : result.reason === 'refused' ? 'refused' : 'ok',
      lensmanId: lensman.id,
      bookingId: booking?.id || '',
      amount: value,
      details: { payoutId: payout.id, transferId: result.transferId || '', note: payout.note, reason: result.reason || '' },
    });

    if (result.reason === 'refused') {
      return Response.json({ payoutId: payout.id, sent: false, error: result.message }, { status: 409 });
    }
    return Response.json({ payoutId: payout.id, ...result });
  } catch (error) {
    console.error('payCreator error:', error.message);
    return Response.json({ error: 'The payout did not go through. Nothing was sent.' }, { status: 500 });
  }
}
