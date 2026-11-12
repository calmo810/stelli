import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { sendEmail, emailAdmins } from '../../shared/notify.ts';
import { slugify, displayNameFrom, applicationProblem, validEmail } from '../../shared/creatorApplication.ts';
import { buildProfilePatch } from '../../shared/profileRules.ts';
import { SITE_ORIGIN } from '../../shared/origins.ts';

const DUPLICATE_EMAIL =
  "There's already a creator profile with this email. Log in to that account instead.";

function privateDetails(body, user) {
  return {
    fullName: String(body.full_name || body.fullName || '').trim().slice(0, 200),
    email: String(body.email || user.email || '').trim().toLowerCase().slice(0, 200),
    phone: String(body.phone || '').trim().slice(0, 200),
    instagram: String(body.instagram || '').replace(/^@/, '').trim().slice(0, 200),
  };
}

/**
 * Creator signup — the only way a creator profile can be created.
 *
 * The application is the short version of a profile: a face, a name, what
 * they shoot, at least three photos and a way to reach them. Everything is
 * checked before anything is written, so every application in the review
 * queue is one a founder can actually review. The public fields land on
 * Lensman (status pending, so nothing goes live before vetting) and the real
 * name, email, phone and handle stay in the private CreatorContact record.
 *
 * Sending it twice is safe: the second call finds the first application,
 * finishes anything the first one left undone, and says it is already in.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Please sign in to apply.' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const details = privateDetails(body, user);
    const Lensman = base44.asServiceRole.entities.Lensman;
    const CreatorContact = base44.asServiceRole.entities.CreatorContact;

    const newContact = (lensmanId) => ({
      lensman_id: lensmanId,
      user_id: user.id,
      full_name: details.fullName,
      email: details.email,
      phone: details.phone,
      instagram: details.instagram,
      admin_notes: '',
      review_note: '',
    });

    // Already applied: nothing is created twice. If an earlier attempt saved
    // the profile but not the private contact record, this one finishes it.
    const existing = await Lensman.filter({ user_id: user.id });
    if (existing.length) {
      const lensman = existing[0];
      const contacts = await CreatorContact.filter({ lensman_id: lensman.id });
      if (!contacts.length && details.fullName && validEmail(details.email)) {
        await CreatorContact.create(newContact(lensman.id));
      }
      return Response.json({ lensman, alreadyApplied: true });
    }

    // The same rules the profile editor saves by: limits, contact protection,
    // the fixed prompt list, the tag cap.
    const { patch, errors } = buildProfilePatch(body);
    const firstError = Object.keys(errors)[0];
    if (firstError) {
      return Response.json({ error: errors[firstError], field: firstError, errors }, { status: 400 });
    }

    const displayName = String(body.display_name || displayNameFrom(details.fullName, body.displayName)).trim();

    // The minimum a founder needs to make a decision.
    const problem = applicationProblem({
      fullName: details.fullName,
      email: details.email,
      displayName,
      profile: patch,
    });
    if (problem) return Response.json(problem, { status: 400 });

    // One creator profile per person, matched on the contact email or on the
    // address they sign in with.
    const contacts = await CreatorContact.list('-created_date', 500);
    const loginEmail = String(user.email || '').toLowerCase();
    const taken = contacts.some((contact) => {
      const contactEmail = String(contact.email || '').toLowerCase();
      return contactEmail && (contactEmail === details.email || contactEmail === loginEmail);
    });
    if (taken) return Response.json({ error: DUPLICATE_EMAIL, field: 'email' }, { status: 409 });

    let slug = slugify(body.slug || displayName || details.fullName) || 'creator';
    const takenSlug = await Lensman.filter({ slug });
    if (takenSlug.length) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

    const now = new Date().toISOString();
    const market = 'ELON';
    const specialties = patch.specialties;
    const portfolio = patch.portfolio_images;
    const cover = portfolio.includes(patch.cover_image) ? patch.cover_image : portfolio[0] || '';

    const lensman = await Lensman.create({
      user_id: user.id,
      display_name: displayName,
      slug,
      market,
      profile_headline: `Book ${displayName} safely through Stelli.`,
      profile_tagline: specialties.slice(0, 3).join(' · '),
      booking_cta: 'Request a date',
      featured_quote: '',
      profile_theme: patch.profile_theme || 'night_flash',
      accent_color: patch.accent_color || 'lime',
      gallery_style: patch.gallery_style || 'hero_grid',
      wall_layout: patch.wall_layout || 'wall',
      wall_curve: patch.wall_curve || 'soft',
      print_frame: patch.print_frame || 'mat',
      print_mat: patch.print_mat || 'mixed',
      show_captions: patch.show_captions ?? true,
      profile_image: patch.profile_image,
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
      ...(patch.years_experience !== undefined ? { years_experience: patch.years_experience } : {}),
      // New profiles have no reviews yet — the UI shows "New", never fake stars.
      avg_rating: 0,
      review_count: 0,
      completed_shoots: 0,
      status: 'pending',
      // Only what the applicant has actually confirmed. If they have not, the
      // creator dashboard asks before it opens.
      age_confirmed: user.age_confirmed === true,
      ...(user.age_confirmed === true ? { age_confirmed_at: now } : {}),
    });

    // The profile and its private record belong together. If the second one
    // does not save, the first is taken back, so the applicant can simply try
    // again and a founder never opens an application with nobody to contact.
    try {
      await CreatorContact.create(newContact(lensman.id));
    } catch (error) {
      console.error('applyAsCreator: contact record failed -', error.message);
      await Lensman.delete(lensman.id).catch((undo) =>
        console.error('applyAsCreator: could not take back profile', lensman.id, '-', undo.message)
      );
      return Response.json({ error: 'Your application did not send. Try again.' }, { status: 500 });
    }

    // From here the application is in. Emails never fail it (sendEmail and
    // emailAdmins swallow their own errors).
    await sendEmail(
      base44,
      details.email,
      'We got your Stelli application.',
      `We look at every creator ourselves, and you'll get an email as soon as there's a decision.\n\nWhile you wait, you can finish your page: add a bio, your kit, and choose how your photos hang. It goes live the moment you're approved.\n\n${SITE_ORIGIN}/edit-profile`
    );

    await emailAdmins(
      base44,
      `New creator application: ${details.fullName}`,
      `${details.fullName}\nEmail: ${details.email}\nPhone: ${details.phone || '—'}\nInstagram: ${details.instagram ? '@' + details.instagram : '—'}\nShoots: ${specialties.join(', ')}\nPhotos: ${portfolio.length}\nMarket: ${market}\nApplied: ${new Date(now).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}\n\nReview it in Stelli: https://getstelli.base44.app/admin → Applications. Approve & publish, ask for changes, or decline.`
    );

    return Response.json({ lensman });
  } catch (error) {
    console.error('applyAsCreator error:', error.message);
    return Response.json({ error: 'Your application did not send. Try again.' }, { status: 500 });
  }
}
