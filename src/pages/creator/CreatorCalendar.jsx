import React, { useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { addDays, format } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, Download, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { todayKey } from '@/hooks/useCreatorPortal';
import { downloadCreatorCalendar } from '@/lib/creatorCalendarExport';

const WINDOW_DAYS = 7;
const INK = '#0a1226';
const LIME = '#c4f82a';

function keyOf(date) {
  return format(date, 'yyyy-MM-dd');
}

/** "14:30" reads as 2:30 PM; anything else is left as the client wrote it. */
function timeLabel(value) {
  if (!value) return 'Time TBD';
  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!match) return value;
  const hours = Number(match[1]);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour = hours % 12 === 0 ? 12 : hours % 12;
  return hour + ':' + match[2] + ' ' + suffix;
}

/** A focused seven-day view: easy to scan, with calm week-to-week navigation. */
export default function CreatorCalendar() {
  const { confirmed, newRequests, myProfile, refetchProfile } = useOutletContext();
  const [selected, setSelected] = useState(() => new Date());
  const [visibleStart, setVisibleStart] = useState(() => new Date());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const blackouts = Array.isArray(myProfile?.blackout_dates) ? myProfile.blackout_dates : [];
  const today = todayKey();

  const strip = useMemo(() => {
    const start = new Date(visibleStart);
    start.setHours(0, 0, 0, 0);
    return Array.from({ length: WINDOW_DAYS }, (_, i) => addDays(start, i));
  }, [visibleStart]);

  const byDate = useMemo(() => {
    const map = {};
    const add = (booking, kind) => {
      if (!booking.event_date) return;
      map[booking.event_date] = map[booking.event_date] || [];
      map[booking.event_date].push({ ...booking, kind });
    };
    confirmed.forEach((booking) => add(booking, 'shoot'));
    newRequests.forEach((booking) => add(booking, 'request'));
    return map;
  }, [confirmed, newRequests]);

  const selectedKey = keyOf(selected);
  const dayItems = [...(byDate[selectedKey] || [])].sort((a, b) =>
    String(a.event_time || '99:99').localeCompare(String(b.event_time || '99:99'))
  );
  const offOnSelected = blackouts.includes(selectedKey);
  const canToggle = selectedKey >= today;
  const canExport = confirmed.some((booking) => booking.event_date >= today);

  const moveWeek = (direction) => {
    const nextStart = addDays(visibleStart, direction * WINDOW_DAYS);
    setVisibleStart(nextStart);
    setSelected(nextStart);
  };

  const toggleAvailability = async () => {
    setSaving(true);
    setError('');
    const next = offOnSelected
      ? blackouts.filter((day) => day !== selectedKey)
      : [...blackouts, selectedKey].sort();

    try {
      const response = await base44.functions.invoke('updateCreatorProfile', { blackout_dates: next });
      if (response.data?.error) {
        setError(response.data.error);
        return;
      }
      await refetchProfile();
    } catch (e) {
      setError(e?.response?.data?.error || 'That did not save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="arch-tab arch-tab--calendar">
      <div className="calendar-head">
        <div className="arch-tab__heading">
          <h1 className="wk-h1">Schedule</h1>
          <p className="wk-lede">Your next seven days, with each shoot and request in one clear view.</p>
        </div>

        <section className="calendar-export" aria-label="Calendar export">
          <span className="calendar-export__icon">
            <CalendarDays className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <div className="calendar-export__copy">
            <p className="calendar-export__eyebrow">Calendar export</p>
            <p className="calendar-export__title">Confirmed shoots</p>
            <p className="calendar-export__detail">Apple Calendar · Google Calendar</p>
          </div>
          <button
            type="button"
            onClick={() => downloadCreatorCalendar(confirmed)}
            disabled={!canExport}
            className="calendar-export__button"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={2.5} />
            Export .ics
          </button>
        </section>
      </div>

      <section className="calendar-rail" aria-label="Week selector">
        <div className="calendar-rail__top">
          <div>
            <p className="calendar-rail__eyebrow">Week view</p>
            <p className="calendar-rail__range">
              {format(strip[0], 'MMM d') + ' — ' + format(strip[strip.length - 1], 'MMM d')}
            </p>
          </div>
          <div className="calendar-nav">
            <button type="button" onClick={() => moveWeek(-1)} aria-label="Previous week">
              <ChevronLeft className="h-4 w-4" strokeWidth={2.4} />
            </button>
            <button type="button" onClick={() => moveWeek(1)} aria-label="Next week">
              <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
            </button>
          </div>
        </div>

        <div className="wk-strip calendar-week-strip">
          {strip.map((day) => {
            const key = keyOf(day);
            const items = byDate[key] || [];
            const hasShoot = items.some((item) => item.kind === 'shoot');
            const hasRequest = items.some((item) => item.kind === 'request');
            const isOn = key === selectedKey;
            const off = blackouts.includes(key);

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(day)}
                aria-pressed={isOn}
                aria-label={format(day, 'EEEE, MMMM d')}
                className={['wk-day', isOn && 'is-on', key === today && 'is-today', off && 'is-off'].filter(Boolean).join(' ')}
              >
                <span className="wk-day-w">{key === today ? 'Today' : format(day, 'EEE')}</span>
                <span className="wk-day-n">{format(day, 'd')}</span>
                <span className="wk-day-dots">
                  {hasShoot && <i style={{ background: isOn ? 'rgba(255,255,255,.9)' : INK }} />}
                  {hasRequest && <i style={{ background: LIME }} />}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="calendar-day">
        <div className="calendar-day__top">
          <div>
            <p className="calendar-day__eyebrow">
              {selectedKey === today ? 'Today' : format(selected, 'EEEE')}
            </p>
            <h2>{format(selected, 'MMMM d')}</h2>
            <p className="calendar-day__status">
              {dayItems.length
                ? dayItems.length + (dayItems.length === 1 ? ' item scheduled' : ' items scheduled')
                : offOnSelected
                  ? 'Unavailable'
                  : 'Open day'}
            </p>
          </div>

          {canToggle ? (
            <button
              type="button"
              onClick={toggleAvailability}
              disabled={saving}
              className="calendar-availability"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {offOnSelected ? 'Mark available' : 'Mark unavailable'}
            </button>
          ) : (
            <span className="calendar-day__past">Past date</span>
          )}
        </div>

        <div className="calendar-day__content">
          {dayItems.length ? (
            dayItems.map((item) => {
              const shoot = item.kind === 'shoot';
              const meta = [item.event_type, item.location].filter(Boolean).join(' · ');
              return (
                <Link
                  key={item.id}
                  to={shoot ? '/messages/' + item.id : '/lensman-dashboard/requests/' + item.id}
                  className={['wk-appt', shoot ? 'is-shoot' : 'is-request'].join(' ')}
                >
                  <span className="wk-appt-time">
                    <b>{timeLabel(item.event_time)}</b>
                    <small>{item.duration || (shoot ? 'Booked' : 'To answer')}</small>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <b className="truncate text-[15px] font-extrabold tracking-tight text-ink">
                        {item.client_name || 'Client'}
                      </b>
                      <span className={['wk-chip shrink-0', shoot ? 'wk-chip--lime' : 'wk-chip--cyan'].join(' ')}>
                        {shoot ? 'Confirmed' : 'Request'}
                      </span>
                    </span>
                    {meta && <small className="mt-1 block truncate text-[12.5px] wk-grey">{meta}</small>}
                    <span className="mt-2 flex items-center gap-1 text-[12.5px] font-bold text-ink">
                      {shoot ? 'Open thread' : 'Send a quote'}
                      <span aria-hidden>→</span>
                    </span>
                  </span>
                </Link>
              );
            })
          ) : (
            <div className="calendar-empty">
              <span className="calendar-empty__icon">
                <CalendarDays className="h-4 w-4" strokeWidth={2} />
              </span>
              <div>
                <p>{offOnSelected ? 'You are unavailable' : 'Open day'}</p>
                <span>
                  {offOnSelected
                    ? 'No new bookings can land here.'
                    : 'Accepted shoots and new requests will appear here.'}
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {error && <p className="calendar-error">{error}</p>}
    </div>
  );
}
