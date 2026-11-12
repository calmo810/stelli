import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { buildProfilePatch } from '../../shared/profileRules.ts';
import { applicationProblem, MIN_PORTFOLIO_IMAGES } from '../../shared/creatorApplication.ts';
import { emailAdmins } from '../../shared/notify.ts';

function slugify(value = '') {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const PRIVATE_TEXT_FIELDS = ['full_name', 'email', 'phone', 'instagram'];

/**
 * Saves the creator's own profile.
 *
 * Public fields go to Lensman; the Private section goes to CreatorContact.
 * The headline, tagline and booking button are written by the app from the
 * display name and specialties — never typed by the creator.
 *
 * A creator can never set their own status, with one exception the server
 * controls: when a founder has asked for changes, saving with `resubmit` sends
 * the profile back to the review queue (needs_changes → pending). It never
 * approves anything.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
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

    // A save that touches the photos or the shoot types can't take the page
    // below what an application needs: a live profile is never left empty.
    if (Array.isArray(body.portfolio_images) && patch.portfolio_images.length < MIN_PORTFOLIO_IMAGES) {
      return Response.json(
        { error: `Keep at least ${MIN_PORTFOLIO_IMAGES} shots on your page.`, field: 'portfolio_images' },
        { status: 400 }
      );
    }
    if (Array.isArray(body.specialties) && !patch.specialties?.length) {
      return Response.json({ error: 'Pick at least one thing you shoot.', field: 'specialties' }, { status: 400 });
    }

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

    // Every other public field (bio, equipment, what and where they shoot,
    // photos, videos, layout choices) is already in `patch`, validated by
    // buildProfilePatch. Nothing is copied from the request as-is: this is how
    // a creator could put a handle in "specialties", and it is also why the
    // fields a creator must never set — status, payouts, review flags — can't
    // be reached from here at all.

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

    let updated = await base44.asServiceRole.entities.Lensman.update(lensman.id, patch);

    const privatePatch: Record<string, any> = {};
    for (const field of PRIVATE_TEXT_FIELDS) {
      if (typeof body[field] === 'string') privatePatch[field] = body[field].trim().slice(0, 200);
    }
    if (privatePatch.email === '') {
      return Response.json({ error: 'A contact email is required.', field: 'email' }, { status: 400 });
    }
    if (privatePatch.full_name === '') {
      return Response.json({ error: 'Your name is required.', field: 'full_name' }, { status: 400 });
    }
    let savedContact = contact;
    if (Object.keys(privatePatch).length) {
      if (contact) {
        savedContact = await base44.asServiceRole.entities.CreatorContact.update(contact.id, privatePatch);
      } else {
        savedContact = await base44.asServiceRole.entities.CreatorContact.create({
          lensman_id: lensman.id,
          user_id: lensman.user_id || user.id,
          full_name: privatePatch.full_name || '',
          email: privatePatch.email || user.email,
          phone: privatePatch.phone || '',
          instagram: privatePatch.instagram || '',
        });
      }
    }

    // Sending it back after a founder asked for changes. The edits above are
    // saved either way; it only returns to the queue if it is reviewable.
    let resubmitted = false;
    if (body.resubmit === true && lensman.status === 'needs_changes') {
      const problem = applicationProblem({
        fullName: savedContact?.full_name || contact?.full_name,
        email: savedContact?.email || contact?.email,
        displayName,
        profile: updated,
      });
      if (problem) return Response.json({ ...problem, saved: true }, { status: 400 });

      const Lensman = base44.asServiceRole.entities.Lensman;
      await Lensman.updateMany({ id: lensman.id, status: 'needs_changes' }, { $set: { status: 'pending' } });
      const fresh = await Lensman.get(lensman.id).catch(() => null);
      if (fresh?.status === 'pending') {
        resubmitted = true;
        updated = fresh;
        const record = savedContact || contact;
        if (record?.id) {
          await base44.asServiceRole.entities.CreatorContact.update(record.id, { changes_requested: '' });
        }
        await emailAdmins(
          base44,
          `Creator sent their page back: ${displayName}`,
          `${displayName} made changes after your note and is back in the queue.\n\nReview it in Stelli: https://getstelli.base44.app/admin → Applications.`
        );
      }
    }

    return Response.json({ lensman: updated, resubmitted });
  } catch (error) {
    console.error('updateCreatorProfile error:', error.message);
    return Response.json({ error: 'Your profile did not save. Try again.' }, { status: 500 });
  }
}