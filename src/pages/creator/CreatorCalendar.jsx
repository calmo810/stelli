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
import Pill from '@/components/shared/Pill';
import { todayKey } from '@/hooks/useCreatorPortal';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

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
      <h1 className="font-display text-[30px] font-medium leading-tight text-white">
        Calendar &amp; availability
      </h1>
      <p className="mt-1.5 text-[14px] leading-snug text-white/50">
        Tap a day to say you are off. Clients see you as unavailable on those dates.
      </p>

      <div className="glass mt-5 rounded-[26px] px-4 py-4">
        <div className="flex items-center justify-between">
          <p className="font-display text-[19px] text-white">{format(cursor, 'MMMM yyyy')}</p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCursor(addMonths(cursor, -1))}
              aria-label="Previous month"
              className="grid h-8 w-8 place-items-center rounded-full text-white/50 hover:bg-white/10 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setCursor(addMonths(cursor, 1))}
              aria-label="Next month"
              className="grid h-8 w-8 place-items-center rounded-full text-white/50 hover:bg-white/10 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((day, i) => (
            <span key={`${day}-${i}`} className="pb-1 text-[10px] font-semibold uppercase text-white/30">
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
                className="relative flex h-11 flex-col items-center justify-center rounded-xl text-[13px] transition-colors"
                style={{
                  background: isSelected ? 'rgba(255,255,255,0.14)' : 'transparent',
                  border: isToday ? '1px solid hsl(var(--neon-lime))' : '1px solid transparent',
                  color: !inMonth ? 'rgba(255,255,255,0.2)' : off ? 'rgba(255,255,255,0.3)' : '#fff',
                  textDecoration: off && inMonth ? 'line-through' : 'none',
                }}
              >
                {format(day, 'd')}
                <span className="mt-1 flex h-1 items-center gap-0.5">
                  {hasShoot && (
                    <span
                      className="h-1 w-1 rounded-full"
                      style={{ background: 'hsl(var(--neon-lime))' }}
                    />
                  )}
                  {hasRequest && (
                    <span
                      className="h-1 w-1 rounded-full"
                      style={{ background: 'hsl(var(--neon-cyan))' }}
                    />
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-white/10 pt-3 text-[11px] text-white/40">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'hsl(var(--neon-lime))' }} />
            Confirmed shoot
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'hsl(var(--neon-cyan))' }} />
            Pending request
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-[12px] line-through">15</span> You are off
          </span>
        </div>
      </div>

      <div className="glass mt-3 rounded-[26px] px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/35">
          {format(selected, 'EEEE, MMM d')}
        </p>

        {selectedShoots.length ? (
          <ul className="mt-2 space-y-2">
            {selectedShoots.map((shoot) => (
              <li key={shoot.id} className="flex items-baseline gap-2 text-[14px]">
                <span
                  className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{
                    background:
                      shoot.kind === 'shoot' ? 'hsl(var(--neon-lime))' : 'hsl(var(--neon-cyan))',
                  }}
                />
                <span className="min-w-0 flex-1">
                  <b className="font-semibold text-white">{shoot.client_name || 'Client'}</b>
                  <small className="ml-2 capitalize text-white/45">
                    {[shoot.event_time, shoot.event_type].filter(Boolean).join(' · ')}
                  </small>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[14px] text-white/45">No shoots on this day.</p>
        )}

        {canToggle ? (
          <Pill
            as="button"
            type="button"
            tone={offOnSelected ? 'glass' : 'lime'}
            onClick={toggleAvailability}
            disabled={saving}
            className="mt-4 w-full py-3.5"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {offOnSelected ? "I'm available this day" : "I'm off this day"}
          </Pill>
        ) : (
          <p className="mt-3 text-[12px] text-white/35">Past dates cannot be changed.</p>
        )}

        {error && (
          <p className="mt-3 text-[13px]" style={{ color: 'hsl(var(--neon-magenta))' }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}