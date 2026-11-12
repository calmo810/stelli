import React from 'react';
import {
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  ClipboardCheck,
  Sparkles,
  Users,
} from 'lucide-react';

function eventDate(value) {
  if (!value) return 'Date not set';
  const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function QueueCard({ icon: Icon, label, value, detail, tone, tab, onOpen }) {
  const color = `var(--chip-${tone}-fg)`;

  return (
    <button
      type="button"
      onClick={() => onOpen(tab)}
      className="admin-surface admin-surface--interactive group flex min-h-[208px] w-full flex-col justify-between p-5 text-left sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="st-kicker text-fg-3">{label}</p>
          <p className="mt-4 text-5xl font-semibold leading-none text-fg">{value}</p>
        </div>
        <span
          className="grid h-11 w-11 place-items-center rounded-2xl"
          style={{ background: `var(--chip-${tone}-bg)`, color }}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>

      <div className="flex items-end justify-between gap-4">
        <p className="max-w-[230px] text-[13px] leading-relaxed text-fg-3">{detail}</p>
        <span className="inline-flex items-center gap-2 text-[12px] font-semibold text-fg transition-colors group-hover:text-accent2">
          Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </div>
    </button>
  );
}

function BookingStatus({ status }) {
  const normalized = status?.replace(/_/g, ' ') || 'status unknown';
  const tone = ['completed', 'confirmed'].includes(status) ? 'lime' : status === 'pending' ? 'cyan' : 'magenta';

  return (
    <span
      className="st-kicker inline-flex rounded-full px-3 py-1.5 text-[8px] font-semibold"
      style={{ background: `var(--chip-${tone}-bg)`, color: `var(--chip-${tone}-fg)` }}
    >
      {normalized}
    </span>
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
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="admin-kicker st-kicker"><Sparkles className="h-3 w-3" aria-hidden="true" /> Priority desk</p>
            <h2 id="admin-queue-title" className="mt-4 text-3xl font-semibold tracking-tight text-fg">What needs you now</h2>
          </div>
          <p className="text-[13px] text-fg-3">Start with the queue, then move into the day-to-day.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <QueueCard
            icon={ClipboardCheck}
            label="Creator applications"
            value={pendingCount}
            detail={pendingCount ? 'Profiles with a decision waiting.' : 'No creator applications are waiting.'}
            tone="cyan"
            tab="applications"
            onOpen={onOpenTab}
          />
          <QueueCard
            icon={CircleDollarSign}
            label="Held funds"
            value={heldCount}
            detail={heldCount ? 'Payouts, disputes, or holds to resolve.' : 'No payment holds need attention.'}
            tone="magenta"
            tab="flagged"
            onOpen={onOpenTab}
          />
          <QueueCard
            icon={CalendarDays}
            label="Bookings"
            value={bookingCount}
            detail="See the latest requests and the status of every shoot."
            tone="lime"
            tab="bookings"
            onOpen={onOpenTab}
          />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="admin-surface p-5 sm:p-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="st-kicker text-fg-3">Marketplace pulse</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-fg">Recent bookings</h2>
            </div>
            <button
              type="button"
              onClick={() => onOpenTab('bookings')}
              className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-[12px] font-semibold text-fg-2 transition hover:border-line-2 hover:bg-fill-2 hover:text-fg"
            >
              View all <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3" aria-label="Loading recent bookings">
              {[0, 1, 2].map((item) => <div key={item} className="h-[76px] animate-pulse rounded-2xl bg-fill" />)}
            </div>
          ) : recentBookings.length ? (
            <ul className="space-y-2">
              {recentBookings.map((booking) => (
                <li key={booking.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-fill px-4 py-4 transition hover:bg-fill-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-fill-2 text-[13px] font-semibold text-accent2">
                      {(booking.client_name || 'C').slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold text-fg">
                        {booking.client_name || 'Client'} <span className="font-normal text-fg-3">with</span> {booking.lensman_name || 'Creator'}
                      </p>
                      <p className="mt-1 text-[12px] text-fg-3">
                        {booking.event_type?.replace(/_/g, ' ') || 'Booking'} · {eventDate(booking.event_date)}
                      </p>
                    </div>
                  </div>
                  <BookingStatus status={booking.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-12 text-center text-[13px] text-fg-3">No bookings to show yet.</p>
          )}
        </div>

        <aside className="admin-surface relative overflow-hidden p-6">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-fill-2 blur-2xl" aria-hidden="true" />
          <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-fill-2 text-accent2">
            <Users className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="relative mt-7 st-kicker text-fg-3">Marketplace health</p>
          <p className="relative mt-3 text-5xl font-semibold leading-none text-fg">{activeCreators}</p>
          <p className="relative mt-2 text-lg font-semibold text-fg">active creators</p>
          <p className="relative mt-3 text-[13px] leading-relaxed text-fg-3">
            Approved profiles currently visible for clients to book.
          </p>
          <button
            type="button"
            onClick={() => onOpenTab('lensmen')}
            className="relative mt-7 inline-flex items-center gap-2 text-[12px] font-semibold text-accent2 transition hover:text-fg"
          >
            Browse creators <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </aside>
      </section>
    </div>
  );
}
