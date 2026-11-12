import React, { useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { addDays, format } from 'date-fns';
import { ArrowUpRight, CalendarDays, ChevronRight, Sparkles } from 'lucide-react';
import PendingBanner from '@/components/dashboard/PendingBanner';
import CopyLinkPill from '@/components/dashboard/CopyLinkPill';
import TodayShootCard from '@/components/creator/workspace/TodayShootCard';
import WhatsNewCard from '@/components/creator/workspace/WhatsNewCard';
import whatsNew from '@/lib/creatorDigest';
import money from '@/lib/money';

const dateKey = (date) => format(date, 'yyyy-MM-dd');

function timeLabel(value) {
  if (!value) return 'Time TBD';
  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!match) return value;
  const hours = Number(match[1]);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour = hours % 12 || 12;
  return hour + ':' + match[2] + ' ' + suffix;
}

export default function CreatorOverview() {
  const data = useOutletContext();
  const {
    user,
    myProfile,
    bookings,
    steps,
    newRequests,
    upcomingShoots,
    finished,
    metrics,
    money: totals,
  } = data;

  const [scheduleView, setScheduleView] = useState('upcoming');
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));
  const firstName = (user?.full_name || '').split(' ')[0] || 'there';
  const { items, facts } = whatsNew(data);

  const days = useMemo(() => {
    const start = new Date();
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
  }, []);

  const sourceItems = scheduleView === 'upcoming' ? upcomingShoots : finished;
  const selectedItems = sourceItems.filter((item) => item.event_date === selectedDate);
  const scheduleItems = selectedItems.length
    ? selectedItems
    : selectedDate === dateKey(new Date())
      ? sourceItems.slice(0, 2)
      : [];

  const attention = steps.slice(0, 2).map((step) => {
    const booking = bookings.find((item) => item.id === step.bookingId);
    return {
      id: step.id,
      title: step.title,
      meta: booking?.client_name || 'Creator workspace',
      action: step.key === 'request' ? 'Review' : step.action,
      to: step.key === 'request' ? '/lensman-dashboard/requests/' + step.bookingId : step.to,
    };
  });

  const nextShoot = upcomingShoots[0];
  const activeCount = sourceItems.length;
  const dateTitle = selectedDate === dateKey(new Date())
    ? 'Today'
    : format(new Date(selectedDate + 'T12:00:00'), 'EEEE');

  return (
    <div className="today-screen">
      <header className="today-header">
        <div>
          <p className="today-eyebrow">Creator studio</p>
          <h1>Today</h1>
          <p className="today-date">{format(new Date(), 'EEEE, MMMM d')}</p>
        </div>
        <Link to="/lensman-dashboard/profile" className="today-avatar" aria-label="Open your profile">
          {myProfile?.profile_image ? (
            <img src={myProfile.profile_image} alt="" />
          ) : (
            (myProfile?.display_name || firstName).trim()[0].toUpperCase()
          )}
        </Link>
      </header>

      {myProfile.under_review ? (
        <PendingBanner tone="magenta">
          Your profile is on hold while the Stelli team reviews it. Your current bookings carry on.
        </PendingBanner>
      ) : myProfile.status === 'pending' ? (
        <PendingBanner />
      ) : myProfile.status === 'rejected' ? (
        <PendingBanner tone="magenta">
          Your application wasn&apos;t approved, so your profile isn&apos;t public. Email getstelli@gmail.com with any questions.
        </PendingBanner>
      ) : null}

      <section className="today-greeting">
        <p>Hi, {firstName}.</p>
        <strong>
          {metrics.requests
            ? metrics.requests + ' request' + (metrics.requests === 1 ? '' : 's') + ' need your attention.'
            : nextShoot
              ? 'Your next shoot is lined up.'
              : 'Your day is clear and ready.'}
        </strong>
      </section>

      <TodayShootCard shoot={nextShoot} profile={myProfile} />

      <section className="today-schedule">
        <div className="today-section-heading">
          <div>
            <p className="today-eyebrow">Your plan</p>
            <h2>{dateTitle}</h2>
          </div>
          <Link to="/lensman-dashboard/calendar" className="today-icon-link" aria-label="Open full calendar">
            <CalendarDays className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </Link>
        </div>

        <div className="today-date-strip" role="tablist" aria-label="Choose a day">
          {days.map((day) => {
            const key = dateKey(day);
            const count = upcomingShoots.filter((item) => item.event_date === key).length;
            const isOn = key === selectedDate;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={isOn}
                onClick={() => setSelectedDate(key)}
                className={isOn ? 'is-on' : ''}
              >
                <span>{key === dateKey(new Date()) ? 'Today' : format(day, 'EEE')}</span>
                <b>{format(day, 'd')}</b>
                <i className={count ? 'has-item' : ''} />
              </button>
            );
          })}
        </div>

        <div className="today-view-tabs" role="tablist" aria-label="Upcoming or completed shoots">
          <button
            type="button"
            role="tab"
            aria-selected={scheduleView === 'upcoming'}
            onClick={() => setScheduleView('upcoming')}
            className={scheduleView === 'upcoming' ? 'is-on' : ''}
          >
            Upcoming <span>{upcomingShoots.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={scheduleView === 'completed'}
            onClick={() => setScheduleView('completed')}
            className={scheduleView === 'completed' ? 'is-on' : ''}
          >
            Completed <span>{finished.length}</span>
          </button>
        </div>

        <div className="today-agenda">
          {scheduleItems.length ? (
            scheduleItems.map((item) => (
              <Link
                key={item.id}
                to={scheduleView === 'upcoming' ? '/messages/' + item.id : '/lensman-dashboard/bookings'}
                className="today-agenda-card"
              >
                <span className="today-agenda-time">{timeLabel(item.event_time)}</span>
                <span className="today-agenda-copy">
                  <strong>{item.client_name || 'Client shoot'}</strong>
                  <small>{[item.event_type, item.location].filter(Boolean).join(' · ') || 'Shoot details'}</small>
                </span>
                <span className="today-agenda-action">
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
                </span>
              </Link>
            ))
          ) : (
            <div className="today-empty">
              <CalendarDays className="h-5 w-5" strokeWidth={2.1} />
              <p>{activeCount ? 'Nothing is scheduled for this day.' : 'No shoots are on the books yet.'}</p>
              <Link to="/lensman-dashboard/calendar">Open calendar</Link>
            </div>
          )}
        </div>
      </section>

      <WhatsNewCard items={items} facts={facts} />

      <section className="today-needs">
        <div className="today-section-heading">
          <div>
            <p className="today-eyebrow">Stay on top of it</p>
            <h2>Needs you</h2>
          </div>
          <span className="today-count">{attention.length}</span>
        </div>
        {attention.length ? (
          <div className="today-needs-list">
            {attention.map((item) => (
              <Link key={item.id} to={item.to} className="today-needs-row">
                <span className="today-needs-mark"><Sparkles className="h-3.5 w-3.5" strokeWidth={2.4} /></span>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.meta}</small>
                </span>
                <em>{item.action}</em>
                <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="today-all-clear">
            <strong>All caught up.</strong>
            <span>Share your page when you&apos;re ready for your next shoot.</span>
            <CopyLinkPill creator={myProfile} />
          </div>
        )}
      </section>

      <section className="today-money">
        <div>
          <span>Held for you</span>
          <strong>{money(totals.heldTotal)}</strong>
        </div>
        <Link to="/lensman-dashboard/earnings">
          Earnings <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.4} />
        </Link>
      </section>
    </div>
  );
}
