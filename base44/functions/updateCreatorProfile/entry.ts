import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { buildProfilePatch } from '../../shared/profileRules.ts';

function slugify(value = '') {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const TEXT_FIELDS = ['display_name', 'bio', 'profile_headline', 'profile_tagline', 'booking_cta', 'featured_quote', 'instagram', 'equipment', 'profile_image'];
const LIST_FIELDS = ['neighborhoods', 'specialties', 'portfolio_images', 'portfolio_videos', 'blackout_dates'];

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });

    const body = await req.json();

    // Curated-profile rules run before anything is written, so a rejected save
    // never touches the stored profile.
    const { patch, errors } = buildProfilePatch(body);
    const firstError = Object.keys(errors)[0];
    if (firstError) {
      return Response.json({ error: errors[firstError], field: firstError, errors }, { status: 400 });
    }

    const mine = await base44.asServiceRole.entities.Lensman.filter({ user_id: user.id });
    const lensman = mine[0];
    if (!lensman) return Response.json({ error: 'You do not have a creator profile yet.' }, { status: 404 });

    for (const field of TEXT_FIELDS) {
      if (typeof body[field] === 'string') patch[field] = body[field].trim();
    }
    for (const field of LIST_FIELDS) {
      if (Array.isArray(body[field])) patch[field] = body[field];
    }
    if (body.market === 'NYC' || body.market === 'ELON') patch.market = body.market;
    if (Number.isFinite(Number(body.years_experience))) patch.years_experience = Number(body.years_experience);
    if (body.gallery_style) patch.gallery_style = body.gallery_style;
    if (body.profile_theme) patch.profile_theme = body.profile_theme;

    // A cover can only be an image the curator actually has in their portfolio.
    if (typeof patch.cover_image === 'string' && patch.cover_image) {
      if (!(patch.portfolio_images || lensman.portfolio_images || []).includes(patch.cover_image)) {
        patch.cover_image = '';
      }
    }
    if (Array.isArray(patch.pinned_images) && patch.pinned_images.length) {
      const available = patch.portfolio_images || lensman.portfolio_images || [];
      patch.pinned_images = patch.pinned_images.filter((url) => available.includes(url)).slice(0, 3);
    }

    if (typeof body.slug === 'string' && body.slug.trim()) {
      const slug = slugify(body.slug);
      const taken = await base44.asServiceRole.entities.Lensman.filter({ slug });
      if (!taken.length || taken[0].id === lensman.id) patch.slug = slug;
      else return Response.json({ error: 'That profile link is taken. Try another.', field: 'slug' }, { status: 400 });
    }

    const updated = await base44.asServiceRole.entities.Lensman.update(lensman.id, patch);

    return Response.json({ lensman: updated });
  } catch (error) {
    console.error('updateCreatorProfile error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}