import React, { useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { addDays, format } from 'date-fns';
import { ArrowUpRight, CalendarDays, ChevronRight, Sparkles } from 'lucide-react';
import PendingBanner from '@/components/dashboard/PendingBanner';
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
  const hour = hours % 12 || 12;
  return hour + ':' + match[2] + (hours >= 12 ? ' PM' : ' AM');
}

export default function CreatorOverview() {
  /** @type {any} */
  const data = useOutletContext();
  const {
    myProfile,
    bookings,
    steps,
    upcomingShoots,
    finished,
    metrics,
    money: totals,
  } = data;

  const [scheduleView, setScheduleView] = useState('upcoming');
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));
  const today = dateKey(new Date());
  const { items, facts } = whatsNew(data);

  const days = useMemo(() => {
    const start = new Date();
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
  }, []);

  const scheduledForDay = upcomingShoots.filter((item) => item.event_date === selectedDate);
  const scheduleItems = scheduleView === 'completed'
    ? finished.slice(0, 3)
    : scheduledForDay.length
      ? scheduledForDay
      : selectedDate === today
        ? upcomingShoots.slice(0, 3)
        : [];

  const attention = steps.slice(0, 3).map((step) => {
    const booking = bookings.find((item) => item.id === step.bookingId);
    return {
      id: step.id,
      title: step.title,
      meta: booking?.client_name || 'Creator workspace',
      action: step.key === 'request' ? 'Review' : step.action,
      to: step.key === 'request' ? '/lensman-dashboard/requests/' + step.bookingId : step.to,
    };
  });

  const summary = metrics.requests
    ? metrics.requests + ' request' + (metrics.requests === 1 ? '' : 's') + ' need your attention.'
    : upcomingShoots[0]
      ? 'Your next shoot is lined up.'
      : 'Your studio is open and ready.';

  return (
    <div className="arch-today">
      <header className="arch-masthead">
        <div className="arch-masthead__copy">
          <p className="arch-today__kicker">Creator studio · {format(new Date(), 'EEEE, MMM d')}</p>
          <h1>Today</h1>
          <strong>{summary}</strong>
          <small>Schedule, studio updates, and next actions in one focused view.</small>
        </div>
        <div className="arch-masthead__tools">
          <span className="arch-masthead__state">
            <i />
            {upcomingShoots[0] ? 'Shoot queued' : 'Studio open'}
          </span>
          <Link to="/lensman-dashboard/calendar" className="arch-masthead__calendar">
            Calendar <CalendarDays className="h-3.5 w-3.5" strokeWidth={2.4} />
          </Link>
        </div>
        <div className="arch-masthead__lens" aria-hidden="true">
          <span className="arch-masthead__ring arch-masthead__ring--outer" />
          <span className="arch-masthead__ring arch-masthead__ring--inner" />
          <span className="arch-masthead__star arch-masthead__star--one">✦</span>
          <span className="arch-masthead__star arch-masthead__star--two">✧</span>
          <span className="arch-masthead__camera">📸</span>
        </div>
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

      <div className="arch-today__grid">
        <section className="arch-schedule">
          <div className="arch-section-title">
            <div>
              <p>Your plan</p>
              <h2>{scheduleView === 'completed' ? 'Recently finished' : selectedDate === today ? 'Today' : format(new Date(selectedDate + 'T12:00:00'), 'EEEE')}</h2>
            </div>
            <Link to="/lensman-dashboard/calendar">
              Calendar <CalendarDays className="h-3.5 w-3.5" strokeWidth={2.3} />
            </Link>
          </div>

          {scheduleView === 'upcoming' && (
            <div className="arch-week" role="tablist" aria-label="Choose a day">
              {days.map((day) => {
                const key = dateKey(day);
                const hasBooking = upcomingShoots.some((item) => item.event_date === key);
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={key === selectedDate}
                    onClick={() => setSelectedDate(key)}
                    className={key === selectedDate ? 'is-on' : ''}
                  >
                    <span>{key === today ? 'Now' : format(day, 'EEE')}</span>
                    <b>{format(day, 'd')}</b>
                    <i className={hasBooking ? 'has-booking' : ''} />
                  </button>
                );
              })}
            </div>
          )}

          <div className="arch-switcher" role="tablist" aria-label="Upcoming or completed shoots">
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

          <div className="arch-agenda">
            {scheduleItems.length ? (
              scheduleItems.map((item) => (
                <Link
                  key={item.id}
                  to={scheduleView === 'upcoming' ? '/messages/' + item.id : '/lensman-dashboard/bookings'}
                  className="arch-agenda__item"
                >
                  <span className="arch-agenda__time">{timeLabel(item.event_time)}</span>
                  <span className="arch-agenda__copy">
                    <strong>{item.client_name || 'Client shoot'}</strong>
                    <small>{[item.event_type, item.location].filter(Boolean).join(' · ') || 'Shoot details'}</small>
                  </span>
                  <span className="arch-agenda__arrow"><ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.5} /></span>
                </Link>
              ))
            ) : (
              <div className="arch-agenda__empty">
                <CalendarDays className="h-4 w-4" strokeWidth={2.2} />
                <span>{scheduleView === 'completed' ? 'No completed shoots yet.' : 'Nothing is scheduled for this day.'}</span>
                <Link to="/lensman-dashboard/calendar">See calendar</Link>
              </div>
            )}
          </div>
        </section>

        <aside className="arch-console">
          <div className="arch-console__head">
            <p>Studio signal</p>
            <span>Live</span>
          </div>
          <TodayShootCard shoot={upcomingShoots[0]} profile={myProfile} />
          <WhatsNewCard items={items} facts={facts} />
        </aside>
      </div>

      <div className="arch-bottom">
        <section className="arch-needs">
          <div className="arch-section-title">
            <div>
              <p>Move work forward</p>
              <h2>Needs you</h2>
            </div>
            <span className="arch-today__stamp"><span>{attention.length}</span></span>
          </div>

          {attention.length ? (
            <div className="arch-needs__list">
              {attention.map((item) => (
                <Link key={item.id} to={item.to} className="arch-needs__row">
                  <span className="arch-needs__mark"><Sparkles className="h-3.5 w-3.5" strokeWidth={2.4} /></span>
                  <span className="arch-needs__copy">
                    <strong>{item.title}</strong>
                    <small>{item.meta}</small>
                  </span>
                  <em>{item.action}</em>
                  <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="arch-clear">
              <Sparkles className="h-4 w-4" strokeWidth={2.4} />
              <span>All caught up. Your studio is ready for the next brief.</span>
            </div>
          )}
        </section>

        <section className="arch-metrics">
          <div className="arch-section-title">
            <div>
              <p>Studio pulse</p>
              <h2>At a glance</h2>
            </div>
          </div>
          <div className="arch-metrics__grid">
            <div className="arch-metric">
              <span>Requests</span>
              <strong>{metrics.requests}</strong>
            </div>
            <div className="arch-metric arch-metric--lime">
              <span>Held</span>
              <strong>{money(totals.heldTotal)}</strong>
            </div>
            <div className="arch-metric">
              <span>Views</span>
              <strong>{metrics.views}</strong>
            </div>
          </div>
          <Link to="/lensman-dashboard/earnings" className="arch-metric__link">
            Review earnings <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.5} />
          </Link>
        </section>
      </div>
    </div>
  );
}
