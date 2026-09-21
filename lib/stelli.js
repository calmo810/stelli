import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

/** Plain-English labels for booking status, with the accent colour each one uses. */
export const STATUS = {
  requested: { label: 'Request sent', tone: 'cyan' },
  quoted: { label: 'Quote ready', tone: 'lime' },
  confirmed: { label: 'Booked', tone: 'lime' },
  delivered: { label: 'Photos delivered', tone: 'lime' },
  completed: { label: 'Completed', tone: 'muted' },
  cancelled: { label: 'Cancelled', tone: 'magenta' },
  disputed: { label: 'Under review', tone: 'magenta' },
};

export const TONE_COLOR = {
  lime: 'hsl(var(--neon-lime))',
  cyan: 'hsl(var(--neon-cyan))',
  magenta: 'hsl(var(--neon-magenta))',
  muted: 'rgba(255,255,255,0.45)',
};

export function statusLabel(status) {
  return STATUS[status]?.label || 'Booking';
}

export function statusColor(status) {
  return TONE_COLOR[STATUS[status]?.tone || 'muted'];
}

export function money(amount) {
  if (!Number.isFinite(Number(amount))) return '';
  return `$${Number(amount).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function prettyDate(value) {
  if (!value) return 'Date TBC';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function shortDate(value) {
  if (!value) return 'TBC';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** The signed-in user, or null. Never throws. */
export function useMe() {
  return useQuery({
    queryKey: ['me'],
    staleTime: 60_000,
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
  });
}

/** The creator profile belonging to the signed-in user, or null. */
export function useMyCreatorProfile(user) {
  return useQuery({
    queryKey: ['my-creator-profile', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const list = await base44.entities.Lensman.filter({ user_id: user.id });
      return list[0] || null;
    },
  });
}

/** Works out which side of a booking the signed-in user is on. */
export function sideOf(booking, user) {
  if (!booking || !user) return null;
  if (booking.client_id === user.id || booking.client_email === user.email) return 'client';
  if (booking.creator_id === user.id || (booking.creator_email && booking.creator_email === user.email)) return 'creator';
  return null;
}

/** Calls a Base44 backend function and returns its data, throwing a readable error. */
export async function callFunction(name, payload = {}) {
  try {
    const response = await base44.functions.invoke(name, payload);
    if (response?.data?.error) throw new Error(response.data.error);
    return response.data;
  } catch (error) {
    const message = error?.response?.data?.error || error?.message || 'Something went wrong. Try again.';
    throw new Error(message);
  }
}

export const INPUT_CLASS =
  'w-full bg-surface-2 border border-white/12 px-4 py-3 font-body text-[14px] text-white placeholder:text-white/25 outline-none focus:border-neon-lime transition-colors';
