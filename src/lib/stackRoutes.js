/**
 * The dashboard stack: which quick sub-pages open as a sheet over which page.
 * Used by the router's page transition and by scroll handling, so opening a
 * sheet never remounts or scrolls the dashboard underneath it.
 */
const SHEETS = {
  '/lensman-dashboard': ['requests', 'upcoming', 'deliveries', 'payouts', 'messages'],
  '/client-dashboard': ['bookings', 'messages'],
};

/** The page a route belongs to: a sheet resolves to its dashboard. */
export function pageParent(pathname) {
  for (const [parent, sheets] of Object.entries(SHEETS)) {
    if (pathname === parent) return parent;
    if (sheets.some((sheet) => pathname === `${parent}/${sheet}`)) return parent;
  }
  return null;
}

/** True when the route is one of the stacked sub-pages. */
export function isSheetRoute(pathname) {
  for (const [parent, sheets] of Object.entries(SHEETS)) {
    if (sheets.some((sheet) => pathname === `${parent}/${sheet}`)) return true;
  }
  return false;
}