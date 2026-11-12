import React, { Suspense, useEffect, useRef } from 'react';
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
import { preloadCreatorWorkspace } from '@/lib/preloadCreatorWorkspace';

/**
 * The creator workspace: four panes — Today, Requests, Shoots, Money — plus
 * availability and the storefront behind the header. Everything a creator runs
 * their business with lives inside these panes.
 */
function WorkspaceTabLoading() {
  return (
    <div className="arch-tab arch-tab--loading" aria-live="polite" aria-label="Loading workspace tab">
      <span className="arch-tab__loading-line arch-tab__loading-line--title" />
      <span className="arch-tab__loading-line arch-tab__loading-line--copy" />
      <span className="arch-tab__loading-block" />
    </div>
  );
}

export default function CreatorPortal() {
  const data = useCreatorPortal();
  const queryClient = useQueryClient();
  const todayEnteredRef = useRef(false);

  // The portal stays light on first paint, then warms its small route chunks in
  // the background so every tab feels immediate after the creator arrives.
  useEffect(() => {
    let cancelled = false;
    const warmWorkspace = () => {
      if (!cancelled) void preloadCreatorWorkspace();
    };
    const idleId = typeof window.requestIdleCallback === 'function'
      ? window.requestIdleCallback(warmWorkspace, { timeout: 1200 })
      : null;
    const timeoutId = idleId === null ? window.setTimeout(warmWorkspace, 180) : null;

    return () => {
      cancelled = true;
      if (idleId !== null && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, []);
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
        <Suspense fallback={<WorkspaceTabLoading />}>
          <Outlet context={{ ...data, todayEnteredRef }} />
        </Suspense>
      </WorkspaceShell>
    </PullToRefresh>
  );
}