const TIMEZONE = 'America/New_York';

function pad(value) {
  return String(value).padStart(2, '0');
}

function escapeIcs(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function dateParts(dateKey) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateKey || ''));
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

function icsDate(parts) {
  if (!parts) return '';
  return `${parts.year}${pad(parts.month)}${pad(parts.day)}`;
}

function icsDateTime(date, time, offsetMinutes = 0) {
  const parts = dateParts(date);
  const match = /^(\d{1,2}):(\d{2})/.exec(String(time || ''));
  if (!parts || !match) return '';
  const value = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, Number(match[1]), Number(match[2])) + offsetMinutes * 60_000);
  return `${value.getUTCFullYear()}${pad(value.getUTCMonth() + 1)}${pad(value.getUTCDate())}T${pad(value.getUTCHours())}${pad(value.getUTCMinutes())}00`;
}

function nextDay(date) {
  const parts = dateParts(date);
  if (!parts) return '';
  const value = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + 1));
  return icsDate({ year: value.getUTCFullYear(), month: value.getUTCMonth() + 1, day: value.getUTCDate() });
}

function durationMinutes(duration) {
  const value = String(duration || '').toLowerCase();
  const amount = Number((/\d+(?:\.\d+)?/.exec(value) || [])[0]);
  if (!Number.isFinite(amount) || amount <= 0) return 120;
  if (value.includes('min')) return Math.round(amount);
  return Math.round(amount * 60);
}

function stamp() {
  const date = new Date();
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function bookingEvent(booking) {
  const allDay = !booking.event_time;
  const title = `Stelli · ${booking.client_name || booking.event_type || 'Shoot'}`;
  const lines = [
    'BEGIN:VEVENT',
    `UID:stelli-${booking.id}@getstelli.com`,
    `DTSTAMP:${stamp()}`,
    `SUMMARY:${escapeIcs(title)}`,
  ];

  if (allDay) {
    lines.push(`DTSTART;VALUE=DATE:${icsDate(dateParts(booking.event_date))}`);
    lines.push(`DTEND;VALUE=DATE:${nextDay(booking.event_date)}`);
  } else {
    lines.push(`DTSTART;TZID=${TIMEZONE}:${icsDateTime(booking.event_date, booking.event_time)}`);
    lines.push(`DTEND;TZID=${TIMEZONE}:${icsDateTime(booking.event_date, booking.event_time, durationMinutes(booking.duration))}`);
  }

  if (booking.location) lines.push(`LOCATION:${escapeIcs(booking.location)}`);
  lines.push(`DESCRIPTION:${escapeIcs('Confirmed Stelli shoot. Open Stelli for the full brief and messages.')}`);
  lines.push('STATUS:CONFIRMED', 'END:VEVENT');
  return lines;
}

/** Download every confirmed future shoot as one calendar file that Apple and Google Calendar can import. */
export function downloadCreatorCalendar(bookings = []) {
  const now = new Date();
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const future = bookings
    .filter((booking) => booking?.event_date && booking.event_date >= today)
    .sort((a, b) => `${a.event_date} ${a.event_time || ''}`.localeCompare(`${b.event_date} ${b.event_time || ''}`));

  if (!future.length) return false;

  const contents = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Stelli//Creator schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...future.flatMap(bookingEvent),
    'END:VCALENDAR',
    '',
  ].join('\r\n');

  const blob = new Blob([contents], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'stelli-shoots.ics';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  return true;
}
