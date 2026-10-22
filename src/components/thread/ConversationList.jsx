import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, isThisWeek, isThisYear, isToday, isYesterday } from 'date-fns';
import { ArrowLeft, Loader2, MessageCircle, Search } from 'lucide-react';
import { statusChip } from '@/lib/threadStatus';

const CHIP_TONE = {
  REQUESTED: 'cyan',
  'QUOTE SENT': 'magenta',
  CONFIRMED: 'lime',
  DELIVERED: 'lime',
  CANCELLED: 'magenta',
  'UNDER REVIEW': 'magenta',
};

function initials(name) {
  return String(name || 'S').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

/** Today shows a time, this week a weekday, anything older a date. */
function stamp(value) {
  if (!value) return '';
  const date = new Date(value);
  if (isToday(date)) return format(date, 'h:mm a');
  if (isYesterday(date)) return 'Yesterday';
  if (isThisWeek(date)) return format(date, 'EEE');
  return isThisYear(date) ? format(date, 'MMM d') : format(date, 'MMM d, yyyy');
}

function preview(thread) {
  if (thread.latest?.content) {
    return `${thread.latestIsMine ? 'You: ' : ''}${thread.latest.content}`;
  }
  const date = thread.booking.event_date
    ? format(new Date(`${thread.booking.event_date}T12:00:00`), 'EEE, MMM d')
    : '';
  return date ? `New request for ${date}` : 'New request';
}

/** Every conversation, newest first. Tap one to open it. */
export default function ConversationList({ threads, activeId, isLoading, unreadCount }) {
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return threads.filter((t) => {
      if (tab === 'unread' && !t.unread) return false;
      if (q && !String(t.otherName || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [threads, tab, query]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-4 pb-3 pt-5 sm:px-5">
        <div className="flex items-center gap-3">
          <Link
            to="/portal"
            aria-label="Back to your portal"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.07] text-white/70 transition-colors hover:text-white lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-[28px] font-semibold leading-none text-white">Messages</h1>
        </div>

        {threads.length > 0 && (
          <>
            <div className="glass mt-4 flex items-center gap-2.5 rounded-full px-4 py-2.5">
              <Search className="h-4 w-4 shrink-0 text-white/35" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name"
                className="min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-white/30"
              />
            </div>

            <div className="mt-3 flex gap-2">
              {[
                ['all', 'All'],
                ['unread', unreadCount ? `Unread · ${unreadCount}` : 'Unread'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className="rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors"
                  style={
                    tab === key
                      ? { background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))' }
                      : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4 sm:px-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-neon-lime" />
          </div>
        ) : threads.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <MessageCircle className="mx-auto mb-4 h-8 w-8 text-white/25" />
            <p className="text-[15px] font-semibold text-white/70">No conversations yet</p>
            <p className="mt-1 text-[13px] text-white/40">A conversation opens when a shoot request is sent.</p>
          </div>
        ) : shown.length === 0 ? (
          <p className="px-6 py-12 text-center text-[14px] text-white/40">
            {tab === 'unread' ? "You're all caught up." : 'No one by that name.'}
          </p>
        ) : (
          <ul className="space-y-1">
            {shown.map((thread) => {
              const chip = statusChip(thread.booking.status);
              const tone = CHIP_TONE[chip] || 'cyan';
              const active = thread.booking.id === activeId;
              return (
                <li key={thread.booking.id}>
                  <Link
                    to={`/messages/${thread.booking.id}`}
                    aria-current={active ? 'page' : undefined}
                    className="flex items-center gap-3.5 rounded-[22px] px-3 py-3.5 transition-colors hover:bg-white/[0.06]"
                    style={active ? { background: 'rgba(255,255,255,0.10)' } : undefined}
                  >
                    <span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-white/10">
                      {thread.otherPhoto ? (
                        <img src={thread.otherPhoto} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-[13px] font-semibold text-white/60">{initials(thread.otherName)}</span>
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <b className={`truncate text-[15px] ${thread.unread ? 'font-semibold text-white' : 'font-medium text-white/80'}`}>
                          {thread.otherName || 'Stelli user'}
                        </b>
                        <small className={`shrink-0 text-[12px] ${thread.unread ? 'font-semibold text-neon-lime' : 'text-white/35'}`}>
                          {stamp(thread.latest?.created_date || thread.booking.updated_date)}
                        </small>
                      </span>

                      <span className="mt-0.5 flex items-center gap-2">
                        <small className={`min-w-0 flex-1 truncate text-[13px] ${thread.unread ? 'font-semibold text-white/80' : 'text-white/45'}`}>
                          {preview(thread)}
                        </small>
                        {thread.unread && (
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ background: 'hsl(var(--neon-lime))' }}
                            aria-label="Unread"
                          />
                        )}
                      </span>

                      <span
                        className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ background: `hsl(var(--neon-${tone}) / 0.14)`, color: `hsl(var(--neon-${tone}))` }}
                      >
                        {chip}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
