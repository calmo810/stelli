import { createClientFromRequest } from 'npm:@base44/sdk@0.8.59';
import { effectiveStatus } from '../../shared/bookingRules.ts';

/**
 * Deletes the signed-in user's own account.
 *
 * An account can't be closed while money or a live booking still depends on
 * it. It used to check only for "held" and "processing" payments, which missed:
 * a half-refunded booking still owed to the creator, a founder payout waiting
 * for the creator's payout setup (it was then marked failed and the money
 * stayed with Stelli), an open card dispute or review, a payout pull-back still
 * owed, and bookings in mid-flow that would leave the other person talking to
 * nobody. Each of those now blocks, with a reason the person can act on.
 *
 * Legal acceptances, contracts and payment records are kept: they are the
 * record of what was agreed and paid.
 */
const MONEY_IN_PLAY = ['held', 'processing', 'partially_refunded'];
const OPEN_STATUSES = ['requested', 'quoted', 'quote_accepted', 'confirmed', 'in_progress', 'awaiting_delivery'];

function blockerFor(booking, asCreator) {
  const status = effectiveStatus(booking);
  if (booking.stray_payment_intent_id) return 'A payment on one of your bookings is being reviewed.';
  if (booking.dispute_status && !['won', 'lost', 'warning_closed'].includes(booking.dispute_status)) {
    return 'A card dispute is open on one of your bookings.';
  }
  if (['needed', 'failed'].includes(booking.reversal_status)) {
    return 'A payout on one of your bookings is being pulled back.';
  }
  if (booking.flagged_for_review) return 'A founder is reviewing one of your bookings.';
  if (MONEY_IN_PLAY.includes(booking.payment_status) && !booking.stripe_transfer_id) {
    return asCreator
      ? 'You still have money held for a shoot. Finish the shoot, or cancel it, first.'
      : 'A shoot on this account still has a payment held. Wait for it to finish, or cancel it, first.';
  }
  if (OPEN_STATUSES.includes(status)) {
    return asCreator
      ? 'You still have an open request or booking. Finish or cancel it first.'
      : 'You still have an open request or booking. Cancel it first.';
  }
  // Delivered, inside the 48 hour window: the payout has not gone out yet.
  if (status === 'delivered' && booking.payment_status === 'held') {
    return 'A delivered shoot is still inside its 48 hour window. Try again once it has closed.';
  }
  return '';
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth
      .me()
      .catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    if (body?.confirm !== 'DELETE') {
      return Response.json({ error: 'Confirmation is required.' }, { status: 400 });
    }

    // The last admin can't delete themselves out of the admin page.
    if (user.role === 'admin') {
      return Response.json(
        { error: 'Founder accounts can’t be deleted from here. Remove the admin role in Base44 first.' },
        { status: 409 }
      );
    }

    const Booking = base44.asServiceRole.entities.Booking;
    const seen = new Map();
    const collect = async (query, asCreator) => {
      for (const booking of await Booking.filter(query, '-created_date', 500)) {
        if (!seen.has(booking.id)) seen.set(booking.id, { booking, asCreator });
      }
    };
    await collect({ client_id: user.id }, false);
    await collect({ client_email: user.email }, false);
    await collect({ creator_id: user.id }, true);
    await collect({ creator_email: user.email }, true);
    await collect({ lensman_email: user.email }, true);

    for (const { booking, asCreator } of seen.values()) {
      const reason = blockerFor(booking, asCreator);
      if (reason) return Response.json({ error: reason }, { status: 409 });
    }

    // Money a founder sent that has not reached the creator yet.
    const waiting = await base44.asServiceRole.entities.ManualPayout.filter({
      creator_user_id: user.id,
      status: 'waiting',
    });
    if (waiting.length) {
      return Response.json(
        { error: 'Stelli has money waiting for you. Set up payouts to receive it before closing your account.' },
        { status: 409 }
      );
    }

    // The creator profile and its private contact record go with the account.
    await base44.asServiceRole.entities.Lensman.deleteMany({ user_id: user.id });
    await base44.asServiceRole.entities.CreatorContact.deleteMany({ user_id: user.id });

    await base44.asServiceRole.entities.User.delete(user.id);

    console.log(`Account deleted: ${user.id}`);
    return Response.json({ ok: true });
  } catch (error) {
    console.error('deleteMyAccount error:', error.message);
    return Response.json({ error: 'Your account could not be deleted. Try again, or email getstelli@gmail.com.' }, { status: 500 });
  }
}
