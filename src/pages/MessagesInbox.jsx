import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, isThisYear } from 'date-fns';
import { MessageCircle, Loader2 } from 'lucide-react';

const READ_KEY = 'stelli_thread_reads';

function getReads() {
  try { return JSON.parse(localStorage.getItem(READ_KEY) || '{}'); } catch { return {}; }
}

function setRead(bookingId, stamp) {
  const reads = getReads();
  reads[bookingId] = stamp;
  localStorage.setItem(READ_KEY, JSON.stringify(reads));
}

function initials(name) {
  return (name || 'S').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

function timeLabel(value) {
  if (!value) return '';
  const date = new Date(value);
  return isThisYear(date) ? format(date, 'MMM d') : format(date, 'MMM d, yyyy');
}

export default function MessagesInbox() {
  const [reads, setReads] = useState(getReads);
  const { data: user } = useQuery({ queryKey: ['inbox-user'], queryFn: () => base44.auth.me(), retry: false });
  const role = user?.account_type === 'creator' ? 'lensman' : 'client';

  const { data = { bookings: [], messages: [], creators: [] }, isLoading } = useQuery({
    queryKey: ['messages-inbox', user?.email, role],
    enabled: !!user?.email,
    queryFn: async () => {
      const bookings = role === 'lensman'
        ? await base44.entities.Booking.filter({ lensman_email: user.email }, '-updated_date')
        : await base44.entities.Booking.filter({ client_email: user.email }, '-updated_date');
      const messages = await base44.entities.Message.list('-created_date', 200);
      const creators = await base44.entities.Lensman.list('-updated_date', 100);
      return { bookings, messages, creators };
    },
  });

  const threads = useMemo(() => {
    const creatorById = new Map(data.creators.map((creator) => [creator.id, creator]));
    return data.bookings.map((booking) => {
      const threadMessages = data.messages.filter((msg) => msg.booking_id === booking.id);
      const latest = threadMessages[0];
      const creator = creatorById.get(booking.lensman_id);
      const otherName = role === 'lensman' ? booking.client_name : booking.lensman_name;
      const otherPhoto = role === 'client' ? creator?.profile_image : '';
      const stamp = latest?.id || latest?.created_date || booking.updated_date || booking.created_date;
      const unread = latest && latest.sender_role !== role && reads[booking.id] !== stamp;
      return {
        booking,
        latest,
        otherName,
        otherPhoto,
        stamp,
        unread,
        sortDate: new Date(latest?.created_date || booking.updated_date || booking.created_date || 0).getTime(),
      };
    }).sort((a, b) => b.sortDate - a.sortDate);
  }, [data, reads, role]);

  const markThreadRead = (thread) => {
    if (!thread.stamp) return;
    setRead(thread.booking.id, thread.stamp);
    setReads(getReads());
  };

  return (
    <div className="min-h-screen bg-ink px-5 md:px-10 pt-28 pb-24">
      <div className="max-w-3xl mx-auto">
        <p className="label-mono text-[10px] text-neon-lime mb-4">Portal messages</p>
        <h1 className="font-heading font-semibold text-white leading-[0.95] mb-8" style={{ fontSize: 'clamp(38px, 6vw, 72px)' }}>
          Conversations
        </h1>

        <div className="border border-white/10 bg-surface overflow-hidden" style={{ borderRadius: 4 }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-neon-lime" />
            </div>
          ) : threads.length === 0 ? (
            <div className="text-center py-16 px-6">
              <MessageCircle className="w-8 h-8 mx-auto mb-4 text-white/25" />
              <p className="font-body text-[14px] text-white/55">No conversations yet.</p>
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto divide-y divide-white/10">
              {threads.map((thread) => (
                <Link
                  key={thread.booking.id}
                  to={`/messages/${thread.booking.id}`}
                  onClick={() => markThreadRead(thread)}
                  className="flex items-center gap-4 p-4 hover:bg-white/[0.04] transition-colors"
                >
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-white/10 shrink-0 flex items-center justify-center">
                    {thread.otherPhoto ? (
                      <img src={thread.otherPhoto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="label-mono text-[11px] text-white/60">{initials(thread.otherName)}</span>
                    )}
                    {thread.unread && <span className="absolute right-0 bottom-0 w-3 h-3 rounded-full bg-neon-lime border-2 border-surface" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <p className={`font-body text-[14px] truncate ${thread.unread ? 'font-semibold text-white' : 'text-white/70'}`}>{thread.otherName || 'Stelli user'}</p>
                      <span className="label-mono text-[9px] text-white/30 shrink-0">{timeLabel(thread.latest?.created_date || thread.booking.updated_date)}</span>
                    </div>
                    <p className={`font-body text-[12px] truncate ${thread.unread ? 'font-semibold text-white/80' : 'text-white/40'}`}>
                      {thread.latest?.content || 'No messages yet — open the thread to start.'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}