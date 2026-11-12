/**
 * When a shoot starts, as a real moment in time.
 *
 * A booking stores a calendar date and a clock time with no time zone. Stelli's
 * Terms measure everything against America/New_York, and the server runs in
 * UTC, so the conversion has to be explicit — reading "2026-11-14T15:00" as
 * server time puts every shoot four or five hours early.
 *
 * Pure: no secrets, no network. Tested in tests/cancellation.test.mjs.
 */
export const SHOOT_TIME_ZONE = 'America/New_York';

/** With no start time on the booking, noon is assumed. */
const DEFAULT_HOUR = 12;

/** How far ahead of UTC a zone is at a given moment, in milliseconds. */
function zoneOffsetMs(utcMs, zone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs));
  const part = (type) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(
    part('year'),
    part('month') - 1,
    part('day'),
    part('hour'),
    part('minute'),
    part('second')
  );
  return asUtc - utcMs;
}

/** A wall-clock time in a zone, as milliseconds since the epoch. */
export function zonedToUtcMs(year, month, day, hour, minute, zone = SHOOT_TIME_ZONE) {
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  const first = wall - zoneOffsetMs(wall, zone);
  // A second pass settles the hours either side of a daylight-saving change.
  return wall - zoneOffsetMs(first, zone);
}

function parseDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || '').trim());
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

/** "15:00", "3:00 pm" and "3pm" are all read; anything else is not. */
function parseTime(value) {
  const text = String(value || '').trim().toLowerCase();
  if (!text) return null;
  const match = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/.exec(text);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const half = match[3];
  if (half) {
    if (hour < 1 || hour > 12) return null;
    if (half === 'pm' && hour !== 12) hour += 12;
    if (half === 'am' && hour === 12) hour = 0;
  }
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

/**
 * The shoot's start. `ms` is NaN when the date can't be read. `assumedTime` is
 * true when the booking had no usable start time and noon was used.
 */
export function shootStart(eventDate, eventTime) {
  const date = parseDate(eventDate);
  if (!date) return { ms: NaN, assumedTime: true };
  const time = parseTime(eventTime);
  const ms = zonedToUtcMs(
    date.year,
    date.month,
    date.day,
    time ? time.hour : DEFAULT_HOUR,
    time ? time.minute : 0
  );
  return { ms, assumedTime: !time };
}

/** The last moment of the shoot's calendar day in New York. */
export function shootDayEndMs(eventDate) {
  const date = parseDate(eventDate);
  if (!date) return NaN;
  return zonedToUtcMs(date.year, date.month, date.day, 23, 59) + 59_999;
}

/** Hours from `nowMs` until the shoot starts. Negative once it has started. */
export function hoursUntilShoot(eventDate, eventTime, nowMs) {
  const { ms } = shootStart(eventDate, eventTime);
  return (ms - nowMs) / 3_600_000;
}
