import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

/**
 * Past Stelli shoots for a public creator page.
 * Only releases BOTH sides approved are returned, with public-safe fields:
 * the client's first name, the shoot type and month, the chosen photos and
 * the linked review. Open to anyone, signed in or not.
 */
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

    const shoots = [];
    for (const r of releases) {
      const photos = (r.photos || []).filter(Boolean);
      if (!photos.length) continue;
      let review = null;
      if (r.review_id) {
        const found = await base44.asServiceRole.entities.Review.get(r.review_id).catch(() => null);
        if (found) review = { rating: found.rating || 0, comment: found.comment || '' };
      }
      shoots.push({
        id: r.id,
        client_first_name: String(r.client_name || '').trim().split(/\s+/)[0] || 'A client',
        event_type: r.event_type || '',
        event_date: r.event_date || '',
        photos,
        review,
      });
    }

    return Response.json({ shoots });
  } catch (error) {
    console.error('getPastShoots error:', error.message);
    return Response.json({ shoots: [] });
  }
}
