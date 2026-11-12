import React, { useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { addDays, format } from 'date-fns';
import { CalendarDays, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { todayKey } from '@/hooks/useCreatorPortal';
import WorkspaceEmpty from '@/components/creator/workspace/WorkspaceEmpty';

const WINDOW_DAYS = 28;
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
  return `${hour}:${match[2]} ${suffix}`;
}

/** The next four weeks as a strip, then the chosen day as appointment cards. */
export default function CreatorCalendar() {
  const { confirmed, newRequests, myProfile, refetchProfile } = useOutletContext();
  const [selected, setSelected] = useState(() => new Date());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const blackouts = Array.isArray(myProfile?.blackout_dates) ? myProfile.blackout_dates : [];
  const today = todayKey();

  const strip = useMemo(() => {
    const start = new Date();
    return Array.from({ length: WINDOW_DAYS }, (_, i) => addDays(start, i));
  }, []);

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

  const selectedKey = keyOf(selected);
  const dayItems = [...(byDate[selectedKey] || [])].sort((a, b) =>
    String(a.event_time || '99:99').localeCompare(String(b.event_time || '99:99'))
  );
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
    <div className="arch-tab arch-tab--calendar">
      <h1 className="wk-h1">Schedule</h1>
      <p className="wk-lede">Four weeks ahead. Tap a day to see it, or to tell clients you are off.</p>

      <div className="wk-strip mt-5">
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
              className={`wk-day ${isOn ? 'is-on' : ''} ${key === today ? 'is-today' : ''} ${off ? 'is-off' : ''}`}
            >
              <span className="wk-day-w">{key === today ? 'Today' : format(day, 'EEE')}</span>
              <span className="wk-day-n">{format(day, 'd')}</span>
              <span className="wk-day-dots">
                {hasShoot && (
                  <i style={{ background: isOn ? 'rgba(255,255,255,.9)' : INK }} />
                )}
                {hasRequest && <i style={{ background: LIME }} />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex items-baseline justify-between gap-3">
        <h2 className="text-[17px] font-extrabold tracking-tight text-white">
          {selectedKey === today ? 'Today' : format(selected, 'EEEE')}, {format(selected, 'MMM d')}
        </h2>
        <span className="text-[12px] font-semibold text-white/45">
          {dayItems.length ? `${dayItems.length} on the books` : offOnSelected ? "You're off" : 'Nothing booked'}
        </span>
      </div>

      <div className="mt-3 space-y-2.5">
        {dayItems.length ? (
          dayItems.map((item) => {
            const shoot = item.kind === 'shoot';
            const meta = [item.event_type, item.location].filter(Boolean).join(' · ');
            return (
              <Link
                key={item.id}
                to={shoot ? `/messages/${item.id}` : `/lensman-dashboard/requests/${item.id}`}
                className={`wk-appt ${shoot ? 'is-shoot' : 'is-request'}`}
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
                    <span className={`wk-chip shrink-0 ${shoot ? 'wk-chip--lime' : 'wk-chip--cyan'}`}>
                      {shoot ? 'CONFIRMED' : 'REQUEST'}
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
          <WorkspaceEmpty
            icon={CalendarDays}
            title="Nothing on this day"
            body={offOnSelected ? "You're marked off, so nothing will land here." : 'Accepted quotes land here as shoots.'}
          />
        )}
      </div>

      {canToggle ? (
        <button
          type="button"
          onClick={toggleAvailability}
          disabled={saving}
          className={`wk-btn mt-3 w-full ${offOnSelected ? 'wk-btn--ghost' : 'wk-btn--ink'}`}
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {offOnSelected ? "I'm available this day" : "I'm off this day"}
        </button>
      ) : (
        <p className="mt-3 text-[12px] text-white/40">Past dates cannot be changed.</p>
      )}

      {error && <p className="mt-3 text-[13px] text-[#ff9ac2]">{error}</p>}
    </div>
  );
}