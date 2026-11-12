import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

/** One count per visitor per profile per this window. */
const VIEW_WINDOW_MS = 6 * 60 * 60 * 1000;
const recentViews = new Map();

/** Who is looking: their account when signed in, otherwise their address. */
function visitorKey(req, viewer) {
  if (viewer?.id) return `u:${viewer.id}`;
  const forwarded = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  const address = forwarded || req.headers.get('cf-connecting-ip') || '';
  return address ? `ip:${address}` : '';
}

/**
 * Counts one look at an approved creator page, so creators can see whether
 * their storefront is getting traffic. Signed in or not, one visitor counts
 * once per profile per window, the creator's own visits never count, and the
 * counter is only ever moved by this endpoint.
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

    const viewer = await base44.auth.me().catch(() => null);
    if (viewer && (viewer.id === lensman.user_id || viewer.role === 'admin')) {
      return Response.json({ counted: false });
    }

    // One visitor counts once per profile per window, so a script that reloads
    // or loops cannot inflate the number.
    const who = visitorKey(req, viewer);
    const key = `${who}:${lensman.id}`;
    if (who) {
      const seenAt = recentViews.get(key) || 0;
      if (Date.now() - seenAt < VIEW_WINDOW_MS) {
        return Response.json({ counted: false });
      }
      if (recentViews.size > 5000) recentViews.clear();
      recentViews.set(key, Date.now());
    }

    await base44.asServiceRole.entities.Lensman.update(lensman.id, {
      profile_views: Number(lensman.profile_views || 0) + 1,
    });

    return Response.json({ counted: true });
  } catch (error) {
    console.error('trackProfileView error:', error.message);
    return Response.json({ counted: false });
  }
}