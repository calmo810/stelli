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
      <div className="glass rounded-[24px] px-[18px] py-5">
        <p className="text-[14px] text-white/50">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="glass overflow-hidden rounded-[24px]">
      {shoots.map((booking, i) => {
        const { top, bottom } = dateParts(booking);
        const meta = [
          booking.event_time,
          booking.event_type?.replace(/_/g, ' '),
          booking.location,
        ]
          .filter(Boolean)
          .join(' · ');

        return (
          <Link
            key={booking.id}
            to={`/messages/${booking.id}`}
            className={`flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-white/[0.05]${
              i ? ' border-t border-white/[0.08]' : ''
            }`}
          >
            <span className="grid h-[46px] w-[42px] shrink-0 place-items-center rounded-2xl bg-white/[0.07] text-center leading-none">
              <span className="text-[9.5px] font-semibold uppercase tracking-wide text-white/45">{top}</span>
              <span className="mt-1 font-display text-[17px] text-white">{bottom}</span>
            </span>
            <span className="min-w-0 flex-1">
              <b className="block truncate text-[15px] font-semibold text-white">
                {booking.client_name || 'Client'}
              </b>
              {meta && <small className="mt-0.5 block truncate text-[13px] capitalize text-white/50">{meta}</small>}
            </span>
            <span className="shrink-0 text-[10px] font-semibold text-white/40">{statusChip(booking)}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-white/30" strokeWidth={2.4} />
          </Link>
        );
      })}
    </div>
  );
}