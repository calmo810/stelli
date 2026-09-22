import React from 'react';
import { format } from 'date-fns';
import { Calendar, MapPin, Sparkles } from 'lucide-react';

/** The client's submitted request, as the first item in every thread. */
export default function RequestCard({ booking }) {
  return (
    <div className="border border-white/10 bg-surface p-5 sm:p-6" style={{ borderRadius: 4 }}>
      <div className="flex items-center justify-between gap-4 mb-4">
        <p className="label-mono text-[9px] text-white/35">Request</p>
        <p className="label-mono text-[9px] text-white/30">
          {booking?.created_date ? format(new Date(booking.created_date), 'MMM d') : ''}
        </p>
      </div>

      <h3 className="font-heading text-[22px] sm:text-[26px] font-semibold text-white leading-tight mb-4">
        {booking?.event_type || 'A shoot'}
      </h3>

      <div className="space-y-2.5 mb-4">
        <p className="flex items-center gap-2.5 font-body text-[13px] text-white/60">
          <Calendar className="w-3.5 h-3.5 text-white/30" />
          {booking?.event_date
            ? format(new Date(`${booking.event_date}T12:00:00`), 'EEEE, MMMM d, yyyy')
            : 'Date to be confirmed'}
          {booking?.event_time ? ` · ${booking.event_time}` : ''}
        </p>
        {booking?.location && (
          <p className="flex items-center gap-2.5 font-body text-[13px] text-white/60">
            <MapPin className="w-3.5 h-3.5 text-white/30" />
            {booking.location}
          </p>
        )}
      </div>

      {booking?.event_description && (
        <p className="font-body text-[14px] leading-relaxed text-white/75 border-l-2 pl-4" style={{ borderColor: 'hsl(var(--neon-cyan) / 0.4)' }}>
          {booking.event_description}
        </p>
      )}

      <p className="flex items-center gap-2 label-mono text-[9px] text-white/30 mt-5">
        <Sparkles className="w-3 h-3" />
        Nothing is charged until you accept a quote
      </p>
    </div>
  );
}