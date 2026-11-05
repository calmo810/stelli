/**
 * Photo release: a separate agreement, made per booking, that lets a delivered
 * shoot appear under "Past Stelli shoots" on the creator's public page.
 *
 * It opens when the final edits are delivered and is answered from each
 * portal. A shoot is shown only when the client AND the creator approve.
 * Never throws — a release problem must not fail a delivery.
 */
export const RELEASE_VERSION = '2026-11';

export const RELEASE_TEXT =
  'Both of you agree that photos from this shoot, and the review left for it, may be shown on the ' +
  "creator's public Stelli page. Either of you can say no, and either of you can withdraw later — " +
  'the shoot comes off the page right away.';

export async function openPhotoRelease(base44, booking) {
  try {
    if (!booking?.id || !booking.lensman_id) return null;
    const existing = await base44.asServiceRole.entities.PhotoRelease.filter({ booking_id: booking.id });
    if (existing.length) return existing[0];

    return await base44.asServiceRole.entities.PhotoRelease.create({
      booking_id: booking.id,
      lensman_id: booking.lensman_id,
      lensman_name: booking.lensman_name || '',
      creator_id: booking.creator_id || '',
      creator_email: booking.creator_email || booking.lensman_email || '',
      client_id: booking.client_id || '',
      client_email: booking.client_email || '',
      client_name: booking.client_name || '',
      event_type: booking.event_type || '',
      event_date: booking.event_date || '',
      photos: [],
      client_decision: 'pending',
      creator_decision: 'pending',
      agreement_version: RELEASE_VERSION,
    });
  } catch (error) {
    console.error('Photo release could not be opened for booking', booking?.id, '-', error.message);
    return null;
  }
}

/** Which side of a release someone is on. */
export function releaseRole(release, user) {
  if (!release || !user) return null;
  if (release.creator_id && release.creator_id === user.id) return 'lensman';
  if (release.client_id && release.client_id === user.id) return 'client';
  if (release.creator_email && release.creator_email === user.email) return 'lensman';
  if (release.client_email && release.client_email === user.email) return 'client';
  return null;
}
