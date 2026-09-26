import { galleryComposition } from '@/lib/profilePresets';

/** The brand accents a creator can carry, mapped to their design tokens. */
const ACCENT_TOKENS = {
  lime: '--neon-lime',
  cyan: '--neon-cyan',
  magenta: '--neon-magenta',
};

export function accentOf(creator) {
  const token = ACCENT_TOKENS[creator?.accent_color] || ACCENT_TOKENS.lime;
  return `hsl(var(${token}))`;
}

export const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80';

/** Safe to drop into a CSS background-image. */
export function cssUrl(url) {
  return `url("${String(url || '').replace(/"/g, '%22')}")`;
}

/** The images the card cycles through: pinned first, never repeating. */
export function cardImages(creator) {
  const { pinned, rest } = galleryComposition(creator);
  const images = [...pinned, ...rest].filter(Boolean).slice(0, 3);
  if (images.length) return images;
  return [creator?.profile_image || FALLBACK_IMAGE];
}

/** The wider set the quick view scrolls through. */
export function galleryImages(creator) {
  const { pinned, rest } = galleryComposition(creator);
  const images = [...pinned, ...rest].filter(Boolean).slice(0, 6);
  if (images.length) return images;
  return [creator?.profile_image || FALLBACK_IMAGE];
}

export function ratingLabel(creator) {
  return creator?.review_count ? `★ ${Number(creator.avg_rating || 0).toFixed(1)}` : 'New';
}

export function taglineOf(creator) {
  const tagline = String(creator?.profile_tagline || '').trim();
  if (tagline) return tagline;
  const specialties = (creator?.specialties || []).filter(Boolean).slice(0, 3);
  return specialties.length ? specialties.join(' · ') : 'Photography';
}

export const BROWSE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'grad', label: 'Grad & Campus' },
  { id: 'headshots', label: 'Headshots' },
  { id: 'events', label: 'Events' },
];

const FILTER_WORDS = {
  grad: ['graduation', 'grad', 'campus', 'outdoor'],
  headshots: ['headshots', 'portraits'],
  events: ['events', 'birthdays', 'formals', 'content days', 'sports', 'commercial'],
};

function hasAny(creator, words) {
  const tags = new Set(
    [...(creator?.specialties || []), ...(creator?.style_tags || [])].map((tag) =>
      String(tag || '').trim().toLowerCase()
    )
  );
  return words.some((word) => tags.has(word));
}

export function matchesFilter(creator, key) {
  const words = FILTER_WORDS[key];
  return words ? hasAny(creator, words) : true;
}