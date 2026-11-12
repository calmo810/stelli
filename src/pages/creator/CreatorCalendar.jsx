import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { todayKey } from '@/hooks/useCreatorPortal';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const SHOOT_DOT = '#8fa52c';
const REQUEST_DOT = '#3f98a8';

function keyOf(date) {
  return format(date, 'yyyy-MM-dd');
}

/** Confirmed shoots, pending requests and the days the creator is off. */
export default function CreatorCalendar() {
  const { confirmed, newRequests, myProfile, refetchProfile } = useOutletContext();
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => new Date());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const blackouts = Array.isArray(myProfile?.blackout_dates) ? myProfile.blackout_dates : [];
  const today = todayKey();

  const byDate = useMemo(() => {
    const map = {};
    const add = (booking, kind) => {
      if (!booking.event_date) return;
      map[booking.event_date] = map[booking.event_date] || [];
      map[booking.event_date].push({ ...booking, kind });
    };
    confirmed.forEach((b) => add(b, 'shoot'));
    newRequests.forEach((b) => add(b, 'request'));
    return map;
  }, [confirmed, newRequests]);

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(cursor)),
    end: endOfWeek(endOfMonth(cursor)),
  });

  const selectedKey = keyOf(selected);
  const selectedShoots = byDate[selectedKey] || [];
  const offOnSelected = blackouts.includes(selectedKey);
  const canToggle = selectedKey >= today;

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
    <div>
      <h1 className="wk-h1">Availability</h1>
      <p className="wk-lede">Tap a day to say you are off. Clients see you as unavailable on those dates.</p>

      <div className="wk-card mt-5 px-4 py-4">
        <div className="flex items-center justify-between">
          <p className="text-[18px] font-extrabold tracking-tight text-ink">{format(cursor, 'MMMM yyyy')}</p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCursor(addMonths(cursor, -1))}
              aria-label="Previous month"
              className="grid h-8 w-8 place-items-center rounded-full wk-mute hover:bg-[#f2f4f8]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setCursor(addMonths(cursor, 1))}
              aria-label="Next month"
              className="grid h-8 w-8 place-items-center rounded-full wk-mute hover:bg-[#f2f4f8]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((day, i) => (
            <span key={`${day}-${i}`} className="pb-1 text-[10px] font-bold uppercase wk-mute">
              {day}
            </span>
          ))}

          {days.map((day) => {
            const key = keyOf(day);
            const inMonth = isSameMonth(day, cursor);
            const shoots = byDate[key] || [];
            const hasShoot = shoots.some((s) => s.kind === 'shoot');
            const hasRequest = shoots.some((s) => s.kind === 'request');
            const off = blackouts.includes(key);
            const isSelected = isSameDay(day, selected);
            const isToday = key === today;

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(day)}
                aria-pressed={isSelected}
                className="relative flex h-11 flex-col items-center justify-center rounded-xl text-[13px] font-semibold transition-colors"
                style={{
                  background: isSelected ? '#0a1226' : 'transparent',
                  boxShadow: isToday && !isSelected ? `inset 0 0 0 1.5px ${SHOOT_DOT}` : 'none',
                  color: !inMonth ? 'rgba(10,18,38,0.2)' : isSelected ? '#fff' : off ? 'rgba(10,18,38,0.3)' : '#0a1226',
                  textDecoration: off && inMonth ? 'line-through' : 'none',
                }}
              >
                {format(day, 'd')}
                <span className="mt-1 flex h-1 items-center gap-0.5">
                  {hasShoot && <span className="h-1 w-1 rounded-full" style={{ background: SHOOT_DOT }} />}
                  {hasRequest && <span className="h-1 w-1 rounded-full" style={{ background: REQUEST_DOT }} />}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-[rgba(10,18,38,0.08)] pt-3 text-[11px] wk-mute">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: SHOOT_DOT }} />
            Confirmed shoot
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: REQUEST_DOT }} />
            Pending request
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-[12px] line-through">15</span> You are off
          </span>
        </div>
      </div>

      <div className="wk-card mt-2.5 px-5 py-4">
        <p className="wk-label">{format(selected, 'EEEE, MMM d')}</p>

        {selectedShoots.length ? (
          <ul className="mt-2 space-y-2">
            {selectedShoots.map((shoot) => (
              <li key={shoot.id} className="flex items-baseline gap-2 text-[14px]">
                <span
                  className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: shoot.kind === 'shoot' ? SHOOT_DOT : REQUEST_DOT }}
                />
                <span className="min-w-0 flex-1">
                  <b className="font-bold text-ink">{shoot.client_name || 'Client'}</b>
                  <small className="ml-2 capitalize wk-grey">
                    {[shoot.event_time, shoot.event_type].filter(Boolean).join(' · ')}
                  </small>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[14px] wk-grey">No shoots on this day.</p>
        )}

        {canToggle ? (
          <button
            type="button"
            onClick={toggleAvailability}
            disabled={saving}
            className={`wk-btn mt-4 w-full ${offOnSelected ? 'wk-btn--ghost' : 'wk-btn--ink'}`}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {offOnSelected ? "I'm available this day" : "I'm off this day"}
          </button>
        ) : (
          <p className="mt-3 text-[12px] wk-mute">Past dates cannot be changed.</p>
        )}

        {error && <p className="mt-3 text-[13px] text-[#b03a72]">{error}</p>}
      </div>
    </div>
  );
}