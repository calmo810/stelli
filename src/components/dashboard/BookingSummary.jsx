import React from 'react';
import { Calendar, Clock, MapPin, StickyNote, Tag, UserRound } from 'lucide-react';
import { format } from 'date-fns';

export default function BookingSummary({ booking, className = '' }) {
  if (!booking) return null;

  const date = booking.event_date ? format(new Date(booking.event_date + 'T12:00:00'), 'MMM d, yyyy') : 'TBD';
  const price = booking.total_price ? `$${Number(booking.total_price).toLocaleString()}` : 'Private quote pending';
  const rows = [
    { icon: UserRound, label: 'Creator', value: booking.lensman_name || 'Creator' },
    { icon: Tag, label: 'Shoot type', value: booking.event_type?.replace(/_/g, ' ') || 'Custom shoot' },
    { icon: Calendar, label: 'Date', value: date },
    { icon: Clock, label: 'Time', value: booking.event_time || 'TBD' },
    { icon: MapPin, label: 'Location', value: booking.location || 'TBD' },
    { icon: Tag, label: 'Price', value: price },
  ];

  return (
    <div className={`border border-white/10 bg-white/[0.03] p-5 ${className}`} style={{ borderRadius: 4 }}>
      <p className="label-mono text-[10px] text-white/35 mb-4">Booking summary</p>
      <div className="grid sm:grid-cols-2 gap-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start gap-2.5">
            <row.icon className="w-3.5 h-3.5 mt-0.5 text-neon-lime shrink-0" />
            <div>
              <p className="label-mono text-[9px] text-white/30">{row.label}</p>
              <p className="font-body text-[13px] text-white/75 capitalize">{row.value}</p>
            </div>
          </div>
        ))}
      </div>
      {booking.event_description && (
        <div className="mt-4 pt-4 border-t border-white/10 flex items-start gap-2.5">
          <StickyNote className="w-3.5 h-3.5 mt-0.5 text-neon-lime shrink-0" />
          <div>
            <p className="label-mono text-[9px] text-white/30">Notes</p>
            <p className="font-body text-[13px] leading-relaxed text-white/70">{booking.event_description}</p>
          </div>
        </div>
      )}
    </div>
  );
}