/** Where Stelli lives. Links in emails point here. */
export const SITE_ORIGIN = 'https://getstelli.com';

/** The app's own Base44 address — always served, whatever the custom domain does. */
const PUBLISHED_ORIGIN = 'https://getstelli.base44.app';

/**
 * The hosts Stelli is actually served from: the custom domain, the published
 * Base44 address, and Base44's own preview of this app.
 */
const TRUSTED_HOSTS = [
  /^getstelli\.com$/,
  /^www\.getstelli\.com$/,
  /^getstelli\.base44\.app$/,
  /^preview--getstelli\.base44\.app$/,
];

/**
 * Stripe sends the visitor back to whatever origin we hand it, so a caller must
 * never be able to choose that origin freely — otherwise a payment can end on a
 * page the caller controls. Only Stelli's own hosts are accepted; anything
 * else falls back to the published app.
 *
 * A visitor who paid from getstelli.com goes back to getstelli.com, where they
 * are signed in. (Before, only *.base44.app was accepted: clients on the real
 * domain were returned to a different one, signed out, and any other Base44
 * app's address passed the check.)
 */
export function safeOrigin(origin?: string | null): string {
  const value = String(origin || '').trim();

  if (value) {
    try {
      const url = new URL(value);
      const host = url.hostname.toLowerCase();

      if (url.protocol === 'https:' && !url.port && TRUSTED_HOSTS.some((pattern) => pattern.test(host))) {
        return url.origin;
      }
    } catch {
      // Not a URL at all — fall through to the published origin.
    }

    console.warn('Rejected an untrusted redirect origin.');
  }

  return PUBLISHED_ORIGIN;
}
