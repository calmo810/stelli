import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import MyAgreements from '@/components/dashboard/MyAgreements';
import PhotoReleases from '@/components/dashboard/PhotoReleases';
import DashboardShell from '@/components/dashboard/DashboardShell';
import NeedsYou from '@/components/dashboard/NeedsYou';
import ShootList from '@/components/dashboard/ShootList';
import GlassRows from '@/components/shared/GlassRows';
import Pill from '@/components/shared/Pill';
import PullToRefresh from '@/components/shared/PullToRefresh';
import { useQueryClient } from '@tanstack/react-query';
import useClientDashboard from '@/hooks/useClientDashboard';
import useThreads from '@/hooks/useThreads';
import shortDate from '@/lib/shortDate';
import useRequireSignIn from '@/lib/requireSignIn';

function SectionLabel({ children }) {
  return <h3 className="mb-2.5 mt-8 pl-1.5 text-[13px] font-semibold text-white/50">{children}</h3>;
}

/**
 * The client portal: one page, top to bottom.
 * What needs you, your shoots, and a short list of everything else.
 */
export default function ClientDashboard() {
  const { user, userLoading, bookings, active, past, steps, isLoading } = useClientDashboard();
  const { unreadCount } = useThreads();
  const queryClient = useQueryClient();
  // Signed out: go and log in, then come straight back here.
  const waiting = useRequireSignIn(user, userLoading);

  // A pull at the top reloads the dashboard and the inbox together.
  const refreshAll = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['client-bookings'] }),
      queryClient.invalidateQueries({ queryKey: ['client-quotes'] }),
      queryClient.invalidateQueries({ queryKey: ['messages-inbox'] }),
    ]);

  if (waiting) return <DashboardShell><div className="glass h-[132px] animate-pulse rounded-3xl" /></DashboardShell>;

  const firstName = (user?.full_name || '').split(' ')[0] || 'there';

  // The real next step on each booking that has one: a quote to answer, a
  // payment to make, photos to look at.
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

  return (
    <PullToRefresh onRefresh={refreshAll}>
    <DashboardShell>
      <h1
        className="font-display font-medium text-white"
        style={{ fontSize: 40, letterSpacing: '-0.02em', lineHeight: 1.05 }}
      >
        Hey, {firstName}.
      </h1>

      <SectionLabel>To do</SectionLabel>
      <NeedsYou
        items={needs}
        empty={{
          icon: Sparkles,
          title: "You're all caught up.",
          body: 'Book your next shoot and it will show up here.',
          cta: (
            <Link to="/creators">
              <Pill>Find a creator</Pill>
            </Link>
          ),
        }}
      />

      <SectionLabel>Your shoots</SectionLabel>
      <ShootList
        role="client"
        active={active}
        past={past}
        isLoading={isLoading}
        emptyText="Shoots you request will show up here."
      />

      <PhotoReleases role="client" user={user} />

      <MyAgreements role="client" />

      <GlassRows
        className="mt-8"
        rows={[
          { label: 'Messages', to: '/messages', value: unreadCount ? `${unreadCount} new` : undefined },
          { label: 'Find a creator', to: '/creators' },
          { label: 'Account', to: '/account-settings' },
        ]}
      />
    </DashboardShell>
    </PullToRefresh>
  );
}