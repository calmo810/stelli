/**
 * Which side of a booking someone is on.
 *
 * Decided from the booking itself — never from the account type on their
 * profile — so a person who is both a client and a creator still sees the
 * correct side of the thread they are looking at.
 */
export function viewerRole(booking, user) {
  if (!booking || !user) return null;

  if (booking.creator_id && booking.creator_id === user.id) return 'lensman';
  if (booking.client_id && booking.client_id === user.id) return 'client';
  if (booking.lensman_email && booking.lensman_email === user.email) return 'lensman';
  if (booking.creator_email && booking.creator_email === user.email) return 'lensman';
  if (booking.client_email && booking.client_email === user.email) return 'client';

  return null;
}

/** Once a booking is confirmed, messaging is unrestricted. */
export function isConfirmed(booking) {
  return ['confirmed', 'in_progress', 'awaiting_delivery', 'delivered', 'completed'].includes(
    booking?.status
  );
}

/** The creator's account email on this booking, whichever field carries it. */
export function creatorEmail(booking) {
  return booking?.creator_email || booking?.lensman_email || '';
}

/**
 * Records the creator's first reply on a request and refreshes their median
 * response time. Only the first reply counts.
 */
export async function recordFirstReply(base44, booking) {
  if (!booking || booking.first_reply_at) return;

  await base44.asServiceRole.entities.Booking.update(booking.id, {
    first_reply_at: new Date().toISOString(),
  });

  await refreshResponseTime(base44, booking.lensman_id);
}

async function refreshResponseTime(base44, lensmanId) {
  if (!lensmanId) return;

  try {
    const recent = await base44.asServiceRole.entities.Booking.filter(
      { lensman_id: lensmanId },
      '-created_date',
      30
    );

    const minutes = recent
      .filter((b) => b.first_reply_at && b.created_date)
      .map((b) =>
        Math.max(
          0,
          Math.round(
            (new Date(b.first_reply_at).getTime() - new Date(b.created_date).getTime()) / 60000
          )
        )
      )
      .slice(0, 10)
      .sort((a, b) => a - b);

    if (minutes.length < 3) return;

    const mid = Math.floor(minutes.length / 2);
    const median =
      minutes.length % 2 ? minutes[mid] : Math.round((minutes[mid - 1] + minutes[mid]) / 2);

    await base44.asServiceRole.entities.Lensman.update(lensmanId, {
      response_median_minutes: median,
      response_sample_size: minutes.length,
    });
  } catch (error) {
    console.error('Response time refresh failed for lensman', lensmanId, '-', error.message);
  }
}