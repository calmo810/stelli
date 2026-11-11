import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PendingBanner from '@/components/dashboard/PendingBanner';
import PayoutsCard from '@/components/dashboard/PayoutsCard';
import AgeConfirmGate from '@/components/dashboard/AgeConfirmGate';
import MyAgreements from '@/components/dashboard/MyAgreements';
import PhotoReleases from '@/components/dashboard/PhotoReleases';
import DashboardShell from '@/components/dashboard/DashboardShell';
import NeedsYou from '@/components/dashboard/NeedsYou';
import ShootList from '@/components/dashboard/ShootList';
import CopyLinkPill from '@/components/dashboard/CopyLinkPill';
import GlassRows from '@/components/shared/GlassRows';
import PullToRefresh from '@/components/shared/PullToRefresh';
import { useQueryClient } from '@tanstack/react-query';
import useCreatorDashboard from '@/hooks/useCreatorDashboard';
import useThreads from '@/hooks/useThreads';
import shortDate from '@/lib/shortDate';
import useRequireSignIn from '@/lib/requireSignIn';
import EmptyPanel from '@/components/dashboard/EmptyPanel';
import Pill from '@/components/shared/Pill';
import { Link } from 'react-router-dom';

function SectionLabel({ children }) {
  return <h3 className="mb-2.5 mt-8 pl-1.5 text-[13px] font-semibold text-white/50">{children}</h3>;
}

/**
 * The creator portal: one page, top to bottom.
 * A status note (only if something needs setting up), what needs you,
 * your shoots, and a short list of everything else.
 */
export default function LensmanDashboard() {
  const {
    user,
    userLoading,
    myProfile,
    profileFetched,
    refetchProfile,
    isLoading,
    bookings,
    active,
    past,
    steps,
    waitingTotal,
    payoutState,
  } = useCreatorDashboard();
  const { unreadCount } = useThreads();
  const [openingStripe, setOpeningStripe] = useState(false);
  const queryClient = useQueryClient();
  // Signed out: go and log in, then come straight back here.
  const waiting = useRequireSignIn(user, userLoading);

  // A pull at the top reloads the creator's shoots, profile, payouts and inbox together.
  const refreshAll = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['lensman-bookings'] }),
      queryClient.invalidateQueries({ queryKey: ['my-lensman-profile'] }),
      queryClient.invalidateQueries({ queryKey: ['waiting-manual-payouts'] }),
      queryClient.invalidateQueries({ queryKey: ['messages-inbox'] }),
    ]);

  if (waiting || !profileFetched) {
    return <DashboardShell><div className="glass h-[132px] animate-pulse rounded-3xl" /></DashboardShell>;
  }

  // Signed in, but no creator profile: this portal has nothing to show yet.
  if (!myProfile) {
    return (
      <DashboardShell>
        <EmptyPanel
          icon={Sparkles}
          title="You don’t have a creator profile yet."
          body="Apply to shoot for Stelli, or head to your client portal."
          cta={
            <div className="flex flex-wrap justify-center gap-2">
              <Link to="/apply"><Pill>Start your application</Pill></Link>
              <Link to="/client-dashboard"><Pill tone="glass">Client portal</Pill></Link>
            </div>
          }
        />
      </DashboardShell>
    );
  }

  // Creators who joined before the 18+ check existed confirm it once, here.
  if (!myProfile.age_confirmed) {
    return <AgeConfirmGate onConfirmed={refetchProfile} />;
  }

  const firstName = (user?.full_name || '').split(' ')[0] || 'there';

  // The real next step on each booking that has one: a request to quote, an
  // agreement to accept, photos to deliver once the shoot has happened.
  const needs = steps.map((step) => {
    const booking = bookings.find((b) => b.id === step.bookingId);
    return {
      id: step.id,
      title: step.title,
      meta: [shortDate(booking?.event_date), booking?.location].filter(Boolean).join(' · '),
      action: step.action,
      to: step.to,
    };
  });

  const openStripe = async () => {
    setOpeningStripe(true);
    try {
      const response = await base44.functions.invoke('startPayoutSetup', {
        origin: window.location.origin,
        action: 'dashboard',
      });
      if (response.data?.url) window.open(response.data.url, '_blank', 'noopener');
    } finally {
      setOpeningStripe(false);
    }
  };

  // A note at the top only when something is off. Where the profile stands
  // comes first; payout setup is shown as well whenever it is not finished, so
  // money waiting on it is never hidden behind another notice.
  let standing = null;
  if (myProfile.under_review) {
    standing = (
      <PendingBanner tone="magenta">
        Your profile is on hold while the Stelli team reviews it. Your current bookings carry on.
      </PendingBanner>
    );
  } else if (myProfile.status === 'pending') {
    standing = <PendingBanner />;
  } else if (myProfile.status === 'rejected') {
    standing = (
      <PendingBanner tone="magenta">
        Your application wasn’t approved, so your profile isn’t public. Email getstelli@gmail.com with any questions.
      </PendingBanner>
    );
  }
  const note = (
    <>
      {standing}
      {!myProfile.payouts_enabled && (
        <div className="mt-5">
          <PayoutsCard
            profile={myProfile}
            needsInfo={payoutState?.needsInfo}
            waitingTotal={waitingTotal}
            onRefresh={refetchProfile}
          />
        </div>
      )}
    </>
  );

  return (
    <PullToRefresh onRefresh={refreshAll}>
    <DashboardShell>
      <h1
        className="font-display font-medium text-white"
        style={{ fontSize: 40, letterSpacing: '-0.02em', lineHeight: 1.05 }}
      >
        Hey, {firstName}.
      </h1>

      {note}

      <SectionLabel>To do</SectionLabel>
      <NeedsYou
        items={needs}
        empty={{
          icon: Sparkles,
          title: "You're all caught up.",
          body: 'Share your profile to get your next booking.',
          cta: myProfile ? <CopyLinkPill creator={myProfile} /> : null,
        }}
      />

      <SectionLabel>Your shoots</SectionLabel>
      <ShootList
        role="lensman"
        active={active}
        past={past}
        isLoading={isLoading}
        emptyText="New requests and booked shoots will show up here."
      />

      <PhotoReleases role="lensman" user={user} />

      <MyAgreements role="lensman" />

      <GlassRows
        className="mt-8"
        rows={[
          { label: 'Messages', to: '/messages', value: unreadCount ? `${unreadCount} new` : undefined },
          { label: 'Edit profile', to: '/edit-profile' },
          ...(myProfile
            ? [{ label: 'View public page', href: `/creators/${myProfile.slug || myProfile.id}`, external: true }]
            : []),
          ...(myProfile?.payouts_enabled
            ? [{ label: 'Payouts', value: 'On', onClick: openStripe, disabled: openingStripe }]
            : []),
          { label: 'Account', to: '/account-settings' },
        ]}
      />
    </DashboardShell>
    </PullToRefresh>
  );
}