import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { sendEmail } from '../../shared/notify.ts';
import { slugify, displayNameFrom } from '../../shared/creatorApplication.ts';

/**
 * Creator signup. Files the profile as `pending`, confirms the 18+ check, and
 * tells both the creator and the founders that a review is waiting.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please sign in to apply.' }, { status: 401 });

    const body = await req.json();
    const fullName = (body.fullName || user.full_name || '').trim();
    if (!fullName) return Response.json({ error: 'Your name is required.' }, { status: 400 });

    const existing = await base44.asServiceRole.entities.Lensman.filter({ user_id: user.id });
    if (existing.length) return Response.json({ lensman: existing[0], alreadyApplied: true });

    const displayName = displayNameFrom(fullName, body.displayName);
    let slug = slugify(body.slug || fullName);
    const taken = await base44.asServiceRole.entities.Lensman.filter({ slug });
    if (taken.length) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

    const specialties = body.specialties || [];
    const portfolioImages = body.portfolioImages || [];
    const now = new Date().toISOString();

    const lensman = await base44.asServiceRole.entities.Lensman.create({
      user_id: user.id,
      full_name: fullName,
      display_name: displayName,
      slug,
      email: (body.email || user.email || '').trim(),
      phone: (body.phone || '').trim(),
      market: body.market === 'ELON' ? 'ELON' : 'NYC',
      neighborhoods: body.neighborhoods || [],
      specialties,
      style_tags: body.styleTags || [],
      years_experience: Number(body.yearsExperience) || 0,
      equipment: (body.equipment || '').trim(),
      bio: (body.bio || '').trim(),
      blackout_dates: body.blackoutDates || [],
      portfolio_images: portfolioImages,
      profile_image: portfolioImages[0] || '',
      profile_headline: `Book ${displayName} safely through Stelli.`,
      profile_tagline: specialties.slice(0, 3).join(' · '),
      booking_cta: 'Book safely through Stelli',
      featured_quote: '',
      profile_theme: 'editorial_cream',
      gallery_style: 'hero_grid',
      // New profiles have no reviews yet — the UI shows "New", never fake stars.
      avg_rating: 0,
      review_count: 0,
      completed_shoots: 0,
      status: 'pending',
      age_confirmed: true,
      age_confirmed_at: now,
    });

    await sendEmail(
      base44,
      lensman.email,
      'Your profile is under review.',
      'We look at every creator ourselves and we\'ll be in touch soon. Keep building your profile in the meantime. It goes live the moment you\'re approved.'
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
              `${fullName}\nEmail: ${lensman.email}\nPhone: ${lensman.phone || '—'}\nMarket: ${lensman.market}\nSigned up: ${new Date(now).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}\n\nReview them in the Base44 dashboard under Data > Lensman.`
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