import React, { useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { addDays, format } from 'date-fns';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, CalendarDays, ChevronRight, Sparkles } from 'lucide-react';
import PendingBanner from '@/components/dashboard/PendingBanner';
import TodayShootCard from '@/components/creator/workspace/TodayShootCard';
import WhatsNewCard from '@/components/creator/workspace/WhatsNewCard';
import whatsNew from '@/lib/creatorDigest';
import money from '@/lib/money';

const dateKey = (date) => format(date, 'yyyy-MM-dd');
const ASSEMBLY_EASE = [0.22, 1, 0.36, 1];

function DashboardAssembly({ reduceMotion }) {
  const transition = reduceMotion ? { duration: 0 } : { duration: .64, ease: ASSEMBLY_EASE };

  return (
    <motion.span
      className="arch-assembly"
      aria-hidden="true"
      initial={reduceMotion ? false : { opacity: 0, rotate: -18, scale: .72 }}
      animate={{ opacity: 1, rotate: 0, scale: 1 }}
      transition={{ ...transition, delay: .12 }}
    >
      <motion.i
        className="arch-assembly__orbit arch-assembly__orbit--one"
        initial={reduceMotion ? false : { rotate: -70, scale: .76 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ ...transition, delay: .20 }}
      />
      <motion.i
        className="arch-assembly__orbit arch-assembly__orbit--two"
        initial={reduceMotion ? false : { rotate: 52, scale: .72 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ ...transition, delay: .26 }}
      />
      <motion.i
        className="arch-assembly__dot arch-assembly__dot--lime"
        initial={reduceMotion ? false : { x: -25, y: 18, opacity: 0 }}
        animate={{ x: 0, y: 0, opacity: 1 }}
        transition={{ ...transition, delay: .28 }}
      />
      <motion.i
        className="arch-assembly__dot arch-assembly__dot--cyan"
        initial={reduceMotion ? false : { x: 23, y: -18, opacity: 0 }}
        animate={{ x: 0, y: 0, opacity: 1 }}
        transition={{ ...transition, delay: .34 }}
      />
    </motion.span>
  );
}

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
  const reduceMotion = useReducedMotion();
  const settle = reduceMotion ? { duration: 0 } : { duration: .56, ease: ASSEMBLY_EASE };
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));
  const today = dateKey(new Date());
  const creatorFirstName = String(myProfile?.display_name || '').trim().split(/\s+/)[0] || 'there';
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
      : 'You’re ready for new work.';

  return (
    <motion.div
      className="arch-world"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={settle}
    >
      <div className="arch-world__environment" aria-hidden="true">
        <span className="arch-world__horizon" />
        <span className="arch-world__beam arch-world__beam--cyan" />
        <span className="arch-world__beam arch-world__beam--violet" />
        <span className="arch-world__star arch-world__star--one">✦</span>
        <span className="arch-world__star arch-world__star--two">✧</span>
      </div>

      <motion.header
        className="arch-world__top"
        initial={reduceMotion ? false : { opacity: 0, y: 14, scale: .985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...settle, delay: .04 }}
      >
        <div className="arch-masthead__copy">
          <p className="arch-today__kicker">Today · {format(new Date(), 'EEEE, MMM d')}</p>
          <h1>Hi, {creatorFirstName}.</h1>
          <strong>{summary}</strong>
          <small>Your schedule, updates, and next steps.</small>
        </div>
        <div className="arch-masthead__tools">
          <span className="arch-masthead__state">
            <i />
            {upcomingShoots[0] ? 'Next up' : 'Available'}
          </span>
          <Link to="/lensman-dashboard/calendar" className="arch-masthead__calendar">
            Calendar <CalendarDays className="h-3.5 w-3.5" strokeWidth={2.4} />
          </Link>
        </div>
        <div className="arch-masthead__lens" aria-hidden="true">
          <DashboardAssembly reduceMotion={reduceMotion} />
          <span className="arch-masthead__ring arch-masthead__ring--outer" />
          <span className="arch-masthead__ring arch-masthead__ring--inner" />
          <span className="arch-masthead__star arch-masthead__star--one">✦</span>
          <span className="arch-masthead__star arch-masthead__star--two">✧</span>
          <span className="arch-masthead__camera">📸</span>
        </div>
      </motion.header>

      <div className="arch-world__notice">
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
      </div>

      <motion.main
        className="arch-world__stage"
        initial={reduceMotion ? false : { opacity: 0, y: 18, scale: .988 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...settle, delay: .13 }}
      >
        <section className="arch-runway">
          <div className="arch-section-title">
            <div>
              <p>Schedule</p>
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

        <aside className="arch-orbit">
          <div className="arch-orbit__head">
            <p>Next up</p>
            <span>Today</span>
          </div>
          <TodayShootCard shoot={upcomingShoots[0]} profile={myProfile} />
          <WhatsNewCard items={items} facts={facts} />
        </aside>
      </motion.main>

      <motion.footer
        className="arch-world__dock"
        initial={reduceMotion ? false : { opacity: 0, y: 13, scale: .99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...settle, delay: .22 }}
      >
        <section className="arch-needs">
          <div className="arch-section-title">
            <div>
              <p>Action list</p>
              <h2>Next steps</h2>
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
              <span>You’re all caught up.</span>
            </div>
          )}
        </section>

        <section className="arch-metrics">
          <div className="arch-section-title">
            <div>
              <p>Activity</p>
              <h2>Overview</h2>
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
      </motion.footer>
    </motion.div>
  );
}
