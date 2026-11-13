import React, { useState } from 'react';
import { CalendarPlus } from 'lucide-react';
import { CHIP_TONE, statusChip } from '@/lib/threadStatus';
import { shootName, timeLabel, toDate } from '@/lib/format';
import { Btn, Chip, EmptyState, ErrorState, Row, Segmented, Skeleton } from '@/components/system';

/** The status chip's colour, in the design system's tones. */
const TONE = { cyan: 'sky', magenta: 'blush', lime: 'lime' };

function rowLink(booking, role) {
  if (role === 'client' && booking.delivered_at && ['delivered', 'completed'].includes(booking.status)) {
    return booking.album_token ? `/album/${booking.id}?t=${booking.album_token}` : `/album/${booking.id}`;
  }
  return `/messages/${booking.id}`;
}

/** The shoot's date as a little calendar leaf: "NOV / 26". */
function DateLeaf({ value }) {
  const date = toDate(value);
  return (
    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-fill text-center leading-none" aria-hidden>
      {date ? (
        <span>
          <span className="block text-[10px] font-bold uppercase tracking-[0.08em] text-fg-3">
            {date.toLocaleDateString('en-US', { month: 'short' })}
          </span>
          <span className="mt-1 block text-[18px] font-extrabold tracking-[-0.03em] text-fg">{date.getDate()}</span>
        </span>
      ) : (
        <span className="text-[11px] font-bold text-fg-3">TBD</span>
      )}
    </span>
  );
}

/**
 * Every shoot in one list. Tapping a shoot opens its conversation, which is
 * where quotes, payment and delivery all happen (or its album, once delivered).
 */
export default function ShootList({ active = [], past = [], role, isLoading, isError = false, onRetry, emptyText }) {
  const [tab, setTab] = useState('active');
  const list = tab === 'active' ? active : past;

  return (
    <section aria-labelledby="shoots-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="shoots-title" className="st-h2">Your shoots</h2>
        <Segmented
          label="Which shoots"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'active', label: 'Active', count: active.length },
            { value: 'past', label: 'Past', count: past.length },
          ]}
        />
      </div>

      <div className="mt-4" role="tabpanel" aria-label={tab === 'active' ? 'Active shoots' : 'Past shoots'}>
        {isError ? (
          <ErrorState title="Your shoots didn't load." onRetry={onRetry} className="st-card" />
        ) : isLoading ? (
          <div className="space-y-2" aria-busy="true" aria-label="Loading shoots">
            <Skeleton className="h-[72px] !rounded-st-md" />
            <Skeleton className="h-[72px] !rounded-st-md" />
          </div>
        ) : list.length ? (
          <div className="st-list">
            {list.map((booking) => {
              const chip = statusChip(booking);
              const who = role === 'client' ? booking.lensman_name || 'Your creator' : booking.client_name || 'Client';
              const meta = [shootName(booking.event_type, ''), timeLabel(booking.event_time), booking.location].filter(Boolean).join(' · ');
              return (
                <Row
                  key={booking.id}
                  to={rowLink(booking, role)}
                  leading={<DateLeaf value={booking.event_date} />}
                  title={who}
                  meta={meta}
                  trailing={
                    <Chip tone={TONE[CHIP_TONE[chip]] || 'neutral'} className="hidden shrink-0 min-[380px]:inline-flex">
                      {chip.charAt(0) + chip.slice(1).toLowerCase()}
                    </Chip>
                  }
                />
              );
            })}
          </div>
        ) : (
          <div className="st-card">
            <EmptyState
              icon={CalendarPlus}
              title={tab === 'active' ? 'No shoots in motion.' : 'Nothing finished yet.'}
              body={tab === 'active' ? emptyText : 'Finished and cancelled shoots land here.'}
              action={tab === 'active' && role === 'client' ? <Btn to="/creators" size="sm" arrow="end">Find a creator</Btn> : null}
            />
          </div>
        )}
      </div>
    </section>
  );
}
