import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { statusChip } from '@/lib/threadStatus';

function dateParts(booking) {
  if (!booking?.event_date) return { top: 'TBD', bottom: '' };
  const date = new Date(`${booking.event_date}T12:00:00`);
  return {
    top: date.toLocaleString('en-US', { month: 'short' }),
    bottom: date.getDate(),
  };
}

/** The next few shoots, so the day's work is visible without opening anything. */
export default function UpcomingShoots({ shoots = [], emptyText }) {
  if (!shoots.length) {
    return (
      <div className="wk-card px-[18px] py-5">
        <p className="wk-body">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="wk-list">
      {shoots.map((booking) => {
        const { top, bottom } = dateParts(booking);
        const meta = [
          booking.event_time,
          booking.event_type?.replace(/_/g, ' '),
          booking.location,
        ]
          .filter(Boolean)
          .join(' · ');

        return (
          <Link key={booking.id} to={`/messages/${booking.id}`} className="wk-row">
            {/* The rows sit on the dark list, so the date leaf is a light tint on it. */}
            <span className="grid h-[46px] w-[44px] shrink-0 place-items-center rounded-2xl bg-white/[0.12] leading-none" aria-hidden>
              <span className="text-[10px] font-bold uppercase tracking-wide text-white/75">{top}</span>
              <span className="mt-1 text-[17px] font-extrabold text-white">{bottom}</span>
            </span>
            <span className="min-w-0 flex-1">
              <b className="block truncate text-[15px] font-bold text-ink">
                {booking.client_name || 'Client'}
              </b>
              {meta && <span className="mt-0.5 block truncate text-[12.5px] capitalize wk-grey">{meta}</span>}
            </span>
            <span className="wk-chip wk-chip--cyan">{statusChip(booking)}</span>
            <ChevronRight className="h-4 w-4 shrink-0 wk-mute" strokeWidth={2.4} />
          </Link>
        );
      })}
    </div>
  );
}