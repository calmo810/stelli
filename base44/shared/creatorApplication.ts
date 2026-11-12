/**
 * Shared rules for creator applications: how a profile's identity is built
 * from a name, and the minimum an application needs before a founder is asked
 * to look at it. The wizard mirrors the minimum for instant feedback, but this
 * module is the authority — nothing reaches the review queue without it.
 */

export const MIN_PORTFOLIO_IMAGES = 3;

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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

export function validEmail(value) {
  return EMAIL_SHAPE.test(String(value || '').trim());
}

/**
 * The first thing missing from an application, or null when it is reviewable.
 * `profile` is the public part (a validated patch, or a saved profile) and the
 * rest is the private part. Each problem names the field, so the wizard can
 * take the applicant straight to it.
 */
export function applicationProblem({ fullName, email, displayName, profile }) {
  if (!String(displayName || '').trim()) {
    return { field: 'display_name', error: 'Add a name clients can call you.' };
  }
  if (!String(profile?.profile_image || '').trim()) {
    return { field: 'profile_image', error: 'Add a photo of you.' };
  }
  const specialties = Array.isArray(profile?.specialties) ? profile.specialties.filter(Boolean) : [];
  if (!specialties.length) {
    return { field: 'specialties', error: 'Pick at least one thing you shoot.' };
  }
  const portfolio = Array.isArray(profile?.portfolio_images) ? profile.portfolio_images.filter(Boolean) : [];
  if (portfolio.length < MIN_PORTFOLIO_IMAGES) {
    return { field: 'portfolio_images', error: `Add at least ${MIN_PORTFOLIO_IMAGES} of your best shots.` };
  }
  if (!String(fullName || '').trim()) {
    return { field: 'full_name', error: 'Add your full name. Only Stelli sees it.' };
  }
  if (!validEmail(email)) {
    return { field: 'email', error: 'Add a valid contact email.' };
  }
  return null;
}
