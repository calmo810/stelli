import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

function slugify(value = '') {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

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

    const displayName = (body.displayName || fullName.split(' ')[0] || fullName).trim();
    let slug = slugify(body.slug || fullName);
    const taken = await base44.asServiceRole.entities.Lensman.filter({ slug });
    if (taken.length) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

    const lensman = await base44.asServiceRole.entities.Lensman.create({
      user_id: user.id,
      full_name: fullName,
      display_name: displayName,
      slug,
      market: body.market === 'ELON' ? 'ELON' : 'NYC',
      instagram: (body.instagram || '').trim(),
      bio: (body.bio || '').trim(),
      profile_headline: `Book ${displayName} through Stelli.`,
      profile_tagline: (body.specialties || []).slice(0, 3).join(' · '),
      booking_cta: 'Book through Stelli',
      gallery_style: 'hero_grid',
      neighborhoods: body.neighborhoods || [],
      specialties: body.specialties || [],
      style_tags: body.styleTags || [],
      years_experience: Number(body.yearsExperience) || 0,
      equipment: (body.equipment || '').trim(),
      portfolio_images: body.portfolioImages || [],
      profile_image: (body.portfolioImages || [])[0] || '',
      review_count: 0,
      completed_shoots: 0,
      status: 'pending',
      is_shadow_banned: false,
    });

    await base44.asServiceRole.entities.CreatorContact.create({
      lensman_id: lensman.id,
      user_id: user.id,
      email: (body.email || user.email || '').trim(),
      phone: (body.phone || '').trim(),
    });

    const docs = await base44.asServiceRole.entities.LegalDocument.list('-effective_date', 20);
    const version = type => docs.find(d => d.type === type)?.version || '2026-09-10';
    const now = new Date().toISOString();
    await Promise.all(['terms', 'privacy'].map(documentType =>
      base44.asServiceRole.entities.AgreementAcceptance.create({
        user_id: user.id,
        user_email: user.email,
        document_type: documentType,
        document_version: version(documentType),
        accepted_at: now,
        ip_address: req.headers.get('x-forwarded-for') || '',
        user_agent: req.headers.get('user-agent') || '',
      })
    ));

    return Response.json({ lensman });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
