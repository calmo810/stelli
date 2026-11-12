import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { queryClientInstance } from '@/lib/query-client';

export const CURRENT_USER_KEY = ['me'];

/**
 * Asks who is signed in. With no session on this device there is nobody to
 * ask about, so no request is made (and no failed one lands in the console of
 * every visitor who is just browsing).
 */
export async function fetchCurrentUser() {
  if (typeof base44.auth.hasToken === 'function' && !base44.auth.hasToken()) return null;
  return base44.auth.me().catch(() => null);
}

/**
 * The signed-in account, loaded once and shared by every screen.
 *
 * Signed out is an answer, not a failure: `user` is null and nothing retries
 * or throws, so a page can offer the sign-in door instead of spinning.
 */
export default function useCurrentUser() {
  const query = useQuery({
    queryKey: CURRENT_USER_KEY,
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 60_000,
  });
  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

/**
 * Call after anything that changes who is signed in, or what their account
 * says, without a page reload (signing in inside the booking form, finishing
 * onboarding). Every screen then sees the new account straight away instead of
 * the one it remembered.
 */
export async function refreshCurrentUser() {
  const user = await fetchCurrentUser();
  queryClientInstance.setQueryData(CURRENT_USER_KEY, user);
  return user;
}
