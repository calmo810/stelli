const PANES = {
  today: [() => import('@/pages/creator/CreatorOverview')],
  work: [
    () => import('@/pages/creator/CreatorRequests'),
    () => import('@/pages/creator/CreatorBookings'),
    () => import('@/pages/creator/CreatorEarnings'),
  ],
  calendar: [() => import('@/pages/creator/CreatorCalendar')],
  profile: [() => import('@/pages/creator/CreatorPublicProfile')],
};

const warm = (loader) => loader().catch(() => undefined);

/** Begin fetching the next pane before a creator needs to wait for it. */
export function preloadCreatorPane(key) {
  return Promise.all((PANES[key] || []).map(warm));
}

/** Once the portal is calm, warm the small route chunks for instant tab changes. */
export function preloadCreatorWorkspace() {
  return Promise.all(Object.values(PANES).flat().map(warm));
}
