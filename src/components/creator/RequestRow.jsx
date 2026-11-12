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
    <Link to={`/lensman-dashboard/requests/${booking.id}`} className="wk-row">
      <span className="min-w-0 flex-1">
        <b className="block truncate text-[15px] font-bold text-ink">{booking.client_name || 'Client'}</b>
        <span className="mt-0.5 block truncate text-[12.5px] capitalize wk-grey">
          {booking.event_type || 'A shoot'}
        </span>
        {meta && <span className="mt-0.5 block truncate text-[12px] wk-mute">{meta}</span>}
      </span>

      <span className="shrink-0 text-right">
        {booking.budget && (
          <span className="block text-[12px] font-bold wk-grey">{booking.budget}</span>
        )}
        {hours !== null ? (
          <span className={`wk-chip mt-1 ${late ? 'wk-chip--blush' : closing ? 'wk-chip--amber' : 'wk-chip--cyan'}`}>
            {late ? 'Reply past due' : `${hours}h left`}
          </span>
        ) : (
          <span className="wk-chip mt-1">{statusChip(booking)}</span>
        )}
      </span>

      <ChevronRight className="h-4 w-4 shrink-0 wk-mute" strokeWidth={2.4} />
    </Link>
  );
}