/**
 * The creator profile, in one place.
 *
 * The profile wizard, the public page, the browse cards and the creator's own
 * portal all read and write the same record, so they all go through this
 * module: the fixed choices a creator picks from, the limits on each field,
 * the profile link, the wizard's form shape and how it maps to and from the
 * saved record, and what "finished" means.
 *
 * Mirrors base44/shared/profileRules.ts. The server remains the authority.
 */
import { hasContactDetails } from './contactGuard.js';

export const MARKET = 'ELON';
export const MARKET_LABEL = 'Elon';
export const MIN_SHOTS = 3;
export const MAX_SHOTS = 12;

/** Same ceilings the server enforces, so the form never accepts what a save rejects. */
export const LIMITS = {
  display_name: 40,
  one_liner: 90,
  bio: 400,
  equipment: 400,
  prompt_answer: 200,
  dont_shoot: 140,
  tag: 24,
  tags: 3,
  tier_name: 28,
  tier_includes: 60,
};

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

/** The prompts offered today. */
export const PROMPTS = [
  'My dream shoot is…',
  'Clients always tell me…',
  'My style in three words…',
  "The shot I'm proudest of…",
  'You should book me if…',
];

/** Prompts from the earlier editor. No longer offered, but a profile that has one keeps it. */
export const LEGACY_PROMPTS = [
  'Best photo I ever took was…',
  "Don't book me if…",
  "The shot I'm always chasing…",
  "You'll know it's my photo because…",
  'I got into this because…',
  'Worst shoot I ever survived…',
];

/** The prompts to show for a profile: today's list, plus its own older one if it has one. */
export function promptOptions(current) {
  return current && LEGACY_PROMPTS.includes(current) ? [current, ...PROMPTS] : PROMPTS;
}

export const DURATIONS = ['30 min', '45 min', '1 hr', '1.5 hr', '2 hr', '3 hr', 'Half day'];
export const TIER_LEVELS = [{ k: 'low', label: 'Low' }, { k: 'mid', label: 'Mid' }, { k: 'high', label: 'High' }];

/* ---------- how the work hangs ---------- */

export const LAYOUTS = [
  { v: 'wall', l: 'Wall' },
  { v: 'strip', l: 'Strip' },
  { v: 'grid', l: 'Grid' },
];
export const CURVES = [
  { v: 'flat', l: 'Flat' },
  { v: 'soft', l: 'Soft' },
  { v: 'full', l: 'Full' },
];
export const FRAMES = [
  { v: 'mat', l: 'Mat' },
  { v: 'bleed', l: 'Full bleed' },
];
export const MATS = [
  { v: 'mixed', l: 'Mixed', sw: 'conic-gradient(#cfe6fb 0 25%, #fbdde4 0 50%, #e2defa 0 75%, #dcf5dc 0)' },
  { v: 'paper', l: 'Paper', sw: '#f2f1ec' },
  { v: 'sky', l: 'Sky', sw: '#cfe6fb' },
  { v: 'blush', l: 'Blush', sw: '#fbdde4' },
  { v: 'lilac', l: 'Lilac', sw: '#e2defa' },
  { v: 'mint', l: 'Mint', sw: '#dcf5dc' },
  { v: 'ink', l: 'Ink', sw: '#1b2238' },
];
export const ACCENTS = [
  { v: 'lime', l: 'Lime', sw: '#C4F82A', token: '--neon-lime' },
  { v: 'cyan', l: 'Cyan', sw: '#2AE8F8', token: '--neon-cyan' },
  { v: 'magenta', l: 'Magenta', sw: '#F82AC4', token: '--neon-magenta' },
];

const labelOf = (options, value) => options.find((option) => option.v === value)?.l || '';

export function accentColor(accent) {
  const found = ACCENTS.find((a) => a.v === accent) || ACCENTS[0];
  return `hsl(var(${found.token}))`;
}

/** How the creator chose to hang their work. Clients only ever see the result. */
export function displaySettings(creator) {
  return {
    layout: LAYOUTS.some((o) => o.v === creator?.wall_layout) ? creator.wall_layout : 'wall',
    curve: CURVES.some((o) => o.v === creator?.wall_curve) ? creator.wall_curve : 'soft',
    frame: creator?.print_frame === 'bleed' ? 'bleed' : 'mat',
    mat: MATS.some((o) => o.v === creator?.print_mat) ? creator.print_mat : 'mixed',
    captions: creator?.show_captions !== false,
  };
}

/** "Wall · Mat · Lime": the look in words, for the portal and the review list. */
export function lookSummary(creator) {
  const settings = displaySettings(creator);
  const accent = ACCENTS.find((a) => a.v === creator?.accent_color) || ACCENTS[0];
  return [labelOf(LAYOUTS, settings.layout), labelOf(FRAMES, settings.frame), accent.l].join(' · ');
}

/* ---------- names and captions ---------- */

/** The only name a client ever sees. Never the real name. */
export function displayNameOf(creator) {
  return String(creator?.display_name || '').trim() || 'Stelli creator';
}

export function firstNameOf(creator) {
  return displayNameOf(creator).split(' ')[0];
}

/** "Emily Novak" → "E. Novak", for the small print captions. */
function captionName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return parts[0] || 'Stelli';
  return `${parts[0][0]}. ${parts[parts.length - 1]}`;
}

/** Caption for print i: a plate number, never an invented title. */
export function printLabel(name) {
  const short = captionName(name);
  return (i) => ({ title: `No. ${String(i + 1).padStart(2, '0')}`, meta: `${short} · ${MARKET_LABEL}` });
}

/** Pinned three first, then the rest of the gallery with nothing repeating. */
export function galleryComposition(creator) {
  const all = (creator?.portfolio_images || []).filter(Boolean);
  const stored = (creator?.pinned_images || []).filter((url) => all.includes(url)).slice(0, 3);
  const pinned = stored.length ? stored : all.slice(0, 3);
  const rest = all.filter((url) => !pinned.includes(url));
  return { pinned, rest, all };
}

/* ---------- the profile link ---------- */

const SITE_ORIGIN = 'https://getstelli.com';
const LIVE_HOSTS = ['getstelli.com', 'www.getstelli.com', 'getstelli.base44.app'];
const SHARE_HOST = 'https://getstelli.base44.app';

export const slugify = (value) =>
  String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * Where profile links point. On the live site that is always getstelli.com;
 * anywhere else (a preview, a local run) it is wherever the app is open, so
 * the link still works there.
 */
function linkOrigin() {
  if (typeof window === 'undefined') return SITE_ORIGIN;
  return LIVE_HOSTS.includes(window.location.hostname) ? SITE_ORIGIN : window.location.origin;
}

/** The in-app route to a creator's page. */
export function profilePath(creator) {
  return `/creators/${creator?.slug || creator?.id || ''}`;
}

/** The address a creator puts in their bio: one format, everywhere it is shown or copied. */
export function profileUrl(creator) {
  return `${linkOrigin()}/creators/${creator?.slug || creator?.id || 'you'}`;
}

/** "getstelli.com/creators/", the part of every profile link that never changes. */
export function profileUrlPrefix() {
  return `${linkOrigin()}/creators/`.replace(/^https?:\/\//, '');
}

/** The same address without the https://, for showing on screen. */
export function profileUrlLabel(creator) {
  return profileUrl(creator).replace(/^https?:\/\//, '');
}

/**
 * The address for a share sheet. Social apps never run the page's code, so
 * this one answers with the creator's preview card and sends people on to the
 * profile. Needs a saved profile; without one it is just the profile address.
 */
export function sharePreviewUrl(creator) {
  return creator?.id ? `${SHARE_HOST}/functions/shareProfile?id=${creator.id}` : profileUrl(creator);
}

/* ---------- the wizard's form ---------- */

export const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || '').trim());

export const defaultTiers = () => [
  { on: true, name: 'Quick Session', price: '', duration: '30 min', includes: '' },
  { on: true, name: 'Standard', price: '', duration: '1 hr', includes: '' },
  { on: true, name: 'Full Shoot', price: '', duration: '2 hr', includes: '' },
];

export const freshForm = () => ({
  photo: null, name: '', slug: '',
  oneLiner: '', tags: [], where: [], what: [],
  portfolio: [], cover: 0,
  tiers: defaultTiers(),
  bio: '', equip: '', years: '', prompt: '', promptA: '', dont: '',
  theme: 'night', accent: 'lime', gallery: 'hero',
  layout: 'wall', curve: 'soft', frame: 'mat', mat: 'mixed', captions: true,
  fullName: '', email: '', phone: '', ig: '',
});

/** A draft saved by an earlier version of the wizard, brought up to today's shape. */
export function normalizeForm(saved) {
  const base = freshForm();
  if (!saved || typeof saved !== 'object') return base;
  const form = { ...base, ...saved };
  // Drafts used to store the prompt as a position in the list.
  if (!form.prompt && Number.isInteger(saved.promptIdx)) form.prompt = PROMPTS[saved.promptIdx] || '';
  delete form.promptIdx;
  if (!Array.isArray(form.tiers) || form.tiers.length !== 3) form.tiers = defaultTiers();
  for (const key of ['tags', 'where', 'what', 'portfolio']) {
    if (!Array.isArray(form[key])) form[key] = [];
  }
  form.cover = Math.max(0, Math.min(Number(form.cover) || 0, Math.max(0, form.portfolio.length - 1)));
  return form;
}

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

const THEME_TO_FORM = { clean_portfolio: 'clean', night_flash: 'night' };
const THEME_TO_RECORD = { clean: 'clean_portfolio', night: 'night_flash' };
const GALLERY_TO_FORM = { hero_grid: 'hero', ordered_grid: 'ordered', contact_sheet: 'contact' };
const GALLERY_TO_RECORD = { hero: 'hero_grid', ordered: 'ordered_grid', contact: 'contact_sheet' };

/** Turns a saved creator profile (and its private contact record) into wizard state. */
export function profileToForm(lensman, contact = null, user = null) {
  const base = freshForm();
  if (!lensman) return { ...base, email: user?.email || '' };
  const portfolio = (lensman.portfolio_images || []).filter(Boolean).map((src) => ({ src }));
  const coverIdx = portfolio.findIndex((item) => item.src === lensman.cover_image);
  const saved = Array.isArray(lensman.pricing_tiers) ? lensman.pricing_tiers : [];
  const tiers = base.tiers.map((tier, i) => {
    const match = saved.find((entry) => entry?.tier === TIER_LEVELS[i].k);
    // A profile that already has packages only offers the ones it saved.
    if (!match) return saved.length ? { ...tier, on: false } : tier;
    return {
      on: Number(match.price) > 0,
      name: match.name || tier.name,
      price: match.price ? String(match.price) : '',
      duration: match.duration || tier.duration,
      includes: match.includes || '',
    };
  });
  const settings = displaySettings(lensman);
  return {
    ...base,
    photo: lensman.profile_image || null,
    name: lensman.display_name || '',
    slug: lensman.slug || '',
    oneLiner: lensman.one_liner || '',
    tags: lensman.style_tags || [],
    where: lensman.neighborhoods || [],
    what: lensman.specialties || [],
    portfolio,
    cover: coverIdx < 0 ? 0 : coverIdx,
    tiers,
    bio: lensman.bio || '',
    equip: lensman.equipment || '',
    years: lensman.years_experience != null ? String(lensman.years_experience) : '',
    prompt: lensman.prompt_question || '',
    promptA: lensman.prompt_answer || '',
    dont: lensman.dont_shoot || '',
    theme: THEME_TO_FORM[lensman.profile_theme] || 'night',
    accent: ACCENTS.some((a) => a.v === lensman.accent_color) ? lensman.accent_color : 'lime',
    gallery: GALLERY_TO_FORM[lensman.gallery_style] || 'hero',
    layout: settings.layout,
    curve: settings.curve,
    frame: settings.frame,
    mat: settings.mat,
    captions: settings.captions,
    fullName: contact?.full_name || '',
    email: contact?.email || user?.email || '',
    phone: contact?.phone || '',
    ig: contact?.instagram || '',
  };
}

/** The public half of the form, shaped like a saved profile. */
function publicFields(s) {
  const ordered = orderedPortfolio(s);
  const hasPrompt = Boolean(s.prompt && s.promptA.trim());
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
    // An answer with no prompt (or the other way round) is not saved as half a pair.
    prompt_question: hasPrompt ? s.prompt : '',
    prompt_answer: hasPrompt ? s.promptA.trim() : '',
    dont_shoot: s.dont.trim(),
    profile_theme: THEME_TO_RECORD[s.theme] || 'night_flash',
    accent_color: s.accent,
    gallery_style: GALLERY_TO_RECORD[s.gallery] || 'hero_grid',
    wall_layout: s.layout,
    wall_curve: s.curve,
    print_frame: s.frame,
    print_mat: s.mat,
    show_captions: Boolean(s.captions),
  };
}

/** The exact shape the profile save expects. */
export function formToPayload(s) {
  return {
    ...publicFields(s),
    // Sent as a number, or as null to clear it.
    years_experience: s.years ? Number(s.years) : null,
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

/**
 * The form as a profile record, for the live preview. The preview draws the
 * very same component as the public page, so what a creator sees while
 * building is what a client sees afterwards. `saved` carries the things the
 * form does not own (reviews, shoot counts) for a profile that already exists.
 */
export function formToProfile(s, saved = null) {
  return {
    avg_rating: 0,
    review_count: 0,
    completed_shoots: 0,
    ...(saved || {}),
    ...publicFields(s),
    years_experience: s.years ? Number(s.years) : undefined,
    booking_cta: 'Request a date',
  };
}

/** The form's place in each server-validated field, so a rejected save can point at its step. */
export const FIELD_STEP = {
  display_name: 'name',
  slug: 'name',
  one_liner: 'line',
  style_tags: 'line',
  neighborhoods: 'where',
  specialties: 'what',
  portfolio_images: 'pf',
  profile_image: 'photo',
  pricing_tiers: 'price',
  bio: 'bio',
  equipment: 'kit',
  prompt_question: 'prompt',
  prompt_answer: 'prompt',
  dont_shoot: 'dont',
  accent_color: 'look',
  wall_layout: 'look',
  wall_curve: 'look',
  print_frame: 'look',
  print_mat: 'look',
  full_name: 'priv',
  email: 'priv',
  phone: 'priv',
  instagram: 'priv',
};

/* ---------- what "finished" means ---------- */

export const REQS = [
  { t: 'Profile photo', k: 'photo', ok: (s) => Boolean(s.photo) },
  { t: 'Display name', k: 'name', ok: (s) => Boolean(s.name.trim()) },
  { t: 'At least 1 spot', k: 'where', ok: (s) => s.where.length > 0 },
  { t: 'At least 1 shoot type', k: 'what', ok: (s) => s.what.length > 0 },
  { t: `${MIN_SHOTS}+ portfolio shots`, k: 'pf', ok: (s) => s.portfolio.length >= MIN_SHOTS },
  { t: '1 priced package', k: 'price', ok: (s) => activeTiers(s).length > 0 },
  { t: 'Your name and email', k: 'priv', ok: (s) => Boolean(s.fullName.trim()) && validEmail(s.email) },
];

export const EXTRAS = [
  { t: 'One-liner', k: 'line', ok: (s) => Boolean(s.oneLiner.trim()) },
  { t: 'Style tags', k: 'line', ok: (s) => s.tags.length > 0 },
  { t: 'Bio', k: 'bio', ok: (s) => Boolean(s.bio.trim()) },
  { t: 'Equipment', k: 'kit', ok: (s) => Boolean(s.equip.trim()) },
  { t: 'A prompt', k: 'prompt', ok: (s) => Boolean(s.prompt && s.promptA.trim()) },
  { t: "What you don't shoot", k: 'dont', ok: (s) => Boolean(s.dont.trim()) },
  { t: 'Instagram', k: 'priv', ok: (s) => Boolean(s.ig.trim()) },
];

/**
 * The priced package is asked for once, when someone applies. A page that is
 * already live has to be able to fix its photos and words without one, so it
 * drops out of the list for an existing profile.
 */
export const applicableReqs = (s, existing) => (existing ? REQS.filter((r) => r.k !== 'price') : REQS);
export const missingReqs = (s, existing = false) => applicableReqs(s, existing).filter((r) => !r.ok(s));
export const strength = (s) => {
  const all = [...REQS, ...EXTRAS];
  return Math.round((all.filter((r) => r.ok(s)).length / all.length) * 100);
};

/** The wizard steps whose public text carries contact details, checked the way the server checks them. */
export function contactProblems(s) {
  return [
    ['line', s.oneLiner],
    ['bio', s.bio],
    ['prompt', s.promptA],
    ['dont', s.dont],
  ]
    .filter(([, value]) => hasContactDetails(value))
    .map(([key]) => key);
}

/**
 * The creator portal's "finish your storefront" list, read from a saved
 * profile with the same rules the wizard publishes by. Each line carries the
 * wizard step that fixes it.
 */
export function storefrontChecklist(lensman, contact = null) {
  const s = profileToForm(lensman, contact);
  const count = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
  const tiers = activeTiers(s);
  return [
    {
      label: 'Photos',
      step: 'pf',
      done: s.portfolio.length >= MIN_SHOTS,
      value: `${count(s.portfolio.length, 'photo')} up`,
      hint: s.portfolio.length ? `Add ${MIN_SHOTS - s.portfolio.length} more to reach ${MIN_SHOTS}` : 'Add the work you want to be booked for',
    },
    {
      label: 'Profile photo',
      step: 'photo',
      done: Boolean(s.photo),
      value: 'Added',
      hint: 'Clients book people. Add a photo of you',
    },
    {
      label: 'About you',
      step: 'bio',
      done: Boolean(s.bio.trim()),
      value: 'Written',
      hint: 'A short line on how you shoot',
    },
    {
      label: 'Packages',
      step: 'price',
      done: tiers.length > 0,
      value: count(tiers.length, 'package'),
      hint: 'Give clients a place to start',
    },
    {
      label: 'Where you shoot',
      step: 'where',
      done: s.where.length > 0,
      value: s.where.join(', '),
      hint: 'Campus spots you work',
    },
  ];
}
