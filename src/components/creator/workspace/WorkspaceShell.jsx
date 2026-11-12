import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Briefcase, CalendarDays, Sun, UserRound } from 'lucide-react';
import '@/styles/creatorWorkspace.css';
import '@/styles/creatorArchitecture.css';
import '@/styles/creatorDesktop.css';

export const TABS = [
  { to: '/lensman-dashboard', key: 'today', label: 'Today', icon: Sun },
  { to: '/lensman-dashboard/requests', key: 'work', label: 'Work', icon: Briefcase },
  { to: '/lensman-dashboard/calendar', key: 'calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/lensman-dashboard/profile', key: 'profile', label: 'Profile', icon: UserRound },
];

/** Which of the four doors a path belongs to. Requests, shoots and money are all Work. */
function sectionOf(path) {
  if (
    path.startsWith('/lensman-dashboard/requests') ||
    path.startsWith('/lensman-dashboard/bookings') ||
    path.startsWith('/lensman-dashboard/earnings')
  ) {
    return 'work';
  }
  if (path.startsWith('/lensman-dashboard/calendar')) return 'calendar';
  if (path.startsWith('/lensman-dashboard/profile')) return 'profile';
  return 'today';
}

/**
 * The creator workspace frame: four doors on a phone with a bottom toggle bar
 * and a sideways swipe between them, the same four in a side rail on desktop.
 */
export default function WorkspaceShell({ profile, user, counts = {}, children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const touch = useRef(null);

  const path = location.pathname.replace(/\/$/, '') || '/lensman-dashboard';
  const activeKey = sectionOf(path);
  const isToday = path === '/lensman-dashboard';
  const index = TABS.findIndex((tab) => tab.key === activeKey);
  const name = profile?.display_name || user?.full_name || 'Your studio';
  const avatar = profile?.profile_image;

  const startTouch = (event) => {
    const point = event.touches[0];
    touch.current = point ? { x: point.clientX, y: point.clientY } : null;
  };

  const endTouch = (event) => {
    const start = touch.current;
    touch.current = null;
    if (!start) return;
    const point = event.changedTouches[0];
    if (!point) return;
    const dx = point.clientX - start.x;
    const dy = point.clientY - start.y;
    // A sideways swipe, not a scroll.
    if (Math.abs(dx) < 64 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
    const target = TABS[index + (dx < 0 ? 1 : -1)];
    if (target) navigate(target.to);
  };

  const badgeFor = (key) => (key === 'work' ? Number((/** @type {any} */ (counts)).requests || 0) : 0);

  return (
    <div className="wk arch-workspace">
      <div className="arch-workspace__frame mx-auto flex w-full max-w-[1540px] gap-5 px-4 pb-[calc(104px+var(--safe-bottom))] pt-2 sm:px-6 lg:px-7 lg:pb-14">
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
            {TABS.map(({ to, key, label, icon: Icon }) => {
              const count = badgeFor(key);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`wk-rail-btn ${key === activeKey ? 'is-on' : ''}`}
                >
                  <Icon className="h-[17px] w-[17px] shrink-0" strokeWidth={2} />
                  <span>{label}</span>
                  {count > 0 && <span className="wk-rail-n">{count}</span>}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="arch-workspace__main min-w-0 flex-1 lg:max-w-none">
          {!isToday && (
            <div className="flex items-center justify-between gap-3">
              <p className="wk-kicker">{format(new Date(), 'EEEE, MMM d')}</p>
              <Link to="/lensman-dashboard/profile" aria-label="Your creator profile" className="wk-avatar">
                {avatar ? <img src={avatar} alt="" /> : (name[0] || 'S').toUpperCase()}
              </Link>
            </div>
          )}

          <div
            className={isToday ? 'arch-workspace__body--today' : 'mt-4'}
            onTouchStart={startTouch}
            onTouchEnd={endTouch}
          >
            {children}
          </div>
        </div>
      </div>

      {/* Outside the pull-to-refresh transform, so the bar stays pinned to the screen. */}
      {createPortal(
        <nav className="wk-tabbar" aria-label="Creator workspace">
          {TABS.map(({ to, key, label, icon: Icon }) => {
            const count = badgeFor(key);
            return (
              <Link key={to} to={to} className={`wk-tab ${key === activeKey ? 'is-on' : ''}`}>
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