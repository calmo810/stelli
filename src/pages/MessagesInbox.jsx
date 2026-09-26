import React from 'react';
import { Link } from 'react-router-dom';
import { format, isThisYear } from 'date-fns';
import { MessageCircle, Loader2 } from 'lucide-react';
import useThreads from '@/hooks/useThreads';

function initials(name) {
  return String(name || 'S').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

function timeLabel(value) {
  if (!value) return '';
  const date = new Date(value);
  return isThisYear(date) ? format(date, 'MMM d') : format(date, 'MMM d, yyyy');
}

export default function MessagesInbox() {
  const { threads, unreadCount, isLoading } = useThreads();

  return (
    <div className="min-h-screen bg-ink px-5 md:px-10 pt-28 pb-24">
      <div className="max-w-3xl mx-auto">
        <p className="label-mono text-[10px] text-neon-lime mb-4">Messages</p>
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