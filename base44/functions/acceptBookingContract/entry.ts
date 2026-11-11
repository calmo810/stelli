import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { viewerRole } from '../../shared/bookingAccess.ts';
import { activeContract } from '../../shared/bookingContract.ts';
import { effectiveStatus, isConfirmed } from '../../shared/bookingRules.ts';
import { sendEmail } from '../../shared/notify.ts';
import { SITE_ORIGIN } from '../../shared/origins.ts';

/**
 * One side accepting the booking agreement.
 *
 * Accepting records a signature. It does nothing else: it never changes the
 * booking's status. (It used to recompute the status from the two acceptance
 * flags, which pushed paid, confirmed bookings back to
 * "awaiting_creator_acceptance" and could un-cancel a cancelled one.) A
 * booking is confirmed by payment and by nothing else.
 *
 * Which side you are comes from the booking, not from the request.
 */
async function sendContractCopies(base44, booking, contract) {
  const subject = `Stelli booking agreement · ${contract.shoot_date}`;
  const body = `${contract.contract_text}\n\nView it in Stelli: ${SITE_ORIGIN}/agreements/${contract.id}`;
  const recipients = [...new Set([booking.client_email, booking.creator_email || booking.lensman_email].filter(Boolean))];
  await Promise.all(recipients.map((to) => sendEmail(base44, to, subject, body)));
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { bookingId } = await req.json();
    if (!bookingId) return Response.json({ error: 'Booking ID is required' }, { status: 400 });

    const booking = await base44.asServiceRole.entities.Booking.get(bookingId).catch(() => null);
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

    const role = viewerRole(booking, user);
    if (!role) {
      return Response.json({ error: 'You are not a party to this booking.' }, { status: 403 });
    }
    const isCreator = role === 'lensman';

    if (effectiveStatus(booking) === 'cancelled') {
      return Response.json({ error: 'This booking was cancelled.' }, { status: 409 });
    }

    const contract = await activeContract(base44, booking);
    if (!contract) return Response.json({ error: 'Contract not found' }, { status: 404 });

    // Already accepted: nothing to do, and nothing to send again.
    const already = isCreator ? contract.creator_accepted_at : contract.client_accepted_at;
    if (already) {
      return Response.json({
        booking: { id: booking.id, status: booking.status },
        contract,
        alreadyAccepted: true,
        confirmed: isConfirmed(booking),
      });
    }

    const now = new Date().toISOString();

    await base44.asServiceRole.entities.AgreementAcceptance.create({
      user_id: user.id,
      user_email: user.email,
      booking_id: bookingId,
      document_type: 'booking_contract',
      document_version: contract.version,
      accepted_at: now,
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || '',
      user_agent: req.headers.get('user-agent') || '',
    });

    const updatedContract = await base44.asServiceRole.entities.BookingContract.update(
      contract.id,
      isCreator ? { creator_accepted_at: now } : { client_accepted_at: now }
    );

    // The signature — and only the signature. `status` is not written here.
    await base44.asServiceRole.entities.Booking.update(
      bookingId,
      isCreator
        ? { creator_contract_accepted: true, creator_contract_accepted_at: now }
        : { client_contract_accepted: true, client_contract_accepted_at: now }
    );

    const bothSigned = Boolean(updatedContract.client_accepted_at && updatedContract.creator_accepted_at);
    if (bothSigned) await sendContractCopies(base44, booking, updatedContract);

    return Response.json({
      booking: { id: booking.id, status: booking.status },
      contract: updatedContract,
      bothSigned,
      confirmed: isConfirmed(booking),
    });
  } catch (error) {
    console.error('acceptBookingContract error:', error.message);
    return Response.json({ error: 'That did not save. Try again.' }, { status: 500 });
  }
}
