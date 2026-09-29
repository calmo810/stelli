/**
 * Everything the creator profile wizard is made of: the fixed choices it
 * offers, its step map, the publish checklist, and the exact payload that
 * gets saved to the creator's profile.
 */

export const MARKET = 'ELON';
export const MIN_SHOTS = 3;
export const MAX_SHOTS = 12;

export const SPOTS = [
  'Fonville Fountain', 'Alamance Building', 'Scott Plaza', 'Under the Oaks', 'Lake Mary Nell',
  'Lake Verona', 'Young Commons', 'Chandler Fountain', 'The Colonnades', 'Historic Neighborhood',
  'Belk Library', 'Schar Center', 'Anywhere on campus', 'Off campus',
];
export const HOT_SPOTS = { 'Fonville Fountain': 'popular', 'Under the Oaks': 'popular' };

export const SHOOTS = [
  'Portraits', 'Graduation', 'Couples', 'Events', 'Nightlife', 'Editorial',
  'Commercial', 'Music Videos', 'Product', 'Family', 'Sports', 'Headshots',
];
export const HOT_SHOOTS = { Graduation: 'big in spring', Headshots: 'career fair' };

export const TAG_IDEAS = ['golden hour', 'direct flash', 'candid', 'film', 'editorial', 'moody', 'bright & airy', 'documentary'];

/** The prompts a creator can answer. The server accepts exactly these. */
export const PROMPTS = [
  'My dream shoot is…',
  'Clients always tell me…',
  'My style in three words…',
  "The shot I'm proudest of…",
  'You should book me if…',
];

export const DURATIONS = ['30 min', '45 min', '1 hr', '1.5 hr', '2 hr', '3 hr', 'Half day'];
export const TIER_LEVELS = [{ k: 'low', label: 'Low' }, { k: 'mid', label: 'Mid' }, { k: 'high', label: 'High' }];

/** Faded placeholder frames, shown in the preview until real photos land. */
export const PH = [
  'linear-gradient(135deg,#2b3350,#141a2c)', 'linear-gradient(135deg,#41305a,#1a1430)',
  'linear-gradient(135deg,#1f4a4e,#0e2126)', 'linear-gradient(135deg,#4e3a22,#211609)',
  'linear-gradient(135deg,#24405f,#0d1826)', 'linear-gradient(135deg,#4a2440,#1c0d1a)',
];

export const CHAPTERS = ['You', 'Your Work', 'Pricing', 'Your Style', 'The Look', 'Private'];

export const STEPS = [
  { ch: 0, key: 'photo', title: 'Put a face to the flash.', sub: 'Clients book people. A clear, recent photo of you — not your best landscape.', need: true },
  { ch: 0, key: 'name', title: 'What should clients call you?', sub: 'First name is fine. Your profile link updates as you type.', required: true },
  { ch: 0, key: 'line', title: 'One line. Make it count.', sub: 'This sits right under your name. Add up to three style tags too.', optional: true },
  { ch: 1, key: 'where', title: 'Where do you like to shoot?', sub: "Tap every campus spot you're up for. Clients filter by this.", required: true },
  { ch: 1, key: 'what', title: 'What do you shoot?', sub: "Pick everything that applies — it's the first thing clients search.", required: true },
  { ch: 1, key: 'pf', title: 'Show your best work.', sub: `Add at least ${MIN_SHOTS}. The first three lead your page, and the star picks your cover.`, need: true },
  { ch: 2, key: 'price', title: 'Set your packages.', sub: 'Three tiers so clients can pick what fits. Rough numbers are fine — you can change these anytime.', need: true },
  { ch: 3, key: 'bio', title: 'How do you shoot?', sub: 'Two or three sentences on your style and what it is like to work with you.', optional: true },
  { ch: 3, key: 'kit', title: "What's in the bag?", sub: 'Camera, lenses, lighting. Keep it short.', optional: true },
  { ch: 3, key: 'prompt', title: 'Pick a prompt.', sub: 'A little personality goes a long way. Choose one and finish the sentence.', optional: true },
  { ch: 3, key: 'dont', title: "What don't you shoot?", sub: 'Saying no saves you and the client a bad match.', optional: true },
  { ch: 4, key: 'look', title: 'Choose your look.', sub: 'This re-skins your whole public page. Watch the preview as you tap.' },
  { ch: 5, key: 'priv', title: 'Just between us.', sub: 'Only Stelli sees this. Clients get in touch through Stelli bookings.', required: true },
];

export const stepIdx = (key) => STEPS.findIndex((s) => s.key === key);

/** Starter styles: they fill the creator's own fields, which they then rewrite. */
export const STARTERS = [
  {
    key: 'flash', name: 'Night Flash', color: '#d6f344',
    art: 'radial-gradient(circle at 30% 40%,#d6f34455,transparent 55%),radial-gradient(circle at 80% 70%,#4fd8e033,transparent 50%),#10141f',
    tags: ['direct flash', 'nightlife', 'candid'], oneLiner: "Flash on, hands up, we'll fix it in the blur.",
    theme: 'night', accent: 'lime', gallery: 'hero', what: ['Nightlife', 'Events', 'Portraits'],
    bio: 'I shoot mostly at night and keep it relaxed. Show up, be yourself, I\'ll handle the rest.',
    promptIdx: 4, promptA: 'you want photos that look like the night actually felt.', dont: 'No weddings or newborns.',
  },
  {
    key: 'golden', name: 'Golden Hour', color: '#4fd8e0',
    art: 'radial-gradient(circle at 70% 30%,#f5c26b55,transparent 55%),radial-gradient(circle at 20% 80%,#4fd8e033,transparent 50%),#f6f6f2',
    tags: ['golden hour', 'candid', 'bright & airy'], oneLiner: 'Golden hour believer. Your mom will cry (good tears).',
    theme: 'clean', accent: 'cyan', gallery: 'ordered', what: ['Graduation', 'Couples', 'Portraits'],
    bio: 'Warm, easy sessions built around real moments. I direct just enough that you never feel stiff.',
    promptIdx: 1, promptA: 'the photos felt like us, not a photoshoot.', dont: 'No late-night events.',
  },
  {
    key: 'film', name: 'Film Editorial', color: '#e356c4',
    art: 'radial-gradient(circle at 25% 30%,#e356c455,transparent 55%),radial-gradient(circle at 80% 80%,#7b3ff244,transparent 50%),#10141f',
    tags: ['film', 'editorial', 'moody'], oneLiner: 'Film first. Digital when the brief calls for it.',
    theme: 'night', accent: 'magenta', gallery: 'contact', what: ['Editorial', 'Music Videos', 'Commercial'],
    bio: 'Editorial eye, run-and-gun energy. I plan the shot list so your shoot day is pure execution.',
    promptIdx: 0, promptA: 'a rooftop at blue hour with a smoke machine.', dont: 'Nothing corporate-stiff.',
  },
];

export const defaultTiers = () => [
  { on: true, name: 'Quick Session', price: '', duration: '30 min', includes: '' },
  { on: true, name: 'Standard', price: '', duration: '1 hr', includes: '' },
  { on: true, name: 'Full Shoot', price: '', duration: '2 hr', includes: '' },
];

export const freshState = () => ({
  photo: null, name: '', slug: '',
  oneLiner: '', tags: [], where: [], what: [],
  portfolio: [], cover: 0,
  tiers: defaultTiers(),
  bio: '', equip: '', years: '', promptIdx: null, promptA: '', dont: '',
  theme: 'night', accent: 'lime', gallery: 'hero',
  fullName: '', email: '', phone: '', ig: '',
});

export const slugify = (value) =>
  String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || '').trim());

export const hasContent = (s) =>
  Boolean(s.name || s.oneLiner || s.tags.length || s.bio || s.what.length || s.where.length || s.photo || s.portfolio.length);

export const activeTiers = (s) =>
  s.tiers
    .map((tier, i) => ({ ...tier, level: TIER_LEVELS[i].k }))
    .filter((tier) => tier.on && Number(tier.price) > 0);

/** Cover first, then the rest in the creator's order. */
export const orderedPortfolio = (s) => {
  if (!s.portfolio.length) return [];
  const cover = s.portfolio[Math.min(s.cover, s.portfolio.length - 1)];
  return [cover, ...s.portfolio.filter((item) => item !== cover)];
};

export const REQS = [
  { t: 'Profile photo', k: 'photo', ok: (s) => Boolean(s.photo) },
  { t: 'Display name', k: 'name', ok: (s) => Boolean(s.name.trim()) },
  { t: 'At least 1 spot', k: 'where', ok: (s) => s.where.length > 0 },
  { t: 'At least 1 shoot type', k: 'what', ok: (s) => s.what.length > 0 },
  { t: `${MIN_SHOTS}+ portfolio shots`, k: 'pf', ok: (s) => s.portfolio.length >= MIN_SHOTS },
  { t: '1 priced package', k: 'price', ok: (s) => activeTiers(s).length > 0 },
  { t: 'Contact email', k: 'priv', ok: (s) => validEmail(s.email) },
];

export const EXTRAS = [
  { t: 'One-liner', k: 'line', ok: (s) => Boolean(s.oneLiner.trim()) },
  { t: 'Style tags', k: 'line', ok: (s) => s.tags.length > 0 },
  { t: 'Bio', k: 'bio', ok: (s) => Boolean(s.bio.trim()) },
  { t: 'Equipment', k: 'kit', ok: (s) => Boolean(s.equip.trim()) },
  { t: 'A prompt', k: 'prompt', ok: (s) => s.promptIdx != null && Boolean(s.promptA.trim()) },
  { t: "What you don't shoot", k: 'dont', ok: (s) => Boolean(s.dont.trim()) },
  { t: 'Instagram', k: 'priv', ok: (s) => Boolean(s.ig.trim()) },
];

export const missingReqs = (s) => REQS.filter((r) => !r.ok(s));
export const isReady = (s) => missingReqs(s).length === 0;
export const strength = (s) => {
  const all = [...REQS, ...EXTRAS];
  return Math.round((all.filter((r) => r.ok(s)).length / all.length) * 100);
};

export const shareUrl = (slug) => `${window.location.origin}/creators/${slug || 'you'}`;
export const shareLabel = (slug) => `${window.location.host}/creators/${slug || 'you'}`;

/** The exact shape the profile save expects. */
export function buildPayload(s) {
  const ordered = orderedPortfolio(s);
  return {
    display_name: s.name.trim(),
    slug: s.slug,
    market: MARKET,
    profile_image: s.photo || '',
    cover_image: ordered[0]?.src || '',
    portfolio_images: ordered.map((item) => item.src).filter(Boolean),
    one_liner: s.oneLiner.trim(),
    style_tags: s.tags,
    neighborhoods: s.where,
    specialties: s.what,
    bio: s.bio.trim(),
    equipment: s.equip.trim(),
    years_experience: s.years ? Number(s.years) : undefined,
    prompt_question: s.promptIdx != null ? PROMPTS[s.promptIdx] : '',
    prompt_answer: s.promptA.trim(),
    dont_shoot: s.dont.trim(),
    profile_theme: s.theme === 'clean' ? 'clean_portfolio' : 'night_flash',
    accent_color: s.accent,
    gallery_style: { hero: 'hero_grid', ordered: 'ordered_grid', contact: 'contact_sheet' }[s.gallery],
    pricing_tiers: activeTiers(s).map((tier) => ({
      tier: tier.level,
      name: tier.name.trim(),
      price: Number(tier.price),
      duration: tier.duration,
      includes: tier.includes.trim(),
    })),
    full_name: s.fullName.trim(),
    email: s.email.trim(),
    phone: s.phone.trim(),
    instagram: s.ig.trim(),
  };
}