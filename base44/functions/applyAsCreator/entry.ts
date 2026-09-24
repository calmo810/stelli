import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { sendEmail } from '../../shared/notify.ts';
import { slugify, displayNameFrom } from '../../shared/creatorApplication.ts';

const DUPLICATE_EMAIL =
  "There's already a creator profile with this email. Log in to that account instead.";

/**
 * Creator signup — the only way a creator profile can be created.
 *
 * One screen: real name, contact email, phone, market and the two checkboxes.
 * The real name, email and phone go into the private CreatorContact record;
 * everything a client can see is built from the display name. The rest of the
 * profile is filled in later on Edit Profile.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please sign in to apply.' }, { status: 401 });

    const body = await req.json();
    const fullName = (body.fullName || '').trim();
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

    const displayName = displayNameFrom(fullName, body.displayName);
    let slug = slugify(body.slug || displayName || fullName);
    const takenSlug = await base44.asServiceRole.entities.Lensman.filter({ slug });
    if (takenSlug.length) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

    const now = new Date().toISOString();
    const market = body.market === 'NYC' ? 'NYC' : 'ELON';

    const lensman = await base44.asServiceRole.entities.Lensman.create({
      user_id: user.id,
      display_name: displayName,
      slug,
      market,
      profile_headline: `Book ${displayName} safely through Stelli.`,
      profile_tagline: '',
      booking_cta: 'Request a date',
      featured_quote: '',
      profile_theme: 'night_flash',
      accent_color: 'lime',
      gallery_style: 'hero_grid',
      portfolio_images: [],
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
      instagram: '',
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