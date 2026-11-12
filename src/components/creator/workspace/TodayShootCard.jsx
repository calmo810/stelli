import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import CopyLinkPill from '@/components/dashboard/CopyLinkPill';
import money from '@/lib/money';
import { statusChip } from '@/lib/threadStatus';

/** How far away the shoot is, in the fewest words that still say it. */
function whenLabel(eventDate) {
  if (!eventDate) return 'Date to be decided';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${eventDate}T00:00:00`);
  const days = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days > 1) return `In ${days} days`;
  return 'Date passed';
}

/** The one shoot that matters next, sized to be the first thing seen. */
export default function TodayShootCard({ shoot, profile }) {
  if (!shoot) {
    return (
      <div className="wk-card wk-card--pad">
        <p className="wk-label">Next shoot</p>
        <p className="wk-title mt-2">Nothing booked yet.</p>
        <p className="wk-body mt-1">Share your page to land your first date.</p>
        <div className="mt-4">
          <CopyLinkPill creator={profile} />
        </div>
      </div>
    );
  }

  const date = shoot.event_date ? new Date(`${shoot.event_date}T12:00:00`) : null;
  const type = shoot.event_type ? shoot.event_type.replace(/_/g, ' ') : 'Shoot';
  const where = [shoot.event_time, shoot.location].filter(Boolean).join(' · ');

  return (
    <div className="wk-card wk-card--pad">
      <div className="flex items-start justify-between gap-3">
        <p className="wk-label">Next shoot</p>
        <span className="wk-chip wk-chip--lime">{whenLabel(shoot.event_date)}</span>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className="wk-tile wk-tile--lime grid h-[78px] w-[66px] shrink-0 place-items-center">
          <span className="wk-label !text-[9px]">{date ? format(date, 'MMM') : 'TBD'}</span>
          <span className="text-[28px] font-extrabold leading-none tracking-tight text-ink">
            {date ? format(date, 'd') : '—'}
          </span>
        </div>
        <div className="min-w-0">
          <p className="wk-title truncate">{shoot.client_name || 'Client'}</p>
          <p className="wk-body mt-1 capitalize">{type}</p>
          {where && <p className="wk-small mt-0.5 truncate capitalize">{where}</p>}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="wk-tile">
          <p className="wk-label">Your payout</p>
          <p className="mt-1 text-[15px] font-extrabold tracking-tight text-ink">
            {money(shoot.creator_payout)}
          </p>
          <p className="wk-small">Held until delivery</p>
        </div>
        <div className="wk-tile">
          <p className="wk-label">Status</p>
          <p className="mt-1.5">
            <span className="wk-chip wk-chip--cyan">{statusChip(shoot)}</span>
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Link to={`/messages/${shoot.id}`} className="wk-btn wk-btn--ink flex-1">
          Open the thread
        </Link>
        <Link to="/lensman-dashboard/bookings" className="wk-btn wk-btn--ghost">
          All shoots
        </Link>
      </div>
    </div>
  );
}