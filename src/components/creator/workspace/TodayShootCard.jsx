import React from 'react';
import { ArrowUpRight, CalendarDays, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import CopyLinkPill from '@/components/dashboard/CopyLinkPill';
import money from '@/lib/money';

function whenLabel(eventDate) {
  if (!eventDate) return 'Open';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(eventDate + 'T00:00:00');
  const days = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days > 1) return 'In ' + days + ' days';
  return 'Completed';
}

function timeLabel(value) {
  if (!value) return 'Time to confirm';
  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!match) return value;
  const hours = Number(match[1]);
  return (hours % 12 || 12) + ':' + match[2] + (hours >= 12 ? ' PM' : ' AM');
}

export default function TodayShootCard({ shoot, profile }) {
  if (!shoot) {
    return (
      <section className="arch-open">
        <div className="arch-open__copy">
          <div className="arch-open__top">
            <span><Sparkles className="h-3 w-3" strokeWidth={2.5} /> Open studio</span>
            <b>Ready</b>
          </div>
          <h2>Your next booking has room to land.</h2>
          <p>Share your page when you want new work.</p>
          <span><CopyLinkPill creator={profile} tone="glass" className="arch-open__link" /></span>
        </div>
        <div className="arch-open__art" aria-hidden="true">
          <span className="arch-open__camera">📸</span>
        </div>
      </section>
    );
  }

  const date = shoot.event_date ? new Date(shoot.event_date + 'T12:00:00') : null;
  const type = shoot.event_type ? shoot.event_type.replace(/_/g, ' ') : 'Shoot';
  const details = [timeLabel(shoot.event_time), shoot.location].filter(Boolean).join(' · ');

  return (
    <section className="arch-booking">
      <div className="arch-booking__top">
        <span><CalendarDays className="h-3 w-3" strokeWidth={2.5} /> Next shoot</span>
        <b>{whenLabel(shoot.event_date)}</b>
      </div>
      <div className="arch-booking__main">
        <div className="arch-booking__date">
          <span>{date ? date.toLocaleDateString('en-US', { month: 'short' }) : 'TBD'}</span>
          <strong>{date ? date.getDate() : '—'}</strong>
        </div>
        <div>
          <h2>{shoot.client_name || 'Client shoot'}</h2>
          <p>{type}</p>
          <small>{details}</small>
        </div>
      </div>
      <div className="arch-booking__bottom">
        <span className="arch-booking__payout">
          <small>Your payout</small>
          <strong>{money(shoot.creator_payout)}</strong>
        </span>
        <Link to={'/messages/' + shoot.id} aria-label="Open this shoot">
          <ArrowUpRight className="h-4 w-4" strokeWidth={2.6} />
        </Link>
      </div>
    </section>
  );
}
