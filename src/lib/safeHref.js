/**
 * Gallery links are typed by creators, so a stored value could be a javascript:
 * or data: payload. Only real https addresses are ever turned into a clickable
 * link; anything else renders as plain text with no href.
 */
export function safeHref(url) {
  const value = String(url || '').trim();
  return /^https:\/\//i.test(value) ? value : undefined;
}