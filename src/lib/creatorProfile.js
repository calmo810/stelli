/**
 * The creator profile, as a form.
 *
 * One model, used in two places. The application walks four of its sections
 * in a row and sends them together; the portal opens any one section on its
 * own and saves just that. Each section knows three things about itself: what
 * it is called, what would stop it being saved, and the exact fields it sends.
 * Nothing here touches the browser, so the same rules run in tests.
 *
 * The server holds the authority for all of it (base44/shared/profileRules.ts
 * and creatorApplication.ts); this mirrors those rules for instant feedback.
 */

export const MARKET = 'ELON';
export const MIN_SHOTS = 3;
export const MAX_SHOTS = 12;

export const SPOTS = [
  'Fonville Fountain', 'Alamance Building', 'Scott Plaza', 'Under the Oaks', 'Lake Mary Nell',
  'Lake Verona', 'Young Commons', 'Chandler Fountain', 'The Colonnades', 'Historic Neighborhood',
  'Belk Library', 'Schar Center', 'Anywhere on campus', 'Off campus',
];
/** What a creator is listed under when they pick no spots. */
export const DEFAULT_SPOT = 'Anywhere on campus';

export const SHOOTS = [
  'Portraits', 'Graduation', 'Couples', 'Events', 'Nightlife', 'Editorial',
  'Commercial', 'Music Videos', 'Product', 'Family', 'Sports', 'Headshots',
];

export const TAG_IDEAS = ['natural light', 'direct flash', 'unposed', 'film', 'editorial', 'moody', 'bright & airy', 'documentary'];
export const MAX_TAGS = 3;

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

export const LIMITS = { name: 40, oneLiner: 90, bio: 400, promptA: 200, dont: 140, equip: 400 };

export const LOOK_OPTIONS = {
  layout: [{ v: 'wall', l: 'Wall' }, { v: 'strip', l: 'Strip' }, { v: 'grid', l: 'Grid' }],
  curve: [{ v: 'flat', l: 'Flat' }, { v: 'soft', l: 'Soft' }, { v: 'full', l: 'Full' }],
  frame: [{ v: 'mat', l: 'Mat' }, { v: 'bleed', l: 'Full bleed' }],
  mat: [
    { v: 'mixed', l: 'Mixed', sw: 'conic-gradient(#cfe6fb 0 25%, #fbdde4 0 50%, #e2defa 0 75%, #dcf5dc 0)' },
    { v: 'paper', l: 'Paper', sw: '#f2f1ec' },
    { v: 'sky', l: 'Sky', sw: '#cfe6fb' },
    { v: 'blush', l: 'Blush', sw: '#fbdde4' },
    { v: 'lilac', l: 'Lilac', sw: '#e2defa' },
    { v: 'mint', l: 'Mint', sw: '#dcf5dc' },
    { v: 'ink', l: 'Ink', sw: '#1b2238' },
  ],
  accent: [
    { v: 'lime', l: 'Lime', sw: '#C4F82A' },
    { v: 'cyan', l: 'Cyan', sw: '#2AE8F8' },
    { v: 'magenta', l: 'Magenta', sw: '#F82AC4' },
  ],
  captions: [{ v: true, l: 'On' }, { v: false, l: 'Off' }],
};

export const defaultTiers = () => [
  { on: true, name: 'Quick Session', price: '', duration: '30 min', includes: '' },
  { on: true, name: 'Standard', price: '', duration: '1 hr', includes: '' },
  { on: true, name: 'Full Shoot', price: '', duration: '2 hr', includes: '' },
];

export const emptyForm = () => ({
  photo: null, name: '',
  what: [], where: [],
  portfolio: [], cover: 0,
  fullName: '', email: '', phone: '', ig: '',
  oneLiner: '', tags: [], bio: '', equip: '', years: '', promptIdx: null, promptA: '', dont: '',
  accent: 'lime', layout: 'wall', curve: 'soft', frame: 'mat', mat: 'mixed', captions: true,
  tiers: defaultTiers(),
});

export const slugify = (value) =>
  String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || '').trim());

/** True once someone has put anything of their own into the form. */
export const hasContent = (f) =>
  Boolean(f.photo || f.name || f.what.length || f.where.length || f.portfolio.length || f.bio || f.oneLiner);

export const activeTiers = (f) =>
  f.tiers
    .map((tier, i) => ({ ...tier, level: TIER_LEVELS[i].k }))
    .filter((tier) => tier.on && Number(tier.price) > 0);

/** Cover first, then the rest in the creator's order. */
export const orderedPortfolio = (f) => {
  if (!f.portfolio.length) return [];
  const cover = f.portfolio[Math.min(f.cover, f.portfolio.length - 1)];
  return [cover, ...f.portfolio.filter((item) => item !== cover)];
};

/** A saved draft (from any earlier version of the form), made safe to load. */
export function formFromDraft(draft, user) {
  const base = emptyForm();
  const form = { ...base };
  for (const key of Object.keys(base)) {
    if (draft && draft[key] !== undefined && draft[key] !== null) form[key] = draft[key];
  }
  for (const key of ['tags', 'where', 'what', 'portfolio']) {
    if (!Array.isArray(form[key])) form[key] = base[key];
  }
  form.portfolio = form.portfolio.filter((item) => item && item.src).slice(0, MAX_SHOTS);
  form.cover = Number.isInteger(form.cover) && form.cover < form.portfolio.length ? form.cover : 0;
  form.tiers = Array.isArray(form.tiers) && form.tiers.length === 3 ? form.tiers : base.tiers;
  form.fullName = form.fullName || user?.full_name || '';
  form.email = form.email || user?.email || '';
  return form;
}

/** A saved profile and its private contact record, as the form. */
export function formFromProfile(lensman, contact, user) {
  const base = emptyForm();
  if (!lensman) return formFromDraft({}, user);
  const portfolio = (lensman.portfolio_images || []).filter(Boolean).map((src) => ({ src }));
  const coverIdx = portfolio.findIndex((item) => item.src === lensman.cover_image);
  const saved = Array.isArray(lensman.pricing_tiers) ? lensman.pricing_tiers : [];
  const tiers = base.tiers.map((tier, i) => {
    const match = saved.find((entry) => entry?.tier === TIER_LEVELS[i].k);
    if (!match) return { ...tier, on: saved.length === 0 };
    return {
      on: Number(match.price) > 0,
      name: match.name || tier.name,
      price: match.price ? String(match.price) : '',
      duration: match.duration || tier.duration,
      includes: match.includes || '',
    };
  });
  const promptIdx = PROMPTS.indexOf(lensman.prompt_question);
  return {
    ...base,
    photo: lensman.profile_image || null,
    name: lensman.display_name || '',
    what: lensman.specialties || [],
    where: lensman.neighborhoods || [],
    portfolio,
    cover: coverIdx < 0 ? 0 : coverIdx,
    fullName: contact?.full_name || user?.full_name || '',
    email: contact?.email || user?.email || '',
    phone: contact?.phone || '',
    ig: contact?.instagram || '',
    oneLiner: lensman.one_liner || '',
    tags: lensman.style_tags || [],
    bio: lensman.bio || '',
    equip: lensman.equipment || '',
    years: lensman.years_experience != null ? String(lensman.years_experience) : '',
    promptIdx: promptIdx < 0 ? null : promptIdx,
    promptA: lensman.prompt_answer || '',
    dont: lensman.dont_shoot || '',
    accent: lensman.accent_color || 'lime',
    layout: lensman.wall_layout || 'wall',
    curve: lensman.wall_curve || 'soft',
    frame: lensman.print_frame || 'mat',
    mat: lensman.print_mat || 'mixed',
    captions: lensman.show_captions !== false,
    tiers,
  };
}

/**
 * Every part of a profile. `problem` returns why it can't be saved yet (or
 * ''); `payload` is exactly what that section sends to the server.
 */
export const SECTIONS = {
  you: {
    label: 'Photo & name',
    title: 'Put a face to the name.',
    lede: 'Clients book people. A clear, recent photo of you, and the name they should call you.',
    problem: (f) => {
      if (!f.photo) return 'Add a photo of you.';
      if (!f.name.trim()) return 'Add a name clients can call you.';
      return '';
    },
    payload: (f) => ({ profile_image: f.photo || '', display_name: f.name.trim() }),
  },
  work: {
    label: 'What you shoot',
    title: 'What do you shoot?',
    lede: "Pick everything that applies. It's the first thing clients search.",
    problem: (f) => (f.what.length ? '' : 'Pick at least one thing you shoot.'),
    payload: (f) => ({ specialties: f.what, neighborhoods: f.where.length ? f.where : [DEFAULT_SPOT] }),
  },
  portfolio: {
    label: 'Portfolio',
    title: 'Show your best work.',
    lede: `At least ${MIN_SHOTS}, up to ${MAX_SHOTS}. The starred photo is your cover.`,
    problem: (f) => (f.portfolio.length >= MIN_SHOTS ? '' : `Add at least ${MIN_SHOTS} of your best shots.`),
    payload: (f) => {
      const ordered = orderedPortfolio(f).map((item) => item.src).filter(Boolean);
      return { portfolio_images: ordered, cover_image: ordered[0] || '' };
    },
  },
  contact: {
    label: 'Private contact',
    title: 'Just between us.',
    lede: 'Only Stelli sees this. Clients reach you through Stelli bookings.',
    problem: (f) => {
      if (!f.fullName.trim()) return 'Add your full name. Only Stelli sees it.';
      if (!validEmail(f.email)) return 'Add a valid email.';
      return '';
    },
    payload: (f) => ({
      full_name: f.fullName.trim(),
      email: f.email.trim(),
      phone: f.phone.trim(),
      instagram: f.ig.trim().replace(/^@+/, ''),
    }),
  },
  about: {
    label: 'About you',
    title: 'About you.',
    lede: 'A few lines on how you shoot. All optional, and all of it helps a client pick you.',
    problem: (f) => (f.promptA.trim() && f.promptIdx == null ? 'Pick a prompt for your answer.' : ''),
    payload: (f) => ({
      one_liner: f.oneLiner.trim(),
      style_tags: f.tags,
      bio: f.bio.trim(),
      equipment: f.equip.trim(),
      ...(f.years ? { years_experience: Number(f.years) } : {}),
      prompt_question: f.promptIdx != null && f.promptA.trim() ? PROMPTS[f.promptIdx] : '',
      prompt_answer: f.promptIdx != null ? f.promptA.trim() : '',
      dont_shoot: f.dont.trim(),
    }),
  },
  look: {
    label: 'Your look',
    title: 'Hang your work.',
    lede: 'How your photos hang on your public page. Only you set this.',
    problem: () => '',
    payload: (f) => ({
      wall_layout: f.layout,
      wall_curve: f.curve,
      print_frame: f.frame,
      print_mat: f.mat,
      accent_color: f.accent,
      show_captions: Boolean(f.captions),
    }),
  },
  packages: {
    label: 'Packages',
    title: 'Your packages.',
    lede: "Rough numbers to quote from. Clients don't see these on your page: you send each one a private quote.",
    problem: (f) =>
      f.tiers.some((tier) => tier.on && Number(tier.price) > 0 && !tier.name.trim())
        ? "Give each package you're offering a name."
        : '',
    payload: (f) => ({
      pricing_tiers: activeTiers(f).map((tier) => ({
        tier: tier.level,
        name: tier.name.trim(),
        price: Number(tier.price),
        duration: tier.duration,
        includes: tier.includes.trim(),
      })),
    }),
  },
};

/** The application: the four sections a founder needs to make a decision. */
export const APPLICATION_SECTIONS = ['you', 'work', 'portfolio', 'contact'];

/** The first application section that still has a problem, or null. */
export function applicationProblem(f) {
  for (const key of APPLICATION_SECTIONS) {
    const problem = SECTIONS[key].problem(f);
    if (problem) return { section: key, problem };
  }
  return null;
}

/** Everything the application sends, in one request. */
export function applicationPayload(f) {
  return Object.assign(
    { market: MARKET, slug: slugify(f.name) },
    ...APPLICATION_SECTIONS.map((key) => SECTIONS[key].payload(f))
  );
}

/** Which section a field the server turned down belongs to. */
export const FIELD_SECTION = {
  profile_image: 'you', display_name: 'you', slug: 'you',
  specialties: 'work', neighborhoods: 'work',
  portfolio_images: 'portfolio', cover_image: 'portfolio',
  full_name: 'contact', email: 'contact', phone: 'contact', instagram: 'contact',
  one_liner: 'about', style_tags: 'about', bio: 'about', equipment: 'about',
  prompt_question: 'about', prompt_answer: 'about', dont_shoot: 'about',
  accent_color: 'look', wall_layout: 'look', wall_curve: 'look', print_frame: 'look', print_mat: 'look',
  pricing_tiers: 'packages',
};

/** The message a failed save came back with, and the field it was about. */
export function readFailure(error) {
  const data = error?.response?.data || error?.data || {};
  return { message: data.error || error?.message || 'Please try again.', field: data.field || '' };
}
