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
    bookings,
    steps,
    upcomingShoots,
    finished,
    metrics,
    hasClientBookings,
    money: totals,
  } = useOutletContext();

  const firstName = (user?.full_name || '').split(' ')[0] || 'there';

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
          Your profile is on hold while the Stelli team reviews it. Your current bookings carry on.
        </PendingBanner>
      ) : myProfile.status === 'needs_changes' ? (
        <PendingBanner tone="lime">
          We asked for one change before your page goes live.{' '}
          <Link to="/edit-profile" className="font-semibold text-white underline underline-offset-4">
            See our note and send it back
          </Link>
        </PendingBanner>
      ) : myProfile.status === 'pending' ? (
        <PendingBanner>
          Your application is with us. Your page goes live once we approve it.{' '}
          <Link to="/edit-profile?step=line" className="font-semibold text-white underline underline-offset-4">
            Finish your page while you wait
          </Link>
        </PendingBanner>
      ) : myProfile.status === 'rejected' ? (
        <PendingBanner tone="magenta">
          Your application wasn’t approved, so your profile isn’t public. Email getstelli@gmail.com with any questions.
        </PendingBanner>
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
          ...(hasClientBookings ? [{ label: 'Client portal', to: '/client-dashboard' }] : []),
          { label: 'Account', to: '/account-settings' },
        ]}
      />
    </div>
  );
}