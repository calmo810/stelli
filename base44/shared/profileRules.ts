import { hasDirectContact } from './contactGuard.ts';

/**
 * Server-side rules for curator profile customization.
 *
 * The form mirrors these rules for instant feedback, but this module is the
 * authority: character limits, the three-tag cap, the accent value and the
 * contact-protection check all run here before any save succeeds.
 */

export const PROMPTS = [
  'Best photo I ever took was…',
  "Don't book me if…",
  "The shot I'm always chasing…",
  "You'll know it's my photo because…",
  'I got into this because…',
  'Worst shoot I ever survived…',
  // Offered by the profile wizard.
  'My dream shoot is…',
  'Clients always tell me…',
  'My style in three words…',
  "The shot I'm proudest of…",
  'You should book me if…',
];

export const STYLE_TAGS = ['grad', 'portraits', 'outdoor', 'campus', 'couples', 'film', 'bright', 'events', 'flash', 'nightlife', 'editorial', 'moody'];
export const ALL_STYLE_TAGS = STYLE_TAGS;

export const LIMITS = { one_liner: 90, prompt_answer: 200, dont_shoot: 140, bio: 400 };
/** Same ceiling the wizard enforces, so a save never trims a portfolio. */
export const MAX_PORTFOLIO_IMAGES = 12;
export const ACCENTS = ['lime', 'cyan', 'magenta'];
export const GALLERY_STYLES = ['ordered_grid', 'hero_grid', 'contact_sheet'];
export const PROFILE_THEMES = ['night_flash', 'clean_portfolio'];
export const MAX_DISPLAY_NAME = 40;
export const MAX_EQUIPMENT = 400;
export const TIER_LEVELS = ['low', 'mid', 'high'];

/** How the creator hangs their public page. Only the creator sets these. */
export const DISPLAY_OPTIONS = {
  wall_layout: ['wall', 'strip', 'grid'],
  wall_curve: ['flat', 'soft', 'full'],
  print_frame: ['mat', 'bleed'],
  print_mat: ['mixed', 'paper', 'sky', 'blush', 'lilac', 'mint', 'ink'],
};

/** The creator's packages, exactly as the profile wizard collects them. */
export function cleanPricingTiers(tiers) {
  if (!Array.isArray(tiers)) return [];
  return tiers
    .slice(0, 3)
    .map((tier, i) => ({
      tier: TIER_LEVELS[i] || 'low',
      name: String(tier?.name || '').trim().slice(0, 28),
      price: Math.max(0, Math.round(Number(tier?.price) || 0)),
      duration: String(tier?.duration || '').trim().slice(0, 12),
      includes: String(tier?.includes || '').trim().slice(0, 60),
    }))
    .filter((tier) => tier.price > 0);
}

export const CONTACT_MESSAGE =
  'Contact details stay private until a booking is confirmed — keep this part about your work.';

const CONTACT_PHRASES = [
  'dm me',
  'text me',
  'call me',
  'hit me up',
  'my insta',
  'ig',
  'instagram',
  'tiktok',
  'whatsapp',
  'venmo',
  'cash app',
  'zelle',
  'email me',
];

/** True when a profile line contains anything that would take a client off Stelli. */
export function hasContactDetails(text) {
  const value = String(text || '');
  if (!value.trim()) return false;

  // 7+ digits in a row, allowing the usual separators
  if (/(?:\d[\s\-().]*){7,}/.test(value)) return true;
  // email address
  if (/[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(value)) return true;
  // @handle
  if (/(^|[\s(])@[a-z0-9._]{2,}/i.test(value)) return true;
  // web address or domain
  if (/(https?:\/\/|www\.)/i.test(value)) return true;
  if (/\.(com|co|net|io)\b/i.test(value)) return true;

  const lower = value.toLowerCase();
  return CONTACT_PHRASES.some((phrase) =>
    new RegExp(`(^|[^a-z0-9])${phrase}([^a-z0-9]|$)`).test(lower)
  );
}

/**
 * A short list of public labels (what a creator shoots, where they work).
 * Strings only, trimmed, capped, no duplicates — and nothing that is really a
 * phone number, an email, a handle or a link.
 */
function cleanLabels(list, { max = 12, length = 40 } = {}) {
  if (!Array.isArray(list)) return { values: [], contact: false };
  const values = [];
  let contact = false;
  for (const entry of list) {
    if (typeof entry !== 'string') continue;
    const value = entry.trim().slice(0, length);
    if (!value) continue;
    if (hasDirectContact(value)) {
      contact = true;
      continue;
    }
    if (!values.some((existing) => existing.toLowerCase() === value.toLowerCase())) values.push(value);
    if (values.length >= max) break;
  }
  return { values, contact };
}

function cleanTags(tags) {
  if (!Array.isArray(tags)) return [];
  const seen = [];
  for (const tag of tags) {
    const value = String(tag || '').trim().toLowerCase().slice(0, 24);
    if (value && !seen.includes(value)) seen.push(value);
  }
  return seen.slice(0, 3);
}

function cleanFocalPoint(point) {
  const x = Number(point?.x);
  const y = Number(point?.y);
  return {
    x: Number.isFinite(x) ? Math.min(100, Math.max(0, Math.round(x))) : 50,
    y: Number.isFinite(y) ? Math.min(100, Math.max(0, Math.round(y))) : 50,
  };
}

/**
 * Turns a profile save request into a validated patch.
 * Returns { patch, errors } where errors is keyed by the offending field.
 */
export function buildProfilePatch(body = {}) {
  const patch = {};
  const errors = {};

  for (const field of Object.keys(LIMITS)) {
    if (typeof body[field] !== 'string') continue;
    const value = body[field].trim();
    if (value.length > LIMITS[field]) {
      errors[field] = `Keep this to ${LIMITS[field]} characters or fewer.`;
      continue;
    }
    if (hasContactDetails(value)) {
      errors[field] = CONTACT_MESSAGE;
      continue;
    }
    patch[field] = value;
  }

  if (typeof body.prompt_question === 'string') {
    const question = body.prompt_question.trim();
    if (question && !PROMPTS.includes(question)) {
      errors.prompt_question = 'Pick one of the profile prompts.';
    } else {
      patch.prompt_question = question;
    }
  }

  if (patch.prompt_answer && !patch.prompt_question) {
    errors.prompt_question = 'Pick a prompt for your answer.';
  }

  if (Array.isArray(body.style_tags)) {
    patch.style_tags = cleanTags(body.style_tags);
  }

  // What they shoot and where: public, and until now saved exactly as sent.
  for (const field of ['specialties', 'neighborhoods']) {
    if (!Array.isArray(body[field])) continue;
    const { values, contact } = cleanLabels(body[field]);
    if (contact) errors[field] = CONTACT_MESSAGE;
    else patch[field] = values;
  }

  if (typeof body.display_name === 'string') {
    const value = body.display_name.trim();
    if (value.length > MAX_DISPLAY_NAME) errors.display_name = `Keep your name to ${MAX_DISPLAY_NAME} characters or fewer.`;
    else if (hasDirectContact(value)) errors.display_name = CONTACT_MESSAGE;
  }

  if (typeof body.equipment === 'string') {
    const value = body.equipment.trim();
    if (value.length > MAX_EQUIPMENT) errors.equipment = `Keep this to ${MAX_EQUIPMENT} characters or fewer.`;
    else if (hasDirectContact(value)) errors.equipment = CONTACT_MESSAGE;
    else patch.equipment = value;
  }

  if (Array.isArray(body.portfolio_videos)) {
    patch.portfolio_videos = body.portfolio_videos
      .filter((url) => typeof url === 'string' && /^https:\/\//i.test(url.trim()))
      .map((url) => url.trim().slice(0, 1000))
      .slice(0, 6);
  }

  if (Array.isArray(body.blackout_dates)) {
    patch.blackout_dates = [...new Set(
      body.blackout_dates.filter((day) => typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day))
    )].slice(0, 366);
  }

  if (body.years_experience !== undefined && body.years_experience !== null && body.years_experience !== '') {
    const years = Number(body.years_experience);
    if (Number.isFinite(years)) patch.years_experience = Math.min(80, Math.max(0, Math.round(years)));
  }

  if (typeof body.gallery_style === 'string' && GALLERY_STYLES.includes(body.gallery_style)) {
    patch.gallery_style = body.gallery_style;
  }
  if (typeof body.profile_theme === 'string' && PROFILE_THEMES.includes(body.profile_theme)) {
    patch.profile_theme = body.profile_theme;
  }

  if (typeof body.accent_color === 'string' && body.accent_color) {
    if (ACCENTS.includes(body.accent_color)) patch.accent_color = body.accent_color;
    else errors.accent_color = 'Pick one of the three accents.';
  }

  for (const [field, allowed] of Object.entries(DISPLAY_OPTIONS)) {
    if (typeof body[field] !== 'string' || !body[field]) continue;
    if (allowed.includes(body[field])) patch[field] = body[field];
    else errors[field] = 'Pick one of the listed options.';
  }

  if (typeof body.show_captions === 'boolean') {
    patch.show_captions = body.show_captions;
  }

  if (typeof body.cover_image === 'string') {
    patch.cover_image = body.cover_image.trim();
  }

  if (body.cover_focal_point) {
    patch.cover_focal_point = cleanFocalPoint(body.cover_focal_point);
  }

  if (Array.isArray(body.pinned_images)) {
    patch.pinned_images = body.pinned_images
      .filter((url) => typeof url === 'string' && url)
      .slice(0, 3);
  }

  if (Array.isArray(body.pricing_tiers)) {
    patch.pricing_tiers = cleanPricingTiers(body.pricing_tiers);
  }

  // Every photo uploaded in the wizard belongs to this profile — the face photo
  // and the portfolio alike. Signup saves through this same patch, so they land
  // on the profile that is submitted for review.
  if (typeof body.profile_image === 'string') {
    const value = body.profile_image.trim();
    if (value && /^https:\/\//i.test(value)) patch.profile_image = value;
  }

  if (Array.isArray(body.portfolio_images)) {
    patch.portfolio_images = body.portfolio_images
      .filter((url) => typeof url === 'string' && /^https:\/\//i.test(url.trim()))
      .map((url) => url.trim())
      .slice(0, MAX_PORTFOLIO_IMAGES);
  }

  return { patch, errors };
}