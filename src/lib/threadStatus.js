/** Shared thread helpers — the status chips and who is who. */
import { isConfirmed as confirmed, statusChip as chipFor } from '@/lib/bookingNextStep';

export const CONTACT_BLOCK_MESSAGE =
  'Contact details unlock once the booking is confirmed. Keep it here until then.';

/** The tone each chip is drawn in. */
export const CHIP_TONE = {
  REQUESTED: 'cyan',
  'QUOTE SENT': 'magenta',
  'TO PAY': 'lime',
  'PAYMENT CLEARING': 'cyan',
  CONFIRMED: 'lime',
  DELIVERED: 'lime',
  CANCELLED: 'magenta',
  'UNDER REVIEW': 'magenta',
};

/** The chip for a booking. Takes the booking, so it can read the payment too. */
export function statusChip(booking) {
  return chipFor(booking);
}

/** Which side of this booking the signed-in person is on. */
export function viewerRole(booking, user) {
  if (!booking || !user) return null;
  if (booking.creator_id && booking.creator_id === user.id) return 'lensman';
  if (booking.client_id && booking.client_id === user.id) return 'client';
  if (booking.lensman_email && booking.lensman_email === user.email) return 'lensman';
  if (booking.creator_email && booking.creator_email === user.email) return 'lensman';
  if (booking.client_email && booking.client_email === user.email) return 'client';
  return null;
}

/** Paid and going ahead: contact details are unlocked. */
export function isConfirmed(booking) {
  return confirmed(booking);
}

export function firstName(name) {
  return String(name || '').trim().split(' ')[0] || '';
}
