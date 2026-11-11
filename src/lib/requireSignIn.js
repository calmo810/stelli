import { useEffect } from 'react';

/** Where the sign-in page should send someone back to. */
export function loginUrl(returnTo = window.location.pathname + window.location.search) {
  return `/login?returnTo=${encodeURIComponent(returnTo)}`;
}

/**
 * For pages that only make sense signed in. Once we know nobody is signed in,
 * the visitor is sent to log in and brought straight back afterwards — instead
 * of being left on an empty page or a spinner that never ends.
 *
 * Returns true while the page should hold off rendering.
 */
export default function useRequireSignIn(user, loading) {
  const signedOut = !loading && !user;
  useEffect(() => {
    if (signedOut) window.location.replace(loginUrl());
  }, [signedOut]);
  return loading || signedOut;
}
