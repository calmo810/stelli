import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, isThisYear } from 'date-fns';
import { MessageCircle, Loader2 } from 'lucide-react';
import { viewerRole } from '@/lib/threadStatus';

function initials(name) {
  return String(name || 'S').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

function timeLabel(value) {
  if (!value) return '';
  const date = new Date(value);
  return isThisYear(date) ? format(date, 'MMM d') : format(date, 'MMM d, yyyy');
}

export default function MessagesInbox() {
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

  const unreadCount = threads.filter((t) => t.unread).length;

  return (
    <div className="min-h-screen bg-ink px-5 md:px-10 pt-28 pb-24">
      <div className="max-w-3xl mx-auto">
        <p className="label-mono text-[10px] text-neon-lime mb-4">Messages</p>
        <h1 className="font-heading font-semibold text-white leading-[0.95] mb-8" style={{ fontSize: 'clamp(38px, 6vw, 72px)' }}>
          Conversations
        </h1>

        <div className="border border-white/10 bg-surface overflow-hidden" style={{ borderRadius: 4 }}>
          {isLoading || userLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-neon-lime" />
            </div>
          ) : threads.length === 0 ? (
            <div className="text-center py-16 px-6">
              <MessageCircle className="w-8 h-8 mx-auto mb-4 text-white/25" />
              <p className="font-body text-[14px] text-white/55">No conversations yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {threads.map((thread) => (
                <Link
                  key={thread.booking.id}
                  to={`/messages/${thread.booking.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-white/[0.04] transition-colors"
                >
                  <div className="relative w-12 h-12 shrink-0 overflow-hidden bg-white/10 flex items-center justify-center" style={{ borderRadius: '50%' }}>
                    {thread.otherPhoto ? (
                      <img src={thread.otherPhoto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="label-mono text-[11px] text-white/60">{initials(thread.otherName)}</span>
                    )}
                    {thread.unread && (
                      <span className="absolute right-0 bottom-0 w-3 h-3 rounded-full bg-neon-lime border-2 border-surface" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <p className={`font-body text-[14px] truncate ${thread.unread ? 'font-semibold text-white' : 'text-white/70'}`}>
                        {thread.otherName || 'Stelli user'}
                      </p>
                      <span className="label-mono text-[9px] text-white/30 shrink-0">
                        {timeLabel(thread.latest?.created_date || thread.booking.updated_date)}
                      </span>
                    </div>
                    <p className={`font-body text-[12px] truncate ${thread.unread ? 'font-semibold text-white/80' : 'text-white/40'}`}>
                      {thread.latest?.content || thread.booking.event_description || 'Open the thread to start.'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {unreadCount > 0 && (
          <p className="label-mono text-[9px] text-white/30 mt-4">{unreadCount} unread</p>
        )}
      </div>
    </div>
  );
}