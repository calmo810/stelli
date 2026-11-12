import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { isPast, nextSteps } from '@/lib/bookingNextStep';
import useCurrentUser from '@/hooks/useCurrentUser';

/** Everything the client's dashboard and its sheets read. */
export default function useClientDashboard() {
  const queryClient = useQueryClient();

  const { user, isLoading: userLoading } = useCurrentUser();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['client-bookings', user?.id, user?.email],
    enabled: !!user?.id,
    queryFn: async () => {
      // By account: emails on bookings are readable by founders only.
      return base44.entities.Booking.filter({ client_id: user.id }, '-created_date');
    },
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ['client-quotes'],
    enabled: !!user?.email,
    queryFn: () => base44.entities.Quote.list('-created_date'),
  });

  // Someone who is also a creator gets a way across to that portal.
  const { data: hasCreatorProfile = false } = useQuery({
    queryKey: ['has-creator-profile', user?.id],
    enabled: !!user?.id,
    queryFn: async () => (await base44.entities.Lensman.filter({ user_id: user.id }).catch(() => [])).length > 0,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['client-bookings'] });
    queryClient.invalidateQueries({ queryKey: ['client-quotes'] });
  };

  // Every booking is in exactly one of these two lists. (Cancelled bookings,
  // bank payments in progress and a few other states used to be in neither.)
  const active = bookings.filter((b) => !isPast(b));
  const past = bookings.filter((b) => isPast(b));

  return {
    user,
    userLoading,
    bookings,
    isLoading,
    active,
    past,
    hasCreatorProfile,
    // The one real next step for each booking that has one.
    steps: nextSteps(active, 'client', { quotes }),
    refresh,
  };
}
