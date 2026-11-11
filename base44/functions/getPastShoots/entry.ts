import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

/**
 * Past Stelli shoots for a public creator page.
 * Only releases BOTH sides approved are returned, with public-safe fields:
 * the client's first name, the shoot type and month, the chosen photos and
 * the review for that booking. Open to anyone, signed in or not.
 *
 * The review is found by booking, not only by the release's saved review_id,
 * so a review written after both sides approved still shows. When one is
 * found that the release didn't point to, the link is saved for next time.
 */

const latestFirst = (a, b) => String(b.created_date || '').localeCompare(String(a.created_date || ''));

async function findReview(base44, release) {
  if (release.review_id) {
    const linked = await base44.asServiceRole.entities.Review.get(release.review_id).catch(() => null);
    if (linked) return linked;
  }
  if (!release.booking_id) return null;
  const found = await base44.asServiceRole.entities.Review.filter({ booking_id: release.booking_id }).catch(() => []);
  const review = [...found].sort(latestFirst)[0] || null;
  if (review && review.id !== release.review_id) {
    await base44.asServiceRole.entities.PhotoRelease.update(release.id, { review_id: review.id }).catch((error) =>
      console.error('Review link could not be saved for release', release.id, '-', error.message)
    );
  }
  return review;
}

function sharedAt(release) {
  const times = [release.client_decided_at, release.creator_decided_at].filter(Boolean).sort();
  return times[times.length - 1] || '';
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const { lensmanId } = await req.json();
    if (!lensmanId) return Response.json({ shoots: [] });

    const lensman = await base44.asServiceRole.entities.Lensman.get(lensmanId).catch(() => null);
    if (!lensman || lensman.status !== 'approved') return Response.json({ shoots: [] });

    const releases = await base44.asServiceRole.entities.PhotoRelease.filter(
      { lensman_id: lensmanId, client_decision: 'approved', creator_decision: 'approved' },
      '-event_date',
      24
    );

    const withPhotos = releases.filter((r) => (r.photos || []).some(Boolean));
    const shoots = await Promise.all(
      withPhotos.map(async (r) => {
        const found = await findReview(base44, r);
        return {
          id: r.id,
          client_first_name: String(r.client_name || '').trim().split(/\s+/)[0] || 'A client',
          event_type: r.event_type || '',
          event_date: r.event_date || '',
          shared_at: sharedAt(r),
          photos: r.photos.filter(Boolean),
          review: found ? { rating: Number(found.rating) || 0, comment: String(found.comment || '').trim() } : null,
        };
      })
    );

    return Response.json({ shoots });
  } catch (error) {
    console.error('getPastShoots error:', error.message);
    return Response.json({ shoots: [] });
  }
}
