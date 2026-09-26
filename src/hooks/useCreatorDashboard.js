import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const UPCOMING = ['quoted', 'quote_accepted'];
const DELIVERIES = ['confirmed', 'in_progress', 'awaiting_delivery'];
const COMPLETED = ['delivered', 'completed'];

/** Everything the creator's dashboard and its sheets read. */
export default function useCreatorDashboard() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: myProfile, refetch: refetchProfile } = useQuery({
    queryKey: ['my-lensman-profile', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const list = await base44.entities.Lensman.filter({ user_id: user.id });
      return list[0] || null;
    },
  });

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['lensman-bookings', user?.email],
    enabled: !!user?.email,
    queryFn: () => base44.entities.Booking.filter({ lensman_email: user.email }, '-created_date'),
  });

  const { data: waitingPayouts = [] } = useQuery({
    queryKey: ['waiting-payouts', user?.email],
    enabled: !!user?.email,
    queryFn: () => base44.entities.Booking.filter({ needs_payout_setup: true, lensman_email: user.email }),
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
          queryClient.invalidateQueries({ queryKey: ['waiting-payouts'] });
        }
        await refetchProfile();
        return response.data || null;
      } catch (error) {
        console.error('Payout status check failed:', error.message);
        return null;
      }
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['lensman-bookings'] });

  return {
    user,
    myProfile,
    refetchProfile,
    bookings,
    isLoading,
    requests: bookings.filter((b) => b.status === 'requested'),
    upcoming: bookings.filter((b) => UPCOMING.includes(b.status)),
    deliveries: bookings.filter((b) => DELIVERIES.includes(b.status)),
    completed: bookings.filter((b) => COMPLETED.includes(b.status)),
    waitingPayouts,
    waitingTotal: waitingPayouts.reduce((sum, b) => sum + Number(b.creator_payout || 0), 0),
    payoutState,
    refresh,
  };
}