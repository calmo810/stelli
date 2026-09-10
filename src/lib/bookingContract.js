const PRODUCT_NAMES = {
  half_day: 'The Candid',
  full_day: 'The Event Film',
  custom: 'The Content Day',
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

export function buildBookingContractPreview({ form, lensman, totalPrice }) {
  const formatName = PRODUCT_NAMES[form.package_type] || 'Stelli Shoot';
  const uneditedDeadline = form.event_date ? addBusinessDays(form.event_date, 3) : 'Pending shoot date';
  const editedDeadline = form.event_date ? addBusinessDays(form.event_date, form.add_ons?.includes('rush') ? 5 : 10) : 'Pending shoot date';

  return `Stelli Booking Confirmation\n\nClient: ${form.client_name || 'Client name pending'}\nCreator: ${lensman?.full_name || lensman?.display_name || 'Creator pending'}\nFormat: ${formatName}\nShoot date: ${form.event_date || 'Pending'}\nShoot time: ${form.event_time || 'To be coordinated'}\nShoot location: ${form.location || 'Pending'}\nCreator fee: $${totalPrice.toLocaleString()}\nAdd-ons: ${(form.add_ons || []).join(', ') || 'None'}\nTotal paid: $${totalPrice.toLocaleString()}\nIncluded edited photos: 30\nUnedited delivery deadline: ${uneditedDeadline}\nEdited delivery deadline: ${editedDeadline}\n\nThe Creator agrees to perform the booked shoot, and the Client agrees to pay the stated total through Stelli. Unedited files are delivered for selection only. Edited files transfer to the Client after payment release under Stelli's Terms and Conditions.\n\nThis Booking Confirmation, together with Stelli's Terms and Conditions (getstelli.com/terms), constitutes the written agreement between the Client and the Creator for this booking.`;
}