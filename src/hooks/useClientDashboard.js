import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const UPCOMING = ['requested', 'quoted', 'quote_accepted', 'confirmed', 'in_progress'];
const AWAITING = ['awaiting_delivery'];
const PAST = ['delivered', 'completed'];

/** Everything the client's dashboard and its sheets read. */
export default function useClientDashboard() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['client-bookings', user?.email],
    enabled: !!user?.email,
    queryFn: () => base44.entities.Booking.filter({ client_email: user.email }, '-created_date'),
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ['client-quotes'],
    queryFn: () => base44.entities.Quote.list('-created_date'),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['client-bookings'] });
    queryClient.invalidateQueries({ queryKey: ['client-quotes'] });
  };

  return {
    user,
    bookings,
    isLoading,
    quoteFor: (bookingId) => quotes.find((q) => q.booking_id === bookingId && q.status === 'sent'),
    upcoming: bookings.filter((b) => UPCOMING.includes(b.status)),
    awaiting: bookings.filter((b) => AWAITING.includes(b.status)),
    past: bookings.filter((b) => PAST.includes(b.status)),
    refresh,
  };
}