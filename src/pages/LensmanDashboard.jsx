import React from 'react';
import { Sparkles } from 'lucide-react';
import PayoutNotice from '@/components/dashboard/PayoutNotice';
import PendingBanner from '@/components/dashboard/PendingBanner';
import AgeConfirmGate from '@/components/dashboard/AgeConfirmGate';
import MyAgreements from '@/components/dashboard/MyAgreements';
import DashboardShell from '@/components/dashboard/DashboardShell';
import DashboardStack from '@/components/dashboard/stack/DashboardStack';
import StackTile from '@/components/dashboard/StackTile';
import NeedsYou from '@/components/dashboard/NeedsYou';
import CopyLinkPill from '@/components/dashboard/CopyLinkPill';
import GlassRows from '@/components/shared/GlassRows';
import useCreatorDashboard from '@/hooks/useCreatorDashboard';
import shortDate from '@/lib/shortDate';

export default function LensmanDashboard() {
  const {
    user,
    myProfile,
    refetchProfile,
    isLoading,
    requests,
    upcoming,
    deliveries,
    payoutState,
  } = useCreatorDashboard();

  // Creators who joined before the 18+ check existed confirm it once, here.
  if (myProfile && !myProfile.age_confirmed) {
    return <AgeConfirmGate onConfirmed={refetchProfile} />;
  }

  const firstName = (user?.full_name || '').split(' ')[0] || 'there';

  const needs = [
    ...requests.map((b) => ({
      id: b.id,
      title: `${b.client_name || 'Someone'} wants ${b.event_type || 'photos'}`,
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

  return (
    <DashboardStack parentPath="/lensman-dashboard">
      <DashboardShell>
        <h1
          className="font-display font-medium text-white"
          style={{ fontSize: 40, letterSpacing: '-0.02em', lineHeight: 1.05 }}
        >
          Hey, {firstName}.
        </h1>
        <p className="mt-1.5 text-[16px] text-white/60">Your requests, shoots and payouts in one place.</p>

        <PayoutNotice state={payoutState} onRefresh={refetchProfile} />
        {myProfile?.status === 'pending' && <PendingBanner />}
        {myProfile?.under_review && (
          <div className="glass mt-4 rounded-[22px] px-[18px] py-4" style={{ borderColor: 'hsl(var(--neon-magenta) / 0.5)' }}>
            <p className="text-[13px] leading-relaxed text-white/70">
              Your profile is under review by the Stelli team after a cancellation.
            </p>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3.5">
          <StackTile
            to="/lensman-dashboard/requests"
            label="Requests"
            value={requests.length ? `${requests.length} new` : 'None'}
            hot={requests.length > 0}
          />
          <StackTile to="/lensman-dashboard/upcoming" label="Upcoming shoots" value={upcoming.length} />
          <StackTile to="/lensman-dashboard/deliveries" label="Deliveries" value={deliveries.length} />
          <StackTile
            to="/lensman-dashboard/payouts"
            label="Payouts"
            value={myProfile?.payouts_enabled ? 'On' : 'Set up'}
          />
        </div>

        <h3 className="mb-2.5 mt-8 pl-1.5 text-[13px] font-semibold text-white/50">Needs you</h3>
        <NeedsYou
          items={needs}
          empty={{
            icon: Sparkles,
            title: "You're all caught up.",
            body: 'Share your profile to get your next booking.',
            cta: myProfile ? <CopyLinkPill creator={myProfile} /> : null,
          }}
        />

        {isLoading && <div className="mt-8 h-24 animate-pulse rounded-[28px] bg-white/[0.06]" />}

        <div className="mt-8">
          <MyAgreements role="lensman" />
        </div>

        <GlassRows
          className="mt-8"
          rows={[
            { label: 'Your profile', to: '/edit-profile' },
            ...(myProfile
              ? [{ label: 'Your public page', href: `/creators/${myProfile.slug || myProfile.id}`, external: true }]
              : []),
            { label: 'Messages', to: '/lensman-dashboard/messages' },
            { label: 'Account', to: '/account-settings' },
          ]}
        />
      </DashboardShell>
    </DashboardStack>
  );
}