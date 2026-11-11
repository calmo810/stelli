import React from 'react';
import { Sparkles } from 'lucide-react';
import SmoothImage from '@/components/shared/SmoothImage';

function longDate(value) {
  if (!value) return '';
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/** The album's front door: one photograph, the shoot's name, and who shot it. */
export default function AlbumCover({ booking, cover, count }) {
  const eventName = (booking?.event_type || 'your shoot').replace(/_/g, ' ').toLowerCase();
  const dateLabel = longDate(booking?.event_date);
  const meta = [booking?.lensman_name && `Shot by ${booking.lensman_name}`, dateLabel]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-surface">
      {cover ? (
        <SmoothImage
          src={cover.url}
          alt={cover.name || 'Your shoot'}
          priority
          className="h-[52vh] max-h-[520px] min-h-[290px] w-full object-cover"
        />
      ) : (
        <div
          className="h-[260px] w-full"
          style={{
            background:
              'radial-gradient(120% 120% at 20% 0%, hsl(var(--neon-lime) / 0.18), transparent 55%), linear-gradient(160deg, hsl(var(--surface-2)), hsl(var(--ink)))',
          }}
        />
      )}

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, hsl(var(--ink)) 4%, hsl(var(--ink) / 0.82) 32%, transparent 78%)',
        }}
      />

      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
        <p className="label-mono text-[10px] text-white/55">Memory album</p>
        <h1 className="stelli-display mt-2 max-w-[22ch] text-[30px] leading-[1.05] text-white sm:text-[46px]">
          <span className="capitalize">{eventName}</span>
        </h1>
        {meta && <p className="mt-3 text-[13px] text-white/60 sm:text-[14px]">{meta}</p>}
      </div>

      {count > 0 && (
        <span
          className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold"
          style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))' }}
        >
          <Sparkles className="h-3.5 w-3.5" strokeWidth={2.4} />
          {count} photo{count === 1 ? '' : 's'}
        </span>
      )}
    </div>
  );
}