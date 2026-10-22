import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PendingBanner from '@/components/dashboard/PendingBanner';
import PayoutsCard from '@/components/dashboard/PayoutsCard';
import AgeConfirmGate from '@/components/dashboard/AgeConfirmGate';
import MyAgreements from '@/components/dashboard/MyAgreements';
import DashboardShell from '@/components/dashboard/DashboardShell';
import NeedsYou from '@/components/dashboard/NeedsYou';
import ShootList from '@/components/dashboard/ShootList';
import CopyLinkPill from '@/components/dashboard/CopyLinkPill';
import GlassRows from '@/components/shared/GlassRows';
import useCreatorDashboard from '@/hooks/useCreatorDashboard';
import useThreads from '@/hooks/useThreads';
import shortDate from '@/lib/shortDate';

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
    myProfile,
    refetchProfile,
    isLoading,
    requests,
    upcoming,
    deliveries,
    completed,
    waitingTotal,
    payoutState,
  } = useCreatorDashboard();
  const { unreadCount } = useThreads();
  const [openingStripe, setOpeningStripe] = useState(false);

  // Creators who joined before the 18+ check existed confirm it once, here.
  if (myProfile && !myProfile.age_confirmed) {
    return <AgeConfirmGate onConfirmed={refetchProfile} />;
  }

  const firstName = (user?.full_name || '').split(' ')[0] || 'there';

  const needs = [
    ...requests.map((b) => ({
      id: b.id,
      title: `${b.client_name || 'Someone'} wants ${b.event_type ? b.event_type.replace(/_/g, ' ') : 'photos'}`,
      meta: [shortDate(b.event_date), b.location].filter(Boolean).join(' · '),
      action: 'Quote',
      to: `/messages/${b.id}`,
    })),
    ...deliveries
      .filter((b) => !b.delivery_link)
      .map((b) => ({
        id: `deliver-${b.id}`,
        title: `Deliver to ${b.client_name || 'your client'}`,
        meta: `Shot ${shortDate(b.event_date)}`,
        action: 'Add link',
        to: `/messages/${b.id}`,
      })),
  ];

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

  // Only one note at the top, and only when something is off.
  let note = null;
  if (myProfile?.under_review) {
    note = (
      <PendingBanner tone="magenta">
        Your profile is under review by the Stelli team after a cancellation.
      </PendingBanner>
    );
  } else if (myProfile?.status === 'pending') {
    note = <PendingBanner />;
  } else if (myProfile && !myProfile.payouts_enabled) {
    note = (
      <div className="mt-5">
        <PayoutsCard
          profile={myProfile}
          needsInfo={payoutState?.needsInfo}
          waitingTotal={waitingTotal}
          onRefresh={refetchProfile}
        />
      </div>
    );
  }

  return (
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
        active={[...requests, ...upcoming, ...deliveries]}
        past={completed}
        isLoading={isLoading}
        emptyText="New requests and booked shoots will show up here."
      />

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
  );
}
