import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

async function sendContractCopies(base44, booking, contract) {
  const viewUrl = `/agreements/${contract.id}`;
  const subject = `Stelli booking agreement · ${contract.shoot_date}`;
  const body = `${contract.contract_text}\n\nView in Stelli: ${viewUrl}`;
  const recipients = [booking.client_email, contract.creator_email].filter(Boolean);
  await Promise.all(recipients.map(to => base44.asServiceRole.integrations.Core.SendEmail({ to, subject, body })));
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { bookingId, party } = await req.json();
    if (!bookingId || !party) return Response.json({ error: 'Booking ID and party are required' }, { status: 400 });

    const booking = await base44.asServiceRole.entities.Booking.get(bookingId);
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

    const contracts = await base44.asServiceRole.entities.BookingContract.filter({ booking_id: bookingId });
    const contract = contracts[0];
    if (!contract) return Response.json({ error: 'Contract not found' }, { status: 404 });

    const now = new Date().toISOString();
    const isCreator = party === 'creator';
    const bookingPatch = isCreator
      ? { creator_contract_accepted: true, creator_contract_accepted_at: now }
      : { client_contract_accepted: true, client_contract_accepted_at: now };
    const contractPatch = isCreator ? { creator_accepted_at: now } : { client_accepted_at: now };

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

    const updatedContract = await base44.asServiceRole.entities.BookingContract.update(contract.id, contractPatch);
    const clientAccepted = isCreator ? booking.client_contract_accepted : true;
    const creatorAccepted = isCreator ? true : booking.creator_contract_accepted;
    const nextStatus = clientAccepted && creatorAccepted ? 'confirmed' : 'awaiting_creator_acceptance';
    const updatedBooking = await base44.asServiceRole.entities.Booking.update(bookingId, { ...bookingPatch, status: nextStatus, payment_status: 'held' });

    if (nextStatus === 'confirmed') {
      await sendContractCopies(base44, updatedBooking, { ...contract, ...contractPatch });
    }

    return Response.json({ booking: updatedBooking, contract: updatedContract, confirmed: nextStatus === 'confirmed' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}