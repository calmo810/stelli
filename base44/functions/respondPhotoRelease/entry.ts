import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { releaseRole } from '../../shared/photoRelease.ts';
import { sendEmail } from '../../shared/notify.ts';

const DECISIONS = ['approved', 'declined'];
const MAX_PHOTOS = 6;

/**
 * One side answers the photo release for their booking.
 * The creator also picks which photos (up to six) would be shown.
 * Either side can change their answer later; a "declined" takes the shoot
 * off the public page immediately.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });

    const { releaseId, decision, photos } = await req.json();
    if (!releaseId || !DECISIONS.includes(decision)) {
      return Response.json({ error: 'A release and an answer are required.' }, { status: 400 });
    }

    const release = await base44.asServiceRole.entities.PhotoRelease.get(releaseId);
    if (!release) return Response.json({ error: 'Release not found.' }, { status: 404 });

    const role = releaseRole(release, user);
    if (!role) return Response.json({ error: 'This release is not yours to answer.' }, { status: 403 });

    const now = new Date().toISOString();
    const patch = {};

    if (role === 'lensman') {
      patch.creator_decision = decision;
      patch.creator_decided_at = now;
      if (Array.isArray(photos)) {
        patch.photos = photos
          .filter((url) => typeof url === 'string' && /^https:\/\//i.test(url.trim()))
          .map((url) => url.trim())
          .slice(0, MAX_PHOTOS);
      }
      const chosen = patch.photos ?? release.photos ?? [];
      if (decision === 'approved' && !chosen.length) {
        return Response.json({ error: 'Add at least one photo from the shoot to share it.' }, { status: 400 });
      }
    } else {
      patch.client_decision = decision;
      patch.client_decided_at = now;
    }

    // Link the review for this booking, if the client left one.
    if (!release.review_id) {
      const reviews = await base44.asServiceRole.entities.Review.filter({ booking_id: release.booking_id }).catch(() => []);
      if (reviews[0]) patch.review_id = reviews[0].id;
    }

    const updated = await base44.asServiceRole.entities.PhotoRelease.update(releaseId, patch);

    // Tell the other side once, only when this answer completes the pair.
    const both = updated.client_decision === 'approved' && updated.creator_decision === 'approved';
    if (both && decision === 'approved') {
      const other = role === 'lensman' ? release.client_email : release.creator_email;
      await sendEmail(
        base44,
        other,
        'Your shoot is now on Stelli',
        `You both agreed to share the ${release.event_date || ''} shoot. It now appears under Past Stelli shoots on ${release.lensman_name || 'the creator'}'s page. You can withdraw any time from your portal.`
      );
    }

    return Response.json({ release: updated });
  } catch (error) {
    console.error('respondPhotoRelease error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
