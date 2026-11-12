import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import SegmentedTabs from '@/components/dashboard/SegmentedTabs';
import { CHIP_TONE, statusChip } from '@/lib/threadStatus';
import { shortDate } from '@/lib/format';

function rowLink(booking, role) {
  if (role === 'client' && booking.delivered_at && ['delivered', 'completed'].includes(booking.status)) {
    return booking.album_token ? `/album/${booking.id}?t=${booking.album_token}` : `/album/${booking.id}`;
  }
  return `/messages/${booking.id}`;
}

/**
 * Every shoot in one list. Tapping a shoot opens its conversation,
 * which is where quotes, payment and delivery all happen.
 */
export default function ShootList({ active = [], past = [], role, isLoading, emptyText }) {
  const [tab, setTab] = useState('active');
  const list = tab === 'active' ? active : past;

  return (
    <section>
      <SegmentedTabs
        value={tab}
        onChange={setTab}
        options={[
          { value: 'active', label: 'Active', count: active.length },
          { value: 'past', label: 'Past', count: past.length },
        ]}
      />

      <div className="mt-3">
        {isLoading ? (
          <div className="st-card h-[132px] animate-pulse rounded-3xl" />
        ) : list.length ? (
          <div className="st-card overflow-hidden rounded-3xl">
            {list.map((booking, i) => {
              const chip = statusChip(booking);
              const tone = CHIP_TONE[chip] || 'cyan';
              const who = role === 'client' ? booking.lensman_name || 'Your creator' : booking.client_name || 'Client';
              const meta = [
                booking.event_type ? booking.event_type.replace(/_/g, ' ') : null,
                shortDate(booking.event_date),
              ]
                .filter(Boolean)
                .join(' · ');

              return (
                <Link
                  key={booking.id}
                  to={rowLink(booking, role)}
                  className={`flex items-center gap-3.5 px-[18px] py-3.5 transition-colors hover:bg-fill-2${
                    i ? ' border-t border-line' : ''
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-[15px] font-medium text-fg">{who}</b>
                    {meta && <small className="mt-0.5 block truncate text-[13px] capitalize text-fg-3">{meta}</small>}
                  </span>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ background: `var(--chip-${tone}-bg)`, color: `var(--chip-${tone}-fg)` }}
                  >
                    {chip}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-fg-3" strokeWidth={2.4} />
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="st-card rounded-3xl px-[18px] py-4">
            <p className="text-[14px] text-fg-3">{tab === 'active' ? emptyText : 'Finished shoots will show up here.'}</p>
          </div>
        )}
      </div>
    </section>
  );
}
