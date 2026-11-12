import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home as HomeIcon, Search, MessageCircle, User as UserIcon } from 'lucide-react';

/* The four doors on a phone. Each tab keeps its own place: come back to Browse
   and you land on the creator you were looking at, not the top of the list.
   The memory lives outside the component so it survives re-renders. */

const TABS = [
  { key: 'home', label: 'Home', icon: HomeIcon, root: '/' },
  { key: 'browse', label: 'Browse', icon: Search, root: '/creators' },
  { key: 'messages', label: 'Messages', icon: MessageCircle, root: '/messages' },
  { key: 'portal', label: 'Portal', icon: UserIcon, root: '/portal' },
];

const lastVisit = {};

/** Which tab a path belongs to, or null for pages outside the four. */
export function tabForPath(pathname) {
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/creators') || pathname.startsWith('/book/')) return 'browse';
  if (pathname.startsWith('/messages')) return 'messages';
  if (
    pathname.startsWith('/portal') ||
    pathname.startsWith('/client-dashboard') ||
    pathname.startsWith('/lensman-dashboard') ||
    pathname.startsWith('/account-settings')
  ) {
    return 'portal';
  }
  return null;
}

export default function MobileTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const active = tabForPath(location.pathname);

  useEffect(() => {
    if (active) lastVisit[active] = location.pathname;
  }, [active, location.pathname]);

  // The creator workspace runs its own four tabs, so this bar stays away.
  if (location.pathname.startsWith('/lensman-dashboard')) return null;

  const select = (tab) => {
    // Tapping the tab you are already on takes you back to its start.
    if (tab.key === active && location.pathname !== tab.root) {
      navigate(tab.root);
      return;
    }
    if (tab.key === active && tab.key === 'home' && location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    navigate(lastVisit[tab.key] || tab.root);
  };

  return (
    <nav className="tabbar md:hidden" aria-label="Primary">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => select(tab)}
            aria-current={isActive ? 'page' : undefined}
            className={`tabbar-item ${isActive ? 'is-active' : ''}`}
          >
            <Icon className="w-[21px] h-[21px]" strokeWidth={isActive ? 2.2 : 1.8} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}