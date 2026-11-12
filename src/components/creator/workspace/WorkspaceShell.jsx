import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, CalendarDays, Camera, Inbox, Sun, UserRound, Wallet } from 'lucide-react';
import '@/styles/creatorWorkspace.css';

export const TABS = [
  { to: '/lensman-dashboard', key: 'today', label: 'Today', icon: Sun },
  { to: '/lensman-dashboard/requests', key: 'requests', label: 'Requests', icon: Inbox, badge: 'requests' },
  { to: '/lensman-dashboard/bookings', key: 'shoots', label: 'Shoots', icon: Camera },
  { to: '/lensman-dashboard/earnings', key: 'money', label: 'Money', icon: Wallet },
];

const TAB_PATHS = TABS.map((tab) => tab.to);

/** Which of the four a path belongs to. Calendar sits with the shoots. */
function sectionOf(path) {
  if (path.startsWith('/lensman-dashboard/requests')) return 'requests';
  if (path.startsWith('/lensman-dashboard/bookings')) return 'shoots';
  if (path.startsWith('/lensman-dashboard/earnings')) return 'money';
  if (path.startsWith('/lensman-dashboard/calendar')) return 'shoots';
  return 'today';
}

/**
 * The creator workspace frame: four panes on a phone with a bottom toggle bar
 * and a sideways swipe between them, the same four in a side rail on desktop.
 */
export default function WorkspaceShell({ profile, user, counts = {}, children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const touch = useRef(null);

  const path = location.pathname.replace(/\/$/, '') || '/lensman-dashboard';
  const index = TAB_PATHS.indexOf(path);
  const onCalendar = path.startsWith('/lensman-dashboard/calendar');
  const onProfile = path.startsWith('/lensman-dashboard/profile');
  const section = sectionOf(path);
  const name = profile?.display_name || user?.full_name || 'Your studio';
  const avatar = profile?.profile_image;

  const startTouch = (event) => {
    const point = event.touches[0];
    touch.current = point ? { x: point.clientX, y: point.clientY } : null;
  };

  const endTouch = (event) => {
    const start = touch.current;
    touch.current = null;
    if (!start || index < 0) return;
    const point = event.changedTouches[0];
    if (!point) return;
    const dx = point.clientX - start.x;
    const dy = point.clientY - start.y;
    // A sideways swipe, not a scroll.
    if (Math.abs(dx) < 64 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
    const target = TABS[index + (dx < 0 ? 1 : -1)];
    if (target) navigate(target.to);
  };

  /** The rail only lights a tab when a tab page is open. */
  const tabOn = (key) => !onCalendar && !onProfile && section === key;
  /** The phone bar keeps a tab lit on the sub-pages that belong to it. */
  const phoneOn = (key) => (onCalendar || onProfile ? key === 'shoots' && onCalendar : section === key);

  return (
    <div className="wk">
      <div className="mx-auto flex w-full max-w-[1180px] gap-9 px-4 pb-[calc(104px+var(--safe-bottom))] pt-2 sm:px-6 lg:px-8 lg:pb-14">
        <aside className="wk-rail">
          <div className="flex items-center gap-3 px-2 pb-6">
            <span className="wk-avatar h-11 w-11 text-[15px]">
              {avatar ? <img src={avatar} alt="" /> : (name[0] || 'S').toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold text-white">{name}</p>
              <p className="mt-0.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-white/35">
                Creator studio
              </p>
            </div>
          </div>

          <nav aria-label="Creator workspace">
            {TABS.map(({ to, key, label, icon: Icon, badge }) => {
              const count = badge ? counts[badge] : 0;
              return (
                <Link key={to} to={to} className={`wk-rail-btn ${tabOn(key) ? 'is-on' : ''}`}>
                  <Icon className="h-[17px] w-[17px] shrink-0" strokeWidth={2} />
                  <span>{label}</span>
                  {count > 0 && <span className="wk-rail-n">{count}</span>}
                </Link>
              );
            })}

            <span className="wk-rail-sep" />

            <Link
              to="/lensman-dashboard/calendar"
              className={`wk-rail-btn ${onCalendar ? 'is-on' : ''}`}
            >
              <CalendarDays className="h-[17px] w-[17px] shrink-0" strokeWidth={2} />
              <span>Availability</span>
            </Link>
            <Link
              to="/lensman-dashboard/profile"
              className={`wk-rail-btn ${onProfile ? 'is-on' : ''}`}
            >
              <UserRound className="h-[17px] w-[17px] shrink-0" strokeWidth={2} />
              <span>Profile</span>
            </Link>
          </nav>
        </aside>

        <div className="min-w-0 flex-1 lg:max-w-[840px]">
          <div className="flex items-center justify-between gap-3">
            {index < 0 ? (
              <Link to="/lensman-dashboard" className="wk-topbtn">
                <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.2} />
                Studio
              </Link>
            ) : (
              <p className="wk-kicker">{format(new Date(), 'EEEE, MMM d')}</p>
            )}
            <div className="flex items-center gap-2">
              {index >= 0 && (
                <Link to="/lensman-dashboard/calendar" className="wk-topbtn lg:hidden">
                  <CalendarDays className="h-3.5 w-3.5" strokeWidth={2.2} />
                  Days off
                </Link>
              )}
              <Link to="/lensman-dashboard/profile" aria-label="Your creator profile" className="wk-avatar">
                {avatar ? <img src={avatar} alt="" /> : (name[0] || 'S').toUpperCase()}
              </Link>
            </div>
          </div>

          <div className="mt-4" onTouchStart={startTouch} onTouchEnd={endTouch}>
            {children}
          </div>
        </div>
      </div>

      {/* Outside the pull-to-refresh transform, so the bar stays pinned to the screen. */}
      {createPortal(
        <nav className="wk-tabbar" aria-label="Creator workspace">
          {TABS.map(({ to, key, label, icon: Icon, badge }) => {
            const count = badge ? counts[badge] : 0;
            return (
              <Link key={to} to={to} className={`wk-tab ${phoneOn(key) ? 'is-on' : ''}`}>
                <Icon className="h-[17px] w-[17px]" strokeWidth={2.1} />
                <span>{label}</span>
                {count > 0 && <span className="wk-tab-badge">{count}</span>}
              </Link>
            );
          })}
        </nav>,
        document.body
      )}
    </div>
  );
}