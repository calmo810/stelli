import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { isPast, nextSteps } from '@/lib/bookingNextStep';

/** Everything the creator's dashboard and its sheets read. */
export default function useCreatorDashboard() {
  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  // Payout status, the Stripe account and holds are readable by founders
  // only, so the creator's own full record comes from the server.
  const { data: myProfile, refetch: refetchProfile, isFetched: profileFetched } = useQuery({
    queryKey: ['my-lensman-profile', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const response = await base44.functions.invoke('getMyCreatorProfile', {});
      return response.data?.lensman || null;
    },
  });

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['lensman-bookings', user?.id, user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      // By account: emails on bookings are readable by founders only.
      return base44.entities.Booking.filter({ creator_id: user.id }, '-created_date');
    },
  });

  // Founder payouts made outside a booking, still waiting to go out.
  const { data: waitingManual = [] } = useQuery({
    queryKey: ['waiting-manual-payouts', user?.id],
    enabled: !!user?.id,
    queryFn: () =>
      base44.entities.ManualPayout.filter({ creator_user_id: user.id, status: 'waiting' }).catch(() => []),
  });

  // Stripe is asked where a mid-setup creator stands, once per profile — the
  // dashboard and any open sheet share this one check.
  const { data: payoutState = null } = useQuery({
    queryKey: ['payout-status', myProfile?.id],
    enabled: !!myProfile?.stripe_account_id && !myProfile?.payouts_enabled,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
    queryFn: async () => {
      try {
        const response = await base44.functions.invoke('startPayoutSetup', { action: 'status' });
        if (response.data?.paidOut) {
          queryClient.invalidateQueries({ queryKey: ['lensman-bookings'] });
          queryClient.invalidateQueries({ queryKey: ['waiting-manual-payouts'] });
        }
        await refetchProfile();
        return response.data || null;
      } catch (error) {
        console.error('Payout status check failed:', error.message);
        return null;
      }
    },
  });

  // Someone who also books shoots as a client gets a way across to that portal.
  const { data: hasClientBookings = false } = useQuery({
    queryKey: ['has-client-bookings', user?.id],
    enabled: !!user?.id,
    queryFn: async () => (await base44.entities.Booking.filter({ client_id: user.id }, '-created_date', 1).catch(() => [])).length > 0,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['lensman-bookings'] });

  // Every booking is in exactly one of these two lists. (Cancelled bookings and
  // a few other states used to be in neither.)
  const active = bookings.filter((b) => !isPast(b));
  const past = bookings.filter((b) => isPast(b));

  // Money held for this creator until they finish payout setup.
  const waitingPayouts = bookings.filter((b) => b.needs_payout_setup && !b.stripe_transfer_id);

  return {
    user,
    userLoading,
    myProfile,
    profileFetched,
    refetchProfile,
    bookings,
    isLoading,
    active,
    past,
    hasClientBookings,
    // The one real next step for each booking that has one.
    steps: nextSteps(active, 'lensman'),
    waitingPayouts,
    waitingTotal:
      waitingPayouts.reduce((sum, b) => sum + Number(b.creator_payout || 0), 0) +
      waitingManual.reduce((sum, p) => sum + Number(p.amount || 0), 0),
    payoutState,
    refresh,
  };
}
