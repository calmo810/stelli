import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Loader2 } from 'lucide-react';
import { format, isThisYear } from 'date-fns';
import SheetHead from '@/components/dashboard/stack/SheetHead';
import EmptyPanel from '@/components/dashboard/EmptyPanel';
import useThreads from '@/hooks/useThreads';

function initials(name) {
  return String(name || 'S').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

function timeLabel(value) {
  if (!value) return '';
  const date = new Date(value);
  return isThisYear(date) ? format(date, 'MMM d') : format(date, 'MMM d, yyyy');
}

export default function MessagesSheet() {
  const { threads, unreadCount, isLoading } = useThreads();

  return (
    <>
      <SheetHead
        title="Messages"
        subtitle={unreadCount ? `${unreadCount} unread` : 'Every shoot conversation.'}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'hsl(var(--neon-lime))' }} />
        </div>
      ) : threads.length === 0 ? (
        <EmptyPanel icon={MessageCircle} title="No conversations yet." body="Threads open when a shoot request is sent." />
      ) : (
        <div className="space-y-2">
          {threads.map((thread) => (
            <Link
              key={thread.booking.id}
              to={`/messages/${thread.booking.id}`}
              className="glass flex items-center gap-3.5 rounded-[22px] py-4 pl-[18px] pr-4 transition-colors hover:bg-white/[0.12]"
            >
              <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-white/10">
                {thread.otherPhoto ? (
                  <img src={thread.otherPhoto} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="label-mono text-[11px] text-white/60">{initials(thread.otherName)}</span>
                )}
                {thread.unread && (
                  <span
                    className="absolute bottom-0 right-0 h-3 w-3 rounded-full"
                    style={{ background: 'hsl(var(--neon-lime))', border: '2px solid hsl(var(--ink))' }}
                  />
                )}
              </span>

              <span className="min-w-0 flex-1">
                <b className={`block truncate text-[15px] ${thread.unread ? 'font-semibold text-white' : 'text-white/75'}`}>
                  {thread.otherName || 'Stelli user'}
                </b>
                <small className="mt-0.5 block truncate text-[13px] text-white/50">
                  {thread.latest?.content || thread.booking.event_description || 'Open the thread to start.'}
                </small>
              </span>

              <span className="label-mono shrink-0 text-[9px] text-white/30">
                {timeLabel(thread.latest?.created_date || thread.booking.updated_date)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}