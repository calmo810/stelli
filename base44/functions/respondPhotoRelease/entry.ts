import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { releaseRole } from '../../shared/photoRelease.ts';
import { sendEmail } from '../../shared/notify.ts';

const DECISIONS = ['approved', 'declined'];
const MAX_PHOTOS = 6;

const samePhotos = (a, b) => JSON.stringify(a || []) === JSON.stringify(b || []);

/**
 * One side answers the photo release for their booking.
 * The creator also picks which photos (up to six) would be shown.
 * Either side can change their answer later; a "declined" takes the shoot
 * off the public page immediately.
 *
 * The client's yes is a yes to specific photos. If the creator changes the set
 * after the client approved — swaps one, adds one — the client's approval is
 * set back to "pending" and the shoot comes off the public page until they
 * have seen the new set and said yes again. (Before, the creator could put up
 * any photos they liked once the client had approved the shoot.)
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });

    const { releaseId, decision, photos } = await req.json();
    if (!releaseId || !DECISIONS.includes(decision)) {
      return Response.json({ error: 'A release and an answer are required.' }, { status: 400 });
    }

    const release = await base44.asServiceRole.entities.PhotoRelease.get(releaseId).catch(() => null);
    if (!release) return Response.json({ error: 'Release not found.' }, { status: 404 });

    const role = releaseRole(release, user);
    if (!role) return Response.json({ error: 'This release is not yours to answer.' }, { status: 403 });

    const now = new Date().toISOString();
    const patch: Record<string, any> = {};
    let clientMustLookAgain = false;

    if (role === 'lensman') {
      patch.creator_decision = decision;
      patch.creator_decided_at = now;
      if (Array.isArray(photos)) {
        patch.photos = photos
          .filter((url) => typeof url === 'string' && /^https:\/\//i.test(url.trim()))
          .map((url) => url.trim().slice(0, 1000))
          .slice(0, MAX_PHOTOS);
      }
      const chosen = patch.photos ?? release.photos ?? [];
      if (decision === 'approved' && !chosen.length) {
        return Response.json({ error: 'Add at least one photo from the shoot to share it.' }, { status: 400 });
      }
      // A different set than the one the client said yes to needs a new yes.
      if (patch.photos && !samePhotos(patch.photos, release.photos) && release.client_decision === 'approved') {
        patch.client_decision = 'pending';
        patch.client_decided_at = '';
        clientMustLookAgain = decision === 'approved';
      }
    } else {
      // The client can only approve a set that exists.
      if (decision === 'approved' && !(release.photos || []).length) {
        return Response.json(
          { error: 'Your creator has not picked the photos yet. You can answer once they have.' },
          { status: 400 }
        );
      }
      patch.client_decision = decision;
      patch.client_decided_at = now;
    }

    // Link the review for this booking, if the client left one.
    if (!release.review_id) {
      const reviews = await base44.asServiceRole.entities.Review.filter({ booking_id: release.booking_id }).catch(() => []);
      if (reviews[0]) patch.review_id = reviews[0].id;
    }

    const updated = await base44.asServiceRole.entities.PhotoRelease.update(releaseId, patch);

    if (clientMustLookAgain) {
      await sendEmail(
        base44,
        release.client_email,
        'The photos for your shared shoot changed',
        `${release.lensman_name || 'Your creator'} changed which photos from the ${release.event_date || ''} shoot they would like to show. The shoot is off their page until you have looked at the new set and said yes. Open your Stelli portal to answer.`
      );
    }

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
    return Response.json({ error: 'That did not save. Try again.' }, { status: 500 });
  }
}
