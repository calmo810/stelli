import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Inbox, Camera, CalendarDays, Wallet, UserRound } from 'lucide-react';

const ITEMS = [
  { to: '/lensman-dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/lensman-dashboard/requests', label: 'Requests', icon: Inbox, badge: 'requests' },
  { to: '/lensman-dashboard/bookings', label: 'Bookings', icon: Camera },
  { to: '/lensman-dashboard/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/lensman-dashboard/earnings', label: 'Earnings', icon: Wallet },
  { to: '/lensman-dashboard/profile', label: 'Profile', icon: UserRound },
];

/** The six doors of the creator workspace, on one scrollable rail. */
export default function PortalNav({ counts = {} }) {
  return (
    <nav aria-label="Creator workspace" className="no-scrollbar -mx-4 overflow-x-auto px-4">
      <div className="glass inline-flex min-w-full gap-1 rounded-[980px] p-1">
        {ITEMS.map(({ to, label, icon: Icon, end, badge }) => {
          const count = badge ? counts[badge] : 0;
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative flex flex-1 items-center justify-center gap-1.5 rounded-[980px] px-3.5 py-2.5 text-[13px] font-medium transition-colors ${
                  isActive ? 'text-ink' : 'text-white/60 hover:text-white'
                }`
              }
              style={({ isActive }) =>
                isActive ? { background: 'hsl(var(--neon-lime))' } : undefined
              }
            >
              <Icon className="h-[15px] w-[15px] shrink-0" strokeWidth={2} />
              <span className="whitespace-nowrap">{label}</span>
              {count > 0 && (
                <span
                  className="ml-0.5 grid h-[17px] min-w-[17px] place-items-center rounded-full px-1 text-[10px] font-bold"
                  style={{ background: 'hsl(var(--neon-magenta))', color: 'hsl(var(--ink))' }}
                >
                  {count}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}