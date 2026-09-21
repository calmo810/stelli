import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });
}

export function useClientBookings(email) {
  return useQuery({
    queryKey: ['client-bookings', email],
    enabled: Boolean(email),
    queryFn: () => base44.entities.Booking.filter({ client_email: email }, '-created_date'),
  });
}

export function useCreatorBookings(email) {
  return useQuery({
    queryKey: ['lensman-bookings', email],
    enabled: Boolean(email),
    queryFn: () => base44.entities.Booking.filter({ lensman_email: email }, '-created_date'),
  });
}

export function useQuotes() {
  return useQuery({
    queryKey: ['client-quotes'],
    queryFn: () => base44.entities.Quote.list('-created_date'),
  });
}
