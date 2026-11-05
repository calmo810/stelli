import React from 'react';
import { ArrowRight, CalendarDays, CircleDollarSign, ClipboardCheck, Users } from 'lucide-react';

const CARD = 'border border-white/10';
const SURFACE = { background: 'hsl(var(--surface))', borderRadius: 4 };

function eventDate(value) {
  if (!value) return 'Date not set';
  const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function AttentionCard({ icon: Icon, label, value, detail, tone, tab, onOpen }) {
  return (
    <div className={`${CARD} flex flex-col justify-between gap-8 p-5 sm:p-6`} style={SURFACE}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="label-mono text-[9px] text-white/45">{label}</p>
          <p className="mt-3 font-heading text-4xl font-semibold leading-none text-white">{value}</p>
        </div>
        <span
          className="grid h-10 w-10 place-items-center rounded-full"
          style={{ background: `hsl(var(--neon-${tone}) / 0.12)`, color: `hsl(var(--neon-${tone}))` }}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <div className="flex items-end justify-between gap-4">
        <p className="max-w-[220px] font-body text-[12px] leading-relaxed text-white/45">{detail}</p>
        <button
          type="button"
          onClick={() => onOpen(tab)}
          className="inline-flex shrink-0 items-center gap-2 text-[12px] font-semibold text-white transition-colors hover:text-neon-lime focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-lime"
        >
          Open <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default function AdminOverview({
  activeCreators,
  pendingCount,
  bookingCount,
  heldCount,
  bookings,
  isLoading,
  onOpenTab,
}) {
  const recentBookings = bookings.slice(0, 5);

  return (
    <div className="space-y-8">
      <section aria-labelledby="admin-queue-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="label-mono text-[9px] text-neon-lime">Today at a glance</p>
            <h2 id="admin-queue-title" className="mt-2 font-heading text-2xl font-semibold text-white">Operations</h2>
          </div>
          <p className="font-body text-[12px] text-white/40">A quick view of what needs attention.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <AttentionCard
            icon={ClipboardCheck}
            label="Creator applications"
            value={pendingCount}
            detail={pendingCount ? 'Review submitted profiles and make a decision.' : 'No creator applications are waiting.'}
            tone="cyan"
            tab="applications"
            onOpen={onOpenTab}
          />
          <AttentionCard
            icon={CircleDollarSign}
            label="Held funds queue"
            value={heldCount}
            detail={heldCount ? 'Review flagged bookings, disputes, or payout setup holds.' : 'No held bookings need attention.'}
            tone="magenta"
            tab="flagged"
            onOpen={onOpenTab}
          />
          <AttentionCard
            icon={CalendarDays}
            label="Bookings"
            value={bookingCount}
            detail="Browse the latest bookings and their current status."
            tone="lime"
            tab="bookings"
            onOpen={onOpenTab}
          />
        </div>
      </section>

      <section aria-labelledby="admin-recent-bookings-title" className={`${CARD} p-5 sm:p-6`} style={SURFACE}>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="label-mono text-[9px] text-white/40">Marketplace</p>
            <h2 id="admin-recent-bookings-title" className="mt-2 font-heading text-xl font-semibold text-white">Recent bookings</h2>
          </div>
          <button
            type="button"
            onClick={() => onOpenTab('bookings')}
            className="text-[12px] font-semibold text-neon-lime transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-lime"
          >
            View all
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3" aria-label="Loading recent bookings">
            {[0, 1, 2].map((item) => <div key={item} className="h-14 animate-pulse rounded bg-white/5" />)}
          </div>
        ) : recentBookings.length ? (
          <ul className="divide-y divide-white/10">
            {recentBookings.map((booking) => (
              <li key={booking.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate font-body text-[14px] font-medium text-white">
                    {booking.client_name || 'Client'} <span className="text-white/35">with</span> {booking.lensman_name || 'Creator'}
                  </p>
                  <p className="mt-1 text-[11px] text-white/40">
                    {booking.event_type?.replace(/_/g, ' ') || 'Booking'} · {eventDate(booking.event_date)}
                  </p>
                </div>
                <span className="label-mono rounded bg-white/5 px-2.5 py-1.5 text-[8px] text-white/60">
                  {booking.status?.replace(/_/g, ' ') || 'status unknown'}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-10 text-center font-body text-[13px] text-white/40">No bookings to show yet.</p>
        )}
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 border border-white/10 p-5 sm:p-6" style={SURFACE}>
        <div className="flex items-center gap-4">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-neon-lime/10 text-neon-lime">
            <Users className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="font-heading text-lg font-semibold text-white">{activeCreators} active creators</p>
            <p className="mt-1 font-body text-[12px] text-white/45">Approved profiles currently visible in the marketplace.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onOpenTab('lensmen')}
          className="rounded-full border border-white/15 px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:border-white/35 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-lime"
        >
          Browse creators
        </button>
      </section>
    </div>
  );
}
