export const PRODUCT_NAMES = {
  half_day: 'The Candid',
  full_day: 'The Event Film',
  custom: 'The Content Day',
};

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

export function buildContractText({ booking, lensman, amount, includedEdits, addOns }) {
  const formatName = PRODUCT_NAMES[booking.package_type] || 'Stelli Shoot';
  const uneditedDeadline = addBusinessDays(booking.event_date, 3) || 'Pending shoot date';
  const editedDeadline = addBusinessDays(booking.event_date, 10) || 'Pending shoot date';
  const creatorName = lensman?.full_name || booking.lensman_name || 'Creator';

  return `Stelli Booking Confirmation

Client: ${booking.client_name || 'Client'}
Creator: ${creatorName}
Format: ${formatName}
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
 */
export async function createContractForBooking(base44, { booking, quote, lensman }) {
  const existing = await base44.asServiceRole.entities.BookingContract.filter({
    booking_id: booking.id,
  });
  if (existing.length) return existing[0];

  const docs = await base44.asServiceRole.entities.LegalDocument.list('-effective_date', 20);
  const version = (type) => docs.find((doc) => doc.type === type)?.version || '2026-09-10';

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
    creator_email: lensman?.email || booking.lensman_email || '',
    creator_name: lensman?.full_name || booking.lensman_name || 'Creator',
    format_name: PRODUCT_NAMES[booking.package_type] || 'Stelli Shoot',
    shoot_date: booking.event_date,
    shoot_time: booking.event_time || '',
    shoot_location: booking.location || '',
    creator_fee: amount,
    add_ons: addOns,
    total_paid: amount,
    included_edited_photos: includedEdits,
    unedited_delivery_deadline: addBusinessDays(booking.event_date, 3),
    edited_delivery_deadline: addBusinessDays(booking.event_date, 10),
    contract_text: buildContractText({ booking, lensman, amount, includedEdits, addOns }),
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