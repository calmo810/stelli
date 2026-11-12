import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Camera } from 'lucide-react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import AgeConfirmGate from '@/components/dashboard/AgeConfirmGate';
import EmptyPanel from '@/components/dashboard/EmptyPanel';
import PullToRefresh from '@/components/shared/PullToRefresh';
import Pill from '@/components/shared/Pill';
import WorkspaceShell from '@/components/creator/workspace/WorkspaceShell';
import useCreatorPortal from '@/hooks/useCreatorPortal';

/**
 * The creator workspace: four panes — Today, Requests, Shoots, Money — plus
 * availability and the storefront behind the header. Everything a creator runs
 * their business with lives inside these panes.
 */
export default function CreatorPortal() {
  const data = useCreatorPortal();
  const queryClient = useQueryClient();
  const { user, userLoading, myProfile, profileFetched, refetchProfile, isLoading, newRequests } = data;

  const refreshAll = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['lensman-bookings'] }),
      queryClient.invalidateQueries({ queryKey: ['my-lensman-profile'] }),
      queryClient.invalidateQueries({ queryKey: ['creator-quotes'] }),
      queryClient.invalidateQueries({ queryKey: ['waiting-payouts'] }),
      queryClient.invalidateQueries({ queryKey: ['waiting-manual-payouts'] }),
    ]);

  // Wait for the profile too, or a creator sees "No creator page yet" for a
  // moment on every visit.
  if (userLoading || (user && (isLoading || !profileFetched))) {
    return (
      <DashboardShell>
        <div className="glass h-[260px] animate-pulse rounded-[28px]" />
      </DashboardShell>
    );
  }

  if (!user) {
    return (
      <DashboardShell>
        <EmptyPanel
          icon={Camera}
          title="Sign in to continue"
          body="Your workspace holds your requests, shoots and payouts."
          cta={
            <Pill as={Link} to="/login" tone="lime">
              Sign in
            </Pill>
          }
        />
      </DashboardShell>
    );
  }

  if (!myProfile) {
    return (
      <DashboardShell>
        <EmptyPanel
          icon={Camera}
          title="No creator page yet"
          body="Apply once and this workspace opens with your requests and shoots."
          cta={
            <Pill as={Link} to="/apply" tone="lime">
              Apply to shoot
            </Pill>
          }
        />
      </DashboardShell>
    );
  }

  // Creators who joined before the 18+ check existed confirm it once, here.
  if (!myProfile.age_confirmed) {
    return <AgeConfirmGate onConfirmed={refetchProfile} />;
  }

  return (
    <PullToRefresh onRefresh={refreshAll}>
      <WorkspaceShell profile={myProfile} user={user} counts={{ requests: newRequests.length }}>
        <Outlet context={data} />
      </WorkspaceShell>
    </PullToRefresh>
  );
}