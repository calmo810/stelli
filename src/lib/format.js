/**
 * Dates, times and money, written one way everywhere.
 *
 * A shoot's date is stored as a plain day ("2026-11-26") and its time as a
 * 24-hour clock ("16:30"). Both are read here as what they mean, never through
 * the browser's time zone: `new Date("2026-11-26")` is midnight UTC, which is
 * still the 25th in North Carolina, and used to put shoots on the wrong day.
 *
 * Pure, so the booking logic and its tests can use it too.
 */

/** A stored day or timestamp as a Date. A plain day lands on that day, wherever you are. */
export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const text = String(value);
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  const date = day ? new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3]), 12) : new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

const write = (value, options) => {
  const date = toDate(value);
  return date ? date.toLocaleDateString('en-US', options) : '';
};

/** "Sat, Oct 3" */
export const shortDate = (value) => write(value, { weekday: 'short', month: 'short', day: 'numeric' });

/** "Oct 3, 2026" */
export const mediumDate = (value) => write(value, { month: 'short', day: 'numeric', year: 'numeric' });

/** "October 3, 2026" */
export const longDate = (value) => write(value, { month: 'long', day: 'numeric', year: 'numeric' });

/** "Saturday, October 3, 2026" */
export const fullDate = (value) => write(value, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

/** "October 2026" */
export const monthYear = (value) => write(value, { month: 'long', year: 'numeric' });

/** "16:30" reads as 4:30 PM. Anything that is not a clock time is left as it was written. */
export function timeLabel(value, fallback = '') {
  if (!value) return fallback;
  const match = /^(\d{1,2}):(\d{2})/.exec(String(value));
  if (!match) return String(value);
  const hours = Number(match[1]);
  return `${hours % 12 || 12}:${match[2]} ${hours >= 12 ? 'PM' : 'AM'}`;
}

/** "Thu, Nov 26 · 4:30 PM" */
export function dateTimeLabel(date, time) {
  return [shortDate(date), timeLabel(time)].filter(Boolean).join(' · ');
}

/** "$140" or "$91.20": cents only when there are some. */
export function money(amount) {
  const value = Number(amount) || 0;
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

/** "graduation_party" → "Graduation party" */
export function shootName(eventType, fallback = 'Shoot') {
  const text = String(eventType || '').replace(/_/g, ' ').trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : fallback;
}
