import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

/**
 * Counts one public look at an approved creator page, so creators can see
 * whether their storefront is getting traffic. The creator's own visits never
 * count, and the counter is only ever moved by this endpoint.
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

    await base44.asServiceRole.entities.Lensman.update(lensman.id, {
      profile_views: Number(lensman.profile_views || 0) + 1,
    });

    return Response.json({ counted: true });
  } catch (error) {
    console.error('trackProfileView error:', error.message);
    return Response.json({ counted: false });
  }
}