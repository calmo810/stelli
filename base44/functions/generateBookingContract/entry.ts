import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const PRODUCT_NAMES = {
  half_day: 'The Candid',
  full_day: 'The Event Film',
  custom: 'The Content Day',
};

const ADDON_NAMES = {
  rush: '48-hour rush delivery',
  raw: 'Raw files included',
  bts: 'Behind-the-scenes video',
};

function addBusinessDays(dateString, days) {
  const date = new Date(`${dateString}T12:00:00`);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }
  return date.toISOString().split('T')[0];
}

function latestVersion(docs, type) {
  const doc = docs.find(item => item.type === type);
  return doc?.version || '2026-09-10';
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { bookingId } = await req.json();
    if (!bookingId) return Response.json({ error: 'Booking ID is required' }, { status: 400 });

    const booking = await base44.asServiceRole.entities.Booking.get(bookingId);
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

    const existing = await base44.asServiceRole.entities.BookingContract.filter({ booking_id: bookingId });
    if (existing.length) return Response.json({ contract: existing[0] });

    const lensman = await base44.asServiceRole.entities.Lensman.get(booking.lensman_id);
    const docs = await base44.asServiceRole.entities.LegalDocument.list('-effective_date', 20);
    const termsVersion = latestVersion(docs, 'terms');
    const privacyVersion = latestVersion(docs, 'privacy');
    const contractVersion = latestVersion(docs, 'contract_template');
    const formatName = PRODUCT_NAMES[booking.package_type] || 'Stelli Shoot';
    const totalPaid = booking.total_price || 0;
    const addOns = (booking.add_ons || []).map(id => ADDON_NAMES[id] || id);
    const uneditedDeadline = addBusinessDays(booking.event_date, 3);
    const editedDeadline = addBusinessDays(booking.event_date, (booking.add_ons || []).includes('rush') ? 5 : 10);

    const contractText = `Stelli Booking Confirmation\n\nClient: ${booking.client_name}\nCreator: ${lensman?.full_name || booking.lensman_name || 'Creator'}\nFormat: ${formatName}\nShoot date: ${booking.event_date}\nShoot time: ${booking.event_time || 'To be coordinated'}\nShoot location: ${booking.location || 'To be coordinated'}\nCreator fee: $${totalPaid.toLocaleString()}\nAdd-ons: ${addOns.join(', ') || 'None'}\nTotal paid: $${totalPaid.toLocaleString()}\nIncluded edited photos: 30\nUnedited delivery deadline: ${uneditedDeadline}\nEdited delivery deadline: ${editedDeadline}\n\nThe Creator agrees to perform the booked shoot, and the Client agrees to pay the stated total through Stelli. Unedited files are delivered for selection only. Edited files transfer to the Client after payment release under Stelli's Terms and Conditions.\n\nThis Booking Confirmation, together with Stelli's Terms and Conditions (getstelli.com/terms), constitutes the written agreement between the Client and the Creator for this booking.`;

    const contract = await base44.asServiceRole.entities.BookingContract.create({
      booking_id: bookingId,
      client_id: booking.client_id || user.id,
      client_email: booking.client_email,
      client_name: booking.client_name,
      creator_id: booking.lensman_id,
      creator_email: lensman?.email || '',
      creator_name: lensman?.full_name || booking.lensman_name || 'Creator',
      format_name: formatName,
      shoot_date: booking.event_date,
      shoot_time: booking.event_time || '',
      shoot_location: booking.location || '',
      creator_fee: totalPaid,
      add_ons: addOns,
      total_paid: totalPaid,
      included_edited_photos: 30,
      unedited_delivery_deadline: uneditedDeadline,
      edited_delivery_deadline: editedDeadline,
      contract_text: contractText,
      terms_version: termsVersion,
      privacy_version: privacyVersion,
      version: contractVersion,
      created_at: new Date().toISOString(),
    });

    await base44.asServiceRole.entities.Booking.update(bookingId, {
      contract_id: contract.id,
      creator_id: booking.lensman_id,
      terms_version: termsVersion,
      privacy_version: privacyVersion,
    });

    return Response.json({ contract });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}