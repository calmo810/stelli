import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * The signed-in creator's own profile and private contact record.
 *
 * Some fields are readable by founders only (payouts, packages, the contact
 * record), so a creator's own copy comes from the server. The application and
 * the portal both read it through here, under one cache key, so a save in one
 * place is seen everywhere.
 *
 * `data` is { lensman, contact } — both null for someone who has not applied.
 */
export const MY_CREATOR_PROFILE_KEY = 'my-lensman-profile';

export default function useMyCreatorProfile(userId) {
  return useQuery({
    queryKey: [MY_CREATOR_PROFILE_KEY, userId],
    enabled: !!userId,
    retry: 1,
    queryFn: async () => {
      const response = await base44.functions.invoke('getMyCreatorProfile', {});
      if (response.data?.error) throw new Error(response.data.error);
      return { lensman: response.data?.lensman || null, contact: response.data?.contact || null };
    },
  });
}
