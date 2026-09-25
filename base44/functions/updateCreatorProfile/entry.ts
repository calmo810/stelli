import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { buildProfilePatch } from '../../shared/profileRules.ts';

function slugify(value = '') {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const PUBLIC_TEXT_FIELDS = ['display_name', 'bio', 'equipment', 'profile_image'];
const PUBLIC_LIST_FIELDS = ['neighborhoods', 'specialties', 'portfolio_images', 'portfolio_videos', 'blackout_dates'];
const PRIVATE_TEXT_FIELDS = ['full_name', 'email', 'phone', 'instagram'];

/**
 * Saves the creator's own profile.
 *
 * Public fields go to Lensman; the Private section goes to CreatorContact.
 * The headline, tagline and booking button are written by the app from the
 * display name and specialties — never typed by the creator.
 */
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

    const contacts = await base44.asServiceRole.entities.CreatorContact.filter({
      lensman_id: lensman.id,
    });
    const contact = contacts[0] || null;

    // The display name is what clients see, so it can never be saved blank.
    let displayName = lensman.display_name || '';
    if (typeof body.display_name === 'string') {
      displayName = body.display_name.trim();
      if (!displayName) {
        return Response.json(
          { error: 'Your display name cannot be empty.', field: 'display_name' },
          { status: 400 }
        );
      }
      patch.display_name = displayName;
    }

    for (const field of PUBLIC_TEXT_FIELDS) {
      if (field === 'display_name') continue;
      if (typeof body[field] === 'string') patch[field] = body[field].trim();
    }
    for (const field of PUBLIC_LIST_FIELDS) {
      if (Array.isArray(body[field])) patch[field] = body[field];
    }
    if (Number.isFinite(Number(body.years_experience))) {
      patch.years_experience = Number(body.years_experience);
    }
    if (body.gallery_style) patch.gallery_style = body.gallery_style;
    if (body.profile_theme) patch.profile_theme = body.profile_theme;
    if (body.accent_color) patch.accent_color = body.accent_color;

    // Written by the app, never asked for in the form.
    patch.profile_headline = `Book ${displayName} safely through Stelli.`;
    const specialties = patch.specialties || lensman.specialties || [];
    patch.profile_tagline = specialties.slice(0, 3).join(' · ');
    patch.booking_cta = 'Request a date';

    // A cover can only be an image the curator actually has in their portfolio.
    if (typeof patch.cover_image === 'string' && patch.cover_image) {
      if (!(patch.portfolio_images || lensman.portfolio_images || []).includes(patch.cover_image)) {
        patch.cover_image = '';
      }
    }

    // The first three photos are the ones pinned on the public profile.
    const portfolio = patch.portfolio_images || lensman.portfolio_images || [];
    patch.pinned_images = portfolio.filter(Boolean).slice(0, 3);

    // The profile link follows the display name unless the creator sets it.
    if (typeof body.slug === 'string' && body.slug.trim()) {
      const slug = slugify(body.slug);
      const taken = await base44.asServiceRole.entities.Lensman.filter({ slug });
      if (!taken.length || taken[0].id === lensman.id) patch.slug = slug;
      else return Response.json({ error: 'That profile link is taken. Try another.', field: 'slug' }, { status: 400 });
    } else if (displayName && displayName !== lensman.display_name) {
      const slug = slugify(displayName);
      if (slug) {
        const taken = await base44.asServiceRole.entities.Lensman.filter({ slug });
        if (!taken.length || taken[0].id === lensman.id) patch.slug = slug;
      }
    }

    const updated = await base44.asServiceRole.entities.Lensman.update(lensman.id, patch);

    const privatePatch = {};
    for (const field of PRIVATE_TEXT_FIELDS) {
      if (typeof body[field] === 'string') privatePatch[field] = body[field].trim();
    }
    if (privatePatch.email === '') {
      return Response.json({ error: 'A contact email is required.', field: 'email' }, { status: 400 });
    }
    if (privatePatch.full_name === '') {
      return Response.json({ error: 'Your name is required.', field: 'full_name' }, { status: 400 });
    }
    if (Object.keys(privatePatch).length) {
      if (contact) {
        await base44.asServiceRole.entities.CreatorContact.update(contact.id, privatePatch);
      } else {
        await base44.asServiceRole.entities.CreatorContact.create({
          lensman_id: lensman.id,
          user_id: lensman.user_id || user.id,
          full_name: privatePatch.full_name || '',
          email: privatePatch.email || user.email,
          phone: privatePatch.phone || '',
          instagram: privatePatch.instagram || '',
        });
      }
    }

    return Response.json({ lensman: updated });
  } catch (error) {
    console.error('updateCreatorProfile error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}