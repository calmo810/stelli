import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import useCreatorDashboard from '@/hooks/useCreatorDashboard';
import { effectiveStatus, moneyTaken } from '@/lib/bookingNextStep';

/**
 * Requests that have moved past "new" but are not a confirmed shoot yet. Read
 * against effectiveStatus, so the two old statuses ('pending' and
 * 'awaiting_creator_acceptance') land where they really belong.
 */
export const QUOTED_STATUSES = ['quoted', 'quote_accepted'];
export const CONFIRMED_STATUSES = ['confirmed', 'in_progress', 'awaiting_delivery'];
export const DONE_STATUSES = ['delivered', 'completed'];

export const todayKey = () => new Date().toISOString().slice(0, 10);

/** A request should be answered inside this many hours. */
export const REPLY_WINDOW_HOURS = 48;

export function deadlineFor(booking) {
  if (!booking?.created_date) return null;
  return new Date(new Date(booking.created_date).getTime() + REPLY_WINDOW_HOURS * 3600 * 1000);
}

/** Hours left to answer a request; negative once the window has passed. */
export function hoursLeft(booking) {
  const deadline = deadlineFor(booking);
  if (!deadline) return null;
  return Math.round((deadline.getTime() - Date.now()) / 3600000);
}

/**
 * Everything the creator workspace reads: the shoots, the quotes, the money in
 * flight, and the four numbers on the overview. One load, shared by every page.
 */
export default function useCreatorPortal() {
  const base = useCreatorDashboard();
  const { user, bookings } = base;

  const { data: quotes = [], isLoading: quotesLoading } = useQuery({
    queryKey: ['creator-quotes', user?.id],
    enabled: !!user?.id,
    // By account: emails on quotes are readable by founders only.
    queryFn: () => base44.entities.Quote.filter({ creator_id: user.id }, '-created_date'),
  });

  const { data: manualPayouts = [] } = useQuery({
    queryKey: ['my-manual-payouts', user?.id],
    enabled: !!user?.id,
    queryFn: () =>
      base44.entities.ManualPayout.filter({ creator_user_id: user.id }, '-created_date').catch(() => []),
  });

  const today = todayKey();

  const statusOf = (b) => effectiveStatus(b);

  const newRequests = bookings
    .filter((b) => statusOf(b) === 'requested')
    .sort((a, b) => String(b.created_date).localeCompare(String(a.created_date)));

  const quotedBookings = bookings.filter((b) => QUOTED_STATUSES.includes(statusOf(b)));

  const confirmed = bookings
    .filter((b) => CONFIRMED_STATUSES.includes(statusOf(b)) && moneyTaken(b))
    .sort((a, b) => String(a.event_date || '').localeCompare(String(b.event_date || '')));

  const finished = bookings
    .filter((b) => DONE_STATUSES.includes(statusOf(b)))
    .sort((a, b) => String(b.event_date || '').localeCompare(String(a.event_date || '')));

  const upcomingShoots = confirmed.filter((b) => !b.event_date || b.event_date >= today);

  const heldTotal = bookings
    .filter((b) => ['held', 'processing'].includes(b.payment_status))
    .reduce((sum, b) => sum + Number(b.creator_payout || 0), 0);

  const paidTotal =
    bookings
      .filter((b) => b.payment_status === 'released' || b.released_at)
      .reduce((sum, b) => sum + Number(b.creator_payout || 0), 0) +
    manualPayouts
      .filter((p) => p.status === 'sent')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const quotedTotal = quotes
    .filter((q) => q.status === 'sent')
    .reduce((sum, q) => sum + Number(q.amount || 0), 0);

  const quotesFor = (bookingId) => quotes.filter((q) => q.booking_id === bookingId);

  return {
    ...base,
    quotes,
    quotesLoading,
    quotesFor,
    manualPayouts,
    newRequests,
    quotedBookings,
    confirmed,
    finished,
    upcomingShoots,
    money: { heldTotal, paidTotal, quotedTotal },
    metrics: {
      upcoming: upcomingShoots.length,
      requests: newRequests.length,
      held: heldTotal,
      views: Number(base.myProfile?.profile_views || 0),
    },
  };
}