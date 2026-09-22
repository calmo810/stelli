/** Shared thread helpers — the four status chips and who is who. */

export const CONTACT_BLOCK_MESSAGE =
  'Contact details unlock once the booking is confirmed. Keep it here until then.';

const CHIPS = {
  requested: 'REQUESTED',
  quoted: 'QUOTE SENT',
  quote_accepted: 'QUOTE SENT',
  pending: 'QUOTE SENT',
  awaiting_creator_acceptance: 'QUOTE SENT',
  confirmed: 'CONFIRMED',
  in_progress: 'CONFIRMED',
  awaiting_delivery: 'CONFIRMED',
  delivered: 'DELIVERED',
  completed: 'DELIVERED',
  cancelled: 'CANCELLED',
  disputed: 'UNDER REVIEW',
};

export function statusChip(status) {
  return CHIPS[status] || 'REQUESTED';
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

export function isConfirmed(booking) {
  return ['confirmed', 'in_progress', 'awaiting_delivery', 'delivered', 'completed'].includes(
    booking?.status
  );
}

export function firstName(name) {
  return String(name || '').trim().split(' ')[0] || '';
}