import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { isPast, nextSteps } from '@/lib/bookingNextStep';

/** Everything the client's dashboard and its sheets read. */
export default function useClientDashboard() {
  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['client-bookings', user?.id, user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      // By account and by email, so a booking is found either way.
      const [byId, byEmail] = await Promise.all([
        user.id ? base44.entities.Booking.filter({ client_id: user.id }, '-created_date') : [],
        base44.entities.Booking.filter({ client_email: user.email }, '-created_date'),
      ]);
      const seen = new Set();
      return [...byId, ...byEmail].filter((b) => (seen.has(b.id) ? false : seen.add(b.id)));
    },
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ['client-quotes'],
    enabled: !!user?.email,
    queryFn: () => base44.entities.Quote.list('-created_date'),
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
    // The one real next step for each booking that has one.
    steps: nextSteps(active, 'client', { quotes }),
    refresh,
  };
}
