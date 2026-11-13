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
import { hasApplicationDraft } from '@/hooks/useWizard';
import { preloadCreatorWorkspace } from '@/lib/preloadCreatorWorkspace';
import { loginUrl } from '@/lib/requireSignIn';
import { ErrorState, Page, Sheet } from '@/components/system';

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
  const { user, userLoading, myProfile, profileFetched, profileError, bookingsError, refetchBookings, refetchProfile, isLoading, newRequests } = data;

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
  // Either half failing to load says so, with a way to try again.
  if (user && (profileError || bookingsError)) {
    return (
      <Page width="narrow">
        <Sheet>
          <ErrorState
            title="Your workspace didn't load."
            body="Nothing has changed on your page or your bookings. Check your connection and try again."
            onRetry={() => (profileError ? refetchProfile() : refetchBookings())}
          />
        </Sheet>
      </Page>
    );
  }

  if (userLoading || (user && (isLoading || !profileFetched))) {
    return (
      <DashboardShell>
        <div className="st-skeleton h-[320px] !rounded-st-xl" aria-busy="true" aria-label="Loading your workspace" />
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
            <Pill as={Link} to={loginUrl('/lensman-dashboard')} tone="lime">
              Sign in
            </Pill>
          }
        />
      </DashboardShell>
    );
  }

  if (!myProfile) {
    // An application started on this device is picked back up, not restarted.
    const started = hasApplicationDraft();
    return (
      <DashboardShell>
        <EmptyPanel
          icon={Camera}
          title={started ? 'Your page is half built' : 'No creator page yet'}
          body={
            started
              ? 'Your draft is saved on this device. Finish it and this workspace opens with your requests and shoots.'
              : 'Apply once and this workspace opens with your requests and shoots.'
          }
          cta={
            <Pill as={Link} to="/apply" tone="lime">
              {started ? 'Continue your application' : 'Apply to shoot'}
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