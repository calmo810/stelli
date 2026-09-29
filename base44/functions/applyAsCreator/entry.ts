import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { sendEmail } from '../../shared/notify.ts';
import { slugify, displayNameFrom } from '../../shared/creatorApplication.ts';
import { buildProfilePatch } from '../../shared/profileRules.ts';

const DUPLICATE_EMAIL =
  "There's already a creator profile with this email. Log in to that account instead.";

const GALLERIES = ['ordered_grid', 'hero_grid', 'contact_sheet'];

/**
 * Creator signup — the only way a creator profile can be created.
 *
 * The profile wizard sends the whole page it built: the public fields land on
 * Lensman (status pending, so nothing goes live before vetting) and the real
 * name, email, phone and handle stay in the private CreatorContact record.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please sign in to apply.' }, { status: 401 });

    const body = await req.json();
    const fullName = (body.full_name || body.fullName || '').trim();
    if (!fullName) return Response.json({ error: 'Your name is required.' }, { status: 400 });

    const email = (body.email || user.email || '').trim().toLowerCase();
    if (!email) return Response.json({ error: 'A contact email is required.' }, { status: 400 });

    const existing = await base44.asServiceRole.entities.Lensman.filter({ user_id: user.id });
    if (existing.length) return Response.json({ lensman: existing[0], alreadyApplied: true });

    // One creator profile per person, matched on the contact email or on the
    // address they sign in with.
    const contacts = await base44.asServiceRole.entities.CreatorContact.list('-created_date', 500);
    const taken = contacts.some(
      (contact) =>
        String(contact.email || '').toLowerCase() === email ||
        String(contact.email || '').toLowerCase() === String(user.email || '').toLowerCase()
    );
    if (taken) return Response.json({ error: DUPLICATE_EMAIL }, { status: 409 });

    // The same rules the profile editor saves by: limits, contact protection,
    // the fixed prompt list, the tag cap.
    const { patch, errors } = buildProfilePatch(body);
    const firstError = Object.keys(errors)[0];
    if (firstError) {
      return Response.json({ error: errors[firstError], field: firstError, errors }, { status: 400 });
    }

    const displayName = (body.display_name || displayNameFrom(fullName, body.displayName)).trim();
    if (!displayName) {
      return Response.json({ error: 'A display name is required.', field: 'display_name' }, { status: 400 });
    }

    let slug = slugify(body.slug || displayName || fullName);
    const takenSlug = await base44.asServiceRole.entities.Lensman.filter({ slug });
    if (takenSlug.length) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

    const now = new Date().toISOString();
    const market = 'ELON';
    const specialties = Array.isArray(patch.specialties) ? patch.specialties : [];
    const portfolio = Array.isArray(patch.portfolio_images) ? patch.portfolio_images.filter(Boolean) : [];
    const cover = portfolio.includes(patch.cover_image) ? patch.cover_image : portfolio[0] || '';
    const years = body.years_experience === '' || body.years_experience == null ? null : Number(body.years_experience);

    const lensman = await base44.asServiceRole.entities.Lensman.create({
      user_id: user.id,
      display_name: displayName,
      slug,
      market,
      profile_headline: `Book ${displayName} safely through Stelli.`,
      profile_tagline: specialties.slice(0, 3).join(' · '),
      booking_cta: 'Request a date',
      featured_quote: '',
      profile_theme: body.profile_theme === 'clean_portfolio' ? 'clean_portfolio' : 'night_flash',
      accent_color: patch.accent_color || 'lime',
      gallery_style: GALLERIES.includes(body.gallery_style) ? body.gallery_style : 'hero_grid',
      profile_image: patch.profile_image || '',
      cover_image: cover,
      portfolio_images: portfolio,
      pinned_images: portfolio.slice(0, 3),
      one_liner: patch.one_liner || '',
      style_tags: patch.style_tags || [],
      neighborhoods: patch.neighborhoods || [],
      specialties,
      bio: patch.bio || '',
      equipment: patch.equipment || '',
      prompt_question: patch.prompt_question || '',
      prompt_answer: patch.prompt_answer || '',
      dont_shoot: patch.dont_shoot || '',
      pricing_tiers: patch.pricing_tiers || [],
      ...(Number.isFinite(years) ? { years_experience: years } : {}),
      // New profiles have no reviews yet — the UI shows "New", never fake stars.
      avg_rating: 0,
      review_count: 0,
      completed_shoots: 0,
      status: 'pending',
      age_confirmed: true,
      age_confirmed_at: now,
    });

    await base44.asServiceRole.entities.CreatorContact.create({
      lensman_id: lensman.id,
      user_id: user.id,
      full_name: fullName,
      email,
      phone: (body.phone || '').trim(),
      instagram: (body.instagram || '').replace(/^@/, '').trim(),
      admin_notes: '',
      review_note: '',
    });

    await sendEmail(
      base44,
      email,
      'Your profile is under review.',
      "We look at every creator ourselves and we'll be in touch soon. Keep building your profile in the meantime. It goes live the moment you're approved."
    );

    try {
      const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
      await Promise.all(
        admins
          .filter((admin) => admin?.email)
          .map((admin) =>
            sendEmail(
              base44,
              admin.email,
              `New creator application: ${fullName}`,
              `${fullName}\nEmail: ${email}\nPhone: ${body.phone || '—'}\nMarket: ${market}\nSigned up: ${new Date(now).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}\n\nReview them in the Base44 dashboard under Data > Lensman, with their contact details under Data > CreatorContact.`
            )
          )
      );
    } catch (error) {
      console.error('Admin application notice failed:', error.message);
    }

    return Response.json({ lensman });
  } catch (error) {
    console.error('applyAsCreator error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}