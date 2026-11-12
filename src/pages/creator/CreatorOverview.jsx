import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { format } from 'date-fns';
import {
  CalendarDays,
  Camera,
  ChevronRight,
  Eye,
  Inbox,
  MessageCircle,
  Sparkles,
  UserRound,
  Wallet,
} from 'lucide-react';
import PendingBanner from '@/components/dashboard/PendingBanner';
import CopyLinkPill from '@/components/dashboard/CopyLinkPill';
import TodayShootCard from '@/components/creator/workspace/TodayShootCard';
import WhatsNewCard from '@/components/creator/workspace/WhatsNewCard';
import UpcomingShoots from '@/components/creator/UpcomingShoots';
import TodayBriefing from '@/components/creator/workspace/TodayBriefing';
import StatTiles from '@/components/creator/workspace/StatTiles';
import whatsNew from '@/lib/creatorDigest';
import money from '@/lib/money';
import shortDate from '@/lib/shortDate';

/** The creator's morning read: the next shoot, the numbers, and what needs them. */
export default function CreatorOverview() {
  const data = useOutletContext();
  const {
    user,
    myProfile,
    bookings,
    steps,
    newRequests,
    upcomingShoots,
    finished,
    metrics,
    hasClientBookings,
    money: totals,
  } = data;

  const firstName = (user?.full_name || '').split(' ')[0] || 'there';
  const nextShoot = upcomingShoots[0];
  const { items, facts } = whatsNew(data);

  // The brief in one breath: the numbers that matter, bolded, joined by dots.
  const clauses = [];
  if (metrics.requests) {
    clauses.push([
      { text: `${metrics.requests} request${metrics.requests > 1 ? 's' : ''}`, bold: true },
      { text: ' to answer' },
    ]);
  }
  if (nextShoot) {
    clauses.push([
      { text: `a shoot ${shortDate(nextShoot.event_date) || 'soon'}`, bold: true },
      { text: ` with ${nextShoot.client_name || 'a client'}` },
    ]);
  }
  if (Number(totals.heldTotal) > 0) {
    clauses.push([{ text: money(totals.heldTotal), bold: true }, { text: ' held until you deliver' }]);
  }
  const briefing = clauses.length
    ? clauses.flatMap((clause, i) => (i ? [{ text: ' · ' }, ...clause] : clause))
    : [{ text: 'Nothing needs you right now. Share your page and the next booking comes to you.' }];

  const people = [
    ...new Map(
      [...newRequests, ...upcomingShoots]
        .filter((b) => b.client_name)
        .map((b) => [b.client_name, { name: b.client_name, initial: b.client_name.trim()[0].toUpperCase() }])
    ).values(),
  ];

  const tiles = [
    {
      key: 'next',
      label: 'Next shoot',
      value: nextShoot?.event_date ? format(new Date(`${nextShoot.event_date}T12:00:00`), 'MMM d') : '—',
      to: '/lensman-dashboard/calendar',
      tone: 'paper',
      icon: CalendarDays,
    },
    {
      key: 'requests',
      label: 'Requests',
      value: String(metrics.requests),
      to: '/lensman-dashboard/requests',
      tone: 'cyan',
      icon: Inbox,
    },
    {
      key: 'held',
      label: 'Held',
      value: money(totals.heldTotal),
      to: '/lensman-dashboard/earnings',
      tone: 'lime',
      icon: Wallet,
    },
    {
      key: 'views',
      label: 'Views',
      value: String(metrics.views),
      to: '/lensman-dashboard/profile',
      tone: 'blush',
      icon: Eye,
    },
  ];

  // The one real next step on each booking that has one (bookingNextStep.js):
  // a request to quote, an agreement to accept, the unedited set once the
  // shoot has happened, then the final edits. Most pressing first.
  const attention = [
    ...steps.map((step) => {
      const booking = bookings.find((b) => b.id === step.bookingId);
      const isRequest = step.key === 'request';
      return {
        id: step.id,
        title: step.title,
        meta: [shortDate(booking?.event_date), booking?.location].filter(Boolean).join(' · ') || (isRequest ? 'New request' : ''),
        action: isRequest ? 'Review' : step.action,
        to: isRequest ? `/lensman-dashboard/requests/${step.bookingId}` : step.to,
        initial: (isRequest && booking?.client_name ? booking.client_name : step.title).trim()[0].toUpperCase(),
        lime: isRequest,
      };
    }),
    ...(myProfile.payouts_enabled
      ? []
      : [
          {
            id: 'payouts',
            title: 'Set up payouts',
            meta: 'Add your payout details so your earnings can reach you.',
            action: 'Set up',
            to: '/lensman-dashboard/earnings',
          },
        ]),
  ].slice(0, 3);

  const links = [
    { label: 'Messages', to: '/messages', icon: MessageCircle },
    { label: 'Completed shoots', to: '/lensman-dashboard/bookings', icon: Camera, value: String(finished.length) },
    ...(hasClientBookings ? [{ label: 'Client portal', to: '/client-dashboard', icon: UserRound }] : []),
    { label: 'Account settings', to: '/account-settings', icon: UserRound },
  ];

  return (
    <div>
      <h1 className="wk-h1">Hey, {firstName}.</h1>

      {myProfile.under_review ? (
        <PendingBanner tone="magenta">
          Your profile is on hold while the Stelli team reviews it. Your current bookings carry on.
        </PendingBanner>
      ) : myProfile.status === 'pending' ? (
        <PendingBanner />
      ) : myProfile.status === 'rejected' ? (
        <PendingBanner tone="magenta">
          Your application wasn’t approved, so your profile isn’t public. Email getstelli@gmail.com with any questions.
        </PendingBanner>
      ) : null}

      <div className="mt-3">
        <TodayBriefing segments={briefing} people={people} />
      </div>

      <div className="mt-5">
        <TodayShootCard shoot={nextShoot} profile={myProfile} />
      </div>

      <div className="mt-2.5">
        <StatTiles tiles={tiles} />
      </div>

      <div className="mt-2.5">
        <WhatsNewCard items={items} facts={facts} />
      </div>

      <h2 className="mb-2.5 mt-7 pl-1.5 text-[13px] font-semibold wk-mute">Needs you now</h2>
      {attention.length ? (
        <div className="wk-list">
          {attention.map((item) => (
            <Link key={item.id} to={item.to} className="wk-row">
              <span className={`wk-feed-av ${item.lime ? 'wk-feed-av--lime' : ''}`}>{item.initial}</span>
              <span className="min-w-0 flex-1">
                <b className="block text-[14.5px] font-bold text-ink">{item.title}</b>
                {item.meta && <span className="mt-0.5 block truncate text-[12.5px] wk-grey">{item.meta}</span>}
              </span>
              <span className="wk-chip wk-chip--lime">{item.action}</span>
              <ChevronRight className="h-4 w-4 shrink-0 wk-mute" strokeWidth={2.4} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="wk-card wk-card--pad">
          <p className="wk-label">
            <Sparkles className="h-3 w-3" strokeWidth={2.4} /> All clear
          </p>
          <p className="wk-title mt-2">You&apos;re all caught up.</p>
          <p className="wk-body mt-1">Share your page to get your next booking.</p>
          <div className="mt-4">
            <CopyLinkPill creator={myProfile} />
          </div>
        </div>
      )}

      <div className="mb-2.5 mt-7 flex items-baseline justify-between gap-3 pl-1.5">
        <h2 className="text-[13px] font-semibold wk-mute">Coming up</h2>
        <Link to="/lensman-dashboard/bookings" className="text-[12.5px] font-semibold text-white/45 hover:text-white">
          All shoots
        </Link>
      </div>
      <UpcomingShoots shoots={upcomingShoots.slice(0, 2)} emptyText="Confirmed shoots will appear here." />

      <div className="mt-2.5 wk-list">
        {links.map(({ label, to, icon: Icon, value }) => (
          <Link key={label} to={to} className="wk-row">
            <Icon className="h-[17px] w-[17px] shrink-0 wk-mute" strokeWidth={2} />
            <span className="min-w-0 flex-1 text-[14.5px] font-semibold text-ink">{label}</span>
            {value && <span className="text-[12.5px] font-bold wk-mute">{value}</span>}
            <ChevronRight className="h-4 w-4 shrink-0 wk-mute" strokeWidth={2.4} />
          </Link>
        ))}
      </div>
    </div>
  );
}