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
];

export const NYC_TAGS = ['flash', 'film', 'nightlife', 'editorial', 'portraits', 'events', 'moody', 'bright'];
export const ELON_TAGS = ['grad', 'portraits', 'outdoor', 'campus', 'couples', 'film', 'bright', 'events'];
export const ALL_STYLE_TAGS = Array.from(new Set([...NYC_TAGS, ...ELON_TAGS]));

export const LIMITS = { one_liner: 80, prompt_answer: 200, dont_shoot: 120 };
export const ACCENTS = ['lime', 'cyan', 'magenta'];

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

function cleanTags(tags) {
  if (!Array.isArray(tags)) return [];
  const seen = [];
  for (const tag of tags) {
    const value = String(tag || '').trim().toLowerCase();
    if (ALL_STYLE_TAGS.includes(value) && !seen.includes(value)) seen.push(value);
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

  if (typeof body.accent_color === 'string' && body.accent_color) {
    if (ACCENTS.includes(body.accent_color)) patch.accent_color = body.accent_color;
    else errors.accent_color = 'Pick one of the three accents.';
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

  return { patch, errors };
}