/**
 * Curated presets for curator profile individuality.
 * Mirrors base44/shared/profileRules.ts — the server remains the authority.
 */

export const NYC_TAGS = ['flash', 'film', 'nightlife', 'editorial', 'portraits', 'events', 'moody', 'bright'];
export const ELON_TAGS = ['grad', 'portraits', 'outdoor', 'campus', 'couples', 'film', 'bright', 'events'];
export const ALL_STYLE_TAGS = Array.from(new Set([...NYC_TAGS, ...ELON_TAGS]));

export function tagsForMarket(market, includeOther) {
  const own = market === 'ELON' ? ELON_TAGS : NYC_TAGS;
  const other = market === 'ELON' ? NYC_TAGS : ELON_TAGS;
  return includeOther ? Array.from(new Set([...own, ...other])) : own;
}

export function otherMarketLabel(market) {
  return market === 'ELON' ? 'NYC' : 'Elon';
}

export const PROMPTS = [
  'Best photo I ever took was…',
  "Don't book me if…",
  "The shot I'm always chasing…",
  "You'll know it's my photo because…",
  'I got into this because…',
  'Worst shoot I ever survived…',
];

export const LIMITS = { one_liner: 80, prompt_answer: 200, dont_shoot: 120 };

export const ACCENTS = [
  { id: 'lime', label: 'Lime', token: '--neon-lime' },
  { id: 'cyan', label: 'Cyan', token: '--neon-cyan' },
  { id: 'magenta', label: 'Magenta', token: '--neon-magenta' },
];

export function accentColor(accent) {
  const found = ACCENTS.find((a) => a.id === accent) || ACCENTS[0];
  return `hsl(var(${found.token}))`;
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

/** Mirrors the server check so the form can warn before the save is attempted. */
export function hasContactDetails(text) {
  const value = String(text || '');
  if (!value.trim()) return false;
  if (/(?:\d[\s\-().]*){7,}/.test(value)) return true;
  if (/[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(value)) return true;
  if (/(^|[\s(])@[a-z0-9._]{2,}/i.test(value)) return true;
  if (/(https?:\/\/|www\.)/i.test(value)) return true;
  if (/\.(com|co|net|io)\b/i.test(value)) return true;
  const lower = value.toLowerCase();
  return CONTACT_PHRASES.some((phrase) =>
    new RegExp(`(^|[^a-z0-9])${phrase}([^a-z0-9]|$)`).test(lower)
  );
}

/** Only tags from the fixed lists survive, capped at three. */
export function cleanStyleTags(tags) {
  const seen = [];
  for (const tag of tags || []) {
    const value = String(tag || '').trim().toLowerCase();
    if (ALL_STYLE_TAGS.includes(value) && !seen.includes(value)) seen.push(value);
  }
  return seen.slice(0, 3);
}

/** True when a profile carries tags that are not on the new fixed lists. */
export function hasLegacyTags(profile) {
  return (profile?.style_tags || []).some(
    (tag) => !ALL_STYLE_TAGS.includes(String(tag || '').trim().toLowerCase())
  );
}

/** Pinned three first, then the rest of the gallery with nothing repeating. */
export function galleryComposition(creator) {
  const all = (creator?.portfolio_images || []).filter(Boolean);
  const stored = (creator?.pinned_images || []).filter((url) => all.includes(url)).slice(0, 3);
  const pinned = stored.length ? stored : all.slice(0, 3);
  const rest = all.filter((url) => !pinned.includes(url));
  return { pinned, rest, all };
}

export function coverImage(creator) {
  const all = (creator?.portfolio_images || []).filter(Boolean);
  if (creator?.cover_image && all.includes(creator.cover_image)) return creator.cover_image;
  const { pinned } = galleryComposition(creator);
  return pinned[0] || all[0] || creator?.profile_image || '';
}

export function focalPoint(creator) {
  if (creator?.cover_image && creator.cover_focal_point) {
    const { x, y } = creator.cover_focal_point;
    if (Number.isFinite(x) && Number.isFinite(y)) return { x, y };
  }
  return { x: 50, y: 50 };
}

export const SHARE_HOST = 'https://getstelli.base44.app';

export function shareUrl(creator) {
  return `${SHARE_HOST}/functions/shareProfile?id=${creator?.id || ''}`;
}