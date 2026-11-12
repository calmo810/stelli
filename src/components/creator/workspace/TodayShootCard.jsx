import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarDays } from 'lucide-react';
import CopyLinkPill from '@/components/dashboard/CopyLinkPill';
import money from '@/lib/money';

function whenLabel(eventDate) {
  if (!eventDate) return 'When a client books';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(eventDate + 'T00:00:00');
  const days = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days > 1) return 'In ' + days + ' days';
  return 'Recently passed';
}

function timeLabel(value) {
  if (!value) return 'Time to be confirmed';
  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!match) return value;
  const hourValue = Number(match[1]);
  const hour = hourValue % 12 || 12;
  return hour + ':' + match[2] + (hourValue >= 12 ? ' PM' : ' AM');
}

export default function TodayShootCard({ shoot, profile }) {
  if (!shoot) {
    return (
      <section className="today-feature today-feature--empty">
        <div className="today-feature__eyebrow">
          <span><CalendarDays className="h-3.5 w-3.5" strokeWidth={2.5} /> Next shoot</span>
          <b>Open</b>
        </div>
        <h2>Your next booking will live here.</h2>
        <p>Keep your page ready and share it when you want new work.</p>
        <CopyLinkPill creator={profile} />
      </section>
    );
  }

  const type = shoot.event_type ? shoot.event_type.replace(/_/g, ' ') : 'Shoot';
  const detail = [timeLabel(shoot.event_time), shoot.location].filter(Boolean).join(' · ');

  return (
    <section className="today-feature">
      <div className="today-feature__eyebrow">
        <span><CalendarDays className="h-3.5 w-3.5" strokeWidth={2.5} /> Next shoot</span>
        <b>{whenLabel(shoot.event_date)}</b>
      </div>

      <div className="today-feature__body">
        <div className="today-feature__date">
          <span>{shoot.event_date ? new Date(shoot.event_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' }) : 'TBD'}</span>
          <strong>{shoot.event_date ? new Date(shoot.event_date + 'T12:00:00').getDate() : '—'}</strong>
        </div>
        <div>
          <h2>{shoot.client_name || 'Client shoot'}</h2>
          <p>{type}</p>
          <small>{detail}</small>
        </div>
      </div>

      <div className="today-feature__footer">
        <span><small>Your payout</small><strong>{money(shoot.creator_payout)}</strong></span>
        <Link to={'/messages/' + shoot.id} aria-label="Open this shoot">
          <ArrowUpRight className="h-5 w-5" strokeWidth={2.6} />
        </Link>
      </div>
    </section>
  );
}
