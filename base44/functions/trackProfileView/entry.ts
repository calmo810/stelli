import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

/** One count per signed-in viewer per profile per this window. */
const VIEW_WINDOW_MS = 6 * 60 * 60 * 1000;
const recentViews = new Map();

/**
 * Counts one look at an approved creator page, so creators can see whether
 * their storefront is getting traffic. Only a signed-in visitor counts, the
 * creator's own visits never count, each viewer is counted once per window,
 * and the counter is only ever moved by this endpoint.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const { lensmanId } = await req.json();

    if (!lensmanId) {
      return Response.json({ counted: false });
    }

    const lensman = await base44.asServiceRole.entities.Lensman.get(lensmanId).catch(() => null);
    if (!lensman || lensman.status !== 'approved') {
      return Response.json({ counted: false });
    }

    // No signed-in caller, no count: an anonymous script must not be able to
    // move a creator's traffic metric at will.
    const viewer = await base44.auth.me().catch(() => null);
    if (!viewer) {
      return Response.json({ counted: false });
    }
    if (viewer.id === lensman.user_id || viewer.role === 'admin') {
      return Response.json({ counted: false });
    }

    // One viewer counts once per profile per window, so reloads and loops by a
    // signed-in caller cannot inflate the number either.
    const key = `${viewer.id}:${lensman.id}`;
    const seenAt = recentViews.get(key) || 0;
    if (Date.now() - seenAt < VIEW_WINDOW_MS) {
      return Response.json({ counted: false });
    }
    if (recentViews.size > 5000) recentViews.clear();
    recentViews.set(key, Date.now());

    await base44.asServiceRole.entities.Lensman.update(lensman.id, {
      profile_views: Number(lensman.profile_views || 0) + 1,
    });

    return Response.json({ counted: true });
  } catch (error) {
    console.error('trackProfileView error:', error.message);
    return Response.json({ counted: false });
  }
}