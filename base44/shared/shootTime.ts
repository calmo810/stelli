/**
 * Shoot dates and times are stored as the wall clock where the shoot happens
 * ("2026-10-03", "14:00"), with no time zone. The server runs on UTC, so they
 * have to be read in the market's own zone before any deadline is measured.
 */
export const MARKET_TIME_ZONES = {
  ELON: 'America/New_York',
  NYC: 'America/New_York',
};

export const DEFAULT_TIME_ZONE = 'America/New_York';

export function marketTimeZone(market) {
  return MARKET_TIME_ZONES[market] || DEFAULT_TIME_ZONE;
}

/** "14:00", "9:30", "2:00 PM" → [hours, minutes]; anything else → midday. */
function parseClock(value) {
  const match = String(value || '').trim().match(/^(\d{1,2}):(\d{2})\s*([ap]\.?m\.?)?$/i);
  if (!match) return [12, 0];
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toLowerCase().replace(/\./g, '');
  if (meridiem === 'pm' && hours < 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;
  if (hours > 23 || minutes > 59) return [12, 0];
  return [hours, minutes];
}

/** How far the zone is ahead of UTC at a given instant, in milliseconds. */
function zoneOffset(instant, timeZone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(instant)
      .map((part) => [part.type, part.value])
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/**
 * The real moment a shoot starts. Returns null when there is no usable date.
 * Daylight saving is handled by measuring the offset at the answer itself.
 */
export function shootStartsAt(eventDate, eventTime, timeZone = DEFAULT_TIME_ZONE) {
  const match = String(eventDate || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const [hours, minutes] = parseClock(eventTime);
  const wallClock = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), hours, minutes);

  let instant = wallClock - zoneOffset(new Date(wallClock), timeZone);
  instant = wallClock - zoneOffset(new Date(instant), timeZone);
  return new Date(instant);
}
