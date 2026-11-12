/**
 * Everything the creator wizard is made of: the fixed choices it offers, its
 * step map, what an application needs, and the exact payload that gets saved
 * to the creator's profile.
 *
 * The wizard runs in two lengths. Applying is four short screens — a face and
 * a name, what you shoot, your best work, how to reach you. Everything else
 * (the words, the look, packages) is optional and opens once the application
 * is in, when the same wizard becomes the page editor.
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
/** What a creator is listed under when they pick no spots. */
export const DEFAULT_SPOT = 'Anywhere on campus';

export const SHOOTS = [
  'Portraits', 'Graduation', 'Couples', 'Events', 'Nightlife', 'Editorial',
  'Commercial', 'Music Videos', 'Product', 'Family', 'Sports', 'Headshots',
];
export const HOT_SHOOTS = { Graduation: 'big in spring', Headshots: 'career fair' };

export const TAG_IDEAS = ['natural light', 'direct flash', 'unposed', 'film', 'editorial', 'moody', 'bright & airy', 'documentary'];

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

/**
 * Every step, in order. The ones marked `apply` are the application; the rest
 * are the page, and only show once a profile exists.
 */
export const STEPS = [
  { chapter: 'You', key: 'you', apply: true, title: 'Put a face to the name.', sub: 'Clients book people. A clear, recent photo of you, and the name they should call you.' },
  { chapter: 'Your work', key: 'work', apply: true, title: 'What do you shoot?', sub: "Pick everything that applies. It's the first thing clients search." },
  { chapter: 'Your work', key: 'pf', apply: true, title: 'Show your best work.', sub: `Add at least ${MIN_SHOTS}. The first three lead your page, and the star picks your cover.` },
  { chapter: 'Contact', key: 'priv', apply: true, title: 'Just between us.', sub: 'Only Stelli sees this. Clients reach you through Stelli bookings.' },
  { chapter: 'Your style', key: 'line', optional: true, title: 'One line. Make it count.', sub: 'This sits right under your name. Add up to three style tags too.' },
  { chapter: 'Your style', key: 'bio', optional: true, title: 'How do you shoot?', sub: 'Two or three sentences on your style and what it is like to work with you.' },
  { chapter: 'Your style', key: 'kit', optional: true, title: "What's in the bag?", sub: 'Camera, lenses, lighting. Keep it short.' },
  { chapter: 'Your style', key: 'prompt', optional: true, title: 'Pick a prompt.', sub: 'A little personality goes a long way. Choose one and finish the sentence.' },
  { chapter: 'Your style', key: 'dont', optional: true, title: "What don't you shoot?", sub: 'Saying no saves you and the client a bad match.' },
  { chapter: 'The look', key: 'look', optional: true, title: 'Hang your work.', sub: 'Choose how your photos hang on your public page. Only you set this.' },
  { chapter: 'Packages', key: 'price', optional: true, title: 'Set your packages.', sub: "Rough numbers to quote from. Clients don't see these on your page. You send each one a private quote." },
];

/** The steps this person walks: the application, or the whole page. */
export const stepsFor = (existing) => (existing ? STEPS : STEPS.filter((step) => step.apply));

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
  layout: 'wall', curve: 'soft', frame: 'mat', mat: 'mixed', captions: true,
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

/**
 * What an application needs, and what a page must keep. `k` is the step each
 * one lives on. The server checks the same list (shared/creatorApplication.ts).
 */
export const REQS = [
  { t: 'A photo of you', k: 'you', ok: (s) => Boolean(s.photo) },
  { t: 'Display name', k: 'you', ok: (s) => Boolean(s.name.trim()) },
  { t: 'At least 1 shoot type', k: 'work', ok: (s) => s.what.length > 0 },
  { t: `${MIN_SHOTS}+ portfolio shots`, k: 'pf', ok: (s) => s.portfolio.length >= MIN_SHOTS },
  { t: 'Full name', k: 'priv', ok: (s) => Boolean(s.fullName.trim()) },
  { t: 'Contact email', k: 'priv', ok: (s) => validEmail(s.email) },
];

/** The optional parts that make a page stronger. */
export const EXTRAS = [
  { t: 'One-liner', k: 'line', ok: (s) => Boolean(s.oneLiner.trim()) },
  { t: 'Style tags', k: 'line', ok: (s) => s.tags.length > 0 },
  { t: 'Bio', k: 'bio', ok: (s) => Boolean(s.bio.trim()) },
  { t: 'Equipment', k: 'kit', ok: (s) => Boolean(s.equip.trim()) },
  { t: 'A prompt', k: 'prompt', ok: (s) => s.promptIdx != null && Boolean(s.promptA.trim()) },
  { t: "What you don't shoot", k: 'dont', ok: (s) => Boolean(s.dont.trim()) },
  { t: 'Packages', k: 'price', ok: (s) => activeTiers(s).length > 0 },
  { t: 'Instagram', k: 'priv', ok: (s) => Boolean(s.ig.trim()) },
];

export const missingReqs = (s) => REQS.filter((r) => !r.ok(s));
export const isReady = (s) => missingReqs(s).length === 0;
export const strength = (s) => {
  const all = [...REQS, ...EXTRAS];
  return Math.round((all.filter((r) => r.ok(s)).length / all.length) * 100);
};

/** Why this step can't be left yet, or '' when it can. */
export function stepProblem(key, s) {
  if (key === 'you') {
    if (!s.photo) return 'Add a photo of you. Clients book people.';
    if (!s.name.trim()) return 'Add a name clients can call you.';
  }
  if (key === 'work' && !s.what.length) return 'Pick at least one thing you shoot.';
  if (key === 'pf' && s.portfolio.length < MIN_SHOTS) return `Add at least ${MIN_SHOTS} of your best shots.`;
  if (key === 'price' && s.tiers.some((tier) => tier.on && tier.price && !tier.name.trim())) {
    return "Give each package you're offering a name.";
  }
  if (key === 'priv') {
    if (!s.fullName.trim()) return 'Add your full name. Only Stelli sees it.';
    if (!validEmail(s.email)) return 'Add a valid email so booking requests can reach you.';
  }
  return '';
}

/** Which step a field the server turned down lives on. */
export const FIELD_STEP = {
  profile_image: 'you', display_name: 'you', slug: 'you',
  specialties: 'work', neighborhoods: 'work',
  portfolio_images: 'pf', cover_image: 'pf',
  full_name: 'priv', email: 'priv', phone: 'priv', instagram: 'priv',
  one_liner: 'line', style_tags: 'line',
  bio: 'bio', equipment: 'kit',
  prompt_question: 'prompt', prompt_answer: 'prompt',
  dont_shoot: 'dont',
  accent_color: 'look', wall_layout: 'look', wall_curve: 'look', print_frame: 'look', print_mat: 'look',
  pricing_tiers: 'price',
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
    neighborhoods: s.where.length ? s.where : [DEFAULT_SPOT],
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
    wall_layout: s.layout,
    wall_curve: s.curve,
    print_frame: s.frame,
    print_mat: s.mat,
    show_captions: Boolean(s.captions),
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
