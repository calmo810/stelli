const PUBLISHED_ORIGIN = 'https://getstelli.base44.app';

/**
 * Stripe sends the visitor back to whatever origin we hand it, so a caller must
 * never be able to choose that origin freely — otherwise a payment can end on a
 * page the caller controls. Only https Stelli origins are accepted; anything
 * else falls back to the published app.
 */
export function safeOrigin(origin?: string | null): string {
  const value = String(origin || '').trim();

  if (value) {
    try {
      const url = new URL(value);
      const host = url.hostname.toLowerCase();

      if (url.protocol === 'https:' && (host === 'base44.app' || host.endsWith('.base44.app'))) {
        return url.origin;
      }
    } catch {
      // Not a URL at all — fall through to the published origin.
    }

    console.warn('Rejected an untrusted redirect origin.');
  }

  return PUBLISHED_ORIGIN;
}