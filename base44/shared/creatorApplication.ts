/**
 * Shared helpers for creator signup. Both the live application flow and the
 * older application endpoint build the same profile identity from a name.
 */

export function slugify(value = '') {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** The public display name: an explicit choice, else the first name. */
export function displayNameFrom(fullName, preferred) {
  const clean = String(fullName || '').trim();
  const explicit = String(preferred || '').trim();
  if (explicit) return explicit;
  return clean.split(' ')[0] || clean;
}