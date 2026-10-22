import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, ChevronDown, MapPin } from 'lucide-react';

/**
 * The client's request, kept small at the top of the chat so the conversation
 * stays the star. Tap it to read the note they wrote.
 */
export default function RequestSummary({ booking }) {
  const [open, setOpen] = useState(false);
  const note = booking?.event_description;
  const date = booking?.event_date
    ? format(new Date(`${booking.event_date}T12:00:00`), 'EEE, MMM d, yyyy')
    : 'Date to be confirmed';

  return (
    <div className="glass rounded-[22px]">
      <button
        type="button"
        onClick={() => note && setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left"
        style={{ cursor: note ? 'pointer' : 'default' }}
      >
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-white/40">
            REQUEST{booking?.created_date ? ` · ${format(new Date(booking.created_date), 'MMM d')}` : ''}
          </p>
          <p className="mt-1 truncate text-[16px] font-semibold text-white">
            {booking?.event_type || 'A shoot'}
          </p>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-white/60">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-white/35" />
              {date}
              {booking?.event_time ? ` · ${booking.event_time}` : ''}
            </span>
            {booking?.location && (
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-white/35" />
                <span className="truncate">{booking.location}</span>
              </span>
            )}
          </p>
        </div>
        {note && (
          <ChevronDown
            className={`mt-1 h-4 w-4 shrink-0 text-white/35 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {open && note && (
        <p className="mx-4 mb-4 rounded-2xl bg-white/[0.05] px-4 py-3 text-[14px] leading-relaxed text-white/75">
          {note}
        </p>
      )}
    </div>
  );
}
