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

export function buildContractText({ booking, creatorName, amount, includedEdits, addOns }) {
  const uneditedDeadline = addBusinessDays(booking.event_date, 3) || 'Pending shoot date';
  const editedDeadline = addBusinessDays(booking.event_date, 10) || 'Pending shoot date';

  return `Stelli Booking Confirmation

Client: ${booking.client_name || 'Client'}
Creator: ${creatorName}
Booking: ${BOOKING_LABEL}
Shoot date: ${booking.event_date || 'Pending'}
Shoot time: ${booking.event_time || 'To be coordinated'}
Shoot location: ${booking.location || 'To be coordinated'}
Agreed amount: $${amount.toLocaleString()}
Add-ons: ${addOns.join(', ') || 'None'}
Total: $${amount.toLocaleString()}
Included edited photos: ${includedEdits}
Unedited delivery deadline: ${uneditedDeadline}
Edited delivery deadline: ${editedDeadline}

The Creator agrees to perform the booked shoot, and the Client agrees to pay the stated total through Stelli. Unedited files are delivered for selection only. Edited files transfer to the Client after payment release under Stelli's Terms and Conditions.

This Booking Confirmation, together with Stelli's Terms and Conditions (getstelli.com/terms), constitutes the written agreement between the Client and the Creator for this booking.`;
}

/**
 * Creates the immutable booking contract for an accepted quote.
 * Idempotent — returns the existing contract if one already exists.
 *
 * The creator's real name and email are private, so they are read from their
 * CreatorContact record with full privileges and only ever written into the
 * contract itself.
 */
export async function createContractForBooking(base44, { booking, quote, lensman, contact }) {
  const existing = await base44.asServiceRole.entities.BookingContract.filter({
    booking_id: booking.id,
  });
  if (existing.length) return existing[0];

  const docs = await base44.asServiceRole.entities.LegalDocument.list('-effective_date', 20);
  const version = (type) => docs.find((doc) => doc.type === type)?.version || '2026-09-10';

  let creatorContact = contact;
  if (!creatorContact && lensman?.id) {
    const contacts = await base44.asServiceRole.entities.CreatorContact.filter({
      lensman_id: lensman.id,
    });
    creatorContact = contacts[0] || null;
  }

  const creatorName =
    creatorContact?.full_name || booking.lensman_name || lensman?.display_name || 'Creator';
  const creatorEmail = creatorContact?.email || booking.lensman_email || '';

  const amount = Number(quote.amount) || 0;
  const includedEdits = Number(quote.included_edits) || 30;
  const addOns = (quote.add_ons || []).map(
    (addOn) => `${addOn.name}${addOn.price ? ` (+$${addOn.price})` : ''}`
  );

  const contract = await base44.asServiceRole.entities.BookingContract.create({
    booking_id: booking.id,
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
    creator_fee: amount,
    add_ons: addOns,
    total_paid: amount,
    included_edited_photos: includedEdits,
    unedited_delivery_deadline: addBusinessDays(booking.event_date, 3),
    edited_delivery_deadline: addBusinessDays(booking.event_date, 10),
    contract_text: buildContractText({ booking, creatorName, amount, includedEdits, addOns }),
    terms_version: version('terms'),
    privacy_version: version('privacy'),
    version: version('contract_template'),
    created_at: new Date().toISOString(),
  });

  await base44.asServiceRole.entities.Booking.update(booking.id, {
    contract_id: contract.id,
    terms_version: version('terms'),
    privacy_version: version('privacy'),
  });

  return contract;
}

/**
 * Brings an unpaid booking's contract in line with the price the client is
 * about to pay — a re-picked set of add-ons or a newer accepted quote. The
 * creator already offered every add-on on the quote, so their side stands.
 */
export async function syncContractTerms(base44, contract, { booking, quote }) {
  const amount = Number(quote.amount) || 0;
  const includedEdits = Number(quote.included_edits) || 30;
  const addOns = (quote.add_ons || []).map(
    (addOn) => `${addOn.name}${addOn.price ? ` (+$${addOn.price})` : ''}`
  );

  const unchanged =
    Number(contract.total_paid) === amount &&
    Number(contract.included_edited_photos) === includedEdits &&
    JSON.stringify(contract.add_ons || []) === JSON.stringify(addOns);
  if (unchanged) return contract;

  const creatorName = contract.creator_name || booking.lensman_name || 'Creator';
  return base44.asServiceRole.entities.BookingContract.update(contract.id, {
    creator_fee: amount,
    add_ons: addOns,
    total_paid: amount,
    included_edited_photos: includedEdits,
    contract_text: buildContractText({ booking, creatorName, amount, includedEdits, addOns }),
  });
}
