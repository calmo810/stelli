import { bookingBreakdown, cleanAddOns, fromCents, money } from './money.ts';

export const BOOKING_LABEL = 'Stelli booking';

export function addBusinessDays(dateString, days) {
  if (!dateString) return null;
  const date = new Date(`${dateString}T12:00:00`);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }
  return date.toISOString().split('T')[0];
}

/**
 * The agreement text. Prices are itemised: the shoot, each add-on on its own
 * line, the creator's price they add up to, Stelli's fee, and what the client
 * is charged. Every number comes from the same breakdown Checkout uses, so the
 * agreement and the payment can't disagree.
 */
export function buildContractText({ booking, creatorName, breakdown, includedEdits }) {
  const uneditedDeadline = addBusinessDays(booking.event_date, 3) || 'Pending shoot date';
  const editedDeadline = addBusinessDays(booking.event_date, 10) || 'Pending shoot date';
  const cents = (value) => money(fromCents(value));

  const priceLines = [
    `Shoot: ${cents(breakdown.baseCents)}`,
    ...breakdown.addOns.map((addOn) => `Add-on, ${addOn.name}: ${cents(addOn.cents)}`),
    `Creator's price: ${cents(breakdown.subtotalCents)}`,
    `Stelli service fee (14%): ${cents(breakdown.clientFeeCents)}`,
    `Total charged to the Client: ${cents(breakdown.clientTotalCents)}, plus any tax shown at checkout`,
    `The Creator receives ${cents(breakdown.creatorPayoutCents)} after Stelli's 14% platform fee.`,
  ];

  return `Stelli Booking Confirmation

Client: ${booking.client_name || 'Client'}
Creator: ${creatorName}
Booking: ${BOOKING_LABEL}
Shoot date: ${booking.event_date || 'Pending'}
Shoot time: ${booking.event_time || 'To be coordinated'}
Shoot location: ${booking.location || 'To be coordinated'}

${priceLines.join('\n')}

Included edited photos: ${includedEdits}
Unedited delivery deadline: ${uneditedDeadline}
Edited delivery deadline: ${editedDeadline}

The Creator agrees to perform the booked shoot, and the Client agrees to pay the stated total through Stelli. Unedited files are delivered for selection only. Edited files transfer to the Client after payment release under Stelli's Terms and Conditions.

This Booking Confirmation, together with Stelli's Terms and Conditions (getstelli.com/terms), constitutes the written agreement between the Client and the Creator for this booking.`;
}

const sameAddOns = (a, b) =>
  JSON.stringify(cleanAddOns(a)) === JSON.stringify(cleanAddOns(b));

/** The contract a booking is currently running under, if it has one. */
export async function activeContract(base44, booking) {
  const BookingContract = base44.asServiceRole.entities.BookingContract;
  if (booking?.contract_id) {
    const byId = await BookingContract.get(booking.contract_id).catch(() => null);
    if (byId && byId.status !== 'superseded') return byId;
  }
  const all = await BookingContract.filter({ booking_id: booking.id }, '-created_date');
  return all.find((contract) => contract.status !== 'superseded') || null;
}

/**
 * Writes the contract for the quote the client has just accepted.
 *
 * A contract belongs to one accepted quote and one set of picked add-ons. If
 * the creator sends a new quote and the client accepts that instead, the old
 * contract is kept but marked superseded, and a new one is written — so what
 * the client pays is always what the agreement in force says. Accepting the
 * same quote twice returns the same contract.
 *
 * The client's acceptance is part of accepting the quote, so it is recorded
 * here, on the contract and on the booking. The creator has not agreed to the
 * new contract yet, so their flag starts again.
 *
 * The creator's real name is private, so it is read from their CreatorContact
 * record with full privileges and only ever written into the contract itself.
 */
export async function createContractForBooking(base44, { booking, quote, pickedAddOns = [], lensman, contact }) {
  const BookingContract = base44.asServiceRole.entities.BookingContract;
  const now = new Date().toISOString();

  const existing = await BookingContract.filter({ booking_id: booking.id });
  const current = existing.find(
    (contract) =>
      contract.status !== 'superseded' &&
      contract.quote_id === quote.id &&
      sameAddOns(contract.add_on_lines, pickedAddOns)
  );
  if (current) return current;

  // Anything written for an earlier quote is retired, never edited or deleted.
  for (const old of existing) {
    if (old.status === 'superseded') continue;
    await BookingContract.update(old.id, { status: 'superseded', superseded_at: now });
  }

  const docs = await base44.asServiceRole.entities.LegalDocument.list('-effective_date', 20);
  const version = (type) => docs.find((doc) => doc.type === type)?.version || '2026-09-10';

  let creatorContact = contact;
  if (!creatorContact && (lensman?.id || booking.lensman_id)) {
    const contacts = await base44.asServiceRole.entities.CreatorContact.filter({
      lensman_id: lensman?.id || booking.lensman_id,
    });
    creatorContact = contacts[0] || null;
  }

  const creatorName =
    creatorContact?.full_name || booking.lensman_name || lensman?.display_name || 'Creator';
  // The account the creator signs in with — this field decides who may read
  // the contract, so it must never be a contact address typed on a profile.
  const creatorEmail = booking.creator_email || booking.lensman_email || creatorContact?.email || '';

  const breakdown = bookingBreakdown(quote.amount, pickedAddOns);
  const includedEdits = Number(quote.included_edits) || 30;
  const addOnLines = breakdown.addOns.map((addOn) => ({ name: addOn.name, price: fromCents(addOn.cents) }));

  const contract = await BookingContract.create({
    booking_id: booking.id,
    quote_id: quote.id,
    status: 'active',
    client_id: booking.client_id || '',
    client_email: booking.client_email,
    client_name: booking.client_name,
    creator_id: booking.lensman_id,
    creator_email: creatorEmail,
    creator_name: creatorName,
    format_name: BOOKING_LABEL,
    shoot_date: booking.event_date,
    shoot_time: booking.event_time || '',
    shoot_location: booking.location || '',
    // Itemised, so nothing has to be read back out of the text.
    base_price: fromCents(breakdown.baseCents),
    add_on_lines: addOnLines,
    add_ons: addOnLines.map((addOn) => `${addOn.name} (${money(addOn.price)})`),
    creator_fee: fromCents(breakdown.subtotalCents),
    service_fee: fromCents(breakdown.clientFeeCents),
    total_paid: fromCents(breakdown.clientTotalCents),
    creator_net: fromCents(breakdown.creatorPayoutCents),
    included_edited_photos: includedEdits,
    unedited_delivery_deadline: addBusinessDays(booking.event_date, 3),
    edited_delivery_deadline: addBusinessDays(booking.event_date, 10),
    contract_text: buildContractText({ booking, creatorName, breakdown, includedEdits }),
    terms_version: version('terms'),
    privacy_version: version('privacy'),
    version: version('contract_template'),
    created_at: now,
    client_accepted_at: now,
  });

  await base44.asServiceRole.entities.Booking.update(booking.id, {
    contract_id: contract.id,
    terms_version: version('terms'),
    privacy_version: version('privacy'),
    client_contract_accepted: true,
    client_contract_accepted_at: now,
    // A new agreement: the creator has not accepted this one.
    creator_contract_accepted: false,
  });

  return contract;
}
