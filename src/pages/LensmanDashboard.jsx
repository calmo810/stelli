import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Inbox, CalendarCheck, Link2, Sparkles } from 'lucide-react';
import BookingCard from '@/components/dashboard/BookingCard';
import QuoteForm from '@/components/dashboard/QuoteForm';
import DeliveryForm from '@/components/dashboard/DeliveryForm';
import PayoutsCard from '@/components/dashboard/PayoutsCard';
import PayoutNotice from '@/components/dashboard/PayoutNotice';
import PendingBanner from '@/components/dashboard/PendingBanner';
import AgeConfirmGate from '@/components/dashboard/AgeConfirmGate';
import MyAgreements from '@/components/dashboard/MyAgreements';
import DashboardShell from '@/components/dashboard/DashboardShell';
import SegmentedTabs from '@/components/dashboard/SegmentedTabs';
import NeedsYou from '@/components/dashboard/NeedsYou';
import EmptyPanel from '@/components/dashboard/EmptyPanel';
import CopyLinkPill from '@/components/dashboard/CopyLinkPill';
import GlassRows from '@/components/shared/GlassRows';
import { Skeleton } from '@/components/ui/skeleton';
import shortDate from '@/lib/shortDate';

const UPCOMING = ['quoted', 'quote_accepted'];
const DELIVERIES = ['confirmed', 'in_progress', 'awaiting_delivery'];
const COMPLETED = ['delivered', 'completed'];

export default function LensmanDashboard() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('requests');
  const [payoutState, setPayoutState] = useState(null);
  const payoutChecked = useRef(false);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: myProfile, refetch: refetchProfile } = useQuery({
    queryKey: ['my-lensman-profile', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const list = await base44.entities.Lensman.filter({ user_id: user.id });
      return list[0] || null;
    },
  });

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['lensman-bookings', user?.email],
    enabled: !!user?.email,
    queryFn: () => base44.entities.Booking.filter({ lensman_email: user.email }, '-created_date'),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['lensman-bookings'] });

  const { data: waitingPayouts = [] } = useQuery({
    queryKey: ['waiting-payouts', user?.email],
    enabled: !!user?.email,
    queryFn: () => base44.entities.Booking.filter({ needs_payout_setup: true, lensman_email: user.email }),
  });

  const waitingTotal = waitingPayouts.reduce((sum, b) => sum + Number(b.creator_payout || 0), 0);

  // Every time the dashboard opens for a creator mid-setup, ask Stripe where
  // they stand — webhooks are not relied on for this.
  useEffect(() => {
    if (payoutChecked.current) return;
    if (!myProfile?.stripe_account_id || myProfile.payouts_enabled) return;
    payoutChecked.current = true;
    (async () => {
      try {
        const response = await base44.functions.invoke('startPayoutSetup', { action: 'status' });
        setPayoutState(response.data || null);
        if (response.data?.paidOut) {
          queryClient.invalidateQueries({ queryKey: ['waiting-payouts'] });
        }
        await refetchProfile();
      } catch (error) {
        console.error('Payout status check failed:', error.message);
      }
    })();
  }, [myProfile?.stripe_account_id, myProfile?.payouts_enabled, refetchProfile, queryClient]);

  // Creators who joined before the 18+ check existed confirm it once, here.
  if (myProfile && !myProfile.age_confirmed) {
    return <AgeConfirmGate onConfirmed={refetchProfile} />;
  }

  const firstName = (user?.full_name || '').split(' ')[0] || 'there';

  const requests = bookings.filter((b) => b.status === 'requested');
  const upcoming = bookings.filter((b) => UPCOMING.includes(b.status));
  const deliveries = bookings.filter((b) => DELIVERIES.includes(b.status));
  const completed = bookings.filter((b) => COMPLETED.includes(b.status));

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

  const tabs = [
    { value: 'requests', label: 'Requests', count: requests.length },
    { value: 'upcoming', label: 'Upcoming', count: upcoming.length },
    { value: 'deliveries', label: 'Deliveries', count: deliveries.length },
    { value: 'completed', label: 'Done', count: completed.length },
  ];

  const panels = {
    requests: requests.length ? (
      requests.map((b) => (
        <div key={b.id} className="space-y-3">
          <BookingCard booking={b} role="lensman" />
          <QuoteForm booking={b} onSent={refresh} />
        </div>
      ))
    ) : (
      <EmptyPanel icon={Inbox} title="No requests yet." body="When someone asks you to shoot, it lands here." />
    ),
    upcoming: upcoming.length ? (
      upcoming.map((b) => <BookingCard key={b.id} booking={b} role="lensman" />)
    ) : (
      <EmptyPanel icon={CalendarCheck} title="Nothing on the books." body="Shoots you have quoted and booked show up here." />
    ),
    deliveries: deliveries.length ? (
      deliveries.map((b) => (
        <div key={b.id} className="space-y-3">
          <BookingCard booking={b} role="lensman" />
          <DeliveryForm booking={b} onDelivered={refresh} />
        </div>
      ))
    ) : (
      <EmptyPanel icon={Link2} title="No galleries due." body="Shoots waiting on your delivery link live here." />
    ),
    completed: completed.length ? (
      completed.map((b) => <BookingCard key={b.id} booking={b} role="lensman" />)
    ) : (
      <EmptyPanel icon={Sparkles} title="Nothing wrapped yet." body="Finished and paid-out shoots collect here." />
    ),
  };

  return (
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

      {myProfile && (
        <div className="mt-5">
          <PayoutsCard
            profile={myProfile}
            needsInfo={payoutState?.needsInfo}
            waitingTotal={waitingTotal}
            onRefresh={refetchProfile}
          />
        </div>
      )}

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

      <SegmentedTabs className="mt-8" value={tab} onChange={setTab} options={tabs} />

      {isLoading ? (
        <div className="mt-3 space-y-3">
          {Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-[22px]" />
          ))}
        </div>
      ) : (
        <div className="mt-3 space-y-3">{panels[tab]}</div>
      )}

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
          { label: 'Messages', to: '/portal/messages' },
          { label: 'Account', to: '/account-settings' },
        ]}
      />
    </DashboardShell>
  );
}