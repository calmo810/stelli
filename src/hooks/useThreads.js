import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { viewerRole } from '@/lib/threadStatus';

/** Every conversation this person is part of, newest first. */
export default function useThreads() {
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['inbox-user'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data = { bookings: [], messages: [], creators: [] }, isLoading } = useQuery({
    queryKey: ['messages-inbox', user?.id, user?.email],
    enabled: !!user?.id || !!user?.email,
    queryFn: async () => {
      const byId = user?.id ? await base44.entities.Booking.filter({ creator_id: user.id }, '-updated_date') : [];
      const asClient = user?.email ? await base44.entities.Booking.filter({ client_email: user.email }, '-updated_date') : [];
      const seen = new Set();
      const bookings = [...byId, ...asClient].filter((b) => {
        if (seen.has(b.id)) return false;
        seen.add(b.id);
        return true;
      });
      const messages = await base44.entities.Message.list('-created_date', 300);
      const creators = await base44.entities.Lensman.list('-updated_date', 100);
      return { bookings, messages, creators };
    },
  });

  const threads = useMemo(() => {
    const creatorById = new Map(data.creators.map((creator) => [creator.id, creator]));

    return data.bookings
      .map((booking) => {
        const role = viewerRole(booking, user);
        if (!role) return null;

        const threadMessages = data.messages.filter((m) => m.booking_id === booking.id);
        const latest = threadMessages[0];
        const creator = creatorById.get(booking.lensman_id);
        const otherName = role === 'lensman' ? booking.client_name : booking.lensman_name || creator?.display_name;
        const otherPhoto = role === 'client' ? creator?.profile_image : '';
        const myRead = role === 'lensman' ? booking.creator_last_read_at : booking.client_last_read_at;

        const unread =
          !!latest &&
          latest.sender_role !== role &&
          (!myRead || new Date(myRead).getTime() < new Date(latest.created_date).getTime());

        return {
          booking,
          role,
          latest,
          otherName,
          otherPhoto,
          unread,
          sortDate: new Date(
            latest?.created_date || booking.updated_date || booking.created_date || 0
          ).getTime(),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.sortDate - a.sortDate);
  }, [data, user]);

  return {
    user,
    threads,
    unreadCount: threads.filter((t) => t.unread).length,
    isLoading: isLoading || userLoading,
  };
}