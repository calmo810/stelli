import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

function slugify(value = '') {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const TEXT_FIELDS = ['display_name', 'bio', 'profile_headline', 'profile_tagline', 'booking_cta', 'featured_quote', 'instagram', 'equipment', 'profile_image'];
const LIST_FIELDS = ['neighborhoods', 'specialties', 'style_tags', 'portfolio_images', 'portfolio_videos', 'blackout_dates'];

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });

    const body = await req.json();
    const mine = await base44.asServiceRole.entities.Lensman.filter({ user_id: user.id });
    const lensman = mine[0];
    if (!lensman) return Response.json({ error: 'You do not have a creator profile yet.' }, { status: 404 });

    const patch = {};
    for (const field of TEXT_FIELDS) {
      if (typeof body[field] === 'string') patch[field] = body[field].trim();
    }
    for (const field of LIST_FIELDS) {
      if (Array.isArray(body[field])) patch[field] = body[field];
    }
    if (body.market === 'NYC' || body.market === 'ELON') patch.market = body.market;
    if (Number.isFinite(Number(body.years_experience))) patch.years_experience = Number(body.years_experience);
    if (body.gallery_style) patch.gallery_style = body.gallery_style;

    if (typeof body.slug === 'string' && body.slug.trim()) {
      const slug = slugify(body.slug);
      const taken = await base44.asServiceRole.entities.Lensman.filter({ slug });
      if (!taken.length || taken[0].id === lensman.id) patch.slug = slug;
      else return Response.json({ error: 'That profile link is taken. Try another.' }, { status: 400 });
    }

    const updated = await base44.asServiceRole.entities.Lensman.update(lensman.id, patch);

    if (typeof body.contact_email === 'string' || typeof body.contact_phone === 'string') {
      const contacts = await base44.asServiceRole.entities.CreatorContact.filter({ lensman_id: lensman.id });
      const contactPatch = {};
      if (typeof body.contact_email === 'string' && body.contact_email.trim()) contactPatch.email = body.contact_email.trim();
      if (typeof body.contact_phone === 'string') contactPatch.phone = body.contact_phone.trim();
      if (contacts[0]) await base44.asServiceRole.entities.CreatorContact.update(contacts[0].id, contactPatch);
      else await base44.asServiceRole.entities.CreatorContact.create({ lensman_id: lensman.id, user_id: user.id, email: contactPatch.email || user.email, phone: contactPatch.phone || '' });
    }

    return Response.json({ lensman: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
