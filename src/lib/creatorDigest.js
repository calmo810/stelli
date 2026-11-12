import money from '@/lib/money';
import shortDate from '@/lib/shortDate';

/**
 * What changed for a creator since they were last here, as plain lines plus the
 * same facts written out for the optional AI note. Kept pure so the workspace
 * can show the plain list whenever the summary is switched off or unavailable.
 */
export default function whatsNew(data = {}) {
  const {
    newRequests = [],
    quotedBookings = [],
    bookings = [],
    upcomingShoots = [],
    myProfile = null,
    money: totals = {},
  } = /** @type {any} */ (data);
  const items = [];
  const add = (key, label, to, fact) => items.push({ key, label, to, fact });

  if (newRequests.length) {
    const newest = newRequests[0];
    add(
      'requests',
      `${newRequests.length} new request${newRequests.length > 1 ? 's' : ''} to answer`,
      '/lensman-dashboard/requests',
      `${newRequests.length} new booking request${newRequests.length > 1 ? 's' : ''} waiting to be answered, the newest from ${
        newest.client_name || 'a client'
      } for ${shortDate(newest.event_date) || 'an open date'}.`
    );
  }

  const withClient = quotedBookings.filter((b) => b.status === 'quoted');
  if (withClient.length) {
    add(
      'quotes',
      `${withClient.length} quote${withClient.length > 1 ? 's' : ''} with a client`,
      '/lensman-dashboard/requests',
      `${withClient.length} quote${withClient.length > 1 ? 's are' : ' is'} with the client for a decision.`
    );
  }

  const awaitingPayment = quotedBookings.filter((b) => b.status === 'quote_accepted');
  if (awaitingPayment.length) {
    add(
      'payment',
      `${awaitingPayment.length} accepted quote${awaitingPayment.length > 1 ? 's' : ''} awaiting payment`,
      '/lensman-dashboard/requests',
      `${awaitingPayment.length} accepted quote${awaitingPayment.length > 1 ? 's are' : ' is'} waiting on the client's payment.`
    );
  }

  const unread = bookings.filter(
    (b) =>
      b.client_notified_at &&
      (!b.creator_last_read_at || new Date(b.client_notified_at) > new Date(b.creator_last_read_at))
  );
  if (unread.length) {
    add(
      'messages',
      `${unread.length} conversation${unread.length > 1 ? 's' : ''} with a new reply`,
      '/messages',
      `${unread.length} conversation${unread.length > 1 ? 's have' : ' has'} a new reply from the client.`
    );
  }

  const nextShoot = upcomingShoots[0];
  if (nextShoot) {
    add(
      'next',
      `Next shoot ${shortDate(nextShoot.event_date)} with ${nextShoot.client_name || 'a client'}`,
      '/lensman-dashboard/bookings',
      `The next shoot is ${shortDate(nextShoot.event_date)} with ${nextShoot.client_name || 'a client'}.`
    );
  }

  if (Number(totals.heldTotal) > 0) {
    add(
      'held',
      `${money(totals.heldTotal)} held until delivery`,
      '/lensman-dashboard/earnings',
      `${money(totals.heldTotal)} is held until delivery.`
    );
  }

  if (myProfile && !myProfile.payouts_enabled) {
    add(
      'payouts',
      'Payouts are not set up yet',
      '/lensman-dashboard/earnings',
      'Payout setup is not finished, so earnings cannot be sent yet.'
    );
  }

  const capped = items.slice(0, 5);
  return { items: capped, facts: capped.map((item) => item.fact) };
}