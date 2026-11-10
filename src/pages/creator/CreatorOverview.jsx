import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { CalendarDays, Inbox, Wallet, Eye, Sparkles } from 'lucide-react';
import PendingBanner from '@/components/dashboard/PendingBanner';
import NeedsYou from '@/components/dashboard/NeedsYou';
import CopyLinkPill from '@/components/dashboard/CopyLinkPill';
import GlassRows from '@/components/shared/GlassRows';
import MetricGrid from '@/components/creator/MetricGrid';
import SectionLabel from '@/components/creator/SectionLabel';
import UpcomingShoots from '@/components/creator/UpcomingShoots';
import ProfilePerformance from '@/components/creator/ProfilePerformance';
import money from '@/lib/money';
import shortDate from '@/lib/shortDate';
import { todayKey } from '@/hooks/useCreatorPortal';

const viewAll = (to) => (
  <Link to={to} className="text-[12.5px] font-semibold text-white/45 hover:text-white">
    See all
  </Link>
);

/** The creator's morning read: four numbers, what needs them, what is next. */
export default function CreatorOverview() {
  const {
    user,
    myProfile,
    newRequests,
    upcomingShoots,
    confirmed,
    finished,
    metrics,
    money: totals,
  } = useOutletContext();

  const firstName = (user?.full_name || '').split(' ')[0] || 'there';
  const today = todayKey();

  // Everything that still needs a decision from the creator, in priority order.
  const attention = [
    ...newRequests.map((b) => ({
      id: b.id,
      title: `${b.client_name || 'Someone'} wants ${b.event_type ? b.event_type.toLowerCase() : 'photos'}`,
      meta: [shortDate(b.event_date), b.location].filter(Boolean).join(' · ') || 'New request',
      action: 'Review',
      to: `/lensman-dashboard/requests/${b.id}`,
    })),
    ...confirmed
      .filter((b) => !b.delivery_link && b.event_date && b.event_date <= today)
      .map((b) => ({
        id: `deliver-${b.id}`,
        title: `Deliver to ${b.client_name || 'your client'}`,
        meta: `Shot ${shortDate(b.event_date)} · gallery not posted`,
        action: 'Deliver',
        to: `/messages/${b.id}`,
      })),
    ...confirmed
      .filter((b) => !b.creator_contract_accepted)
      .map((b) => ({
        id: `contract-${b.id}`,
        title: 'Sign a booking contract',
        meta: `${b.client_name || 'Your client'} · ${shortDate(b.event_date)}`,
        action: 'Sign',
        to: '/lensman-dashboard/bookings',
      })),
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
  ];

  const nextShoot = upcomingShoots[0];

  const tiles = [
    {
      key: 'upcoming',
      label: 'Upcoming shots',
      value: metrics.upcoming,
      note: nextShoot ? `Next ${shortDate(nextShoot.event_date)}` : 'Nothing booked yet',
      icon: CalendarDays,
      to: '/lensman-dashboard/bookings',
    },
    {
      key: 'requests',
      label: 'New requests',
      value: metrics.requests,
      note: metrics.requests ? 'Answer within 48h' : 'All answered',
      icon: Inbox,
      to: '/lensman-dashboard/requests',
    },
    {
      key: 'earnings',
      label: 'Expected earnings',
      value: money(totals.heldTotal),
      note: 'Held until delivery',
      icon: Wallet,
      to: '/lensman-dashboard/earnings',
    },
    {
      key: 'views',
      label: 'Profile views',
      value: metrics.views,
      note: 'All time',
      icon: Eye,
      to: '/lensman-dashboard/profile',
    },
  ];

  return (
    <div>
      <h1
        className="font-display font-medium text-white"
        style={{ fontSize: 38, letterSpacing: '-0.02em', lineHeight: 1.05 }}
      >
        Hey, {firstName}.
      </h1>

      {myProfile.under_review ? (
        <PendingBanner tone="magenta">
          Your profile is under review by the Stelli team after a cancellation.
        </PendingBanner>
      ) : myProfile.status === 'pending' ? (
        <PendingBanner />
      ) : null}

      <div className="mt-6">
        <MetricGrid tiles={tiles} />
      </div>

      <SectionLabel>Needs your attention</SectionLabel>
      <NeedsYou
        items={attention}
        empty={{
          icon: Sparkles,
          title: "You're all caught up.",
          body: 'Share your profile to get your next booking.',
          cta: <CopyLinkPill creator={myProfile} />,
        }}
      />

      <SectionLabel action={viewAll('/lensman-dashboard/bookings')}>Upcoming shoots</SectionLabel>
      <UpcomingShoots
        shoots={upcomingShoots.slice(0, 3)}
        emptyText="Confirmed shoots will appear here."
      />

      <SectionLabel action={viewAll('/lensman-dashboard/requests')}>Profile performance</SectionLabel>
      <ProfilePerformance profile={myProfile} />

      <GlassRows
        className="mt-8"
        rows={[
          { label: 'Messages', to: '/messages' },
          { label: 'Completed shoots', to: '/lensman-dashboard/bookings', value: String(finished.length) },
          { label: 'Account', to: '/account-settings' },
        ]}
      />
    </div>
  );
}