import React from 'react';
import { format } from 'date-fns';
import { Calendar, MapPin, Sparkles } from 'lucide-react';

/** The client's submitted request, as the first item in every thread. */
export default function RequestCard({ booking }) {
  return (
    <div className="glass rounded-[26px] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[11px] font-semibold text-white/40">REQUEST</p>
        <p className="text-[11px] text-white/30">
          {booking?.created_date ? format(new Date(booking.created_date), 'MMM d') : ''}
        </p>
      </div>

      <h3 className="mt-3 text-[22px] font-semibold leading-tight text-white">
        {booking?.event_type || 'A shoot'}
      </h3>

      <div className="mt-3 space-y-2">
        <p className="flex items-center gap-2.5 text-[15px] text-white/70">
          <Calendar className="h-4 w-4 shrink-0 text-white/35" />
          {booking?.event_date
            ? format(new Date(`${booking.event_date}T12:00:00`), 'EEEE, MMMM d, yyyy')
            : 'Date to be confirmed'}
          {booking?.event_time ? ` · ${booking.event_time}` : ''}
        </p>
        {booking?.location && (
          <p className="flex items-center gap-2.5 text-[15px] text-white/70">
            <MapPin className="h-4 w-4 shrink-0 text-white/35" />
            {booking.location}
          </p>
        )}
      </div>

      {booking?.event_description && (
        <p className="mt-4 rounded-2xl bg-white/[0.05] px-4 py-3 text-[15px] leading-relaxed text-white/75">
          {booking.event_description}
        </p>
      )}

      <p className="mt-4 flex items-center gap-2 text-[12px] text-white/40">
        <Sparkles className="h-3.5 w-3.5" />
        Nothing is charged until you accept a quote
      </p>
    </div>
  );
}