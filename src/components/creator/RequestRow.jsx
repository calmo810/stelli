import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { statusChip } from '@/lib/threadStatus';
import { deadlineFor } from '@/hooks/useCreatorPortal';
import { effectiveStatus } from '@/lib/bookingNextStep';

/** One booking request in a list, with everything needed to triage it. */
export default function RequestRow({ booking }) {
  const date = booking.event_date
    ? format(new Date(`${booking.event_date}T12:00:00`), 'EEE, MMM d')
    : 'Date open';

  const isNew = effectiveStatus(booking) === 'requested';
  const hours = isNew && booking.created_date
    ? Math.round((deadlineFor(booking).getTime() - Date.now()) / 3600000)
    : null;

  const late = hours !== null && hours <= 0;
  const closing = hours !== null && hours > 0 && hours <= 12;

  const meta = [booking.event_time, date, booking.location].filter(Boolean).join(' · ');

  return (
    <Link
      to={`/lensman-dashboard/requests/${booking.id}`}
      className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.05]"
    >
      <span className="min-w-0 flex-1">
        <b className="block truncate text-[15px] font-semibold text-white">
          {booking.client_name || 'Client'}
        </b>
        <small className="mt-0.5 block truncate text-[13px] capitalize text-white/55">
          {booking.event_type || 'A shoot'}
        </small>
        <small className="mt-0.5 block truncate text-[12px] text-white/40">{meta}</small>
      </span>

      <span className="shrink-0 text-right">
        {booking.budget && (
          <small className="block text-[12px] font-semibold text-white/70">{booking.budget}</small>
        )}
        {hours !== null ? (
          <small
            className="mt-0.5 block text-[11px] font-medium"
            style={{
              color: late
                ? 'hsl(var(--neon-magenta))'
                : closing
                  ? 'hsl(var(--neon-cyan))'
                  : 'rgba(255,255,255,0.35)',
            }}
          >
            {late ? 'Reply past due' : `${hours}h to reply`}
          </small>
        ) : (
          <small className="mt-0.5 block text-[10.5px] font-semibold text-white/35">
            {statusChip(booking)}
          </small>
        )}
      </span>

      <ChevronRight className="h-4 w-4 shrink-0 text-white/30" strokeWidth={2.4} />
    </Link>
  );
}